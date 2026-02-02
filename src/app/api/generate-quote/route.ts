import { NextRequest, NextResponse } from 'next/server';
import { GlassQuoteService } from '@/services/glassQuoteService';
import { BotSailorService } from '@/services/botSailorService';
import { DatabaseService } from '@/services/databaseService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { customer, items, whatsappUserId } = body;
    
    if (!customer || !items || !whatsappUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: customer, items, whatsappUserId' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items must be a non-empty array' },
        { status: 400 }
      );
    }
    
    // Initialize services
    const quoteService = new GlassQuoteService();
    const botSailorService = new BotSailorService();
    
    // Calculate quote
    const quote = await quoteService.calculateQuote(customer, items);
    
    // Save quote to Supabase
    await DatabaseService.saveQuote(quote);
    
    // Generate quote URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://glassdemo.vercel.app';
    const quoteUrl = `${baseUrl}/quote/${quote.quoteNumber}?reference=${quote.quoteNumber}`;
    
    // Send quote URL via WhatsApp
    await botSailorService.sendQuoteLinkToWhatsApp(whatsappUserId, quoteUrl, quote.quoteNumber);
    
    return NextResponse.json({
      success: true,
      quoteReference: quote.quoteNumber,
      quoteUrl,
      totalAmount: quote.total,
      message: 'Quote generated and sent successfully via WhatsApp'
    });
    
  } catch (error) {
    console.error('Error generating quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
