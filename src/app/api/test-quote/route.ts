import { NextRequest, NextResponse } from 'next/server';
import { GlassQuoteService } from '@/services/glassQuoteService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { customer, items } = body;
    
    if (!customer || !items) {
      return NextResponse.json(
        { error: 'Missing required fields: customer, items' },
        { status: 400 }
      );
    }
    
    // Initialize service
    const quoteService = new GlassQuoteService();
    
    // Calculate quote
    const quote = await quoteService.calculateQuote(customer, items);
    
    // Return quote without PDF generation
    return NextResponse.json({
      success: true,
      quoteReference: quote.quoteNumber,
      totalAmount: quote.total,
      quote: quote,
      message: 'Quote calculated successfully (PDF generation bypassed)'
    });
    
  } catch (error: any) {
    console.error('Error calculating quote:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
