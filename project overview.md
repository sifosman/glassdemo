# OWD Glass-Bot Project

## 📚 Complete Documentation

All detailed documentation has been created in the `docs/` folder:

| Document | Description |
|----------|-------------|
| [00-QUICK-START.md](docs/00-QUICK-START.md) | Step-by-step setup guide |
| [01-PROJECT-MASTER-PLAN.md](docs/01-PROJECT-MASTER-PLAN.md) | Architecture & overview |
| [02-WHATSAPP-CHAT-FLOW.md](docs/02-WHATSAPP-CHAT-FLOW.md) | BotSailor flow design |
| [03-N8N-WORKFLOW.md](docs/03-N8N-WORKFLOW.md) | n8n automation setup |
| [04-SUPABASE-SCHEMA.md](docs/04-SUPABASE-SCHEMA.md) | Database design |
| [05-APPLICATION-STRUCTURE.md](docs/05-APPLICATION-STRUCTURE.md) | Vercel app structure |
| [06-PAYMENT-EMAIL-SETUP.md](docs/06-PAYMENT-EMAIL-SETUP.md) | PayFast & email config |
| [07-IMPLEMENTATION-ROADMAP.md](docs/07-IMPLEMENTATION-ROADMAP.md) | Week-by-week plan |
| [08-FEATURES-FROM-HDS.md](docs/08-FEATURES-FROM-HDS.md) | HDS project adaptation |

## 🔧 Ready-to-Import n8n Workflows

Located in `n8n-workflows/`:
- `glass-quote-main.json` - Main quote flow
- `payment-notification.json` - PayFast ITN handler

---

## Original Concept Document

1. The Core Concept: The "OWD Glass-Bot"You are building a WhatsApp-based AI Sales Agent specifically for South African glazing firms (Gauteng focus). It solves the industry's biggest bottleneck: The "Messy" Lead.The Problem it Solves:Admin Overload: Owners spend 4–6 hours a day replying to "How much for a window?" on WhatsApp.Wasted Fuel/Time: Teams drive to Sandton or Centurion only to find the customer can’t afford the price.Compliance Risk: Non-expert staff might quote "Cheap Float" glass for a shower or door, violating SANS safety laws.2. Comparison: The Industry ShiftFeatureThe "Old Way" (Manual)The "New Way" (OWD Engine)First Response2 to 24 hours (usually after hours).Instant (Under 30 seconds).Quoting AccuracyHuman error in math or safety rules.AI-standardized based on SANS 10400-N.Lead QualityHigh volume of "Tire Kickers."Pre-qualified. Only warm leads get site visits.Customer ExperienceFrustration due to "Ghosting."Immediate gratification and professional PDF.ROIHigh fuel & labor waste on failed visits.R12k - R15k saved monthly per bakkie/team.3. The "Golden Nugget": Expert Knowledge ImplementationTo win over a business owner with "25 years of experience," your AI must apply these South African trade rules automatically:SANS 10400-N Safety Logic: The bot must detect keywords like Shower, Door, Sidelight, or Low-level window and automatically switch pricing to Toughened Safety Glass.The Expansion Gap: The bot must subtract $3mm$ from "Tight Sizes" to account for thermal expansion ($Price = (W-3) \times (H-3) \times Rate$).The "Out of Square" Check: If the image looks irregular, the bot must add a 20% Shaping Surcharge.The Disclaimer (Your Safety Net): "This is a Preliminary Estimate for budgeting. Final manufacturing is subject to a physical site measurement by our qualified installer."4. Step-by-Step Build Guide (The Technical Sprint)Phase 1: The Engine (Week 1)WhatsApp API: Use WATI or Twilio (WATI is often easier for SA numbers).Logic: Connect the API to OpenAI GPT-4o.Database: Use Supabase to store client-specific price lists (e.g., Client A charges R650/m² for 4mm Float, Client B charges R720).Phase 2: The System Prompt (Week 2)Program the AI to act as a "Senior Estimator." Tell it: "You are an expert South African glazier. You calculate area, apply 0.25m² minimums, and always prioritize SANS safety glass in high-risk zones."Phase 3: The Demo Build (Week 2)Load a "Dummy" price list. Take 3 photos of messy sketches and test the AI’s ability to extract the Width and Height correctly.5. The Go-to-Market Strategy: How to Sell itWhere to Advertise:LinkedIn Ads: Target job titles "Owner," "Director," or "Operations Manager" in the "Glass & Ceramics" or "Construction" industries in Gauteng.Direct Outreach: Find the top 20 glaziers on Google Maps in Sandton, Midrand, and Centurion.The "Stealth" Approach: Join South African contractor groups on Facebook and look for people complaining about "time-wasters."What to Say (The Script):*"Hi [Owner Name], I noticed your team handles a lot of custom glass requests via WhatsApp. I’ve built an AI engine that reads customer sketches, checks them against SANS safety standards, and provides an instant 'Ballpark Quote' 24/7.It saves my clients about R12,000 a month in wasted fuel and site visits. I’d love to show you a 2-minute demo on your own phone. Do you have a moment on Tuesday?"*6. How to Reach R100k/MonthTo hit your goal and leave your job, you need 8 to 10 clients.Upfront Setup Fee: R15,000 (To "skin" the bot with their logo and prices).Monthly Retainer: R8,500 (Covers your hosting, AI costs, and profit).Total with 10 Clients: R85,000/mo (Passive) + R150,000 (Upfront Cash).Pro Tip: Don't sell "Software." Sell "The Filter." Tell them: "My bot makes sure your installers only drive to people who have already agreed to the price."