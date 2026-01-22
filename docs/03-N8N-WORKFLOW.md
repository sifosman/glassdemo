# n8n Workflow Setup Guide
## Glass Quote Bot Automation

---

## Overview

The n8n workflow handles:
1. **Webhook receiver** - Receives messages from BotSailor
2. **Image processing** - Sends images to Gemini Vision API
3. **Quote generation** - Calls your Vercel API
4. **Payment handling** - Processes PayFast notifications
5. **Reminders** - Scheduled follow-up messages
6. **AI Chat** - Routes complex questions to Gemini

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MAIN WORKFLOWS                               │
└─────────────────────────────────────────────────────────────────┘

1. Glass Quote Main Flow
   Webhook → Router → [Image/Text/AI] → Quote API → BotSailor Response

2. Payment Notification Flow  
   PayFast ITN → Verify → Update DB → Send Confirmation → Email

3. Reminder Scheduler Flow
   Schedule Trigger → Check Pending Quotes → Send Reminders

4. AI Chat Flow
   Webhook → Gemini AI → BotSailor Response
```

---

## Workflow 1: Main Glass Quote Flow

### Node Configuration

#### 1. Webhook Node (Entry Point)
```json
{
  "name": "BotSailor Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "glass-bot-webhook",
    "responseMode": "responseNode",
    "options": {
      "rawBody": true
    }
  }
}
```

#### 2. Router Node (Message Type Detection)
```javascript
// Code node to determine message type
const body = $input.first().json.body;

let messageType = 'text';
let routeOutput = 0;

// Check if it's an image
if (body.media_url || body.user_input_data?.[0]?.answer?.includes('http')) {
  messageType = 'image';
  routeOutput = 0; // Route to image processing
}
// Check if it's a flow response with measurements
else if (body.user_input_data && body.flow_id) {
  messageType = 'flow_response';
  routeOutput = 1; // Route to quote generation
}
// Check if AI chat mode
else if (body.message?.toLowerCase().includes('help') || 
         body.context?.mode === 'ai_chat') {
  messageType = 'ai_chat';
  routeOutput = 2; // Route to AI
}
// Default text handling
else {
  messageType = 'text';
  routeOutput = 3; // Route to standard response
}

return [{
  json: {
    ...body,
    messageType,
    routeOutput,
    phoneNumber: body.chat_id,
    senderName: body.first_name || 'Customer'
  }
}];
```

#### 3. Image Processing Branch

##### 3a. Download Image
```json
{
  "name": "Download Image",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "={{ $json.body.user_input_data[0].answer }}",
    "options": {
      "response": {
        "response": {
          "responseFormat": "file"
        }
      }
    }
  }
}
```

##### 3b. Convert to Base64
```json
{
  "name": "Extract from File",
  "type": "n8n-nodes-base.extractFromFile",
  "parameters": {
    "operation": "binaryToPropery"
  }
}
```

##### 3c. Prepare Gemini Request
```javascript
// Code node to build Gemini Vision API request
const base64Image = $input.first().json.data;
const phoneNumber = $('BotSailor Webhook').item.json.body.chat_id;
const senderName = $('BotSailor Webhook').item.json.body.first_name;

if (!base64Image) {
  throw new Error("No base64 image found");
}

const prompt = `
You are a glass measurement extraction expert for a South African glazing company.

Analyze this image and extract:
1. Glass/window dimensions (width x height in mm)
2. Number of pieces if multiple
3. Glass type if visible (clear, tinted, frosted, etc.)
4. Installation location if identifiable (window, door, shower, etc.)
5. Any visible damage or special requirements

Output format (JSON):
{
  "measurements": [
    {"width": 1200, "height": 900, "quantity": 1}
  ],
  "glassType": "clear" | "tinted" | "frosted" | "unknown",
  "location": "window" | "door" | "shower" | "other" | "unknown",
  "notes": "any additional observations",
  "confidence": "high" | "medium" | "low",
  "requiresSafetyGlass": true | false
}

If measurements are unclear, set confidence to "low" and add explanation in notes.
If you see a tape measure or ruler, use it for scale.
`.trim();

return [{
  json: {
    contents: [{
      role: "user",
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image
          }
        }
      ]
    }],
    phoneNumber,
    senderName
  }
}];
```

##### 3d. Call Gemini Vision API
```json
{
  "name": "Gemini Vision API",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
    "authentication": "genericCredentialType",
    "genericAuthType": "queryAuth",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify($json) }}"
  }
}
```

**Note**: Store your Gemini API key in n8n credentials:
- Type: Query Auth
- Name: key
- Value: YOUR_GEMINI_API_KEY

##### 3e. Parse Gemini Response
```javascript
// Extract and parse Gemini's response
const response = $input.first().json;
const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

// Try to parse JSON from response
let extractedData;
try {
  // Find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    extractedData = JSON.parse(jsonMatch[0]);
  }
} catch (e) {
  extractedData = {
    measurements: [],
    confidence: 'low',
    notes: 'Could not parse measurements from image'
  };
}

return [{
  json: {
    ...extractedData,
    rawResponse: text,
    phoneNumber: $('BotSailor Webhook').item.json.body.chat_id,
    senderName: $('BotSailor Webhook').item.json.body.first_name
  }
}];
```

#### 4. Quote Generation

##### 4a. Call Glass Quote API
```json
{
  "name": "Generate Quote",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://your-glass-app.vercel.app/api/quotes/generate",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {"name": "Content-Type", "value": "application/json"},
        {"name": "x-api-key", "value": "YOUR_API_KEY"}
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {"name": "phoneNumber", "value": "={{ $json.phoneNumber }}"},
        {"name": "customerName", "value": "={{ $json.senderName }}"},
        {"name": "measurements", "value": "={{ JSON.stringify($json.measurements) }}"},
        {"name": "glassType", "value": "={{ $json.glassType }}"},
        {"name": "location", "value": "={{ $json.location }}"},
        {"name": "requiresSafetyGlass", "value": "={{ $json.requiresSafetyGlass }}"}
      ]
    }
  }
}
```

#### 5. Send Response via BotSailor

##### 5a. Format Response Message
```javascript
// Format the quote response for WhatsApp
const quote = $input.first().json;

let message = '';

if (quote.success) {
  message = `✅ *Quote Ready!*

Quote #: ${quote.quoteNumber}
─────────────────

`;

  quote.items.forEach((item, i) => {
    message += `${i+1}. ${item.description}
   Size: ${item.width}mm x ${item.height}mm
   Qty: ${item.quantity}
   Price: R${item.lineTotal.toFixed(2)}

`;
  });

  message += `─────────────────
Subtotal: R${quote.subtotal.toFixed(2)}
VAT (15%): R${quote.vat.toFixed(2)}
*TOTAL: R${quote.total.toFixed(2)}*

⏰ Valid for 7 days

📄 View full quote: ${quote.pdfUrl}`;

} else {
  message = `❌ Sorry, I couldn't generate a quote.

${quote.error || 'Please try again or contact us directly.'}

Call: 011 XXX XXXX`;
}

return [{
  json: {
    message,
    phoneNumber: quote.phoneNumber,
    quoteUrl: quote.pdfUrl,
    quoteNumber: quote.quoteNumber
  }
}];
```

##### 5b. Send via BotSailor API
```json
{
  "name": "Send WhatsApp Message",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://www.botsailor.com/api/v1/whatsapp/send-message",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {"name": "Authorization", "value": "Bearer YOUR_BOTSAILOR_API_KEY"},
        {"name": "Content-Type", "value": "application/json"}
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {"name": "phone", "value": "={{ $json.phoneNumber }}"},
        {"name": "message", "value": "={{ $json.message }}"}
      ]
    }
  }
}
```

##### 5c. Send Interactive Buttons
```json
{
  "name": "Send Quote Buttons",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://www.botsailor.com/api/v1/whatsapp/send-interactive",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {"name": "Authorization", "value": "Bearer YOUR_BOTSAILOR_API_KEY"},
        {"name": "Content-Type", "value": "application/json"}
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": {
      "phone": "={{ $json.phoneNumber }}",
      "type": "button",
      "body": "What would you like to do?",
      "buttons": [
        {"id": "accept_quote", "title": "✅ Accept Quote"},
        {"id": "ask_question", "title": "💬 Ask Question"},
        {"id": "decline", "title": "❌ Decline"}
      ]
    }
  }
}
```

---

## Workflow 2: Payment Notification Flow

```
PayFast ITN Webhook → Verify Signature → Update Quote Status → 
Generate Invoice → Send Confirmation → Email Company
```

### Node Configuration

#### 1. PayFast ITN Webhook
```json
{
  "name": "PayFast ITN Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "payfast-notify",
    "responseMode": "onReceived",
    "options": {}
  }
}
```

#### 2. Verify PayFast Signature
```javascript
// Verify PayFast ITN signature
const crypto = require('crypto');
const data = $input.first().json.body;

const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || 'your_passphrase';

// Build parameter string (exclude signature)
const params = { ...data };
delete params.signature;

const paramString = Object.keys(params)
  .filter(key => params[key] !== '')
  .sort()
  .map(key => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`)
  .join('&');

const stringToHash = `${paramString}&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE)}`;
const calculatedSignature = crypto.createHash('md5').update(stringToHash).digest('hex');

const isValid = calculatedSignature === data.signature;

if (!isValid) {
  throw new Error('Invalid PayFast signature');
}

return [{
  json: {
    ...data,
    signatureValid: true,
    quoteId: data.m_payment_id,
    amount: parseFloat(data.amount_gross),
    paymentStatus: data.payment_status
  }
}];
```

#### 3. Update Quote in Supabase
```json
{
  "name": "Update Quote Status",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "PATCH",
    "url": "https://your-project.supabase.co/rest/v1/quotes",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {"name": "apikey", "value": "YOUR_SUPABASE_ANON_KEY"},
        {"name": "Authorization", "value": "Bearer YOUR_SUPABASE_ANON_KEY"},
        {"name": "Content-Type", "value": "application/json"},
        {"name": "Prefer", "value": "return=representation"}
      ]
    },
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {"name": "id", "value": "eq.{{ $json.quoteId }}"}
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {"name": "status", "value": "paid"},
        {"name": "payment_reference", "value": "={{ $json.pf_payment_id }}"},
        {"name": "payment_date", "value": "={{ new Date().toISOString() }}"},
        {"name": "deposit_amount", "value": "={{ $json.amount }}"}
      ]
    }
  }
}
```

#### 4. Send Payment Confirmation (WhatsApp)
```javascript
// Format payment confirmation message
const payment = $input.first().json;

const message = `✅ *Payment Received!*

Thank you for your deposit of R${payment.amount.toFixed(2)}

Reference: ${payment.pf_payment_id}
Quote #: ${payment.quoteId}

*What happens next:*
1️⃣ We'll call you within 24 hours
2️⃣ Site measurement arranged
3️⃣ Manufacturing: 5-7 working days
4️⃣ Installation at your convenience

📧 Invoice sent to your email
📞 Questions? Call 011 XXX XXXX`;

return [{
  json: {
    message,
    phoneNumber: payment.custom_str1 // Phone stored in custom field
  }
}];
```

#### 5. Send Email to Company
```json
{
  "name": "Email Company",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "noreply@yourcompany.co.za",
    "toEmail": "orders@yourcompany.co.za",
    "subject": "💰 New Payment Received - Quote #{{ $json.quoteId }}",
    "text": "Payment received:\n\nQuote: {{ $json.quoteId }}\nAmount: R{{ $json.amount }}\nReference: {{ $json.pf_payment_id }}\nCustomer Phone: {{ $json.custom_str1 }}\n\nPlease contact customer to arrange site visit.",
    "options": {}
  }
}
```

---

## Workflow 3: Reminder Scheduler

### Schedule Trigger (Run every hour)
```json
{
  "name": "Hourly Schedule",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [{"field": "hours", "triggerAtHour": 1}]
    }
  }
}
```

### Get Pending Quotes from Supabase
```json
{
  "name": "Get Pending Quotes",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "https://your-project.supabase.co/rest/v1/quotes",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {"name": "apikey", "value": "YOUR_SUPABASE_ANON_KEY"},
        {"name": "Authorization", "value": "Bearer YOUR_SUPABASE_ANON_KEY"}
      ]
    },
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {"name": "status", "value": "eq.sent"},
        {"name": "select", "value": "*"}
      ]
    }
  }
}
```

### Filter and Send Reminders
```javascript
// Determine which reminders to send
const quotes = $input.first().json;
const now = new Date();
const reminders = [];

quotes.forEach(quote => {
  const createdAt = new Date(quote.created_at);
  const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
  const expiryDate = new Date(quote.expiry_date);
  const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
  
  // 24-hour reminder
  if (hoursSinceCreated >= 24 && hoursSinceCreated < 25 && !quote.reminder_24h_sent) {
    reminders.push({
      quoteId: quote.id,
      phoneNumber: quote.customer_phone,
      reminderType: '24h',
      quoteNumber: quote.quote_number,
      total: quote.total
    });
  }
  
  // 3-day reminder
  if (hoursSinceCreated >= 72 && hoursSinceCreated < 73 && !quote.reminder_3d_sent) {
    reminders.push({
      quoteId: quote.id,
      phoneNumber: quote.customer_phone,
      reminderType: '3d',
      quoteNumber: quote.quote_number,
      total: quote.total
    });
  }
  
  // Expiry warning (24 hours before)
  if (hoursUntilExpiry <= 24 && hoursUntilExpiry > 23 && !quote.reminder_expiry_sent) {
    reminders.push({
      quoteId: quote.id,
      phoneNumber: quote.customer_phone,
      reminderType: 'expiry',
      quoteNumber: quote.quote_number,
      total: quote.total
    });
  }
});

return reminders.map(r => ({ json: r }));
```

---

## Environment Variables for n8n

Create these in your n8n instance:

```env
# BotSailor
BOTSAILOR_API_KEY=your_botsailor_api_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# PayFast
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase

# Your App
APP_URL=https://your-glass-app.vercel.app
API_KEY=your_internal_api_key

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

---

## Import Ready Workflow JSON

See: `../n8n-workflows/glass-quote-main.json` for the complete importable workflow.

---

## Testing the Workflow

1. **Test Webhook**: Use n8n's webhook test URL
2. **Simulate BotSailor Payload**:
```json
{
  "body": {
    "chat_id": "27821234567",
    "first_name": "John",
    "message": "Hi, I need a quote",
    "user_input_data": [
      {"answer": "https://example.com/image.jpg"}
    ]
  }
}
```

3. **Check each node** executes correctly
4. **Verify BotSailor** receives the response
