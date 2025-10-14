# How to Create Your Own E2B Sandbox Template

If you need a custom Next.js setup, follow these steps to create your own E2B template:

## Prerequisites
1. Install E2B CLI:
   ```bash
   npm install -g @e2b/cli
   ```

2. Login to E2B:
   ```bash
   e2b auth login
   ```

## Steps to Create Your Template

1. **Navigate to the sandbox template directory:**
   ```bash
   cd /Users/sujal/Downloads/Homos/sandbox-templates/nextjs
   ```

2. **Update the e2b.toml file with your team ID:**
   - Open `e2b.toml`
   - Replace the `team_id` with your team ID: `ca4f6376-2d7f-44a4-bbe7-3c9a1c19b230`
   - Update the `template_name` to something unique (e.g., `homos-nextjs-sandbox`)

3. **Build and push your template:**
   ```bash
   e2b template build
   ```

4. **Get your template ID:**
   After the build completes, you'll receive a template ID. Copy it.

5. **Update your code:**
   - Open `/Users/sujal/Downloads/Homos/inngest/functions.ts`
   - Replace `"base"` with your new template ID or name

## Alternative: Use Environment Variable

You can also make this configurable via environment variable:

1. Add to your `.env.local`:
   ```env
   E2B_TEMPLATE_ID=your-template-id-here
   ```

2. Update the code to use:
   ```typescript
   const sandbox = await Sandbox.create(process.env.E2B_TEMPLATE_ID || "base");
   ```

## Finding Your Team ID

Your current team ID is: `ca4f6376-2d7f-44a4-bbe7-3c9a1c19b230`

You can verify this in the E2B dashboard at: https://e2b.dev/dashboard
