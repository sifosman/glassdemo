# OWD Glass-Bot: Master Project Plan
## WhatsApp AI Sales Agent for South African Glazing Industry

---

## Executive Summary

Building a WhatsApp-based AI Sales Agent for South African glazing firms (Gauteng focus) that automates lead qualification, instant quoting, and payment collection while ensuring SANS 10400-N safety compliance.

### Key Value Propositions
- **Instant Response**: < 30 seconds vs 2-24 hours
- **SANS Compliance**: Automatic safety glass detection for showers, doors, sidelights
- **Pre-qualified Leads**: Only warm leads get site visits
- **ROI**: R12k-R15k saved monthly per team (fuel + labor)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER JOURNEY                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WHATSAPP (BotSailor)                                │
│  • Initial greeting & menu                                                   │
│  • Collect project type (window/door/shower/etc)                            │
│  • Collect measurements (text or image)                                      │
│  • AI-powered conversation for complex queries                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            n8n WORKFLOW                                      │
│  • Webhook receiver from BotSailor                                          │
│  • Image processing via Gemini Vision API                                   │
│  • Route to Glass Quote API                                                 │
│  • Handle payment notifications                                             │
│  • Trigger reminders                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      VERCEL APPLICATION (Next.js/React)                     │
│  • API endpoints for quote generation                                       │
│  • PDF generation (quotes/invoices)                                         │
│  • Admin dashboard                                                          │
│  • Customer quote view                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE                                          │
│  • Customer data                                                            │
│  • Quotes & invoices                                                        │
│  • Glass products & pricing                                                 │
│  • Conversation history                                                     │
│  • Payment records                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTEGRATIONS                                        │
│  • PayFast (ZA payment gateway)                                             │
│  • SendGrid/SMTP (email notifications)                                      │
│  • Google Gemini (AI vision + chat)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| WhatsApp | BotSailor | Chatbot platform with flow builder |
| Automation | n8n (self-hosted or cloud) | Workflow orchestration |
| Backend | Node.js + Express (TypeScript) | API server |
| Frontend | React + TypeScript + TailwindCSS | Admin dashboard |
| Database | Supabase (PostgreSQL) | Data persistence |
| Hosting | Vercel | Application deployment |
| AI | Google Gemini 2.5 Pro | Vision OCR + Chat |
| Payments | PayFast | South African payment gateway |
| Email | SendGrid / SMTP | Transactional emails |

---

## Project Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Supabase project with schema
- [ ] Create Vercel project structure
- [ ] Configure BotSailor account
- [ ] Set up n8n instance

### Phase 2: Core Bot Flow (Week 2)
- [ ] Design WhatsApp conversation flow
- [ ] Implement measurement capture (text + image)
- [ ] Build Gemini Vision integration for image analysis
- [ ] Create quote calculation engine with SANS compliance

### Phase 3: Application & Dashboard (Week 3)
- [ ] Build quote generation API
- [ ] Create PDF generation service
- [ ] Develop admin dashboard
- [ ] Implement customer quote view page

### Phase 4: Payments & Notifications (Week 4)
- [ ] Integrate PayFast payment gateway
- [ ] Set up email notifications
- [ ] Implement WhatsApp reminders
- [ ] Create invoice generation

### Phase 5: Testing & Refinement (Week 5)
- [ ] End-to-end testing
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Documentation

---

## Key Features

### 1. Smart Glass Type Detection
Automatically detect when safety glass is required:
- **Showers**: Must use toughened safety glass
- **Doors**: Must use toughened safety glass
- **Sidelights**: Must use toughened safety glass
- **Low-level windows** (< 800mm from floor): Safety glass required

### 2. SANS 10400-N Compliance
- Automatic safety glass upgrade when detected
- Expansion gap calculation (subtract 3mm from tight sizes)
- Out-of-square surcharge (20%) for irregular shapes
- Clear disclaimer on all quotes

### 3. Image Analysis
- Accept photos of existing glass/windows
- OCR for measurement extraction
- Shape detection for irregular pieces
- Multiple image support for complex jobs

### 4. Instant Quoting
- Real-time price calculation
- Professional PDF quotes
- SMS/WhatsApp delivery
- Quote validity period (7-14 days)

### 5. Payment Collection
- 50% deposit collection via PayFast
- Multiple payment methods (card, EFT, SnapScan)
- Automatic invoice generation
- Payment confirmation emails

### 6. Follow-up Automation
- Quote reminder after 24 hours
- Follow-up after 3 days
- Expiry warning before quote expires
- Post-installation feedback request

---

## South African Glass Industry Context

### Common Glass Types & Pricing (Gauteng)
| Glass Type | Thickness | Price/m² (approx) |
|------------|-----------|-------------------|
| Clear Float | 4mm | R180-220 |
| Clear Float | 6mm | R250-300 |
| Toughened Clear | 6mm | R450-550 |
| Toughened Clear | 10mm | R650-800 |
| Laminated Safety | 6.38mm | R550-650 |
| Low-E Double Glazed | 24mm unit | R1200-1500 |
| Obscure/Patterned | 4mm | R220-280 |

### Common Applications
1. **Residential Windows** - Most common request
2. **Shower Doors/Enclosures** - High margin, safety glass required
3. **Shopfronts** - Commercial, larger quantities
4. **Balustrades** - Safety glass, specific regulations
5. **Splashbacks** - Kitchen/bathroom, toughened
6. **Mirrors** - Custom sizes

### Safety Requirements (SANS 10400-N)
- **Critical locations** requiring safety glass:
  - Within 300mm of a door edge
  - Below 800mm from floor level
  - In bathrooms/shower areas
  - Overhead glazing
  - Balustrades and barriers

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time | < 30 seconds | Time from message to first response |
| Quote Generation | < 2 minutes | Time from measurements to quote |
| Lead Conversion | > 25% | Quotes accepted / Total quotes |
| Customer Satisfaction | > 4.5/5 | Post-service rating |
| Monthly Savings | R12k-15k | Reduced site visits × travel cost |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Incorrect measurements from images | Clear disclaimer + verification step |
| AI misunderstanding glass type | Human review for complex jobs |
| Payment failures | Multiple payment methods + manual fallback |
| WhatsApp API downtime | Email fallback + status page |
| Pricing errors | Admin override + approval workflow |

---

## Next Steps

1. **Review this plan** and confirm scope
2. **Proceed to**: `02-WHATSAPP-CHAT-FLOW.md` for detailed bot design
3. **Then**: `03-N8N-WORKFLOW.md` for automation setup
4. **Then**: `04-SUPABASE-SCHEMA.md` for database design
5. **Then**: `05-APPLICATION-STRUCTURE.md` for Vercel app
6. **Finally**: `06-PAYMENT-EMAIL-SETUP.md` for integrations
