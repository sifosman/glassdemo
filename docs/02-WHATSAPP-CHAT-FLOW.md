# WhatsApp Chat Flow Design
## BotSailor + AI Hybrid Approach

---

## Recommendation: Hybrid Approach (Flows + AI)

After analyzing your requirements, I recommend a **hybrid approach**:

| Scenario | Approach | Reason |
|----------|----------|--------|
| Initial greeting & menu | **WhatsApp Flows** | Structured, fast, reliable |
| Simple measurements (text) | **WhatsApp Flows** | Predictable input format |
| Image uploads | **AI (Gemini)** | Vision analysis required |
| Complex questions | **AI Chat** | Flexible, natural responses |
| Quote confirmation | **WhatsApp Flows** | Clear yes/no actions |
| Payment links | **WhatsApp Flows** | Direct action buttons |

### Why Not Pure AI?
- **Cost**: Every message = API call to Gemini
- **Latency**: AI responses take 2-5 seconds vs instant flows
- **Predictability**: Flows ensure consistent user experience
- **Error handling**: Easier to manage in structured flows

### Why Not Pure Flows?
- **Image analysis**: Flows can't interpret photos
- **Complex queries**: "What glass do I need for a bathroom window near a shower?"
- **Natural conversation**: Some customers prefer chatting

---

## BotSailor Setup Guide

### Step 1: Create BotSailor Account
1. Go to [botsailor.com](https://www.botsailor.com)
2. Sign up and connect your WhatsApp Business number
3. Verify your business with Meta

### Step 2: Configure Webhook
In BotSailor dashboard:
```
Webhook URL: https://your-n8n-instance.com/webhook/glass-bot
Events to send:
  ✓ Message received
  ✓ Media received
  ✓ Flow response
  ✓ Button click
```

### Step 3: Create Flow Templates

---

## Complete Conversation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER SENDS MESSAGE                        │
│                    "Hi" / "Hello" / Any text                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     WELCOME MESSAGE                              │
│                                                                  │
│  👋 Welcome to [Company Name]!                                  │
│                                                                  │
│  We're Gauteng's trusted glass & glazing specialists.           │
│  Get an instant quote in under 2 minutes!                       │
│                                                                  │
│  How can we help you today?                                     │
│                                                                  │
│  [🪟 New Glass/Window]  [🔧 Repair/Replace]                     │
│  [🚿 Shower Door]       [📋 Other Services]                     │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
```

---

## Flow 1: New Glass/Window Quote

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW GLASS/WINDOW                              │
│                                                                  │
│  Great choice! Let's get your quote started.                    │
│                                                                  │
│  What type of glass do you need?                                │
│                                                                  │
│  [Clear Float]     [Tinted]        [Obscure/Privacy]            │
│  [Safety/Toughened] [Double Glazed] [Not Sure - Help Me]        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOCATION CHECK                                │
│                                                                  │
│  Where will this glass be installed?                            │
│  (This helps us ensure safety compliance)                       │
│                                                                  │
│  [Window - Above 800mm]   [Window - Below 800mm]                │
│  [Door/Sidelight]         [Bathroom]                            │
│  [Shopfront]              [Other]                               │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
    ┌───────────────┐                  ┌───────────────┐
    │ Standard Glass │                  │ SAFETY GLASS  │
    │   Allowed     │                  │   REQUIRED    │
    └───────────────┘                  └───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MEASUREMENT INPUT                             │
│                                                                  │
│  How would you like to provide measurements?                    │
│                                                                  │
│  [📏 Type Measurements]   [📸 Send a Photo]                     │
│  [📐 I Need Help Measuring]                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────┐           ┌─────────────────────┐
│   TYPE MEASUREMENTS │           │    SEND PHOTO       │
│                     │           │                     │
│ Enter dimensions:   │           │ 📸 Please send a    │
│ Width x Height      │           │ clear photo showing │
│ (in mm)             │           │ the glass/window    │
│                     │           │ with a tape measure │
│ Example: 600 x 900  │           │ visible if possible │
│                     │           │                     │
│ [Single piece]      │           │ Tips for best       │
│ [Multiple pieces]   │           │ results:            │
└─────────────────────┘           │ • Good lighting     │
                                  │ • Include ruler     │
                                  │ • Show full frame   │
                                  └─────────────────────┘
                                            │
                                            ▼
                                  ┌─────────────────────┐
                                  │  → TO n8n WORKFLOW  │
                                  │  → Gemini Vision    │
                                  │  → Extract sizes    │
                                  └─────────────────────┘
```

---

## Flow 2: Shower Door Quote

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHOWER DOOR                                   │
│                                                                  │
│  🚿 Shower enclosures are our specialty!                        │
│                                                                  │
│  ⚠️ Note: All shower glass MUST be toughened safety glass       │
│  as per SANS 10400-N regulations.                               │
│                                                                  │
│  What type of shower enclosure?                                 │
│                                                                  │
│  [Single Door]      [Door + Fixed Panel]                        │
│  [Corner Entry]     [Walk-in/Frameless]                         │
│  [Bath Screen]      [Custom]                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GLASS THICKNESS                               │
│                                                                  │
│  Select glass thickness:                                        │
│                                                                  │
│  [6mm Toughened]   - Standard, budget-friendly                  │
│  [8mm Toughened]   - Premium feel, recommended                  │
│  [10mm Toughened]  - Luxury, heavy-duty                         │
│  [Not Sure]        - We'll recommend based on size              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HARDWARE STYLE                                │
│                                                                  │
│  Choose your hardware finish:                                   │
│                                                                  │
│  [Chrome]          [Matt Black]                                 │
│  [Brushed Nickel]  [Gold/Brass]                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [Continue to measurements...]
```

---

## Flow 3: AI Chat Handoff

When customer selects "Not Sure" or asks complex question:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI ASSISTANT MODE                             │
│                                                                  │
│  🤖 I'm connecting you with our AI glass expert...             │
│                                                                  │
│  You can ask questions like:                                    │
│  • "What glass do I need for a bathroom window?"                │
│  • "Is tinted glass good for a west-facing window?"             │
│  • "What's the difference between laminated and toughened?"     │
│                                                                  │
│  Type your question below, or send [MENU] to return.            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [Route to Gemini AI via n8n]
```

### AI System Prompt for Glass Expert:

```
You are a helpful glass and glazing expert assistant for a South African 
glazing company in Gauteng. You help customers understand:

1. Glass types and their applications
2. Safety requirements (SANS 10400-N)
3. Pricing guidance (without exact quotes)
4. Installation considerations

IMPORTANT RULES:
- Always recommend safety glass for: showers, doors, sidelights, 
  low-level windows (below 800mm), balustrades
- Mention that toughened or laminated glass is required by law for 
  these applications
- If customer provides measurements, guide them to the quote flow
- Never provide exact prices - say "for an accurate quote, let me 
  get your measurements"
- Be friendly but professional
- Use South African terminology (e.g., "bakkie" not "truck")

If the customer seems ready to get a quote, respond with:
"Great! Let me get you an instant quote. I'll send you a quick form now."
[TRIGGER: QUOTE_FLOW]
```

---

## Flow 4: Quote Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUOTE READY                                   │
│                                                                  │
│  ✅ Your quote is ready!                                        │
│                                                                  │
│  Quote #: GLS-2024-0001                                         │
│  ─────────────────────────────                                  │
│  Item: 6mm Toughened Clear Glass                                │
│  Size: 1200mm x 900mm                                           │
│  Qty: 2 pieces                                                  │
│  ─────────────────────────────                                  │
│  Subtotal: R1,180.00                                            │
│  VAT (15%): R177.00                                             │
│  ─────────────────────────────                                  │
│  TOTAL: R1,357.00                                               │
│                                                                  │
│  ⏰ Valid for 7 days                                            │
│                                                                  │
│  [📄 View Full Quote PDF]                                       │
│  [✅ Accept & Pay Deposit]                                      │
│  [❌ Decline]                                                   │
│  [💬 I Have Questions]                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 5: Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT OPTIONS                               │
│                                                                  │
│  💳 Secure your order with a 50% deposit                        │
│                                                                  │
│  Deposit Amount: R678.50                                        │
│                                                                  │
│  Choose payment method:                                         │
│                                                                  │
│  [💳 Card Payment]    → PayFast secure checkout                 │
│  [🏦 EFT/Bank Transfer] → Bank details provided                 │
│  [📱 SnapScan]        → Scan QR code                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [PayFast payment link sent]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT CONFIRMED                             │
│                                                                  │
│  ✅ Payment Received!                                           │
│                                                                  │
│  Thank you for your deposit of R678.50                          │
│  Reference: PF-123456                                           │
│                                                                  │
│  What happens next:                                             │
│  1. We'll call you within 24 hours to arrange a site visit      │
│  2. Final measurements will be taken                            │
│  3. Manufacturing takes 5-7 working days                        │
│  4. Installation scheduled at your convenience                  │
│                                                                  │
│  📧 Confirmation email sent to your address                     │
│  📄 Invoice attached                                            │
│                                                                  │
│  Questions? Reply here or call 011 XXX XXXX                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Reminder Messages

### Reminder 1: 24 Hours After Quote (No Response)
```
┌─────────────────────────────────────────────────────────────────┐
│  👋 Hi [Name]!                                                  │
│                                                                  │
│  Just checking in about your glass quote from yesterday.        │
│                                                                  │
│  Quote #: GLS-2024-0001                                         │
│  Total: R1,357.00                                               │
│                                                                  │
│  Have any questions? I'm here to help!                          │
│                                                                  │
│  [View Quote]  [I Have Questions]  [Not Interested]             │
└─────────────────────────────────────────────────────────────────┘
```

### Reminder 2: 3 Days After Quote
```
┌─────────────────────────────────────────────────────────────────┐
│  ⏰ Your quote expires in 4 days                                │
│                                                                  │
│  Hi [Name], your glass quote is still waiting!                  │
│                                                                  │
│  💡 Tip: Secure current pricing with a deposit.                 │
│  Glass prices may increase without notice.                      │
│                                                                  │
│  [Accept Quote]  [Update Measurements]  [Cancel]                │
└─────────────────────────────────────────────────────────────────┘
```

### Reminder 3: Day Before Expiry
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Last chance! Quote expires tomorrow                        │
│                                                                  │
│  Hi [Name], just a heads up that your quote                     │
│  GLS-2024-0001 expires tomorrow.                                │
│                                                                  │
│  After that, we'll need to requote at current prices.           │
│                                                                  │
│  [Accept Now]  [Request Extension]  [Let It Expire]             │
└─────────────────────────────────────────────────────────────────┘
```

---

## BotSailor Flow Builder Setup

### Creating the Welcome Flow

1. **In BotSailor Dashboard**:
   - Go to: Automation → Flow Builder
   - Click: Create New Flow
   - Name: "Glass Quote Welcome Flow"

2. **Add Trigger**:
   - Type: "Message Received"
   - Condition: Any message OR keywords ["hi", "hello", "quote", "price"]

3. **Add Welcome Message Node**:
   - Type: "Send Message with Buttons"
   - Configure as per Flow 1 above

4. **Add Button Response Handlers**:
   - Create branches for each button option
   - Link to respective sub-flows

5. **Add Webhook Node** (for image/AI):
   - URL: Your n8n webhook URL
   - Method: POST
   - Include: message, sender, media_url

### Key BotSailor Settings

```json
{
  "flow_settings": {
    "timeout_minutes": 30,
    "fallback_message": "Sorry, I didn't understand that. Type MENU to see options.",
    "business_hours": {
      "enabled": true,
      "timezone": "Africa/Johannesburg",
      "hours": "08:00-17:00",
      "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
      "after_hours_message": "Thanks for your message! We'll respond first thing tomorrow. For urgent matters, call 011 XXX XXXX"
    }
  }
}
```

---

## Testing Checklist

- [ ] Welcome message displays correctly
- [ ] All button options work
- [ ] Safety glass warning triggers for showers/doors
- [ ] Image upload forwards to n8n
- [ ] AI chat responds appropriately
- [ ] Quote PDF generates and sends
- [ ] Payment link works
- [ ] Confirmation message sends after payment
- [ ] Reminders trigger at correct times
- [ ] After-hours message works
- [ ] Fallback message triggers on unknown input
