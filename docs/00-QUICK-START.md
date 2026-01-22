# Quick Start Guide
## Get the Glass Quote Bot Running

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] n8n account (cloud or self-hosted)
- [ ] BotSailor account with WhatsApp number
- [ ] Supabase account
- [ ] Vercel account
- [ ] Google Cloud account (for Gemini API)
- [ ] PayFast merchant account
- [ ] SendGrid account (or SMTP provider)

---

## 1. Supabase Setup (30 minutes)

```bash
# 1. Create new project at supabase.com
# 2. Go to SQL Editor
# 3. Run the schema from docs/04-SUPABASE-SCHEMA.md
# 4. Note your credentials:
```

**Save these values:**
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 2. Vercel Deployment (20 minutes)

```bash
# Clone/create your Next.js project
npx create-next-app@latest glass-quote-app --typescript --tailwind

# Install dependencies
cd glass-quote-app
npm install @supabase/supabase-js nodemailer @react-pdf/renderer

# Deploy to Vercel
npm i -g vercel
vercel
```

**Set environment variables in Vercel Dashboard:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_SANDBOX=true
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
SENDGRID_API_KEY=
FROM_EMAIL=
COMPANY_EMAIL=
API_SECRET_KEY=your-random-secret
```

---

## 3. n8n Setup (30 minutes)

### Option A: n8n Cloud
1. Sign up at [n8n.io](https://n8n.io)
2. Create new workflow
3. Import `n8n-workflows/glass-quote-main.json`

### Option B: Self-Hosted
```bash
# Using Docker
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Configure Credentials in n8n:
1. **Gemini API Key**: Settings → Credentials → HTTP Query Auth
   - Name: `key`
   - Value: Your Gemini API key

2. **BotSailor API**: Settings → Credentials → HTTP Header Auth
   - Name: `Authorization`
   - Value: `Bearer YOUR_BOTSAILOR_API_KEY`

3. **Supabase API**: Settings → Credentials → HTTP Header Auth
   - Name: `apikey`
   - Value: Your Supabase anon key
   - Also add: `Authorization: Bearer YOUR_SUPABASE_ANON_KEY`

### Update Environment Variables in n8n:
```
APP_URL=https://your-app.vercel.app
API_SECRET_KEY=your-random-secret
SUPABASE_URL=https://xxxxx.supabase.co
PAYFAST_PASSPHRASE=your-passphrase
FROM_EMAIL=quotes@yourcompany.co.za
COMPANY_EMAIL=orders@yourcompany.co.za
```

---

## 4. BotSailor Setup (20 minutes)

1. **Login** to [botsailor.com](https://www.botsailor.com)

2. **Connect WhatsApp**:
   - Go to WhatsApp → Connect
   - Scan QR code with WhatsApp Business

3. **Configure Webhook**:
   ```
   URL: https://your-n8n-instance.com/webhook/glass-bot-webhook
   Events: Message, Media, Button Click
   ```

4. **Create Welcome Flow**:
   - Automation → Flow Builder → New
   - Add trigger: "Message Received"
   - Add welcome message with buttons
   - See `docs/02-WHATSAPP-CHAT-FLOW.md` for details

---

## 5. PayFast Setup (15 minutes)

### For Testing (Sandbox):
```
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn
PAYFAST_SANDBOX=true
```

### For Production:
1. Register at [payfast.co.za](https://www.payfast.co.za)
2. Complete business verification
3. Get credentials from Settings → Integration
4. Set `PAYFAST_SANDBOX=false`

### Configure Webhook URLs in PayFast:
```
Return URL: https://your-app.vercel.app/payment/success
Cancel URL: https://your-app.vercel.app/payment/cancel
Notify URL: https://your-n8n.com/webhook/payfast-notify
```

---

## 6. Test the Flow

### Test 1: Basic Message
1. Send "Hi" to your WhatsApp number
2. Should receive welcome message with buttons

### Test 2: Image Processing
1. Send a photo with measurements
2. Should receive extracted dimensions + quote

### Test 3: Payment
1. Get a quote
2. Click "Accept & Pay"
3. Complete sandbox payment
4. Verify confirmation message received

---

## Troubleshooting

### WhatsApp not responding?
- Check BotSailor webhook URL is correct
- Verify n8n workflow is active
- Check n8n execution logs

### Image OCR failing?
- Verify Gemini API key is valid
- Check image URL is accessible
- Review Gemini error response in n8n

### Payment not processing?
- Verify PayFast credentials
- Check ITN webhook URL
- Review PayFast sandbox logs

### Quotes not saving?
- Check Supabase credentials
- Verify RLS policies allow inserts
- Check Supabase logs for errors

---

## Next Steps

1. ✅ Basic flow working
2. → Customize BotSailor flows (see `02-WHATSAPP-CHAT-FLOW.md`)
3. → Build admin dashboard
4. → Add product catalog
5. → Enable reminders
6. → Go live with production credentials

---

## Support Resources

- **n8n Docs**: https://docs.n8n.io
- **BotSailor Docs**: https://docs.botsailor.com
- **Supabase Docs**: https://supabase.com/docs
- **PayFast Docs**: https://developers.payfast.co.za
- **Gemini API**: https://ai.google.dev/docs

---

## File Structure After Setup

```
Glass Demo/
├── docs/
│   ├── 00-QUICK-START.md          ← You are here
│   ├── 01-PROJECT-MASTER-PLAN.md
│   ├── 02-WHATSAPP-CHAT-FLOW.md
│   ├── 03-N8N-WORKFLOW.md
│   ├── 04-SUPABASE-SCHEMA.md
│   ├── 05-APPLICATION-STRUCTURE.md
│   ├── 06-PAYMENT-EMAIL-SETUP.md
│   ├── 07-IMPLEMENTATION-ROADMAP.md
│   └── 08-FEATURES-FROM-HDS.md
├── n8n-workflows/
│   ├── glass-quote-main.json
│   └── payment-notification.json
├── glass-quote-app/               ← Your Vercel app (to create)
└── project overview.md
```
