# 🔑 Missing API Keys - Quick Setup

Your `.env` file is mostly complete! You just need to add 2 more API keys:

## ✅ What You Already Have
- ✅ E2B_API_KEY
- ✅ DATABASE_URL
- ✅ CLERK Keys

## ❌ What You Need to Add

Add these lines to your `.env` file:

```env
# AI Model API
OPENAI_API_KEY=your_key_here

# Inngest Background Jobs
INNGEST_EVENT_KEY=your_key_here
```

---

## 🔹 1. Get OPENAI_API_KEY

You have two options:

### Option A: GitHub Models (Recommended - Free Tier Available)
1. Go to https://github.com/settings/tokens
2. Click "New Application" button
3. Give it a name like "Homos.ai"
4. Choose "Personal Account" for the Application Owner
   - ✅ `read:org`
5. Click "Generate token"
6. Copy the token (starts with `ghp_`)
7. Add to `.env`: `OPENAI_API_KEY=ghp_your_token_here`

### Option B: OpenAI (Paid)
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Add to `.env`: `OPENAI_API_KEY=sk_your_key_here`

---

## 🔹 2. Get INNGEST_EVENT_KEY

### Option 1: Inngest Cloud (Recommended)
1. Go to https://app.inngest.com/
2. Sign up or log in (it's free!)
3. Create a new app or select existing one
4. Go to **Settings** → **Keys** or **Events**
5. Copy the **Event Key** (starts with `inngest_`)
6. Add to `.env`: `INNGEST_EVENT_KEY=inngest_your_key_here`

### Option 2: Local Development (No key needed)
For local development only, you can run Inngest locally:

```bash
# In a separate terminal
npx inngest-cli@latest dev
```

Then you can skip the `INNGEST_EVENT_KEY` for now (but the validation will still show a warning).

---

## 📝 Quick Copy-Paste Template

Open your `.env` file and add these lines at the end:

```env
# ==========================
# 🤖 AI MODEL API
# ==========================
OPENAI_API_KEY=

# ==========================
# 🔄 INNGEST
# ==========================
INNGEST_EVENT_KEY=
```

Then fill in the values after the `=` sign.

---

## ✅ Verify Your Setup

After adding the keys, run:

```bash
npm run validate-env
```

You should see all green checkmarks! ✅

---

## 🚀 Then Restart Your Server

```bash
# Stop the current server (Ctrl+C if running)
npm run dev
```

Your agent should now work without errors! 🎉
