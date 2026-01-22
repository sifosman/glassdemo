# Implementation Roadmap
## Week-by-Week Development Plan

---

## Timeline Overview

| Week | Focus Area | Key Deliverables |
|------|------------|------------------|
| 1 | Foundation Setup | Supabase, Vercel project, BotSailor config |
| 2 | Core Bot Flow | WhatsApp conversation, Gemini integration |
| 3 | Quote Engine | Pricing logic, PDF generation, SANS compliance |
| 4 | Payments & Email | PayFast integration, email notifications |
| 5 | Dashboard & Polish | Admin interface, testing, refinements |

---

## Week 1: Foundation Setup

### Day 1-2: Supabase Setup
- [ ] Create Supabase project
- [ ] Run database schema (see `04-SUPABASE-SCHEMA.md`)
- [ ] Configure storage bucket for PDFs
- [ ] Set up Row Level Security policies
- [ ] Insert seed data (products)
- [ ] Test database connections

**Verification**: Can insert/query quotes via SQL Editor

### Day 3-4: Vercel Project Setup
- [ ] Create new Next.js project
- [ ] Set up project structure (see `05-APPLICATION-STRUCTURE.md`)
- [ ] Install dependencies
- [ ] Configure Tailwind CSS
- [ ] Set up environment variables
- [ ] Deploy initial version to Vercel
- [ ] Configure custom domain (optional)

**Verification**: Basic page loads at Vercel URL

### Day 5: BotSailor Configuration
- [ ] Create/configure BotSailor account
- [ ] Connect WhatsApp Business number
- [ ] Set up webhook URL pointing to n8n
- [ ] Create basic welcome flow
- [ ] Test message sending/receiving

**Verification**: Can send message to bot and receive response

### Day 6-7: n8n Setup
- [ ] Set up n8n instance (cloud or self-hosted)
- [ ] Create webhook endpoint
- [ ] Test BotSailor → n8n connection
- [ ] Set up Gemini API credentials
- [ ] Create basic workflow structure

**Verification**: Message from WhatsApp triggers n8n workflow

---

## Week 2: Core Bot Flow

### Day 1-2: Welcome & Menu Flow
- [ ] Create BotSailor welcome message
- [ ] Build button menu (New Quote, Repair, Shower, etc.)
- [ ] Create branch flows for each option
- [ ] Implement location check (safety glass detection)
- [ ] Add glass type selection

**Verification**: Complete menu navigation works

### Day 3-4: Measurement Collection
- [ ] Create measurement input flow (text option)
- [ ] Validate measurement format
- [ ] Create photo upload flow
- [ ] Forward images to n8n

**Verification**: Can collect measurements via text and image

### Day 5-6: Gemini Vision Integration
- [ ] Build Gemini Vision API request in n8n
- [ ] Create prompt for glass measurement extraction
- [ ] Parse Gemini response
- [ ] Handle confidence levels
- [ ] Request clarification for unclear images

**Verification**: Image uploaded → dimensions extracted → response to customer

### Day 7: AI Chat Integration
- [ ] Create AI handoff flow
- [ ] Build Gemini chat prompt with glass expert persona
- [ ] Handle conversation context
- [ ] Implement "back to menu" trigger

**Verification**: Complex questions answered by AI

---

## Week 3: Quote Engine

### Day 1-2: Pricing Logic
- [ ] Implement area calculation
- [ ] Apply expansion gap formula
- [ ] Implement safety glass pricing rules
- [ ] Add irregular shape surcharge
- [ ] Calculate VAT and totals

**Verification**: Correct prices for various scenarios

### Day 3-4: SANS Compliance Engine
- [ ] Implement safety location detection
- [ ] Auto-upgrade to safety glass when required
- [ ] Add safety warnings to quotes
- [ ] Include disclaimer text

**Verification**: Shower/door requests → safety glass selected

### Day 5-6: PDF Generation
- [ ] Create quote PDF template
- [ ] Include company branding
- [ ] Add item details and totals
- [ ] Include safety disclaimers
- [ ] Upload to Supabase storage

**Verification**: Professional PDF generates correctly

### Day 7: Quote API Integration
- [ ] Build `/api/quotes/generate` endpoint
- [ ] Connect n8n to quote API
- [ ] Store quotes in database
- [ ] Send quote to customer via WhatsApp
- [ ] Create customer-facing quote view page

**Verification**: End-to-end: Image → Quote → PDF → WhatsApp

---

## Week 4: Payments & Notifications

### Day 1-2: PayFast Integration
- [ ] Set up PayFast sandbox account
- [ ] Implement signature generation
- [ ] Create payment initiation endpoint
- [ ] Build payment form redirect
- [ ] Create success/cancel pages

**Verification**: Test payment completes in sandbox

### Day 3-4: Payment Notification Handler
- [ ] Implement ITN webhook
- [ ] Verify PayFast signature
- [ ] Update quote status on payment
- [ ] Generate invoice
- [ ] Record payment in database

**Verification**: Payment → Database updated → Invoice generated

### Day 5: Email Notifications
- [ ] Set up SendGrid
- [ ] Create payment confirmation email
- [ ] Create company notification email
- [ ] Create quote email template
- [ ] Test email delivery

**Verification**: Emails send correctly on payment

### Day 6-7: WhatsApp Notifications & Reminders
- [ ] Send payment confirmation via WhatsApp
- [ ] Implement reminder scheduler in n8n
- [ ] Create 24-hour reminder
- [ ] Create 3-day reminder
- [ ] Create expiry warning

**Verification**: Reminders trigger at correct times

---

## Week 5: Dashboard & Polish

### Day 1-2: Admin Dashboard
- [ ] Create admin layout
- [ ] Build quotes list page
- [ ] Add quote detail view
- [ ] Create stats dashboard
- [ ] Add filtering and search

**Verification**: View and manage quotes in dashboard

### Day 3: Customer Management
- [ ] Create customers list
- [ ] Show customer history
- [ ] Link quotes to customers

**Verification**: Full customer visibility

### Day 4: Products Management
- [ ] Create products list
- [ ] Add/edit products
- [ ] Update pricing

**Verification**: Can manage product catalog

### Day 5-6: Testing & Bug Fixes
- [ ] End-to-end testing
- [ ] Edge case handling
- [ ] Error message improvements
- [ ] Performance optimization
- [ ] Mobile responsiveness check

**Verification**: All flows work smoothly

### Day 7: Documentation & Handover
- [ ] Update documentation
- [ ] Create user guide
- [ ] Record demo video
- [ ] Prepare production checklist

**Verification**: Documentation complete

---

## Production Launch Checklist

### Pre-Launch
- [ ] Switch PayFast to production
- [ ] Verify all webhook URLs
- [ ] Set up error monitoring (Sentry/LogRocket)
- [ ] Configure production environment variables
- [ ] Test with real phone number
- [ ] Test with real payment (small amount)

### Launch Day
- [ ] Enable live WhatsApp number
- [ ] Monitor error logs
- [ ] Test first real customer interaction
- [ ] Verify emails delivering
- [ ] Check payment processing

### Post-Launch (Week 6+)
- [ ] Monitor quote conversion rates
- [ ] Collect customer feedback
- [ ] Iterate on AI responses
- [ ] Optimize conversation flow
- [ ] Add requested features

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Image OCR inaccuracy | Medium | High | Add manual confirmation step |
| PayFast integration issues | Low | High | Thorough sandbox testing |
| WhatsApp API changes | Low | Medium | Monitor BotSailor updates |
| AI hallucination | Medium | Medium | Clear system prompts + validation |
| High message volume | Low | Medium | n8n scalability planning |

---

## Feature Backlog (Future Phases)

### Phase 2: Enhanced Features
- [ ] Multi-language support (Afrikaans, Zulu)
- [ ] Voice message transcription
- [ ] Customer portal login
- [ ] Installation scheduling
- [ ] Feedback collection

### Phase 3: Business Intelligence
- [ ] Analytics dashboard
- [ ] Quote conversion tracking
- [ ] Popular product insights
- [ ] Customer lifetime value
- [ ] Revenue forecasting

### Phase 4: Advanced Automation
- [ ] Inventory integration
- [ ] Supplier ordering
- [ ] Installation team dispatch
- [ ] GPS tracking for installers
- [ ] Customer satisfaction surveys

---

## Support Resources

### Documentation
- BotSailor Docs: [docs.botsailor.com](https://docs.botsailor.com)
- n8n Docs: [docs.n8n.io](https://docs.n8n.io)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- PayFast Docs: [developers.payfast.co.za](https://developers.payfast.co.za)
- Gemini API: [ai.google.dev/docs](https://ai.google.dev/docs)

### Communities
- n8n Community: [community.n8n.io](https://community.n8n.io)
- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)

### Emergency Contacts
- BotSailor Support: support@botsailor.com
- PayFast Support: support@payfast.co.za
