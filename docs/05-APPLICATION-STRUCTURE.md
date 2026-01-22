# Application Structure
## Vercel Deployment with Next.js/React

---

## Project Structure

```
glass-quote-app/
├── .env.example
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
│
├── public/
│   ├── logo.png
│   └── favicon.ico
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing page
│   │   ├── globals.css
│   │   │
│   │   ├── api/                  # API Routes
│   │   │   ├── quotes/
│   │   │   │   ├── generate/route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── pdf/[id]/route.ts
│   │   │   │
│   │   │   ├── webhooks/
│   │   │   │   ├── botsailor/route.ts
│   │   │   │   └── payfast/route.ts
│   │   │   │
│   │   │   ├── payments/
│   │   │   │   ├── initiate/route.ts
│   │   │   │   ├── success/route.ts
│   │   │   │   └── notify/route.ts
│   │   │   │
│   │   │   ├── products/route.ts
│   │   │   └── customers/route.ts
│   │   │
│   │   ├── quote/                # Customer-facing quote view
│   │   │   └── [id]/page.tsx
│   │   │
│   │   ├── payment/
│   │   │   ├── success/page.tsx
│   │   │   └── cancel/page.tsx
│   │   │
│   │   └── admin/                # Admin dashboard
│   │       ├── layout.tsx
│   │       ├── page.tsx          # Dashboard home
│   │       ├── quotes/page.tsx
│   │       ├── customers/page.tsx
│   │       ├── products/page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── quote/
│   │   │   ├── QuoteCard.tsx
│   │   │   ├── QuoteItemRow.tsx
│   │   │   └── QuotePDF.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── QuotesTable.tsx
│   │   │
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── payfast/
│   │   │   ├── client.ts
│   │   │   └── signature.ts
│   │   │
│   │   ├── pdf/
│   │   │   ├── quote-template.ts
│   │   │   └── invoice-template.ts
│   │   │
│   │   ├── email/
│   │   │   └── sender.ts
│   │   │
│   │   └── utils/
│   │       ├── pricing.ts
│   │       ├── safety-check.ts
│   │       └── format.ts
│   │
│   ├── services/
│   │   ├── quote.service.ts
│   │   ├── customer.service.ts
│   │   ├── payment.service.ts
│   │   └── notification.service.ts
│   │
│   └── types/
│       ├── quote.ts
│       ├── customer.ts
│       ├── product.ts
│       └── api.ts
│
└── tests/
    ├── api/
    └── services/
```

---

## Key Files

### package.json
```json
{
  "name": "glass-quote-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@react-pdf/renderer": "^3.4.0",
    "nodemailer": "^6.9.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.6.0",
    "zod": "^3.23.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/nodemailer": "^6.4.0",
    "typescript": "^5.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^15.0.0"
  }
}
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['your-project.supabase.co'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-api-key' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["jnb1"],
  "env": {
    "TZ": "Africa/Johannesburg"
  }
}
```

### .env.example
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PayFast
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_SANDBOX=true
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=quotes@yourcompany.co.za
COMPANY_EMAIL=orders@yourcompany.co.za

# BotSailor
BOTSAILOR_API_KEY=your_botsailor_key
BOTSAILOR_WEBHOOK_SECRET=your_webhook_secret

# Google Gemini (for direct API calls if needed)
GEMINI_API_KEY=your_gemini_key

# Internal API Key
API_SECRET_KEY=your_internal_api_key
```

---

## Core API Routes

### /api/quotes/generate/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateQuote } from '@/lib/utils/pricing';
import { checkSafetyRequirements } from '@/lib/utils/safety-check';
import { generateQuotePDF } from '@/lib/pdf/quote-template';

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, customerName, measurements, glassType, location } = body;

    const supabase = createClient();

    // Check/create customer
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    if (!customer) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({ phone: phoneNumber, name: customerName })
        .select()
        .single();
      customer = newCustomer;
    }

    // Check safety requirements
    const safetyCheck = checkSafetyRequirements(location, measurements);

    // Get appropriate products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_safety_glass', safetyCheck.requiresSafetyGlass)
      .order('price_per_sqm');

    // Calculate quote
    const quoteData = calculateQuote({
      measurements,
      glassType,
      products,
      safetyRequired: safetyCheck.requiresSafetyGlass,
      safetyReason: safetyCheck.reason
    });

    // Create quote record
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        customer_id: customer.id,
        customer_name: customerName,
        customer_phone: phoneNumber,
        installation_type: location,
        requires_safety_glass: safetyCheck.requiresSafetyGlass,
        safety_reason: safetyCheck.reason,
        subtotal: quoteData.subtotal,
        vat_amount: quoteData.vat,
        total: quoteData.total,
        deposit_amount: quoteData.total * 0.5,
        status: 'sent',
        sent_at: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Insert quote items
    const items = quoteData.items.map((item, index) => ({
      quote_id: quote.id,
      description: item.description,
      glass_type: item.glassType,
      thickness_mm: item.thickness,
      width_mm: item.width,
      height_mm: item.height,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
      is_safety_glass: safetyCheck.requiresSafetyGlass,
      sort_order: index
    }));

    await supabase.from('quote_items').insert(items);

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(quote, items, customer);
    
    // Upload to Supabase Storage
    const pdfPath = `quotes/${quote.quote_number}.pdf`;
    await supabase.storage
      .from('documents')
      .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf' });

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(pdfPath);

    // Update quote with PDF URL
    await supabase
      .from('quotes')
      .update({ pdf_url: publicUrl, pdf_storage_path: pdfPath })
      .eq('id', quote.id);

    // Schedule reminders
    await scheduleReminders(quote.id, customer.id, phoneNumber);

    return NextResponse.json({
      success: true,
      quoteNumber: quote.quote_number,
      quoteId: quote.id,
      items: quoteData.items,
      subtotal: quoteData.subtotal,
      vat: quoteData.vat,
      total: quoteData.total,
      depositRequired: quoteData.total * 0.5,
      pdfUrl: publicUrl,
      phoneNumber,
      safetyGlassRequired: safetyCheck.requiresSafetyGlass,
      safetyReason: safetyCheck.reason
    });

  } catch (error: any) {
    console.error('Quote generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function scheduleReminders(quoteId: string, customerId: string, phone: string) {
  const supabase = createClient();
  const now = new Date();
  
  const reminders = [
    {
      quote_id: quoteId,
      customer_id: customerId,
      phone,
      reminder_type: 'quote_24h',
      scheduled_for: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
      quote_id: quoteId,
      customer_id: customerId,
      phone,
      reminder_type: 'quote_3d',
      scheduled_for: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString()
    },
    {
      quote_id: quoteId,
      customer_id: customerId,
      phone,
      reminder_type: 'quote_expiry',
      scheduled_for: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  await supabase.from('reminders').insert(reminders);
}
```

### /api/payments/initiate/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePayFastSignature, buildPayFastForm } from '@/lib/payfast/client';

export async function POST(request: NextRequest) {
  try {
    const { quoteId } = await request.json();
    const supabase = createClient();

    // Get quote details
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, customers(*)')
      .eq('id', quoteId)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const depositAmount = quote.deposit_amount || (quote.total * 0.5);

    // Build PayFast payment data
    const paymentData = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?quote=${quote.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel?quote=${quote.id}`,
      notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/notify`,
      name_first: quote.customer_name.split(' ')[0],
      name_last: quote.customer_name.split(' ').slice(1).join(' ') || '',
      email_address: quote.customer_email || '',
      m_payment_id: quote.id,
      amount: depositAmount.toFixed(2),
      item_name: `Glass Quote ${quote.quote_number} - Deposit`,
      custom_str1: quote.customer_phone,
      custom_str2: quote.quote_number
    };

    // Generate signature
    const signature = generatePayFastSignature(paymentData);
    
    const payFastUrl = process.env.PAYFAST_SANDBOX === 'true'
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    return NextResponse.json({
      success: true,
      paymentUrl: payFastUrl,
      paymentData: { ...paymentData, signature },
      amount: depositAmount
    });

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Utility Functions

### /lib/utils/pricing.ts
```typescript
interface Measurement {
  width: number;  // mm
  height: number; // mm
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price_per_sqm: number;
  thickness_mm: number;
  min_charge: number;
}

interface QuoteCalculation {
  items: QuoteItem[];
  subtotal: number;
  vat: number;
  total: number;
}

interface QuoteItem {
  description: string;
  glassType: string;
  thickness: number;
  width: number;
  height: number;
  quantity: number;
  areaSqm: number;
  unitPrice: number;
  lineTotal: number;
}

const VAT_RATE = 0.15;
const EXPANSION_GAP_MM = 3;
const IRREGULAR_SURCHARGE = 0.20;

export function calculateQuote(params: {
  measurements: Measurement[];
  glassType: string;
  products: Product[];
  safetyRequired: boolean;
  safetyReason?: string;
  applyExpansionGap?: boolean;
  isIrregular?: boolean;
}): QuoteCalculation {
  const { measurements, products, applyExpansionGap = false, isIrregular = false } = params;

  // Select appropriate product
  const product = products[0]; // Simplification - in production, match by type

  const items: QuoteItem[] = measurements.map(m => {
    // Apply expansion gap if needed
    let effectiveWidth = m.width;
    let effectiveHeight = m.height;
    
    if (applyExpansionGap) {
      effectiveWidth = Math.max(0, m.width - EXPANSION_GAP_MM);
      effectiveHeight = Math.max(0, m.height - EXPANSION_GAP_MM);
    }

    // Calculate area in square meters
    const areaSqm = (effectiveWidth / 1000) * (effectiveHeight / 1000);
    
    // Calculate unit price
    let unitPrice = areaSqm * product.price_per_sqm;
    
    // Apply minimum charge
    if (unitPrice < product.min_charge) {
      unitPrice = product.min_charge;
    }
    
    // Apply irregular shape surcharge
    if (isIrregular) {
      unitPrice *= (1 + IRREGULAR_SURCHARGE);
    }

    const lineTotal = unitPrice * m.quantity;

    return {
      description: product.name,
      glassType: product.name,
      thickness: product.thickness_mm,
      width: effectiveWidth,
      height: effectiveHeight,
      quantity: m.quantity,
      areaSqm,
      unitPrice: Math.round(unitPrice * 100) / 100,
      lineTotal: Math.round(lineTotal * 100) / 100
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  return {
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}
```

### /lib/utils/safety-check.ts
```typescript
interface SafetyCheckResult {
  requiresSafetyGlass: boolean;
  reason: string | null;
  regulations: string[];
}

const SAFETY_LOCATIONS = ['shower', 'door', 'sidelight', 'balustrade', 'overhead'];
const LOW_LEVEL_HEIGHT_MM = 800;
const DOOR_PROXIMITY_MM = 300;

export function checkSafetyRequirements(
  location: string,
  measurements?: { height?: number }[]
): SafetyCheckResult {
  const result: SafetyCheckResult = {
    requiresSafetyGlass: false,
    reason: null,
    regulations: []
  };

  const locationLower = location.toLowerCase();

  // Check explicit safety locations
  if (SAFETY_LOCATIONS.some(loc => locationLower.includes(loc))) {
    result.requiresSafetyGlass = true;
    result.reason = `Safety glass required for ${location} per SANS 10400-N`;
    result.regulations.push('SANS 10400-N Section 4.3');
  }

  // Check for bathroom keywords
  if (locationLower.includes('bathroom') || locationLower.includes('toilet')) {
    result.requiresSafetyGlass = true;
    result.reason = 'Safety glass required in wet areas per SANS 10400-N';
    result.regulations.push('SANS 10400-N Section 4.3.2');
  }

  // Check low-level windows
  if (locationLower.includes('low') || locationLower.includes('below')) {
    result.requiresSafetyGlass = true;
    result.reason = `Safety glass required for glazing below ${LOW_LEVEL_HEIGHT_MM}mm`;
    result.regulations.push('SANS 10400-N Section 4.3.1');
  }

  return result;
}
```

---

## Admin Dashboard Page Example

### /app/admin/quotes/page.tsx
```tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { QuotesTable } from '@/components/admin/QuotesTable';
import { StatsCard } from '@/components/admin/StatsCard';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    expired: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  async function fetchQuotes() {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*, customers(name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      setQuotes(data);
      setStats({
        total: data.length,
        pending: data.filter(q => q.status === 'sent').length,
        accepted: data.filter(q => q.status === 'paid').length,
        expired: data.filter(q => q.status === 'expired').length
      });
    }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quotes Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Quotes"
          value={stats.total}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
        />
        <StatsCard
          title="Accepted"
          value={stats.accepted}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatsCard
          title="Expired"
          value={stats.expired}
          icon={<XCircle className="h-6 w-6" />}
          color="red"
        />
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg shadow">
        <QuotesTable quotes={quotes} loading={loading} onRefresh={fetchQuotes} />
      </div>
    </div>
  );
}
```

---

## Deployment Steps

### 1. Create Vercel Project
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### 2. Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables:
- Add all variables from `.env.example`
- Set appropriate values for production

### 3. Configure Custom Domain (Optional)
- Add domain in Vercel dashboard
- Update DNS records
- Update `NEXT_PUBLIC_BASE_URL`

### 4. Set Up Webhooks
- BotSailor webhook: `https://your-app.vercel.app/api/webhooks/botsailor`
- PayFast notify URL: `https://your-app.vercel.app/api/payments/notify`
