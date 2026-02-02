import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Quote } from './glassQuoteService';
import fs from 'fs';
import path from 'path';

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
  async generateQuotePDF(quote: Quote): Promise<Buffer> {
    try {
      // For now, generate a simple text-based quote as a buffer
      // We'll replace this with proper PDF generation once the basic API works
      
      let content = `QUOTE: ${quote.quoteNumber}\n`;
      content += `Date: ${new Date(quote.createdDate).toLocaleDateString('en-ZA')}\n\n`;
      content += `CUSTOMER DETAILS:\n`;
      content += `Name: ${quote.customer.name}\n`;
      content += `Email: ${quote.customer.email}\n`;
      content += `Address: ${quote.customer.address}\n\n`;
      content += `QUOTE SUMMARY:\n`;
      content += `Subtotal: R ${quote.subtotal.toFixed(2)}\n`;
      if (quote.discountAmount > 0) {
        content += `Discount (${quote.discountPercent}%): R ${quote.discountAmount.toFixed(2)}\n`;
      }
      content += `VAT (${quote.vatRate}%): R ${quote.vatAmount.toFixed(2)}\n`;
      content += `TOTAL: R ${quote.total.toFixed(2)}\n\n`;
      content += `ITEMS:\n`;
      content += `Description\t\tSize\t\tPrice\n`;
      content += `------------------------------------------------\n`;
      
      quote.items.forEach(item => {
        content += `${item.description}\t${item.size_mm}\tR ${item.totalPrice.toFixed(2)}\n`;
      });
      
      content += `\nQuote valid for 10 days. SANS 10400-N Compliant.\n`;
      
      return Buffer.from(content, 'utf8');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  async savePDF(pdfBuffer: Buffer, referenceNumber: string): Promise<string> {
    try {
      // Debug: log the type of pdfBuffer
      console.log('pdfBuffer type:', typeof pdfBuffer);
      console.log('pdfBuffer constructor:', pdfBuffer.constructor.name);
      console.log('is Buffer?:', Buffer.isBuffer(pdfBuffer));
      
      // Create quotes directory if it doesn't exist
      const quotesDir = path.join(process.cwd(), 'public', 'quotes');
      if (!fs.existsSync(quotesDir)) {
        fs.mkdirSync(quotesDir, { recursive: true });
      }

      // Save PDF file
      const fileName = `${referenceNumber}.pdf`;
      const filePath = path.join(quotesDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      // Return public URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      return `${baseUrl}/quotes/${fileName}`;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Failed to save PDF');
    }
  }
}
