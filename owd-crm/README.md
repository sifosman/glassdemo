# OWD CRM - Multi-Tenant SaaS Application

**Version:** 1.0.0  
**Status:** 🚀 Production Ready  
**Last Updated:** April 1, 2026

A comprehensive multi-tenant CRM system for glass installation businesses, featuring secure webhook endpoints, role-based access control, and complete data isolation between tenants.

---

## 🎯 Overview

OWD CRM is a Next.js-based SaaS application that provides:

- **Multi-Tenant Architecture** - Complete data isolation between businesses
- **Role-Based Access Control** - Super Admin, Distributor, Business Admin, and Business User roles
- **Webhook Integration** - Secure API endpoints for n8n workflow automation
- **Quote Management** - Generate and track quotes from WhatsApp conversations
- **Customer CRM** - Manage customer relationships and contact history
- **Product Catalog** - Multi-category product management with pricing
- **Payment Integration** - PayFast payment gateway integration
- **Beautiful UI** - Crystal Clarity design system with Material Design 3

---

## 🏗️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI)
- **Forms & Validation:** React Hook Form + Zod
- **PDF Generation:** pdf-lib
- **Testing:** Jest + React Testing Library
- **Deployment:** Vercel

---

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Vercel account (for deployment)
- n8n instance (for webhook automation)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set Up Database

Run the schema in Supabase SQL Editor:

```bash
# Copy contents of supabase_multi_tenant_schema.sql
# Paste into Supabase Dashboard > SQL Editor
# Execute
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📚 Documentation

- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - Complete development progress and status
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures and best practices
- **[RLS_SECURITY_AUDIT.md](./RLS_SECURITY_AUDIT.md)** - Security audit and RLS policy documentation

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

**Note:** Configure `.env.test.local` with test Supabase credentials before running tests.

---

## 🔐 Security Features

- ✅ Row-Level Security (RLS) policies on all tables
- ✅ Webhook secret validation
- ✅ Business-scoped data isolation
- ✅ JWT-based authentication
- ✅ RBAC with role verification
- ✅ Secure file storage with business_id paths

**Security Rating:** STRONG - See `RLS_SECURITY_AUDIT.md` for details.

---

## 📦 Project Structure

```
owd-crm/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── admin/                # Super Admin & Distributor views
│   │   ├── api/                  # API routes and webhooks
│   │   ├── dashboard/            # Business CRM dashboard
│   │   └── login/                # Authentication
│   ├── components/               # React components
│   ├── lib/                      # Utilities and integrations
│   ├── providers/                # Context providers
│   └── utils/                    # Supabase clients
├── __tests__/                    # Test suites
├── public/                       # Static assets
├── DEPLOYMENT_GUIDE.md           # Deployment documentation
├── TESTING_GUIDE.md              # Testing documentation
├── RLS_SECURITY_AUDIT.md         # Security audit
└── vercel.json                   # Vercel configuration
```

---

## 🌐 API Endpoints

### Webhook Endpoints

All webhook endpoints require `x-webhook-secret` header:

```
POST /api/v1/business/[slug]/generate-quote
POST /api/v1/business/[slug]/repair-request
POST /api/v1/business/[slug]/webhook/validate
```

**Example:**

```bash
curl -X POST https://your-app.vercel.app/api/v1/business/acme-glass/generate-quote \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-webhook-secret" \
  -d '{
    "customerPhone": "+27123456789",
    "customerName": "John Doe",
    "items": [...]
  }'
```

---

## 🎨 Design System

**Crystal Clarity Design System** features:

- Material Design 3 color palette (48 semantic tokens)
- Inter font for UI, JetBrains Mono for data
- Material Symbols icons
- Tonal layering (no borders)
- Glassmorphic effects
- Responsive mobile-first design

---

## 🚢 Deployment

### Deploy to Vercel

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

**Detailed instructions:** See `DEPLOYMENT_GUIDE.md`

### Cost Estimation

- **Vercel Pro:** $20/month
- **Supabase Pro:** $25/month
- **Total:** ~$45/month

---

## 👥 User Roles

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **Super Admin** | Global | Manage all distributors and businesses |
| **Distributor** | Multi-business | Manage businesses under their umbrella |
| **Business Admin** | Single business | Full access to business CRM |
| **Business User** | Single business | Limited access to business CRM |

---

## 🔧 Development

### Build for Production

```bash
npm run build
```

### Lint Code

```bash
npm run lint
```

### Run Development Server

```bash
npm run dev
```

---

## 📊 Features

### For Super Admins
- Distributor management
- Global analytics
- All businesses overview
- System settings

### For Distributors
- Business onboarding
- Subscription management
- Aggregated analytics

### For Businesses
- Quote management
- Customer CRM
- Product catalog
- Invoice tracking
- Payment integration
- Business settings
- WhatsApp integration (BotSailor)

---

## 🤝 Support

For issues, questions, or feature requests:

1. Check documentation in this repository
2. Review `IMPLEMENTATION_STATUS.md` for known issues
3. Contact development team

---

## 📄 License

Proprietary - OWD Glass Solutions

---

## ✅ Implementation Status

**All 5 phases complete:**

- ✅ Phase 1: Foundation & Authentication
- ✅ Phase 2: Webhooks & API Layer
- ✅ Phase 2.5: Crystal Clarity Design System
- ✅ Phase 3: Super Admin & Distributor Views
- ✅ Phase 4: Business CRM Dashboard
- ✅ Phase 5: Testing & Deployment

**Status:** Production Ready 🚀

See `IMPLEMENTATION_STATUS.md` for detailed progress.
