import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/databaseService';
import { PDFService } from '@/services/pdfService';

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

    const pdfService = new PDFService();

    if (!quote.pdfUrl) {
      try {
        const buffer = await pdfService.generateQuotePDF(quote);
        const { pdfUrl, storagePath } = await pdfService.savePDF(buffer, quote.quoteNumber);
        await DatabaseService.updateQuotePdfUrl(quote.quoteNumber, pdfUrl, storagePath);
        quote.pdfUrl = pdfUrl;
      } catch (pdfError) {
        console.error('Failed to generate or save quote PDF:', pdfError);
      }
    }

    if (quote.depositPaid > 0 && !quote.invoicePdfUrl) {
      try {
        const buffer = await pdfService.generateInvoicePDF(quote, { pf_payment_id: 'N/A' });
        const { pdfUrl, storagePath } = await pdfService.savePDF(buffer, quote.quoteNumber, true);

        await DatabaseService.createInvoice({
          quote_number: quote.quoteNumber,
          customer_name: quote.customer.name,
          customer_phone: quote.customer.phone || quote.customer.email,
          customer_email: quote.customer.email,
          billing_address: quote.customer.address,
          subtotal: quote.subtotal,
          vat_amount: quote.vatAmount,
          total: quote.total,
          amount_paid: quote.depositPaid,
          balance_due: quote.total - quote.depositPaid,
          pdf_url: pdfUrl,
          pdf_storage_path: storagePath
        });

        quote.invoicePdfUrl = pdfUrl;
      } catch (invoiceError) {
        console.error('Failed to generate or save invoice PDF:', invoiceError);
      }
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
