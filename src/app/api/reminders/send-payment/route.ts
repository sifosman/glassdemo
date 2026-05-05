import { NextRequest, NextResponse } from 'next/server';
import { supabase, Database } from '@/lib/supabase';
import { MetaWhatsAppService } from '@/services/metaWhatsAppService';

export async function POST(request: NextRequest) {
  try {
    const { quoteId, reminderType } = await request.json();
    
    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();
    
    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    
    // Don't send reminders if already paid
    if (quote.deposit_paid >= quote.deposit_required) {
      return NextResponse.json({ message: 'Payment already received' });
    }
    
    const whatsappService = new MetaWhatsAppService();
    let message = '';
    
    switch (reminderType) {
      case '24h':
        message = `🔷 *OWD Glass Quote ${quote.quote_number}*\n\n` +
                 `👋 Hi ${quote.customer_name}! Just checking if you had a chance to review your glass quotation.\n\n` +
                 `💰 *Quote Details:*\n` +
                 `• Total: R${quote.total.toFixed(2)}\n` +
                 `• Deposit required: R${quote.deposit_required.toFixed(2)}\n\n` +
                 `🔗 *View & Pay:* https://glassdemo.vercel.app/quote/${quote.quote_number}?reference=${quote.quote_number}\n\n` +
                 `⏰ Quote expires in 6 days\n\n` +
                 `Questions? Reply to this message or call us at +27 66 307 7449\n\n` +
                 `SANS 10400-N Compliant ✅`;
        
        // Update reminder flag
        await supabase
          .from('quotes')
          .update({ reminder_24h_sent: true })
          .eq('id', quoteId);
        break;
        
      case '3d':
        message = `🔷 *OWD Glass Quote ${quote.quote_number}*\n\n` +
                 `⚠️ *TIME SENSITIVE - Quote Expires Soon!*\n\n` +
                 `Hi ${quote.customer_name}, your quote expires in 4 days!\n\n` +
                 `💰 *Quote Details:*\n` +
                 `• Total: R${quote.total.toFixed(2)}\n` +
                 `• Deposit required: R${quote.deposit_required.toFixed(2)}\n\n` +
                 `🔗 *Secure Your Price:* https://glassdemo.vercel.app/quote/${quote.quote_number}?reference=${quote.quote_number}\n\n` +
                 `⏰ Only 4 days left to lock in this price!\n\n` +
                 `Reply "READY" to proceed or call +27 66 307 7449\n\n` +
                 `SANS 10400-N Compliant ✅`;
        
        // Update reminder flag
        await supabase
          .from('quotes')
          .update({ reminder_3d_sent: true })
          .eq('id', quoteId);
        break;
        
      case 'expiry':
        message = `🔷 *OWD Glass Quote ${quote.quote_number}*\n\n` +
                 `🚨 *FINAL REMINDER - Quote Expires Today!*\n\n` +
                 `Hi ${quote.customer_name}, this is your final reminder!\n\n` +
                 `💰 *Quote Details:*\n` +
                 `• Total: R${quote.total.toFixed(2)}\n` +
                 `• Deposit required: R${quote.deposit_required.toFixed(2)}\n\n` +
                 `🔗 *Last Chance:* https://glassdemo.vercel.app/quote/${quote.quote_number}?reference=${quote.quote_number}\n\n` +
                 `⏰ Expires at midnight tonight!\n\n` +
                 `Reply "URGENT" for immediate assistance or call +27 66 307 7449\n\n` +
                 `SANS 10400-N Compliant ✅`;
        
        // Update reminder flag and mark as expired
        await supabase
          .from('quotes')
          .update({ 
            reminder_expiry_sent: true,
            status: 'expired'
          })
          .eq('id', quoteId);
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid reminder type' }, { status: 400 });
    }
    
    // Send WhatsApp message
    await whatsappService.sendTextMessage(quote.customer_phone, message);
    
    return NextResponse.json({ 
      success: true, 
      message: `${reminderType} reminder sent successfully`,
      quoteNumber: quote.quote_number 
    });
    
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
