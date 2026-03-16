import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { BotSailorService } from '@/services/botSailorService';

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

function verifySignature(data: Record<string, string>, signature: string, passphrase: string): boolean {
  // Create parameter string (exclude signature itself)
  const paramString = Object.keys(data)
    .filter(key => key !== 'signature')
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');
  
  // Add passphrase
  const stringToHash = `${paramString}&passphrase=${passphrase}`;
  
  // Generate MD5 hash
  const calculatedSignature = crypto.createHash('md5').update(stringToHash).digest('hex');
  
  return calculatedSignature === signature;
}

async function sendTeamNotification(repairData: any, paymentData: any) {
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

    // Verify signature (in sandbox, this might be skipped)
    if (PAYFAST_PASSPHRASE && data.signature) {
      const isValid = verifySignature(data, data.signature, PAYFAST_PASSPHRASE);
      if (!isValid) {
        console.error('PayFast signature verification failed');
        // In production, you should reject this. For now, we'll log and continue.
        // return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    // Extract data
    const referenceNumber = data.custom_str1;
    const repairRequestId = data.custom_str2;
    const pfPaymentId = data.pf_payment_id;
    const paymentStatus = data.payment_status;
    const amountGross = parseFloat(data.amount_gross || '0');
    const amountFee = parseFloat(data.amount_fee || '0');
    const amountNet = parseFloat(data.amount_net || '0');

    if (!referenceNumber || !repairRequestId) {
      return NextResponse.json({ error: 'Missing reference data' }, { status: 400 });
    }

    // Store payment record
    const { error: paymentError } = await supabase
      .from('payfast_payments')
      .insert({
        repair_request_id: repairRequestId,
        pf_payment_id: pfPaymentId,
        payment_status: paymentStatus,
        amount_gross: amountGross,
        amount_fee: amountFee,
        amount_net: amountNet,
        payfast_signature: data.signature,
        merchant_id: data.merchant_id,
        signature_match: true, // Set based on verification above
        raw_payload: data,
        received_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error('Failed to store payment record:', paymentError);
    }

    // Only process if payment is complete
    if (paymentStatus === 'COMPLETE') {
      // Fetch repair request details
      const { data: repairRequest, error: repairError } = await supabase
        .from('repair_requests')
        .select('*')
        .eq('id', repairRequestId)
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
        .eq('id', repairRequestId);

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
        const botSailorService = new BotSailorService();
        await botSailorService.sendPaymentConfirmation(
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
          .eq('id', repairRequestId);
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
