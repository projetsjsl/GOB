# 🧪 Test Email Setup Instructions

## Architecture
```
When chat message received
    ↓
Basic LLM Chain (Gemini)
    ↓
[NEW] Test Email Prep ← YOU ADD THIS
    ↓
Generate HTML Newsletter (EXISTING - REUSED!)
    ↓
Send Email via Resend (EXISTING - REUSED!)
```

## Step 1: Add the Prep Node

1. **In n8n**, click the **+** button after "Basic LLM Chain"
2. Search for **"Code"** and select it
3. Name it: **"Test Email Prep"**
4. Copy the code from: `n8n-test-prep-node.js`
5. Paste it into the Code node

## Step 2: Connect the Nodes

Connect in this order:
```
When chat message received → Basic LLM Chain → Test Email Prep → Generate HTML Newsletter → Send Email via Resend
```

## Step 3: Update "Send Email via Resend" Node

**IMPORTANT:** Make the recipients field dynamic to support test mode.

In the "Send Email via Resend" node, update the **JSON Body**:

### Current (hardcoded):
```json
{
  "from": "Emma Newsletter <onboarding@resend.dev>",
  "to": ["projetsjsl@gmail.com"],
  "subject": $json.subject,
  "html": $json.html_content
}
```

### New (dynamic):
```json
{
  "from": "Emma Newsletter <onboarding@resend.dev>",
  "to": $json.recipients || ["projetsjsl@gmail.com"],
  "subject": $json.subject,
  "html": $json.html_content
}
```

**Why?** The test flow sets `recipients: ['projetsjsl@gmail.com']`, while the production flow can use a different recipient list.

## Step 4: Test It!

1. **Save** the workflow in n8n
2. **Open** the chat interface (webhook URL for "When chat message received")
3. **Send** a test message like:
   - "Give me a market analysis"
   - "What's happening with tech stocks?"
   - "Analyze AAPL"
4. **Check** `projetsjsl@gmail.com` for the formatted email!

## What the Prep Node Does

✅ **Extracts LLM output** from "Basic LLM Chain"
✅ **Formats data structure** to match "Generate HTML Newsletter" expectations
✅ **Sets test metadata** (trigger_type: "🧪 Test Chat", model: "gemini-langchain")
✅ **Enables sending** (preview_mode: false, approved: true)
✅ **Routes to test email** (recipients: projetsjsl@gmail.com)

## Benefits of This Approach

🎯 **Single source of truth** - Only ONE "Generate HTML Newsletter" node
🔧 **Easy maintenance** - Update formatting in one place
♻️ **Code reuse** - No duplication
🧪 **Separate test path** - Test doesn't interfere with production
📧 **Same beautiful emails** - Test emails look exactly like production

## Email Differences: Test vs Production

| Feature | Production | Test |
|---------|-----------|------|
| Trigger | Schedule/Webhook/Manual | Chat |
| Model | Emma (Perplexity) or Gemini | Gemini LangChain |
| Badge | Based on prompt type | Shows "🧪 Test Chat" |
| Tickers | From Supabase | None (empty) |
| Tools | FMP, Finnhub, etc. | LangChain, Chat |
| Recipient | From config/API | projetsjsl@gmail.com |

## Troubleshooting

### Email not sending?
- Check "Send Email via Resend" node logs
- Verify Resend API key is valid
- Ensure `preview_mode: false` and `approved: true` in prep node

### Wrong content format?
- Check "Test Email Prep" node output
- Verify `newsletter_content` field exists
- Look at "Generate HTML Newsletter" node input

### Email looks wrong?
- The formatting comes from "Generate HTML Newsletter"
- Test will use the SAME template as production
- Check that node's code if you want to modify styling

## Next Steps

Want to customize the test email subject? Edit the prep node and add:

```javascript
// Custom subject for test emails
subject_prefix: '🧪 TEST: ',
```

Then in "Generate HTML Newsletter", check for this prefix and use it.
