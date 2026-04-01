# OWD CRM - Multi-Tenant SaaS Implementation Plan

## Overview
This document outlines the step-by-step implementation plan for the new OWD CRM SaaS application. The architecture is a multi-tenant Next.js application that serves both as the web dashboard for users and the API backend for n8n webhooks.

## Tech Stack
*   **Framework:** Next.js 14 (App Router)
*   **Database & Auth:** Supabase (PostgreSQL, Auth, Storage, RLS)
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui (Radix UI)
*   **Forms & Validation:** React Hook Form + Zod
*   **PDF Generation:** `pdf-lib` or `puppeteer` (depending on complexity needed)
*   **Deployment:** Vercel

---

## Phase 1: Foundation & Authentication (Week 1)

### 1.1 Project Initialization
*   Initialize Next.js 14 App Router in a new `owd-crm` folder.
*   Setup Tailwind CSS and shadcn/ui.
*   Configure Supabase client (`@supabase/ssr` for server-side rendering).

### 1.2 Authentication System
*   Implement Supabase Auth (Email/Password & Magic Links).
*   Create Next.js Middleware (`middleware.ts`) for route protection and session management.
*   **Role-Based Access Control (RBAC):**
    *   Implement logic to determine user role on login (`super_admin`, `distributor`, `business_admin`).
    *   Sync `auth.users` with the custom `business_users` and `distributors` tables.

### 1.3 Tenant Context Provider
*   Create a React Context/Zustand store to globally manage the "Active Business" state.
*   Ensure all API calls and DB queries automatically append or rely on the RLS `business_id`.

---

## Phase 2: Webhooks & API Layer (n8n Integration)

Since n8n currently relies on these APIs to function, we must rebuild them to support multi-tenancy.

### 2.1 Dynamic Webhook Endpoints
*   Create dynamic API routes: `/api/v1/business/[slug]/[action]`.
*   Implement webhook security: n8n must pass a `x-webhook-secret` header matching the business's `webhook_secret` in the database.

### 2.2 BotSailor & PayFast Integration
*   Refactor API logic to pull API keys from the `businesses` table rather than hardcoded environment variables.
*   Ensure WhatsApp messages are sent from the specific business's BotSailor Phone ID.
*   Ensure payment links are generated using the specific business's PayFast Merchant ID.

### 2.3 PDF Quote Generation
*   Rebuild the PDF generation endpoint to use the specific business's logo, primary color, and contact details.
*   Upload generated PDFs to the Supabase `documents` bucket under `/quotes/[business_id]/[filename].pdf`.

---

## Phase 3: Dashboard UI - Super Admin & Distributors

### 3.1 Super Admin View
*   **Distributor Management:** CRUD operations for Distributors.
*   **Global Overview:** View all businesses across all distributors, total revenue, total quotes.
*   **System Settings:** Global configurations.

### 3.2 Distributor Admin View
*   **Business Onboarding:** Ability to create new businesses, assign slugs, and set them up.
*   **Subscription Management:** View status of child businesses (active/inactive, expiry dates).
*   **Aggregated Analytics:** View stats for all businesses under their umbrella.

---

## Phase 4: Dashboard UI - Business CRM (The Core App)

This is what the actual glass companies will see when they log in.

### 4.1 Dashboard Overview
*   Metrics: Total Quotes, Conversion Rate, Total Revenue, Recent Activity.

### 4.2 Quote & Invoice Management
*   **Quotes List:** View all quotes, filter by status (draft, sent, accepted).
*   **Quote Builder UI:** Interface to manually create or edit quotes (bypassing n8n if needed).
*   **Invoices & Payments:** Track paid vs pending invoices, view PayFast transactions.

### 4.3 Customer CRM
*   Customer list, contact details, total spent, and quote history per customer.

### 4.4 Product & Pricing Management
*   **Product Catalog:** CRUD operations for glass types, extrusions, and hardware.
*   **CSV Import/Export:** Allow businesses to easily bulk-update their prices via CSV upload.

### 4.5 Business Settings
*   **Profile:** Update Logo, Brand Color, Address.
*   **Integrations:** Input fields for BotSailor API Token and PayFast Credentials.

---

## Phase 5: Testing, Deployment & Go-Live

*   **RLS Auditing:** Rigorous testing to ensure Business A cannot access Business B's data via API or UI.
*   **Vercel Deployment:** Set up production and staging environments.
*   **Migration Cutover:** Point the live n8n webhooks to the new Vercel production URLs.
