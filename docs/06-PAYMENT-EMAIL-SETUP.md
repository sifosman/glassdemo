# Payment Gateway & Email Setup
## PayFast Integration and Email Notifications

---

## PayFast Setup (South African Payment Gateway)

### Why PayFast?
- **Local**: South African company, ZAR transactions
- **Popular**: Widely trusted by SA consumers
- **Multiple Methods**: Card, EFT, SnapScan, Mobicred
- **Low Fees**: ~2.3% + R2 per transaction
- **No Monthly Fees**: Pay only on transactions

### Step 1: Create PayFast Account

1. Go to [payfast.co.za](https://www.payfast.co.za)
2. Click "Sign Up" → "For Business"
3. Complete business registration:
   - Company name and registration number
   - VAT number (if applicable)
   - Bank account details
   - ID document verification

4. Once approved (1-3 business days):
   - Access dashboard at `my.payfast.co.za`
   - Get your credentials from Settings → Integration

### Step 2: Get API Credentials

**Sandbox (Testing)**:
```
Merchant ID: 10000100
Merchant Key: 46f0cd694581a
Passphrase: jt7NOE43FZPn
URL: https://sandbox.payfast.co.za/eng/process
```

**Production** (from your dashboard):
```
Merchant ID: [Your Merchant ID]
Merchant Key: [Your Merchant Key]
Passphrase: [Set in PayFast Settings → Integration]
URL: https://www.payfast.co.za/eng/process
```

### Step 3: Configure Webhook URLs in PayFast

In PayFast Dashboard → Settings → Integration:

```
Return URL: https://your-app.vercel.app/payment/success
Cancel URL: https://your-app.vercel.app/payment/cancel
Notify URL: https://your-app.vercel.app/api/payments/notify
```

**Important**: The Notify URL (ITN - Instant Transaction Notification) is critical. PayFast will POST payment confirmation to this URL.

---

## PayFast Integration Code

### /lib/payfast/signature.ts
```typescript
import crypto from 'crypto';

interface PayFastData {
  [key: string]: string;
}

/**
 * Generate PayFast signature according to their specification
 * https://developers.payfast.co.za/docs#step_2_signature
 */
export function generatePayFastSignature(
  data: PayFastData,
  passphrase?: string
): string {
  // Remove signature field if present
  const { signature, ...dataWithoutSig } = data;

  // Create parameter string in specific order
  const orderedKeys = [
    'merchant_id',
    'merchant_key',
    'return_url',
    'cancel_url',
    'notify_url',
    'name_first',
    'name_last',
    'email_address',
    'cell_number',
    'm_payment_id',
    'amount',
    'item_name',
    'item_description',
    'custom_int1',
    'custom_int2',
    'custom_int3',
    'custom_int4',
    'custom_int5',
    'custom_str1',
    'custom_str2',
    'custom_str3',
    'custom_str4',
    'custom_str5',
    'email_confirmation',
    'confirmation_address',
    'payment_method'
  ];

  // Build parameter string
  const paramPairs: string[] = [];
  
  orderedKeys.forEach(key => {
    if (dataWithoutSig[key] !== undefined && dataWithoutSig[key] !== '') {
      // URL encode the value, but replace %20 with +
      const encodedValue = encodeURIComponent(dataWithoutSig[key].trim())
        .replace(/%20/g, '+');
      paramPairs.push(`${key}=${encodedValue}`);
    }
  });

  let paramString = paramPairs.join('&');

  // Append passphrase if provided
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  }

  // Generate MD5 hash
  return crypto.createHash('md5').update(paramString).digest('hex');
}

/**
 * Verify PayFast ITN signature
 */
export function verifyPayFastSignature(
  data: PayFastData,
  passphrase?: string
): boolean {
  const receivedSignature = data.signature;
  if (!receivedSignature) return false;

  const calculatedSignature = generatePayFastSignature(data, passphrase);
  return calculatedSignature === receivedSignature;
}

/**
 * Verify PayFast ITN is from valid IP
 */
export function isValidPayFastIP(ip: string): boolean {
  const validIPs = [
    '197.97.145.144',
    '197.97.145.145',
    '197.97.145.146',
    '197.97.145.147',
    '41.74.179.194',
    '41.74.179.195',
    '41.74.179.196',
    '41.74.179.197'
  ];
  
  // For sandbox, also allow sandbox IPs
  const sandboxIPs = [
    '197.97.145.144',
    // Add any sandbox-specific IPs
  ];

  const allValidIPs = [...validIPs, ...sandboxIPs];
  return allValidIPs.includes(ip);
}
```

### /lib/payfast/client.ts
```typescript
interface PaymentInitiation {
  quoteId: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  quoteNumber: string;
}

export async function initiatePayment(params: PaymentInitiation) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const isSandbox = process.env.PAYFAST_SANDBOX === 'true';

  const paymentData = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${baseUrl}/payment/success`,
    cancel_url: `${baseUrl}/payment/cancel`,
    notify_url: `${baseUrl}/api/payments/notify`,
    name_first: params.customerName.split(' ')[0],
    name_last: params.customerName.split(' ').slice(1).join(' ') || 'Customer',
    email_address: params.customerEmail || '',
    cell_number: params.customerPhone.replace('+27', '0'),
    m_payment_id: params.quoteId,
    amount: params.amount.toFixed(2),
    item_name: `Quote ${params.quoteNumber} Deposit`,
    custom_str1: params.customerPhone,
    custom_str2: params.quoteNumber
  };

  // Generate signature
  const signature = generatePayFastSignature(
    paymentData,
    process.env.PAYFAST_PASSPHRASE
  );

  const payFastUrl = isSandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  return {
    url: payFastUrl,
    data: { ...paymentData, signature }
  };
}

/**
 * Build HTML form for PayFast redirect
 */
export function buildPayFastForm(url: string, data: Record<string, string>): string {
  const inputs = Object.entries(data)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
    .join('\n');

  return `
    <!DOCTYPE html>
    <html>
    <head><title>Redirecting to PayFast...</title></head>
    <body onload="document.forms[0].submit()">
      <p>Redirecting to secure payment...</p>
      <form method="POST" action="${url}">
        ${inputs}
      </form>
    </body>
    </html>
  `;
}
```

### /api/payments/notify/route.ts (ITN Handler)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPayFastSignature, isValidPayFastIP } from '@/lib/payfast/signature';
import { sendPaymentConfirmationEmail } from '@/lib/email/sender';
import { sendWhatsAppConfirmation } from '@/lib/notifications/whatsapp';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for validation
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || '';
    
    // In production, validate IP (skip in sandbox)
    if (process.env.PAYFAST_SANDBOX !== 'true' && !isValidPayFastIP(clientIP)) {
      console.warn('Invalid PayFast IP:', clientIP);
      return new NextResponse('Invalid IP', { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Verify signature
    if (!verifyPayFastSignature(data, process.env.PAYFAST_PASSPHRASE)) {
      console.error('Invalid PayFast signature');
      return new NextResponse('Invalid signature', { status: 400 });
    }

    // Check payment status
    if (data.payment_status !== 'COMPLETE') {
      console.log('Payment not complete:', data.payment_status);
      return new NextResponse('OK', { status: 200 });
    }

    const supabase = createClient();
    const quoteId = data.m_payment_id;
    const amount = parseFloat(data.amount_gross);
    const paymentId = data.pf_payment_id;

    // Record payment
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        quote_id: quoteId,
        amount,
        payment_method: 'payfast',
        payfast_payment_id: paymentId,
        status: 'completed',
        gateway_response: data
      });

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
    }

    // Update quote status
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .update({
        status: 'paid',
        deposit_paid: amount,
        deposit_paid_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select('*, customers(*)')
      .single();

    if (quoteError) {
      console.error('Error updating quote:', quoteError);
    }

    // Generate invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        quote_id: quoteId,
        quote_number: quote.quote_number,
        customer_id: quote.customer_id,
        customer_name: quote.customer_name,
        customer_phone: quote.customer_phone,
        customer_email: quote.customer_email,
        invoice_type: 'deposit',
        subtotal: amount / 1.15, // Remove VAT
        vat_amount: amount - (amount / 1.15),
        total: amount,
        amount_paid: amount,
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .select()
      .single();

    // Send confirmation email to customer
    if (quote.customer_email) {
      await sendPaymentConfirmationEmail({
        to: quote.customer_email,
        customerName: quote.customer_name,
        quoteNumber: quote.quote_number,
        amount,
        paymentReference: paymentId,
        invoiceUrl: invoice?.pdf_url
      });
    }

    // Send email to company
    await sendPaymentConfirmationEmail({
      to: process.env.COMPANY_EMAIL!,
      customerName: quote.customer_name,
      quoteNumber: quote.quote_number,
      amount,
      paymentReference: paymentId,
      customerPhone: quote.customer_phone,
      isCompanyNotification: true
    });

    // Send WhatsApp confirmation
    await sendWhatsAppConfirmation({
      phone: quote.customer_phone,
      customerName: quote.customer_name,
      quoteNumber: quote.quote_number,
      amount,
      paymentReference: paymentId
    });

    // Cancel pending reminders
    await supabase
      .from('reminders')
      .update({ status: 'cancelled' })
      .eq('quote_id', quoteId)
      .eq('status', 'pending');

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('PayFast ITN error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
```

---

## Email Setup (SendGrid)

### Why SendGrid?
- **Reliable**: High deliverability rates
- **Free Tier**: 100 emails/day free
- **Easy Integration**: Simple API
- **Templates**: HTML email support

### Step 1: Create SendGrid Account

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Verify your email and complete setup
4. Create API key: Settings → API Keys → Create API Key

### Step 2: Verify Sender Domain

1. Go to Settings → Sender Authentication
2. Add and verify your domain (recommended) OR
3. Verify a single sender email address

### Step 3: Get API Key

```
Settings → API Keys → Create API Key
Name: Glass Quote App
Permissions: Full Access (or Restricted: Mail Send)
```

Save the API key - you'll only see it once!

---

## Email Service Implementation

### /lib/email/sender.ts
```typescript
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Configure for SendGrid
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY!
  }
});

interface PaymentEmailParams {
  to: string;
  customerName: string;
  quoteNumber: string;
  amount: number;
  paymentReference: string;
  invoiceUrl?: string;
  customerPhone?: string;
  isCompanyNotification?: boolean;
}

export async function sendPaymentConfirmationEmail(params: PaymentEmailParams) {
  const {
    to,
    customerName,
    quoteNumber,
    amount,
    paymentReference,
    invoiceUrl,
    customerPhone,
    isCompanyNotification
  } = params;

  const subject = isCompanyNotification
    ? `💰 Payment Received - Quote ${quoteNumber}`
    : `Payment Confirmation - Quote ${quoteNumber}`;

  const html = isCompanyNotification
    ? getCompanyNotificationHTML(params)
    : getCustomerConfirmationHTML(params);

  try {
    await transporter.sendMail({
      from: `"Your Glass Company" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html
    });

    console.log(`Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

function getCustomerConfirmationHTML(params: PaymentEmailParams): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .amount { font-size: 32px; font-weight: bold; color: #059669; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Confirmed</h1>
        </div>
        <div class="content">
          <p>Dear ${params.customerName},</p>
          <p>Thank you for your payment! We've received your deposit and your order is now confirmed.</p>
          
          <div class="details">
            <p class="amount">R${params.amount.toFixed(2)}</p>
            <p><strong>Quote Number:</strong> ${params.quoteNumber}</p>
            <p><strong>Payment Reference:</strong> ${params.paymentReference}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-ZA')}</p>
          </div>

          <h3>What Happens Next?</h3>
          <ol>
            <li>Our team will contact you within 24 hours to arrange a site visit</li>
            <li>Final measurements will be taken on site</li>
            <li>Manufacturing takes 5-7 working days</li>
            <li>Installation will be scheduled at your convenience</li>
          </ol>

          ${params.invoiceUrl ? `
            <p style="text-align: center; margin-top: 30px;">
              <a href="${params.invoiceUrl}" class="button">Download Invoice</a>
            </p>
          ` : ''}

          <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>Your Glass Company</p>
          <p>📞 011 XXX XXXX | ✉️ info@yourcompany.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getCompanyNotificationHTML(params: PaymentEmailParams): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .alert { background: #059669; color: white; padding: 20px; }
        .details { padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="alert">
        <h2>💰 New Payment Received!</h2>
      </div>
      <div class="details">
        <table>
          <tr>
            <td><strong>Amount:</strong></td>
            <td>R${params.amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>Quote Number:</strong></td>
            <td>${params.quoteNumber}</td>
          </tr>
          <tr>
            <td><strong>Customer:</strong></td>
            <td>${params.customerName}</td>
          </tr>
          <tr>
            <td><strong>Phone:</strong></td>
            <td>${params.customerPhone || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Payment Ref:</strong></td>
            <td>${params.paymentReference}</td>
          </tr>
          <tr>
            <td><strong>Time:</strong></td>
            <td>${new Date().toLocaleString('en-ZA')}</td>
          </tr>
        </table>

        <h3>⚡ Action Required</h3>
        <p>Please contact the customer within 24 hours to arrange site measurement.</p>
      </div>
    </body>
    </html>
  `;
}

// Quote email
export async function sendQuoteEmail(params: {
  to: string;
  customerName: string;
  quoteNumber: string;
  total: number;
  pdfUrl: string;
  expiryDate: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .quote-box { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
        .total { font-size: 36px; font-weight: bold; color: #2563eb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 10px; }
        .button-secondary { background: #059669; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Glass Quote is Ready!</h1>
        </div>
        <div class="content">
          <p>Dear ${params.customerName},</p>
          <p>Thank you for your enquiry. Please find your glass quote below:</p>
          
          <div class="quote-box">
            <p><strong>Quote #${params.quoteNumber}</strong></p>
            <p class="total">R${params.total.toFixed(2)}</p>
            <p>incl. VAT</p>
            <p style="color: #666;">Valid until ${new Date(params.expiryDate).toLocaleDateString('en-ZA')}</p>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <a href="${params.pdfUrl}" class="button">📄 View Full Quote</a>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/quote/${params.quoteNumber}/accept" class="button button-secondary">✅ Accept Quote</a>
          </p>

          <p>If you have any questions about this quote, please reply to this email or call us.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Your Glass Company" <${process.env.FROM_EMAIL}>`,
    to: params.to,
    subject: `Your Glass Quote #${params.quoteNumber} - R${params.total.toFixed(2)}`,
    html
  });
}
```

---

## Alternative Payment Options

### EFT/Bank Transfer
For customers who prefer manual bank transfer:

```typescript
const BANK_DETAILS = {
  bank: 'FNB',
  accountName: 'Your Glass Company (Pty) Ltd',
  accountNumber: '62XXXXXXXX',
  branchCode: '250655',
  reference: 'Quote number'
};

function getEFTInstructions(quoteNumber: string, amount: number): string {
  return `
🏦 *Bank Transfer Details*

Bank: ${BANK_DETAILS.bank}
Account: ${BANK_DETAILS.accountName}
Account No: ${BANK_DETAILS.accountNumber}
Branch Code: ${BANK_DETAILS.branchCode}
Amount: R${amount.toFixed(2)}
Reference: ${quoteNumber}

Please use your quote number as payment reference.
Send proof of payment to: accounts@yourcompany.co.za
  `;
}
```

### SnapScan (QR Code)
Generate SnapScan QR codes for easy mobile payment:

1. Register at snapscan.co.za
2. Get your Snap Code
3. Generate payment-specific QR codes via their API

---

## Testing Checklist

### PayFast Testing
- [ ] Sandbox payment completes successfully
- [ ] ITN webhook receives notification
- [ ] Signature verification works
- [ ] Quote status updates to "paid"
- [ ] Invoice generates correctly
- [ ] Customer receives confirmation
- [ ] Company receives notification

### Email Testing
- [ ] Quote emails deliver
- [ ] Payment confirmations deliver
- [ ] Links in emails work
- [ ] HTML renders correctly
- [ ] Not marked as spam

### Production Checklist
- [ ] Switch to production PayFast credentials
- [ ] Update webhook URLs
- [ ] Verify sender domain in SendGrid
- [ ] Test with real small payment
- [ ] Monitor error logs
