import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { Quote } from './glassQuoteService';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Register fonts (optional - you can add custom fonts here)
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 20,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  businessInfo: {
    fontSize: 10,
    color: '#666',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  customerInfo: {
    marginBottom: 15,
  },
  quoteReference: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 5,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCol: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  tableColLast: {
    padding: 8,
  },
  description: {
    width: '40%',
  },
  quantity: {
    width: '10%',
    textAlign: 'center',
  },
  size: {
    width: '20%',
    textAlign: 'center',
  },
  price: {
    width: '15%',
    textAlign: 'right',
  },
  total: {
    width: '15%',
    textAlign: 'right',
  },
  totals: {
    marginTop: 30,
    borderTop: '1px solid #ddd',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTop: '1px solid #ddd',
    paddingTop: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
});

interface QuoteDocumentProps {
  quote: Quote;
}

const QuoteDocument: React.FC<QuoteDocumentProps> = ({ quote }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.businessName}>OWD Glass</Text>
        <Text style={styles.businessInfo}>Professional Glazing Solutions | SANS 10400-N Compliant</Text>
        <Text style={styles.businessInfo}>Email: info@owdglass.co.za | Phone: +27 12 345 6789</Text>
      </View>

      {/* Quote Reference */}
      <View style={styles.section}>
        <Text style={styles.quoteReference}>Quote Reference: {quote.quoteNumber}</Text>
        <Text>Date: {new Date(quote.createdDate).toLocaleDateString('en-ZA')}</Text>
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.customerInfo}>
          <Text style={styles.bold}>Name: {quote.customer.name}</Text>
          <Text>Email: {quote.customer.email}</Text>
          <Text>Address: {quote.customer.address}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quotation Items</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableCol, styles.description]}>
              <Text style={styles.bold}>Description</Text>
            </View>
            <View style={[styles.tableCol, styles.quantity]}>
              <Text style={styles.bold}>Qty</Text>
            </View>
            <View style={[styles.tableCol, styles.size]}>
              <Text style={styles.bold}>Size (mm)</Text>
            </View>
            <View style={[styles.tableCol, styles.price]}>
              <Text style={styles.bold}>Unit Price</Text>
            </View>
            <View style={[styles.tableColLast, styles.total]}>
              <Text style={styles.bold}>Total</Text>
            </View>
          </View>

          {/* Table Rows */}
          {quote.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.description]}>
                <Text>{item.description}</Text>
              </View>
              <View style={[styles.tableCol, styles.quantity]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCol, styles.size]}>
                <Text>{item.size_mm}</Text>
              </View>
              <View style={[styles.tableCol, styles.price]}>
                <Text>R {item.unitPrice.toFixed(2)}</Text>
              </View>
              <View style={[styles.tableColLast, styles.total]}>
                <Text>R {item.totalPrice.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>R {quote.subtotal.toFixed(2)}</Text>
        </View>
        {quote.discountAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount ({quote.discountPercent}%):</Text>
            <Text style={styles.totalValue}>R {quote.discountAmount.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>VAT ({quote.vatRate}%):</Text>
          <Text style={styles.totalValue}>R {quote.vatAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, styles.grandTotal]}>TOTAL AMOUNT:</Text>
          <Text style={[styles.totalValue, styles.grandTotal]}>R {quote.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Quote valid for 10 days. SANS 10400-N Compliant.</Text>
        <Text>Terms and conditions apply. All prices include VAT.</Text>
      </View>
    </Page>
  </Document>
);

export class PDFService {
  private async toNodeBuffer(value: unknown): Promise<Buffer> {
    if (Buffer.isBuffer(value)) {
      return value;
    }

    if (value instanceof Uint8Array) {
      return Buffer.from(value);
    }

    const maybeStream = value as { getReader?: () => { read: () => Promise<{ done: boolean; value?: Uint8Array }> } };
    if (maybeStream && typeof maybeStream.getReader === 'function') {
      const reader = maybeStream.getReader();
      const chunks: Buffer[] = [];

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        if (chunk) chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    }

    throw new Error('Failed to convert PDF output to Buffer');
  }

  async generateQuotePDF(quote: Quote): Promise<Buffer> {
    try {
      const instance = pdf(<QuoteDocument quote={quote} />);
      const output = await instance.toBuffer();
      return await this.toNodeBuffer(output);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  async generateInvoicePDF(quote: any, paymentData: any): Promise<Buffer> {
    try {
      const depositPaid = Number(quote.depositPaid || quote.depositAmount || 0);
      const remainingBalance = quote.total - depositPaid;
      
      const transactionRef = paymentData?.pf_payment_id || 'N/A';
      const invoiceNumber = paymentData?.invoice_number || `INV-${quote.quoteNumber}`;

      const InvoiceDocument = (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={styles.businessName}>OWD Glass</Text>
              <Text style={styles.businessInfo}>Professional Glazing Solutions | SANS 10400-N Compliant</Text>
              <Text style={styles.businessInfo}>Email: info@owdglass.co.za | Phone: +27 12 345 6789</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.quoteReference}>Invoice: {invoiceNumber}</Text>
              <Text>Quote Reference: {quote.quoteNumber}</Text>
              <Text>Transaction Ref: {transactionRef}</Text>
              <Text>Date: {new Date().toLocaleDateString('en-ZA')}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={styles.customerInfo}>
                <Text style={styles.bold}>Name: {quote.customer.name}</Text>
                <Text>Email: {quote.customer.email}</Text>
                <Text>Address: {quote.customer.address}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Quote Value:</Text>
                <Text style={styles.totalValue}>R {quote.total.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Deposit Received (50%):</Text>
                <Text style={styles.totalValue}>R {depositPaid.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Remaining Balance:</Text>
                <Text style={styles.totalValue}>R {remainingBalance.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <View style={[styles.tableCol, styles.description]}>
                    <Text style={styles.bold}>Description</Text>
                  </View>
                  <View style={[styles.tableCol, styles.quantity]}>
                    <Text style={styles.bold}>Qty</Text>
                  </View>
                  <View style={[styles.tableCol, styles.size]}>
                    <Text style={styles.bold}>Size (mm)</Text>
                  </View>
                  <View style={[styles.tableColLast, styles.total]}>
                    <Text style={styles.bold}>Total</Text>
                  </View>
                </View>

                {quote.items.map((item: any, index: number) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.tableCol, styles.description]}>
                      <Text>{item.description}</Text>
                    </View>
                    <View style={[styles.tableCol, styles.quantity]}>
                      <Text>{item.quantity}</Text>
                    </View>
                    <View style={[styles.tableCol, styles.size]}>
                      <Text>{item.size_mm}</Text>
                    </View>
                    <View style={[styles.tableColLast, styles.total]}>
                      <Text>R {item.totalPrice.toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.footer}>
              <Text>Thank you for your payment.</Text>
              <Text>The remaining balance is due strictly upon completion of installation.</Text>
              <Text>All prices include VAT.</Text>
            </View>
          </Page>
        </Document>
      );

      const instance = pdf(InvoiceDocument);
      const output = await instance.toBuffer();
      return await this.toNodeBuffer(output);
      
    } catch (error) {
      console.error('Error generating Invoice PDF:', error);
      throw new Error('Failed to generate Invoice PDF');
    }
  }

  async savePDF(
    pdfBuffer: Buffer,
    referenceNumber: string,
    isInvoice: boolean = false
  ): Promise<{ pdfUrl: string; storagePath: string; fileName: string }> {
    try {
      const fileName = isInvoice ? `${referenceNumber}-invoice.pdf` : `${referenceNumber}.pdf`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const bucket = process.env.SUPABASE_PDF_BUCKET || 'documents';
      const folder = isInvoice ? 'invoices' : 'quotes';
      const storagePath = `${folder}/${fileName}`;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        const pdfUrl = data.publicUrl;
        return { pdfUrl, storagePath, fileName };
      }

      const quotesDir = path.join(process.cwd(), 'public', 'quotes');
      if (!fs.existsSync(quotesDir)) {
        fs.mkdirSync(quotesDir, { recursive: true });
      }

      const filePath = path.join(quotesDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      return { pdfUrl: `${baseUrl}/quotes/${fileName}`, storagePath: `quotes/${fileName}`, fileName };
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Failed to save PDF');
    }
  }
}
