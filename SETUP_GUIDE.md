# 🔧 Complete Setup Guide - Fix Agent Errors

## 📊 Current Status

**Your Agent Error**: "Unknown error" 

**Root Cause**: Missing environment variables required for the agent to run.

---

## ✅ What I've Fixed

### 1. **Improved Error Messages**
- ✅ Changed "Unknown error" to show detailed error messages
- ✅ Added environment variable validation
- ✅ Better error logging in console and database

### 2. **E2B Template Access**
- ✅ Fixed template access error
- ✅ Now uses "base" template (publicly accessible)
- ✅ Added E2B API key validation

### 3. **Error Handling**
- ✅ Added try-catch blocks for sandbox creation
- ✅ Better error messages for API failures
- ✅ Stack trace logging for debugging

### 4. **Validation Script**
- ✅ Created `npm run validate-env` to check environment setup
- ✅ Shows which variables are missing
- ✅ Provides setup instructions

---

## 🚀 Quick Fix - Set Up Your Environment

### Step 1: Create Environment File

Create a `.env.local` file in your project root:

```bash
touch .env.local
```

### Step 2: Add Required Variables

Copy this template into `.env.local` and fill in your actual values:

```env
# ==========================================
# E2B - Cloud Sandbox Platform
# ==========================================
# Get your key from: https://e2b.dev/dashboard
E2B_API_KEY=e2b_xxx

# ==========================================
# AI Model API Key
# ==========================================
# For GitHub Models, get token from: https://github.com/settings/tokens
# Or use OpenAI key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=ghp_xxx  # or sk-xxx for OpenAI

# ==========================================
# Inngest - Background Jobs
# ==========================================
# Get from: https://app.inngest.com/
INNGEST_EVENT_KEY=inngest_xxx
INNGEST_SIGNING_KEY=signkey-prod-xxx

# ==========================================
# Database - Neon PostgreSQL
# ==========================================
# Get from: https://neon.tech/
DATABASE_URL=postgresql://xxx

# ==========================================
# Clerk - Authentication
# ==========================================
# Get from: https://dashboard.clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# ==========================================
# Optional Configuration
# ==========================================
E2B_TEMPLATE_ID=base
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Get Your API Keys

#### 🔹 E2B API Key (Required)
1. Go to https://e2b.dev/
2. Sign up for a free account
3. Navigate to **Dashboard** → **API Keys**
4. Copy your API key
5. Paste it as `E2B_API_KEY` in `.env.local`

#### 🔹 GitHub Token / OpenAI Key (Required)
**Option A - GitHub Models (Free tier available):**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:org`
4. Copy the token (starts with `ghp_`)
5. Paste it as `OPENAI_API_KEY` in `.env.local`

**Option B - OpenAI (Paid):**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)
4. Paste it as `OPENAI_API_KEY` in `.env.local`

#### 🔹 Inngest Event Key (Required)
1. Go to https://app.inngest.com/
2. Sign up or log in
3. Create a new app or select existing
4. Go to **Settings** → **Keys**
5. Copy the **Event Key**
6. Paste it as `INNGEST_EVENT_KEY` in `.env.local`

#### 🔹 Database URL (Required)
1. Go to https://neon.tech/
2. Sign up for free
3. Create a new project
4. Copy the connection string
5. Paste it as `DATABASE_URL` in `.env.local`

#### 🔹 Clerk Keys (Required)
1. Go to https://dashboard.clerk.com/
2. Sign up or log in
3. Create a new application
4. Go to **API Keys**
5. Copy both keys and paste them in `.env.local`

### Step 4: Validate Your Setup

Run the validation script:

```bash
npm run validate-env
```

You should see all green checkmarks ✅

### Step 5: Set Up Database

Run Prisma migrations:

```bash
npx prisma generate
npx prisma db push
```

### Step 6: Restart Your Dev Server

```bash
npm run dev
```

---

## 🧪 Testing the Agent

1. Open your app at `http://localhost:3000`
2. Try using the AI agent
3. If you get an error, it will now show a **detailed error message** instead of "Unknown error"
4. Check the console for additional debugging information

---

## 🔍 Troubleshooting Specific Errors

### Error: "E2B_API_KEY is not set"
**Solution**: Add `E2B_API_KEY` to your `.env.local` file

### Error: "OPENAI_API_KEY is not set"
**Solution**: Add `OPENAI_API_KEY` to your `.env.local` file

### Error: "Failed to create E2B sandbox"
**Solutions**:
- Verify your E2B_API_KEY is correct
- Check you have credits in your E2B account
- Try the "base" template (already configured)

### Error: "Inngest API Error: 401"
**Solution**: Add `INNGEST_EVENT_KEY` to your `.env.local` file

### Error: "Database connection failed"
**Solutions**:
- Verify DATABASE_URL is correct
- Run `npx prisma db push`
- Check your database is accessible

---

## 📝 Quick Checklist

Before running the agent:

- [ ] Created `.env.local` file
- [ ] Added all 6 required environment variables
- [ ] Got API keys from E2B, GitHub/OpenAI, Inngest, Neon, and Clerk
- [ ] Ran `npm run validate-env` (all green checkmarks)
- [ ] Ran `npx prisma db push`
- [ ] Restarted dev server
- [ ] Tested the agent

---

## 💡 Development Tips

### Use Local Inngest Dev Server
For local development, you can skip the Inngest cloud setup:

```bash
# In a separate terminal
npx inngest-cli@latest dev
```

This runs a local Inngest server and you don't need INNGEST_EVENT_KEY.

### Check Logs
Monitor logs in multiple places:
- **Browser Console**: Client-side errors
- **Terminal**: Server-side logs and agent execution
- **Inngest Dashboard**: Function execution history
- **E2B Dashboard**: Sandbox usage and logs

---

## 🎉 Success!

Once you complete all steps:
1. The agent will work without "Unknown error"
2. You'll see detailed error messages if something goes wrong
3. You can validate your setup anytime with `npm run validate-env`

Happy coding! 🚀
