# Features Adapted from HDS Project
## Mapping Board Cutting Features to Glass Industry

---

## Overview

The HDS project (`hdsproject1`) is a board cutting optimizer for the panel/board industry. Many features can be directly adapted for the glass/glazing industry with domain-specific modifications.

---

## Feature Mapping

| HDS Feature | Glass Adaptation | Notes |
|-------------|------------------|-------|
| Cutlist OCR | Measurement extraction from images | Same Gemini Vision approach |
| Board size optimization | Glass cutting layout | Simplified for glass |
| Quote generation | Quote generation | Adapted pricing rules |
| PDF generation | PDF generation | New glass-specific template |
| PayFast integration | PayFast integration | Direct reuse |
| Email service | Email service | New templates |
| WhatsApp integration | WhatsApp integration | Enhanced with AI chat |
| Supabase storage | Supabase storage | New schema for glass |

---

## Components to Reuse Directly

### 1. PayFast Integration
**From**: `hdsproject1/server/src/routes/payfast.routes.ts`
**Reuse**: Signature generation, ITN handling, payment form generation

```typescript
// Key functions to port:
- generatePayFastSignature()
- verifyPayFastSignature()
- handlePaymentNotification()
- generatePaymentForm()
```

### 2. Email Service
**From**: `hdsproject1/server/src/services/email.service.ts`
**Reuse**: SMTP configuration, nodemailer setup

```typescript
// Key configurations:
- Nodemailer transporter setup
- TLS/SSL configuration
- Error handling patterns
```

### 3. PDF Generation Patterns
**From**: `hdsproject1/server/src/services/optimizer.service.ts`
**Adapt**: PDF structure and layout approach

### 4. Supabase Service Patterns
**From**: `hdsproject1/server/src/services/supabase.service.ts`
**Reuse**: Query patterns, error handling, connection management

---

## Components to Adapt

### 1. OCR/Image Processing

**HDS Version** (board cutting):
```javascript
const prompt = `
Extract ONLY the board/panel measurements and quantities.
Output: Length x Width = Quantity
Include edging: L1,L2,W1,W2
`;
```

**Glass Version** (new):
```javascript
const prompt = `
Extract glass/window measurements.
Output JSON: { measurements: [{width, height, quantity}] }
Detect if safety glass needed based on location.
`;
```

### 2. Quote Calculation

**HDS Version**:
- Price per linear meter of edging
- Board optimization costs
- Material waste calculation

**Glass Version**:
- Price per square meter
- Safety glass surcharges
- Expansion gap deductions
- Irregular shape surcharges

### 3. Product Catalog

**HDS Products**:
- MDF, Melamine, Chipboard
- Various thicknesses
- Edging materials

**Glass Products**:
- Float glass (4mm, 5mm, 6mm)
- Toughened glass (6mm, 8mm, 10mm, 12mm)
- Laminated glass
- Double glazed units
- Mirrors

---

## New Features for Glass Industry

### 1. SANS 10400-N Compliance Engine
**Not in HDS** - Unique to glass industry

```typescript
// Safety glass detection
const SAFETY_LOCATIONS = ['shower', 'door', 'sidelight', 'balustrade'];
const LOW_LEVEL_HEIGHT = 800; // mm from floor

function checkSafetyRequirements(location: string): boolean {
  // Auto-detect and enforce safety glass
}
```

### 2. Expansion Gap Calculator
**Not in HDS** - Glass-specific thermal calculation

```typescript
// Glass expands/contracts with temperature
const EXPANSION_GAP = 3; // mm

function calculateEffectiveSize(width: number, height: number): {
  effectiveWidth: number;
  effectiveHeight: number;
} {
  return {
    effectiveWidth: width - EXPANSION_GAP,
    effectiveHeight: height - EXPANSION_GAP
  };
}
```

### 3. AI-Powered Glass Expert Chat
**Not in HDS** - Enhanced customer interaction

```typescript
// Gemini AI integration for complex questions
const systemPrompt = `
You are a glass expert. Help with:
- Glass type selection
- Safety requirements
- Installation advice
`;
```

### 4. WhatsApp Flow Builder Integration
**Enhanced from HDS** - More structured conversation

- Menu-driven glass type selection
- Location-based safety detection
- Interactive quote acceptance

---

## Database Schema Differences

### HDS Schema (simplified)
```sql
quotes (
  id, quote_number, customer_name, customer_phone,
  items JSONB,  -- Cut pieces with edging
  subtotal, total, status
)
```

### Glass Schema (new)
```sql
quotes (
  id, quote_number, customer_name, customer_phone,
  installation_type,  -- window, door, shower, etc.
  requires_safety_glass BOOLEAN,
  safety_reason TEXT,
  subtotal, vat_amount, total, status,
  deposit_amount, deposit_paid
)

quote_items (
  id, quote_id,
  glass_type, thickness_mm,
  width_mm, height_mm,
  is_safety_glass,
  has_edging, edging_type,  -- polished, beveled
  is_irregular, shape_surcharge
)

products (
  id, product_code, name,
  category,  -- float, toughened, laminated, etc.
  thickness_mm,
  price_per_sqm,
  is_safety_glass,
  sans_approved_for JSONB  -- ["shower", "door", ...]
)
```

---

## Code Migration Guide

### Step 1: Copy PayFast Module
```bash
# From hdsproject1
cp server/src/routes/payfast.routes.ts → glass-app/src/app/api/payments/
cp server/src/controllers/payfast.controller.ts → glass-app/src/lib/payfast/
```

### Step 2: Adapt Email Service
```bash
# Copy and modify templates
cp server/src/services/email.service.ts → glass-app/src/lib/email/
# Update templates for glass industry
```

### Step 3: Create New Quote Engine
```typescript
// New file: glass-app/src/lib/utils/pricing.ts
// Implement glass-specific calculations
```

### Step 4: Build New Supabase Schema
```bash
# Run new schema in Supabase SQL Editor
# See: docs/04-SUPABASE-SCHEMA.md
```

---

## Testing Comparison

### HDS Test Flow
1. Upload cutlist image
2. OCR extracts board dimensions
3. Optimizer calculates layout
4. PDF generated with cutting pattern
5. Quote sent via WhatsApp

### Glass Test Flow
1. Customer sends "Hi" to WhatsApp
2. Bot presents menu (window/door/shower)
3. Customer selects type + provides measurements
4. System checks safety requirements
5. Quote generated with correct glass type
6. PDF sent with disclaimer
7. Payment via PayFast
8. Confirmation + reminders

---

## Risk Assessment

| Risk | HDS Experience | Glass Mitigation |
|------|----------------|------------------|
| OCR accuracy | ~85% on clear images | Add confirmation step |
| Payment failures | Rare with sandbox testing | Same approach |
| WhatsApp delivery | Reliable via BotSailor | Same approach |
| Price errors | Manual override available | Add admin review |

---

## Estimated Development Savings

By reusing HDS components:

| Component | Fresh Development | With HDS Base | Savings |
|-----------|-------------------|---------------|---------|
| PayFast | 2-3 days | 0.5 days | 80% |
| Email | 1-2 days | 0.5 days | 70% |
| PDF patterns | 2 days | 1 day | 50% |
| Supabase patterns | 1 day | 0.5 days | 50% |
| WhatsApp basics | 2 days | 1 day | 50% |
| **Total** | **8-10 days** | **3.5 days** | **~60%** |

---

## Files to Reference from HDS

```
hdsproject1/
├── server/src/
│   ├── routes/
│   │   ├── payfast.routes.ts        ✓ Reuse
│   │   └── botsailor.routes.ts      ✓ Reference
│   ├── services/
│   │   ├── email.service.ts         ✓ Reuse
│   │   ├── supabase.service.ts      ✓ Reference patterns
│   │   └── whatsapp.service.ts      ✓ Reference
│   ├── controllers/
│   │   └── payfast.controller.ts    ✓ Reuse
│   └── database/
│       └── supabase-schema.sql      ✓ Reference structure
├── .env.example                     ✓ Reference variables
└── PAYFAST-README.md               ✓ Use as guide
```
