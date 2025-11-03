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

			// Initialize Next.js environment in the sandbox
			await step.run("initialize-nextjs", async () => {
				try {
					const sandbox = await getSandbox(sandboxId);
					
					console.log("Initializing Next.js environment in sandbox...");
					
					// Check if package.json exists in /home/user
					let checkPackageJson;
					try {
						checkPackageJson = await sandbox.commands.run("test -f /home/user/package.json && echo 'exists' || echo 'missing'", { 
							onStdout: () => {},
							onStderr: () => {},
						});
					} catch (e) {
						console.error("Error checking package.json:", e);
						throw new Error(`Failed to check for existing Next.js installation: ${e instanceof Error ? e.message : String(e)}`);
					}
					
					if (checkPackageJson.stdout.trim() === 'missing') {
						console.log("Next.js not found, creating new Next.js app in /home/user...");
						
						// Create Next.js app directly in /home/user (using . as target)
						let createApp;
						try {
							createApp = await sandbox.commands.run(
								"cd /home/user && npx create-next-app@15.3.5 . --yes --no-git --typescript --tailwind --app --turbopack --import-alias '@/*'",
								{
									onStdout: (data: string) => console.log(data),
									onStderr: (data: string) => console.error(data),
								}
							);
						} catch (e) {
							console.error("Error creating Next.js app:", e);
							throw new Error(`Failed to create Next.js app: ${e instanceof Error ? e.message : String(e)}`);
						}
						
						if (createApp.exitCode !== 0) {
							throw new Error(`Failed to create Next.js app (exit code ${createApp.exitCode}): ${createApp.stderr}`);
						}
						
						// Install shadcn-ui dependencies
						console.log("Installing shadcn-ui...");
						try {
							const installShadcn = await sandbox.commands.run(
								"cd /home/user && npx shadcn@2.8.0 init --yes --defaults",
								{
									onStdout: (data: string) => console.log(data),
									onStderr: (data: string) => console.error(data),
								}
							);
							
							if (installShadcn.exitCode !== 0) {
								console.warn("Shadcn init warning (non-critical):", installShadcn.stderr);
							}
						} catch (e) {
							console.warn("Shadcn installation failed (non-critical):", e);
						}
						
						// Start the dev server in background
						console.log("Starting Next.js dev server...");
						try {
							sandbox.commands.run("cd /home/user && npm run dev", {
								onStdout: (data: string) => console.log("[Next.js]", data),
								onStderr: (data: string) => console.error("[Next.js]", data),
								background: true,
							});
							
							// Wait for server to be ready
							await new Promise(resolve => setTimeout(resolve, 10000));
							
							console.log("Next.js environment initialized successfully");
						} catch (e) {
							console.error("Error starting Next.js dev server:", e);
							throw new Error(`Failed to start Next.js dev server: ${e instanceof Error ? e.message : String(e)}`);
						}
					} else {
						console.log("Next.js already installed in /home/user, skipping initialization");
					}
				} catch (error) {
					console.error("Error in initialize-nextjs step:", error);
					throw error;
				}
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
					const host = sandbox.getHost(3000);
					return `https://${host}`;
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
			
			// Extract detailed error information
			let errorMessage = "Unknown error";
			let errorDetails = "";
			
			if (error instanceof Error) {
				errorMessage = error.message;
				errorDetails = error.stack || "";
			} else if (typeof error === "string") {
				errorMessage = error;
			} else {
				errorMessage = JSON.stringify(error);
			}
			
			console.error("Error details:", errorDetails);

			await step.run("save-error", async () => {
				return await prisma.message.create({
					data: {
						projectId: event.data.projectId,
						content: `Agent failed: ${errorMessage}`,
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
