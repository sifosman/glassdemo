# OWD CRM - Deployment Guide

**Version:** 1.0  
**Last Updated:** April 1, 2026  
**Target Platform:** Vercel

---

## Prerequisites

Before deploying, ensure you have:

- [x] Vercel account (free or pro)
- [x] Supabase project (production)
- [x] GitHub repository with the code
- [x] Environment variables ready
- [x] Domain name (optional, Vercel provides free subdomain)

---

## Step 1: Prepare Supabase Production Database

### 1.1 Create Production Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose organization and region (recommend: Singapore for South Africa)
4. Set database password (save securely)
5. Wait for project to initialize (~2 minutes)

### 1.2 Run Database Migrations

1. Open SQL Editor in Supabase Dashboard
2. Copy contents of `supabase_multi_tenant_schema.sql`
3. Execute the SQL script
4. Verify all tables are created:
   - `distributors`
   - `businesses`
   - `business_users`
   - `customers`
   - `products`
   - `quotes`
   - `quote_items`
   - `repair_requests`
   - `payfast_payments`

### 1.3 Enable Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Create new bucket: `documents`
3. Set as **Public** bucket
4. Add folder structure:
   - `/quotes/`
   - `/logos/`

### 1.4 Collect API Credentials

From Supabase Dashboard > Settings > API:

- **Project URL:** `https://xxxxx.supabase.co`
- **Anon/Public Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ Keep secret!)

---

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select `owd-crm` as the root directory
4. Framework preset: **Next.js** (auto-detected)

### 2.2 Configure Environment Variables

Add the following environment variables in Vercel:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** Mark `SUPABASE_SERVICE_ROLE_KEY` as **sensitive** to hide it from logs.

### 2.3 Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide a URL: `https://owd-crm-xxxxx.vercel.app`

---

## Step 3: Post-Deployment Configuration

### 3.1 Test Authentication

1. Navigate to `https://your-app.vercel.app/login`
2. Create a test super admin user in Supabase:

```sql
-- In Supabase SQL Editor
INSERT INTO business_users (email, role)
VALUES ('admin@yourdomain.com', 'super_admin');
```

3. Sign up via Supabase Auth UI or create user manually
4. Verify login works

### 3.2 Create First Distributor

1. Log in as super admin
2. Go to **Admin > Distributors**
3. Click **Add Distributor**
4. Fill in details and save

### 3.3 Create First Business

1. Go to **Admin > Businesses**
2. Click **Add Business**
3. Fill in:
   - Business Name
   - Slug (URL-friendly, e.g., `acme-glass`)
   - Distributor (select from dropdown)
   - BotSailor credentials (if available)
   - PayFast credentials (if available)
4. Save and copy the **Webhook Secret**

### 3.4 Update n8n Webhooks

For each n8n workflow:

1. Open workflow in n8n
2. Find webhook nodes
3. Update URL to: `https://your-app.vercel.app/api/v1/business/[slug]/[action]`
4. Add header: `x-webhook-secret: [business-webhook-secret]`
5. Test webhook
6. Activate workflow

**Example Webhook URLs:**
- Generate Quote: `https://your-app.vercel.app/api/v1/business/acme-glass/generate-quote`
- Repair Request: `https://your-app.vercel.app/api/v1/business/acme-glass/repair-request`

---

## Step 4: Domain Configuration (Optional)

### 4.1 Add Custom Domain

1. In Vercel Dashboard, go to **Settings > Domains**
2. Add your domain: `crm.yourdomain.com`
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate to provision (~5 minutes)

### 4.2 Update n8n Webhooks with Custom Domain

Replace all Vercel URLs with your custom domain:
- Old: `https://owd-crm-xxxxx.vercel.app/api/v1/...`
- New: `https://crm.yourdomain.com/api/v1/...`

---

## Step 5: Monitoring & Maintenance

### 5.1 Enable Vercel Analytics

1. Go to **Analytics** tab in Vercel Dashboard
2. Enable **Web Analytics** (free)
3. Enable **Speed Insights** (free)

### 5.2 Set Up Error Monitoring

Recommended: Integrate Sentry or LogRocket

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 5.3 Database Backups

Supabase automatically backs up your database daily. To enable point-in-time recovery:

1. Go to Supabase Dashboard > Database > Backups
2. Upgrade to Pro plan (if needed)
3. Enable PITR (Point-in-Time Recovery)

---

## Step 6: Security Checklist

Before going live, verify:

- [ ] All environment variables are set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is marked as sensitive
- [ ] RLS policies are enabled on all tables
- [ ] Webhook secrets are unique per business
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] CORS headers are configured correctly
- [ ] Test multi-tenant isolation (Business A cannot see Business B data)
- [ ] Test webhook authentication (wrong secret = 401 error)

---

## Step 7: Migration Cutover Plan

### 7.1 Staging Phase (1 week)

1. Deploy to Vercel staging environment
2. Create test business with real data
3. Update ONE n8n workflow to point to staging
4. Monitor for errors
5. Test end-to-end flow (WhatsApp → Quote → Payment)

### 7.2 Production Cutover (1 day)

**Morning (9 AM):**
1. Announce maintenance window to clients
2. Pause all n8n workflows
3. Export data from old system (if applicable)
4. Import data to new Supabase database

**Afternoon (2 PM):**
5. Update all n8n workflows to production URLs
6. Test each workflow manually
7. Activate workflows one by one
8. Monitor logs for errors

**Evening (6 PM):**
9. Verify all systems operational
10. Send confirmation to clients
11. Monitor overnight for issues

### 7.3 Rollback Plan

If critical issues occur:

1. Pause all n8n workflows
2. Revert webhook URLs to old system
3. Investigate issue in staging
4. Fix and re-deploy
5. Schedule new cutover date

---

## Troubleshooting

### Build Fails on Vercel

**Error:** `Module not found: Can't resolve '@/...'`

**Solution:** Ensure `tsconfig.json` has correct path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Webhook Returns 401 Unauthorized

**Causes:**
- Wrong webhook secret
- Business slug doesn't match
- Business is inactive

**Solution:**
1. Verify webhook secret in database: `SELECT webhook_secret FROM businesses WHERE slug = 'your-slug';`
2. Check n8n header: `x-webhook-secret`
3. Ensure business `is_active = true`

### RLS Policy Blocks Legitimate Query

**Symptoms:** User cannot see their own data

**Solution:**
1. Check `business_users` table has correct email and business_id
2. Verify JWT token contains correct email
3. Test `get_user_business_id()` function:

```sql
SELECT get_user_business_id();
```

### PDF Generation Fails

**Error:** `Failed to upload PDF to storage`

**Solution:**
1. Verify storage bucket `documents` exists
2. Check bucket is public
3. Verify service role key has storage permissions

---

## Performance Optimization

### 5.1 Enable Vercel Edge Caching

Add to `next.config.ts`:

```typescript
export default {
  async headers() {
    return [
      {
        source: '/api/v1/business/:slug/:action',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};
```

### 5.2 Database Indexing

Ensure indexes exist on frequently queried columns:

```sql
CREATE INDEX IF NOT EXISTS idx_customers_business_phone ON customers(business_id, phone);
CREATE INDEX IF NOT EXISTS idx_quotes_business_status ON quotes(business_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_business_created ON quotes(business_id, created_at DESC);
```

### 5.3 Enable Supabase Connection Pooling

In Supabase Dashboard > Settings > Database:
- Enable **Connection Pooling**
- Mode: **Transaction**
- Pool Size: **15**

---

## Cost Estimation

### Vercel (Hobby Plan - Free)
- **Bandwidth:** 100 GB/month
- **Build Minutes:** 100 hours/month
- **Serverless Functions:** 100 GB-hours/month
- **Cost:** $0/month

### Vercel (Pro Plan - Recommended)
- **Bandwidth:** 1 TB/month
- **Build Minutes:** Unlimited
- **Serverless Functions:** 1000 GB-hours/month
- **Cost:** $20/month per member

### Supabase (Free Tier)
- **Database:** 500 MB
- **Storage:** 1 GB
- **Bandwidth:** 2 GB/month
- **Cost:** $0/month

### Supabase (Pro Tier - Recommended for Production)
- **Database:** 8 GB
- **Storage:** 100 GB
- **Bandwidth:** 50 GB/month
- **Cost:** $25/month

**Total Monthly Cost (Production):** ~$45/month

---

## Support & Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs in Vercel
- Check Supabase database size

**Weekly:**
- Review webhook success rates
- Check for failed payments
- Audit new user signups

**Monthly:**
- Review RLS policies
- Update dependencies
- Performance optimization review

### Emergency Contacts

- **Vercel Support:** support@vercel.com
- **Supabase Support:** support@supabase.io
- **Developer:** [Your contact info]

---

## Conclusion

Your OWD CRM SaaS application is now deployed and ready for production use. Follow the monitoring guidelines and maintain regular backups to ensure smooth operation.

**Next Steps:**
1. Onboard first paying customer
2. Gather user feedback
3. Iterate on features
4. Scale infrastructure as needed

---

**Deployment Completed:** ✅  
**Status:** Production Ready  
**Version:** 1.0.0
