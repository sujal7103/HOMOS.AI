import {
	openai,
	createAgent,
	createTool,
	createNetwork,
	Message,
	createState,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { Sandbox } from "e2b";
import { getSandbox, lastAssistantTextMessageContent, parseAgentOutput } from "./utils";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { SANDBOX_TIMEOUT } from "./types";

interface AgentState {
	summary: string;
	files: { [path: string]: string };
}

export const codeAgent = inngest.createFunction(
	{ id: "code-agent" },
	{ event: "code-agent/run" },
	async ({ event, step }) => {
		let sandboxUrl: string | null = null;
		try {
			const sandboxId = await step.run("create-sandbox", async () => {
				// Using base template or custom template from env
				// To use a custom template, set E2B_TEMPLATE_ID in your .env file
				const template = process.env.E2B_TEMPLATE_ID || "base";
				
				// Check if E2B API key is set
				if (!process.env.E2B_API_KEY) {
					throw new Error("E2B_API_KEY is not set in environment variables. Please add it to your .env file.");
				}
				
				try {
					const sandbox = await Sandbox.create(template);
					await sandbox.setTimeout(SANDBOX_TIMEOUT);
					return sandbox.sandboxId;
				} catch (e) {
					const errorMsg = e instanceof Error ? e.message : String(e);
					throw new Error(`Failed to create E2B sandbox: ${errorMsg}. Make sure your E2B_API_KEY is valid and you have access to the '${template}' template.`);
				}
			});

			// Setup basic working directory
			await step.run("setup-workspace", async () => {
				const sandbox = await getSandbox(sandboxId);
				console.log("Setting up workspace...");
				
				// Create a working directory
				await sandbox.commands.run("mkdir -p /home/user/project", {
					onStdout: () => {},
					onStderr: () => {},
				});
				
				console.log("Workspace ready");
			});

			const perviousMessages = await step.run(
				"get-previous-messages",
				async () => {
					const formattedMessages: Message[] = [];
					const messages = await prisma.message.findMany({
						where: {
							projectId: event.data.projectId,
						},
						orderBy: {
							createdAt: "desc",
						},
						take: 5
					});
					for (const message of messages) {
						formattedMessages.push({
							type: "text",
							role: message.role === "ASSISTANT" ? "assistant" : "user",
							content: message.content,
						});
					}
					return formattedMessages.reverse();
				}
			);

			const state = createState<AgentState>(
				{
					summary: "",
					files: {},
				},
				{
					messages: perviousMessages,
				}
			);

			// Check if OpenAI API key is set
			if (!process.env.OPENAI_API_KEY) {
				throw new Error("OPENAI_API_KEY is not set in environment variables. Please add it to your .env file.");
			}

			const model = openai({
				model: "gpt-4.1",
				baseUrl: "https://models.github.ai/inference",
				apiKey: process.env.OPENAI_API_KEY!,
			});

			const codeAgent = createAgent<AgentState>({
				name: "code-agent",
				system: PROMPT,
				model,
				tools: [
					// terminal use
					createTool({
						name: "terminal",
						description: "Use the terminal to run commands",
						parameters: z.object({
							command: z.string(),
						}),
						handler: async ({ command }) => {
							console.log("terminal < ", command);
							const buffers = { stdout: "", stderr: "" };

							try {
								const sandbox = await getSandbox(sandboxId);
								const result = await sandbox.commands.run(command, {
									onStdout: (data: string) => {
										buffers.stdout += data;
									},
									onStderr: (data: string) => {
										buffers.stderr += data;
									},
								});
								console.log("terminal result >", result.stdout);
								return result.stdout;
							} catch (e) {
								console.error(
									`Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
								);
								return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
							}
						},
					}),
					// create or update file
					createTool({
						name: "createOrUpdateFiles",
						description: "Create or update files in the sandbox",
						parameters: z.object({
							files: z.array(
								z.object({
									path: z.string(),
									content: z.string(),
								})
							),
						}),
						handler: async ({ files }, context) => {
							console.log(
								"createOrUpdateFiles <",
								files.map((f) => f.path)
							);
							try {
								const sandbox = await getSandbox(sandboxId);
								for (const file of files) {
									await sandbox.files.write(file.path, file.content);
								}

								if (context?.network) {
									context.network.state.data.files = {
										...(context.network.state.data.files || {}),
										...Object.fromEntries(
											files.map((f) => [f.path, f.content])
										),
									};
								}

								return `Files created/updated: ${files
									.map((f) => f.path)
									.join(", ")}`;
							} catch (e) {
								console.error("error", e);
								return "Error: " + e;
							}
						},
					}),
					// read files
					createTool({
						name: "readFiles",
						description: "Read files from the sandbox",
						parameters: z.object({
							files: z.array(z.string()),
						}),
						handler: async ({ files }) => {
							console.log("readFiles <", files);
							try {
								const sandbox = await getSandbox(sandboxId);
								const contents = [];
								for (const file of files) {
									const content = await sandbox.files.read(file);
									contents.push({ path: file, content });
								}
								return JSON.stringify(contents);
							} catch (e) {
								console.error("error", e);
								return "Error: " + e;
							}
						},
					}),
				],
				lifecycle: {
					onResponse: async ({ result, network }) => {
						const txt = await lastAssistantTextMessageContent(result);
						if (txt?.includes("<task_summary>") && network) {
							network.state.data.summary = txt;
						}
						return result;
					},
				},
			});

			const network = createNetwork<AgentState>({
				name: "coding-agent-network",
				agents: [codeAgent],
				defaultState: state,
				maxIter: 15,
				router: async ({ network }) =>
					network.state.data.summary ? undefined : codeAgent,
			});

			const result = await network.run(event.data.value, { state });

			const fragmentTitleGenerator = createAgent<AgentState>({
				name: "fragment-title",
				system: FRAGMENT_TITLE_PROMPT,
				model: openai({
					model: "gpt-4o",
					baseUrl: "https://models.github.ai/inference",
					apiKey: process.env.OPENAI_API_KEY!,
				}),
			});

			const responseGenerator = createAgent<AgentState>({
				name: "response-generator",
				system: RESPONSE_PROMPT,
				model: openai({
					model: "gpt-4o",
					baseUrl: "https://models.github.ai/inference",
					apiKey: process.env.OPENAI_API_KEY!,
				}),
			});

			const { output: fragmentTitle } = await fragmentTitleGenerator.run(result.state.data.summary);
			const { output: responseOutput } = await responseGenerator.run(result.state.data.summary);

			const isError =
				!result.state.data.summary ||
				Object.keys(result.state.data.files || {}).length === 0;

			if (!isError) {
				sandboxUrl = await step.run("get-sandbox-url", async () => {
					const sandbox = await getSandbox(sandboxId!);
					// Return sandbox info URL instead of trying to connect to a dev server
					return `https://e2b.dev/sandbox/${sandboxId}`;
				});
			}

			await step.run("save-result", async () => {
				if (isError) {
					return await prisma.message.create({
						data: {
							projectId: event.data.projectId,
							content: "Agent execution failed to produce valid output",
							role: "ASSISTANT",
							type: "ERROR",
						},
					});
				}

				return await prisma.message.create({
					data: {
						projectId: event.data.projectId,
						content: parseAgentOutput(responseOutput),
						role: "ASSISTANT",
						type: "RESULT",
						fragment: {
							create: {
								title: parseAgentOutput(fragmentTitle),
								sandboxUrl: sandboxUrl!,
								files: result.state.data.files,
							},
						},
					},
				});
			});

			return {
				url: sandboxUrl,
				title: "Fragment",
				files: result.state.data.files || {},
				summary: result.state.data.summary || "",
			};
		} catch (error) {
			console.error("Agent execution error:", error);
			
			// Extract detailed error information with better serialization
			let errorMessage = "Unknown error";
			let errorDetails = "";
			
			if (error instanceof Error) {
				errorMessage = error.message;
				errorDetails = error.stack || "";
				console.error("Error type: Error");
				console.error("Error name:", error.name);
				console.error("Error message:", error.message);
				console.error("Error stack:", error.stack);
			} else if (typeof error === "string") {
				errorMessage = error;
				console.error("Error type: string");
			} else if (error && typeof error === "object") {
				errorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error));
				console.error("Error type: object");
				console.error("Error object:", errorMessage);
			} else {
				errorMessage = String(error);
				console.error("Error type:", typeof error);
				console.error("Error value:", errorMessage);
			}
			
			console.error("Final error message:", errorMessage);
			console.error("Final error details:", errorDetails);

			await step.run("save-error", async () => {
				return await prisma.message.create({
					data: {
						projectId: event.data.projectId,
						content: `Agent failed: ${errorMessage}${errorDetails ? `\n\nStack trace:\n${errorDetails}` : ""}`,
						role: "ASSISTANT",
						type: "ERROR",
					},
				});
			});

			return {
				error: errorMessage,
				details: errorDetails,
			};
		}
	}
);
