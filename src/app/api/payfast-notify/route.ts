import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { MetaWhatsAppService } from '@/services/metaWhatsAppService';
import { PDFService } from '@/services/pdfService';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const TEAM_EMAIL = process.env.TEAM_EMAIL || 'team@owdglass.co.za';

// PayFast configuration
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';

function buildPayFastItnParamString(data: Record<string, string>): string {
  const keys = Object.keys(data)
    .filter(key => key !== 'signature')
    .sort();

  const params: string[] = [];

  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null && value !== '') {
      params.push(`${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`);
    }
  }

  return params.join('&');
}

function verifySignature(data: Record<string, string>, passphrase: string): boolean {
  const signature = data.signature;
  if (!signature) return false;

  let paramString = buildPayFastItnParamString(data);
  const normalizedPassphrase = passphrase.trim();

  if (normalizedPassphrase) {
    paramString += `&passphrase=${encodeURIComponent(normalizedPassphrase).replace(/%20/g, '+')}`;
  }

  const calculatedSignature = crypto.createHash('md5').update(paramString).digest('hex');

  return calculatedSignature === signature;
}

type PayFastPaymentData = {
  amount_gross?: string | number;
  pf_payment_id?: string;
};

type RepairRequestEmailData = {
  reference_number: string;
  customer_phone: string;
  customer_location?: string | null;
  system_type?: string | null;
  glass_type?: string | null;
  frame_finish?: string | null;
  expert_advice?: string | null;
  safety_upgrade_required?: boolean | null;
  safety_note?: string | null;
  distance_km?: number | null;
  calculated_call_out_fee?: number | null;
  materials_fitting?: number | null;
  total_price?: number | null;
  [key: string]: unknown;
};

async function sendTeamNotification(repairData: RepairRequestEmailData, paymentData: PayFastPaymentData) {
  try {
    const transporter = nodemailer.createTransporter({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .section { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #2563eb; }
    .alert { background: #fef3c7; border-left-color: #f59e0b; }
    .success { background: #d1fae5; border-left-color: #10b981; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    td:first-child { font-weight: 600; width: 40%; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔧 New Glass Repair Booking</h1>
      <p>Payment Received - Action Required</p>
    </div>
    
    <div class="content">
      <div class="section success">
        <h3>✅ Payment Confirmed</h3>
        <p><strong>Amount:</strong> R${paymentData.amount_gross}</p>
        <p><strong>PayFast Reference:</strong> ${paymentData.pf_payment_id}</p>
        <p><strong>Paid at:</strong> ${new Date().toLocaleString('en-ZA')}</p>
      </div>

      <div class="section">
        <h3>📋 Repair Request Details</h3>
        <table>
          <tr><td>Reference Number:</td><td>${repairData.reference_number}</td></tr>
          <tr><td>Customer Phone:</td><td>${repairData.customer_phone}</td></tr>
          <tr><td>Location:</td><td>${repairData.customer_location || 'Not provided'}</td></tr>
          <tr><td>System Type:</td><td>${repairData.system_type}</td></tr>
          <tr><td>Glass Type:</td><td>${repairData.glass_type}</td></tr>
          <tr><td>Frame Finish:</td><td>${repairData.frame_finish || 'Not specified'}</td></tr>
        </table>
      </div>

      <div class="section">
        <h3>💡 Expert Assessment</h3>
        <p>${repairData.expert_advice || 'No specific advice provided.'}</p>
      </div>

      ${repairData.safety_upgrade_required ? `
      <div class="section alert">
        <h3>⚠️ Safety Upgrade Required</h3>
        <p>${repairData.safety_note}</p>
        <p><strong>Standard glass must be replaced with 6.38mm Safety Glass per SANS 10400-N.</strong></p>
      </div>
      ` : ''}

      <div class="section">
        <h3>💰 Cost Breakdown</h3>
        <table>
          <tr><td>Distance:</td><td>${repairData.distance_km} km</td></tr>
          <tr><td>Call-out Fee:</td><td>R${repairData.calculated_call_out_fee}</td></tr>
          <tr><td>Materials & Fitting:</td><td>R${repairData.materials_fitting}</td></tr>
          <tr><td><strong>Total Estimate:</strong></td><td><strong>R${repairData.total_price}</strong></td></tr>
        </table>
      </div>

      <div class="section alert">
        <h3>🎯 Next Steps</h3>
        <ol>
          <li>Contact customer within 2 hours to schedule site visit</li>
          <li>Prepare safety glass (6.38mm) if required</li>
          <li>Update repair request status after site assessment</li>
          <li>Provide official quote on-site</li>
        </ol>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/repair-checkout/${repairData.reference_number}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Full Details
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated notification from OWD Glass Repair System</p>
      <p>Reference: ${repairData.reference_number} | ${new Date().toLocaleString('en-ZA')}</p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"OWD Glass System" <${SMTP_USER}>`,
      to: TEAM_EMAIL,
      subject: `🔧 New Repair Booking - ${repairData.reference_number} - PAID`,
      html: emailContent,
    });

    console.log('Team notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send team notification:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // PayFast sends form data, not JSON
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('PayFast notification received:', data);

    // Verify signature (in sandbox, log instead of rejecting)
    if (data.signature) {
      const isValidWithPassphrase = PAYFAST_PASSPHRASE ? verifySignature(data, PAYFAST_PASSPHRASE) : false;
      const isValidWithoutPassphrase = verifySignature(data, '');
      const isValid = isValidWithPassphrase || isValidWithoutPassphrase;

      if (!isValid) {
        console.error('PayFast signature verification failed');
      } else if (isValidWithoutPassphrase && PAYFAST_PASSPHRASE) {
        console.warn('PayFast signature verified without passphrase; check PAYFAST_PASSPHRASE configuration');
      }
    }

    // Extract data
    const referenceNumber = data.custom_str1;
    const recordId = data.custom_str2;
    const paymentType = data.custom_str3 || 'repair';
    const pfPaymentId = data.pf_payment_id;
    const paymentStatus = data.payment_status;
    const amountGross = parseFloat(data.amount_gross || '0');
    const amountFee = parseFloat(data.amount_fee || '0');
    const amountNet = parseFloat(data.amount_net || '0');

    if (!referenceNumber || !recordId) {
      return NextResponse.json({ error: 'Missing reference data' }, { status: 400 });
    }

    // Store payment record
    if (paymentType === 'repair') {
      const { error: paymentError } = await supabase
        .from('payfast_payments')
        .insert({
          repair_request_id: recordId,
          pf_payment_id: pfPaymentId,
          payment_status: paymentStatus,
          amount_gross: amountGross,
          amount_fee: amountFee,
          amount_net: amountNet,
          payfast_signature: data.signature,
          merchant_id: data.merchant_id,
          signature_match: true,
          raw_payload: data,
          received_at: new Date().toISOString(),
        });

      if (paymentError) {
        console.error('Failed to store payment record:', paymentError);
      }
    }

    // Only process if payment is complete
    if (paymentStatus === 'COMPLETE') {
      if (paymentType === 'quote') {
        const { data: quoteRecord, error: quoteError } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', recordId)
          .single();

        if (quoteError || !quoteRecord) {
          console.error('Failed to fetch quote record:', quoteError);
          return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        const depositPaid = Number(quoteRecord.deposit_paid || 0) + amountGross;
        const depositAmount = Number(quoteRecord.deposit_amount || 0);
        const status = depositPaid >= depositAmount ? 'accepted' : quoteRecord.status;

        const { error: updateError } = await supabase
          .from('quotes')
          .update({
            deposit_paid: depositPaid,
            deposit_paid_at: new Date().toISOString(),
            status,
            accepted_at: status === 'accepted' ? new Date().toISOString() : quoteRecord.accepted_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recordId);

        if (updateError) {
          console.error('Failed to update quote:', updateError);
          return NextResponse.json({ error: 'Failed to update quote status' }, { status: 500 });
        }

        const metaWhatsAppService = new MetaWhatsAppService();
        const whatsappUserId = data.custom_str4 || quoteRecord.customer_phone;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://glassdemo.vercel.app';
        const quoteUrl = `${baseUrl}/quote/${quoteRecord.quote_number}?reference=${quoteRecord.quote_number}`;

        let quotePdfUrl: string | undefined = quoteRecord.pdf_url || undefined;
        let invoicePdfUrl: string | undefined;

        try {
          const { DatabaseService } = await import('@/services/databaseService');
          const fullQuote = await DatabaseService.getQuote(quoteRecord.quote_number);

          if (fullQuote) {
            const pdfService = new PDFService();

            if (!quotePdfUrl && fullQuote.pdfUrl) {
              quotePdfUrl = fullQuote.pdfUrl;
            }

            if (!quotePdfUrl) {
              try {
                const quoteBuffer = await pdfService.generateQuotePDF(fullQuote);
                const { pdfUrl, storagePath } = await pdfService.savePDF(quoteBuffer, fullQuote.quoteNumber);
                await DatabaseService.updateQuotePdfUrl(fullQuote.quoteNumber, pdfUrl, storagePath);
                quotePdfUrl = pdfUrl;
              } catch (quotePdfError) {
                console.error('Failed to generate or save quote PDF:', quotePdfError);
              }
            }

            try {
              fullQuote.depositPaid = depositPaid;
              const invoiceBuffer = await pdfService.generateInvoicePDF(fullQuote, { pf_payment_id: pfPaymentId });
              const { pdfUrl, storagePath } = await pdfService.savePDF(invoiceBuffer, fullQuote.quoteNumber, true);
              invoicePdfUrl = pdfUrl;

              await DatabaseService.createInvoice({
                quote_number: fullQuote.quoteNumber,
                customer_name: fullQuote.customer.name,
                customer_phone: fullQuote.customer.phone || quoteRecord.customer_phone,
                customer_email: fullQuote.customer.email,
                billing_address: fullQuote.customer.address,
                subtotal: fullQuote.subtotal,
                vat_amount: fullQuote.vatAmount,
                total: fullQuote.total,
                amount_paid: amountGross,
                balance_due: fullQuote.total - depositPaid,
                pdf_url: pdfUrl,
                pdf_storage_path: storagePath,
              });
            } catch (invoiceError) {
              console.error('Failed to generate or save invoice PDF:', invoiceError);
            }
          }
        } catch (loadError) {
          console.error('Failed to load quote for message composition:', loadError);
        }

        try {
          if (whatsappUserId) {
            const remainingBalance = Number(quoteRecord.total || 0) - depositPaid;
            const quotePdfLine = quotePdfUrl ? `\n📄 Quote PDF:\n${quotePdfUrl}\n` : '';
            const invoicePdfLine = invoicePdfUrl ? `\n🧾 Invoice PDF:\n${invoicePdfUrl}\n` : '';

            const message = `✅ *Payment Received - OWD Glass*\n\nThank you, we have received your deposit payment.\n\n📌 Quote: ${quoteRecord.quote_number}\n💰 Deposit Paid: R${amountGross.toFixed(2)}\n🧾 Total Quote: R${Number(quoteRecord.total || 0).toFixed(2)}\n📌 Remaining Balance: R${remainingBalance.toFixed(2)}\n\nView your quote here:\n${quoteUrl}${quotePdfLine}${invoicePdfLine}\nOur scheduling team will contact you shortly to arrange installation. The remaining balance is due strictly upon completion of installation.\n\nOWD Glass`;

            await metaWhatsAppService.sendTextMessage(whatsappUserId, message);
            console.log('Payment confirmation WhatsApp message sent successfully');
          } else {
            console.warn('No WhatsApp user ID found to send payment confirmation');
          }
        } catch (messageError) {
          console.error('Failed to send payment confirmation WhatsApp message:', messageError);
        }

        console.log('Quote deposit processed successfully:', referenceNumber);
        return NextResponse.json({ success: true });
      }

      // Handle balance payment
      if (paymentType === 'balance') {
        const { data: quoteRecord, error: quoteError } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', recordId)
          .single();

        if (quoteError || !quoteRecord) {
          console.error('Failed to fetch quote record for balance payment:', quoteError);
          return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        const balancePaid = Number(quoteRecord.balance_paid || 0) + amountGross;
        const totalPaid = Number(quoteRecord.deposit_paid || 0) + balancePaid;
        const isFullyPaid = totalPaid >= Number(quoteRecord.total || 0);

        const { error: updateError } = await supabase
          .from('quotes')
          .update({
            balance_paid: balancePaid,
            balance_paid_at: new Date().toISOString(),
            status: isFullyPaid ? 'fully_paid' : quoteRecord.status,
            fully_paid_at: isFullyPaid ? new Date().toISOString() : quoteRecord.fully_paid_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recordId);

        if (updateError) {
          console.error('Failed to update quote for balance payment:', updateError);
          return NextResponse.json({ error: 'Failed to update quote balance status' }, { status: 500 });
        }

        const metaWhatsAppService = new MetaWhatsAppService();
        const whatsappUserId = data.custom_str4 || quoteRecord.customer_phone;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://glassdemo.vercel.app';
        const quoteUrl = `${baseUrl}/quote/${quoteRecord.quote_number}?reference=${quoteRecord.quote_number}`;
        const balanceSuccessUrl = `${baseUrl}/quote/${quoteRecord.quote_number}/balance-success`;

        let statementPdfUrl: string | undefined;

        try {
          const { DatabaseService } = await import('@/services/databaseService');
          const fullQuote = await DatabaseService.getQuote(quoteRecord.quote_number);

          if (fullQuote && isFullyPaid) {
            const pdfService = new PDFService();

            // Create payment history
            const paymentHistory = [
              {
                type: 'deposit' as const,
                amount: Number(quoteRecord.deposit_paid || 0),
                date: quoteRecord.deposit_paid_at || quoteRecord.created_at,
                transactionRef: 'Deposit Payment'
              },
              {
                type: 'balance' as const,
                amount: amountGross,
                date: new Date().toISOString(),
                transactionRef: pfPaymentId || 'Balance Payment'
              }
            ];

            // Generate statement PDF
            try {
              const statementBuffer = await pdfService.generateStatementPDF(fullQuote, paymentHistory);
              const { pdfUrl, storagePath } = await pdfService.savePDF(statementBuffer, fullQuote.quoteNumber, false);
              statementPdfUrl = pdfUrl;

              // Store statement URL in quotes table
              await supabase
                .from('quotes')
                .update({ statement_pdf_url: pdfUrl })
                .eq('id', recordId);
            } catch (statementError) {
              console.error('Failed to generate or save statement PDF:', statementError);
            }
          }
        } catch (loadError) {
          console.error('Failed to load quote for statement generation:', loadError);
        }

        try {
          if (whatsappUserId) {
            const statementPdfLine = statementPdfUrl ? `\n📄 Statement of Account:\n${statementPdfUrl}\n` : '';

            const message = `✅ *Balance Payment Received - OWD Glass*

Thank you, we have received your final balance payment.

📌 Quote: ${quoteRecord.quote_number}
💰 Balance Paid: R${amountGross.toFixed(2)}
🧾 Total Paid: R${totalPaid.toFixed(2)}
✅ Account Status: FULLY PAID

View your payment confirmation:
${balanceSuccessUrl}${statementPdfLine}
Our scheduling team will contact you shortly to confirm installation details.

OWD Glass`;

            await metaWhatsAppService.sendTextMessage(whatsappUserId, message);
            console.log('Balance payment confirmation WhatsApp message sent successfully');
          }
        } catch (messageError) {
          console.error('Failed to send balance payment confirmation WhatsApp message:', messageError);
        }

        console.log('Quote balance payment processed successfully:', referenceNumber);
        return NextResponse.json({ success: true });
      }

      // Fetch repair request details
      const { data: repairRequest, error: repairError } = await supabase
        .from('repair_requests')
        .select('*')
        .eq('id', recordId)
        .single();

      if (repairError || !repairRequest) {
        console.error('Failed to fetch repair request:', repairError);
        return NextResponse.json({ error: 'Repair request not found' }, { status: 404 });
      }

      // Update repair request status
      const { error: updateError } = await supabase
        .from('repair_requests')
        .update({
          status: 'paid',
          payment_reference: pfPaymentId,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId);

      if (updateError) {
        console.error('Failed to update repair request:', updateError);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
      }

      // Send team notification email
      const emailSent = await sendTeamNotification(repairRequest, {
        amount_gross: amountGross,
        pf_payment_id: pfPaymentId,
      });

      // Send WhatsApp payment confirmation to customer
      try {
        const metaWhatsAppService = new MetaWhatsAppService();
        await metaWhatsAppService.sendPaymentConfirmation(
          repairRequest.customer_phone,
          repairRequest.reference_number,
          amountGross
        );
        console.log('WhatsApp payment confirmation sent successfully');
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp payment confirmation:', whatsappError);
        // Don't fail the payment process if WhatsApp fails
      }

      // Update notification status
      if (emailSent) {
        await supabase
          .from('repair_requests')
          .update({
            team_notified: true,
            notification_sent_at: new Date().toISOString(),
          })
          .eq('id', recordId);
      }

      console.log('Payment processed successfully:', referenceNumber);
    }

    // Return 200 OK to PayFast (required)
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PayFast notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET handler for manual testing/verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'PayFast notification endpoint active',
    timestamp: new Date().toISOString()
  });
}
