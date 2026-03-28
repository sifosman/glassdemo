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
    
  } catch (error: unknown) {
    console.error('Error calculating quote:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details },
      { status: 500 }
    );
  }
}
