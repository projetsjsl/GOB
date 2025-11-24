# 🚀 Twilio SMS Configuration - Setup Instructions

## Current Status
✅ **Twilio webhook configured** - Your Twilio number is correctly forwarding SMS to `https://gobapps.com/api/adapters/sms`

❌ **Database not configured** - Supabase tables need to be created

---

## 🗄️ Step 1: Setup Supabase Database

### 1.1 Access Supabase SQL Editor
1. Go to: https://app.supabase.com
2. Select your GOB project
3. Click **SQL Editor** in the left sidebar

### 1.2 Execute the Setup Script
1. Open the file `/supabase-multichannel-setup.sql` (in your GOB repository)
2. Copy **all** the content
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

This will create:
- ✅ `user_profiles` table (for multi-channel user management)
- ✅ Extensions to `conversation_history` (adds channel, status columns)
- ✅ `multichannel_messages` table
- ✅ `channel_logs` table (for debugging)
- ✅ `channel_preferences` table

### 1.3 Verify Tables Were Created

Run this SQL query in the SQL Editor:

```sql
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles',
    'conversation_history',
    'multichannel_messages',
    'channel_logs',
    'channel_preferences'
  )
ORDER BY table_name;
```

**Expected result:** You should see 5 tables listed.

---

## ⚙️ Step 2: Configure Vercel Environment Variables

### 2.1 Get Supabase Credentials

In Supabase:
1. Go to **Settings** → **API**
2. Copy these values:
   - **URL**: `https://xxxxx.supabase.co`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long key)

⚠️ **IMPORTANT**: The Service Role Key is secret - never commit it to git!

### 2.2 Add Environment Variables to Vercel

1. Go to: https://vercel.com/projetsjsls-projects/gob/settings/environment-variables
2. Add these variables (click **Add** for each):

```bash
# Supabase (Required for multichannel)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Twilio (Should already be set, but verify)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Gemini AI (Required for Emma responses)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2.3 Check if Variables Already Exist

Before adding, verify which variables are already set:
1. Go to: https://vercel.com/projetsjsls-projects/gob/settings/environment-variables
2. Check if these exist:
   - ✅ `GEMINI_API_KEY` (required for Emma AI)
   - ✅ `TWILIO_ACCOUNT_SID`
   - ✅ `TWILIO_AUTH_TOKEN`
   - ✅ `TWILIO_PHONE_NUMBER`
   - ❓ `SUPABASE_URL` (probably missing)
   - ❓ `SUPABASE_SERVICE_ROLE_KEY` (probably missing)

### 2.4 Redeploy After Adding Variables

After adding the Supabase variables, trigger a redeployment:

**Option A: Push to trigger auto-deploy**
```bash
git commit --allow-empty -m "trigger redeploy after env vars"
git push origin main
```

**Option B: Manual redeploy in Vercel Dashboard**
1. Go to: https://vercel.com/projetsjsls-projects/gob/deployments
2. Click the **three dots** on the latest deployment
3. Click **Redeploy**

---

## 🧪 Step 3: Test SMS Integration

Once Supabase is set up and Vercel redeployed:

### Test 1: Send SMS to Twilio Number
Send an SMS:
```
Test Emma
```

**Expected response:**
Emma IA should respond with an intelligent message based on your query.

### Test 2: Try a Stock Analysis
Send:
```
Analyse AAPL
```

**Expected response:**
Emma should provide financial analysis for Apple stock.

---

## 🐛 Troubleshooting

### Issue: Still getting error message

**Check 1: Verify Supabase tables exist**
```sql
SELECT * FROM user_profiles LIMIT 1;
```
If this fails, re-run `supabase-multichannel-setup.sql`

**Check 2: Verify environment variables in Vercel**
1. Go to: https://vercel.com/projetsjsls-projects/gob/settings/environment-variables
2. Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
3. Values should NOT be empty

**Check 3: Check Vercel logs**
1. Go to: https://vercel.com/projetsjsls-projects/gob/logs
2. Look for errors mentioning "Supabase" or "user_profiles"
3. Share the error message if you see one

**Check 4: Verify redeploy happened**
After adding environment variables, a new deployment should have been triggered.
Check: https://vercel.com/projetsjsls-projects/gob/deployments

---

## 📊 Debugging Tools

### Check Twilio Logs
Console → Monitor → Logs → SMS Logs
- Look for successful webhook deliveries to `gobapps.com/api/adapters/sms`
- Check response codes (should be 200, not 500)

### Check Vercel Logs
https://vercel.com/projetsjsls-projects/gob/logs
- Filter by `/api/adapters/sms` and `/api/chat`
- Look for error messages

### Check Supabase Logs
Supabase Dashboard → Logs → Query Logs
- Look for failed queries to `user_profiles` or `conversation_history`

---

## ✅ Success Indicators

When everything is working correctly:

1. **SMS Test** → Emma responds intelligently
2. **Vercel Logs** → No errors in `/api/chat` or `/api/adapters/sms`
3. **Supabase** → New rows appear in `user_profiles` and `conversation_history`
4. **Twilio Console** → Shows 200 OK responses from webhook

---

## 📚 Additional Resources

- **Full Multichannel Setup Guide**: `/docs/MULTICANAL-SETUP.md`
- **Supabase SQL Script**: `/supabase-multichannel-setup.sql`
- **SMS Adapter Code**: `/api/adapters/sms.js`
- **Chat API Code**: `/api/chat.js`

---

## 🆘 Need Help?

If you're still experiencing issues after following these steps:

1. **Check the logs** (Vercel + Twilio + Supabase)
2. **Run the test script**: `node test-multichannel.js sms`
3. **Verify webhook URL**: Should be `https://gobapps.com/api/adapters/sms`
4. **Verify environment variables**: All required keys should be set in Vercel

---

**Last Updated**: 2025-11-03
**Status**: Twilio webhook configured ✅ | Supabase setup required ❌
