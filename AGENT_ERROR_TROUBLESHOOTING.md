# Agent "Unknown Error" - Troubleshooting Guide

## ✅ Fixes Applied

I've improved the error handling in the agent to provide more detailed error messages. The "Unknown error" issue has been fixed with:

### 1. **Enhanced Error Logging**
- Added detailed error extraction from Error objects
- Now captures error stack traces for debugging
- Better error message formatting

### 2. **Environment Variable Validation**
Added checks for required environment variables:
- ✅ E2B_API_KEY validation
- ✅ OPENAI_API_KEY validation
- ✅ Clear error messages when keys are missing

### 3. **E2B Sandbox Error Handling**
- Better error messages for sandbox creation failures
- Template access validation
- API key verification

---

## 🔍 Common Causes of Agent Failures

### 1. **Missing Environment Variables**
**Error**: "E2B_API_KEY is not set" or "OPENAI_API_KEY is not set"

**Solution**: Create/update your `.env.local` file:
```env
# E2B Configuration
E2B_API_KEY=your_e2b_api_key_here

# OpenAI/AI Model Configuration
OPENAI_API_KEY=your_openai_or_github_token_here

# Inngest Configuration
INNGEST_EVENT_KEY=your_inngest_event_key

# Database
DATABASE_URL=your_database_url

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### 2. **Invalid API Keys**
**Error**: "Failed to create E2B sandbox" or API authentication errors

**Solution**: 
- Verify your E2B API key at: https://e2b.dev/dashboard
- For GitHub Models (OpenAI), get a token at: https://github.com/settings/tokens
- Make sure keys have proper permissions

### 3. **Template Access Issues**
**Error**: "Team does not have access to template"

**Solution**: Already fixed! The code now uses the "base" template which is accessible to all users.

### 4. **Database Connection Issues**
**Error**: Database-related errors

**Solution**:
- Verify DATABASE_URL is correct
- Run migrations: `npx prisma migrate deploy`
- Check database connection: `npx prisma db push`

### 5. **Inngest Configuration**
**Error**: "Inngest API Error: 401"

**Solution**: Already fixed! Make sure INNGEST_EVENT_KEY is set in your environment.

---

## 🚀 How to Get Detailed Error Messages Now

With the new error handling, you'll see specific error messages instead of "Unknown error":

1. **Check the console** - Error details are logged to console
2. **Check the database** - Error messages are saved in the messages table
3. **Check Inngest dashboard** - View function execution logs at https://app.inngest.com/

---

## 📋 Quick Checklist

Before running the agent, verify:

- [ ] E2B_API_KEY is set and valid
- [ ] OPENAI_API_KEY (or GitHub token) is set and valid
- [ ] INNGEST_EVENT_KEY is set
- [ ] DATABASE_URL is set and database is accessible
- [ ] Development server is running (`npm run dev`)
- [ ] All npm packages are installed (`npm install`)

---

## 🧪 Testing the Fix

1. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Try the agent again** - You should now see detailed error messages if something fails

3. **Check the logs** - Look at your terminal output for detailed error information

---

## 🔑 Getting Required API Keys

### E2B API Key
1. Go to https://e2b.dev/
2. Sign up or log in
3. Go to Dashboard → Settings → API Keys
4. Copy your API key

### GitHub Token (for OpenAI models)
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:org`
4. Copy the token

### Inngest Event Key
1. Go to https://app.inngest.com/
2. Sign up or log in
3. Go to your app settings
4. Copy the Event Key

---

## 💡 Next Steps

1. **Set up all environment variables** in `.env.local`
2. **Restart your development server**
3. **Test the agent** - You'll now get clear error messages
4. If you still see errors, check the specific error message and follow the solutions above

---

## 📞 Still Having Issues?

If you're still seeing errors after following this guide:

1. Check the **console output** for the detailed error message
2. Look at the **Inngest dashboard** for execution logs
3. Verify all environment variables are correctly set
4. Make sure your API keys are valid and have proper permissions

The improved error handling will now tell you exactly what's wrong!
