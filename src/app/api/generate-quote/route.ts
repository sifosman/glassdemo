import { NextRequest, NextResponse } from 'next/server';
import { GlassQuoteService } from '@/services/glassQuoteService';
import { MetaWhatsAppService } from '@/services/metaWhatsAppService';
import { DatabaseService } from '@/services/databaseService';
import { PDFService } from '@/services/pdfService';

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
    const metaWhatsAppService = new MetaWhatsAppService();
    const pdfService = new PDFService();
    let quotePdfUrl: string | null = null;
    
    // Validate items contain required fields and extract opening_mechanism
    const processedItems = items.map((item: any) => ({
      width_mm: item.width_mm,
      height_mm: item.height_mm,
      type: item.type,
      glassType: item.glassType,
      frameColor: item.frameColor,
      thickness: item.thickness,
      quantity: item.quantity || 1, // Include quantity, default to 1 if not provided
      opening_mechanism: item.opening_mechanism || 'unknown' // Default to unknown if not provided
    }));

    // Calculate quote
    const quote = await quoteService.calculateQuote({ ...customer, phone: customer.phone || whatsappUserId }, processedItems);
    
    // Save quote to Supabase
    await DatabaseService.saveQuote(quote);
    
    // Generate and save Quote PDF
    try {
      const quotePdfBuffer = await pdfService.generateQuotePDF(quote);
      const { pdfUrl, storagePath } = await pdfService.savePDF(quotePdfBuffer, quote.quoteNumber);
      quotePdfUrl = pdfUrl;
      await DatabaseService.updateQuotePdfUrl(quote.quoteNumber, pdfUrl, storagePath);
    } catch (pdfError) {
      console.error('Failed to generate or save Quote PDF:', pdfError);
      // Proceed even if PDF generation fails
    }
    
    // Generate quote URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://glassdemo.vercel.app';
    const quoteUrl = `${baseUrl}/quote/${quote.quoteNumber}?reference=${quote.quoteNumber}`;
    
    // Send quote PDF link + attachment via WhatsApp (preferred), fallback to web link if PDF not available
    try {
      if (quotePdfUrl) {
        await metaWhatsAppService.sendQuotePdfToWhatsApp(whatsappUserId, quotePdfUrl, quoteUrl, quote.quoteNumber);
      } else {
        await metaWhatsAppService.sendQuoteLinkToWhatsApp(whatsappUserId, quoteUrl, quote.quoteNumber);
      }
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp message:', whatsappError);
      // Continue even if WhatsApp fails - quote is still generated and saved
    }
    
    return NextResponse.json({
      success: true,
      quoteReference: quote.quoteNumber,
      quoteUrl,
      quotePdfUrl,
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
