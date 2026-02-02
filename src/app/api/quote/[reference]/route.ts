import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/databaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    
    if (!reference) {
      return NextResponse.json(
        { error: 'Quote reference is required' },
        { status: 400 }
      );
    }

    // Fetch quote from Supabase
    const quote = await DatabaseService.getQuote(reference);
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
    
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
