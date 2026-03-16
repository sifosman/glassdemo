'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Quote {
  quoteNumber: string;
  customer: {
    name: string;
    email: string;
    address: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    size_mm: string;
    area_m2: number;
    unitPrice: number;
    totalPrice: number;
    product_code: string;
    is_safety_glass: boolean;
    systemName?: string;
    glassSpec?: { type: string; thickness: string };
    powderCoatCode?: string;
    frameColor?: string;
  }>;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  requiresSafetyGlass: boolean;
  safetyReason?: string;
  createdDate: string;
  expiryDate: string;
}

export default function QuotePage() {
  const searchParams = useSearchParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) {
      setError('No quote reference provided');
      setLoading(false);
      return;
    }

    fetchQuote(reference);
  }, [searchParams]);

  const fetchQuote = async (reference: string) => {
    try {
      const response = await fetch(`/api/quote/${reference}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Quote not found');
        } else {
          setError('Failed to fetch quote');
        }
        return;
      }

      const quoteData = await response.json();
      setQuote(quoteData);
    } catch (err) {
      setError('Failed to fetch quote');
    } finally {
      setLoading(false);
    }
  };

  const downloadQuote = async () => {
    if (!quote) return;
    
    const button = document.querySelector('button[onclick*="downloadQuote"]') as HTMLButtonElement;
    const originalText = button?.textContent || 'Download Quote';
    
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule;
      
      // Show loading state
      if (button) {
        button.textContent = 'Generating PDF...';
        button.disabled = true;
      }

      // Create the PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // PDF dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 12, fontStyle: string = 'normal', isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        if (isBold) pdf.setFont('helvetica', 'bold');
        
        const lines = pdf.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.35;
        });
        return yPosition;
      };

      // Generate reference codes for items
      const generateReference = (description: string, index: number): string => {
        const num = String(index + 1).padStart(2, '0');
        if (description.toLowerCase().includes('window')) return `W${num}`;
        if (description.toLowerCase().includes('door')) return `D${num}`;
        return `P${num}`; // Panel
      };
      
      // PAGE 1: SUMMARY WITH TABLE
      pdf.setFillColor(248, 249, 250);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OWD GLASS', margin, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Professional Glazing Solutions', margin, 28);
      pdf.text('123 Glass Street, Pretoria | +27 12 345 6789 | info@owdglass.co.za', margin, 35);
      
      // Quote header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Quotation', margin, 55);
      
      pdf.setFontSize(12);
      pdf.text(`Ref: ${quote.quoteNumber}`, pageWidth - margin - 60, 55);
      
      // Customer info
      yPosition = 65;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`To: ${quote.customer.name}`, margin, yPosition);
      pdf.text(`Quote Date: ${new Date(quote.createdDate).toLocaleDateString('en-ZA')}`, pageWidth - margin - 60, yPosition);
      pdf.text(`${quote.customer.address}`, margin, yPosition + 8);
      pdf.text('Validity: 10 days', pageWidth - margin - 60, yPosition + 8);
      
      // Summary Table Header
      yPosition = 85;
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reference', margin + 2, yPosition + 5);
      pdf.text('Qty', margin + 25, yPosition + 5);
      pdf.text('System', margin + 35, yPosition + 5);
      pdf.text('Price', pageWidth - margin - 40, yPosition + 5);
      pdf.text('Total', pageWidth - margin - 20, yPosition + 5);
      
      yPosition += 8;
      
      // Table rows
      pdf.setFont('helvetica', 'normal');
      quote.items.forEach((item, index) => {
        const ref = generateReference(item.description, index);
        
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPosition, contentWidth, 6, 'F');
        
        pdf.text(ref, margin + 2, yPosition + 4);
        pdf.text(item.quantity.toString(), margin + 25, yPosition + 4);
        const displayName = item.systemName || item.description;
        pdf.text(displayName.substring(0, 30), margin + 35, yPosition + 4);
        pdf.text(`R ${item.unitPrice.toFixed(2)}`, pageWidth - margin - 45, yPosition + 4);
        pdf.text(`R ${item.totalPrice.toFixed(2)}`, pageWidth - margin - 25, yPosition + 4);
        
        yPosition += 6;
      });
      
      // Totals section
      yPosition += 10;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition, contentWidth, 25, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sub Total', pageWidth - margin - 70, yPosition + 6);
      pdf.text(`R ${quote.subtotal.toFixed(2)}`, pageWidth - margin - 25, yPosition + 6);
      
      pdf.text(`Vat Total (${quote.vatRate}%)`, pageWidth - margin - 70, yPosition + 14);
      pdf.text(`R ${quote.vatAmount.toFixed(2)}`, pageWidth - margin - 25, yPosition + 14);
      
      pdf.setFontSize(12);
      pdf.text('Total', pageWidth - margin - 70, yPosition + 22);
      pdf.text(`R ${quote.total.toFixed(2)}`, pageWidth - margin - 30, yPosition + 22);
      
      // Terms
      yPosition += 35;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Terms: 50% deposit required. Balance on completion. Valid for 10 days.', margin, yPosition);
      
      // Page footer
      pdf.setFontSize(8);
      const totalPages = Math.ceil(quote.items.length) + 1;
      pdf.text(`Page 1 of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
      
      // PAGES 2+: DETAILED BREAKDOWN (One item per page)
      quote.items.forEach((item, index) => {
        pdf.addPage();
        
        const ref = generateReference(item.description, index);
        const widthVal = parseInt(item.size_mm.split(' x ')[0]);
        const heightVal = parseInt(item.size_mm.split(' x ')[1]);
        
        // Header
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Quotation', margin, 20);
        pdf.text(`Ref: ${quote.quoteNumber}`, pageWidth - margin - 60, 20);
        
        // Item reference and info
        yPosition = 35;
        pdf.setFillColor(220, 220, 220);
        pdf.rect(margin, yPosition, contentWidth, 30, 'F');
        
        pdf.setFontSize(10);
        const displayName = item.systemName || item.description;
        pdf.text(`Reference: ${ref}`, margin + 5, yPosition + 8);
        pdf.text(`Qty: ${item.quantity}`, margin + 5, yPosition + 16);
        pdf.text(`System: ${displayName}`, margin + 5, yPosition + 24);
        pdf.text(`Price: R ${item.unitPrice.toFixed(2)}`, pageWidth - margin - 60, yPosition + 16);
        pdf.text(`Total: R ${item.totalPrice.toFixed(2)}`, pageWidth - margin - 60, yPosition + 24);
        
        yPosition += 40;
        
        // Calculate proportional diagram size (max 80mm width or height)
        const maxDiagramSize = 80;
        const aspectRatio = widthVal / heightVal;
        let diagramWidth, diagramHeight;
        
        if (aspectRatio > 1) {
          // Wider than tall
          diagramWidth = Math.min(maxDiagramSize, widthVal / 20);
          diagramHeight = diagramWidth / aspectRatio;
        } else {
          // Taller than wide
          diagramHeight = Math.min(maxDiagramSize, heightVal / 20);
          diagramWidth = diagramHeight * aspectRatio;
        }
        
        // Center the diagram
        const diagramX = margin + 10;
        const diagramY = yPosition + 10;
        
        // Draw professional window diagram with proportional sizing
        const drawProfessionalWindow = (x: number, y: number, w: number, h: number) => {
          // Outer frame
          pdf.setDrawColor(60, 60, 60);
          pdf.setLineWidth(2);
          pdf.rect(x, y, w, h);
          
          // Inner frame
          const frameThickness = 4;
          pdf.setDrawColor(100, 100, 100);
          pdf.setLineWidth(1);
          pdf.rect(x + frameThickness, y + frameThickness, w - frameThickness * 2, h - frameThickness * 2);
          
          // Glass fill
          pdf.setFillColor(230, 240, 250);
          pdf.rect(x + frameThickness + 1, y + frameThickness + 1, w - frameThickness * 2 - 2, h - frameThickness * 2 - 2, 'F');
          
          // Window divisions based on type
          const desc = item.description.toLowerCase();
          if (desc.includes('door')) {
            // Vertical division for doors
            pdf.setDrawColor(80, 80, 80);
            pdf.setLineWidth(1.5);
            pdf.line(x + w/2, y + frameThickness, x + w/2, y + h - frameThickness);
            
            // Handle
            pdf.setFillColor(40, 40, 40);
            const handleSize = Math.min(w, h) / 8;
            pdf.rect(x + w/2 - handleSize/2, y + h/2 - 2, handleSize, 4, 'F');
          } else if (aspectRatio > 2) {
            // Wide window - horizontal division
            pdf.setDrawColor(80, 80, 80);
            pdf.setLineWidth(1.5);
            const numSections = Math.floor(aspectRatio);
            for (let i = 1; i < numSections; i++) {
              pdf.line(x + (w * i / numSections), y + frameThickness, x + (w * i / numSections), y + h - frameThickness);
            }
          } else {
            // Standard window - cross division
            pdf.setDrawColor(80, 80, 80);
            pdf.setLineWidth(1.5);
            pdf.line(x + w/2, y + frameThickness, x + w/2, y + h - frameThickness);
            if (h > w / 2) {
              pdf.line(x + frameThickness, y + h/2, x + w - frameThickness, y + h/2);
            }
          }
        };
        
        drawProfessionalWindow(diagramX, diagramY, diagramWidth, diagramHeight);
        
        // Measurements
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        
        // Width measurement (top)
        pdf.text(`${widthVal}mm`, diagramX + diagramWidth/2 - 10, diagramY - 3);
        
        // Height measurement (left side)
        pdf.text(`${heightVal}mm`, diagramX - 20, diagramY + diagramHeight/2);
        
        // Specifications section
        const specY = diagramY + diagramHeight + 20;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SPECIFICATIONS', margin, specY);
        
        yPosition = specY + 8;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        const specDisplayName = item.systemName || item.description;
        const glassType = item.glassSpec?.type || 'Clear Float';
        const glassThickness = item.glassSpec?.thickness || '4mm';
        const frameFinish = item.frameColor || 'Charcoal Matt';
        const powderCode = item.powderCoatCode || 'PIS71149';
        
        pdf.text(`Design: ${specDisplayName}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Frame Finish: ${frameFinish} ${powderCode}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Glass Type: ${glassType}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Thickness: ${glassThickness}`, margin, yPosition);
        yPosition += 7;
        
        if (item.is_safety_glass) {
          pdf.text(`Compliance: SANS 1263-1 & SANS 10400-N`, margin, yPosition);
          yPosition += 7;
        }
        
        pdf.text('Limitations: None', margin, yPosition);
        yPosition += 7;
        pdf.text('Comments: Image as viewed from outside', margin, yPosition);
        
        // Page footer
        pdf.setFontSize(8);
        pdf.text(`Page ${index + 2} of ${quote.items.length + 1}`, pageWidth - margin - 30, pageHeight - 10);
      });
      
      
      // Save the PDF
      pdf.save(`OWD-Glass-Quote-${quote.quoteNumber}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      // Reset button
      const button = document.querySelector('button[onclick*="downloadQuote"]') as HTMLButtonElement;
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
  };

  const shareQuote = async () => {
    if (!quote) return;
    
    const shareUrl = window.location.href;
    const shareText = `OWD Glass Quote ${quote.quoteNumber}\n\nTotal: R ${quote.total.toFixed(2)}\n\nView quote: ${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `OWD Glass Quote ${quote.quoteNumber}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Quote link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const generatePDFContent = (quote: Quote): string => {
    let content = `OWD GLASS QUOTE\n`;
    content += `================\n\n`;
    content += `Quote Number: ${quote.quoteNumber}\n`;
    content += `Date: ${new Date(quote.createdDate).toLocaleDateString('en-ZA')}\n`;
    content += `Valid Until: ${new Date(quote.expiryDate).toLocaleDateString('en-ZA')}\n\n`;
    
    content += `CUSTOMER DETAILS\n`;
    content += `----------------\n`;
    content += `Name: ${quote.customer.name}\n`;
    content += `Email: ${quote.customer.email}\n`;
    content += `Phone: ${quote.customer.phone || 'N/A'}\n`;
    content += `Address: ${quote.customer.address}\n\n`;
    
    content += `QUOTE ITEMS\n`;
    content += `-----------\n`;
    content += `Description\t\tQty\tSize\t\tPrice\n`;
    content += `------------------------------------------------\n`;
    
    quote.items.forEach(item => {
      content += `${item.description}\t${item.quantity}\t${item.size_mm}\tR ${item.totalPrice.toFixed(2)}\n`;
    });
    
    content += `\nSUMMARY\n`;
    content += `-------\n`;
    content += `Subtotal: R ${quote.subtotal.toFixed(2)}\n`;
    if (quote.discountAmount > 0) {
      content += `Discount (${quote.discountPercent}%): R ${quote.discountAmount.toFixed(2)}\n`;
    }
    content += `VAT (${quote.vatRate}%): R ${quote.vatAmount.toFixed(2)}\n`;
    content += `TOTAL: R ${quote.total.toFixed(2)}\n\n`;
    
    content += `CONTACT INFORMATION\n`;
    content += `------------------\n`;
    content += `OWD Glass\n`;
    content += `Email: info@owdglass.co.za\n`;
    content += `Phone: +27 12 345 6789\n`;
    content += `SANS 10400-N Compliant\n`;
    
    return content;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-gray-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Quote Not Found</h1>
            <p className="text-gray-600">{error || 'The quote you are looking for could not be found.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mb-6">
          <button
            onClick={shareQuote}
            className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Quote
          </button>
          <button
            onClick={downloadQuote}
            className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Quote
          </button>
        </div>

        {/* Quote Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 border-l-4 border-gray-800">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">OWD</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">OWD Glass</h1>
                  <p className="text-gray-600">Professional Glazing Solutions</p>
                  <p className="text-gray-500 text-sm">SANS 10400-N Compliant | CGC Member</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">📍 123 Glass Street, Pretoria, 0001</p>
                  <p className="text-gray-600">📞 +27 12 345 6789</p>
                </div>
                <div>
                  <p className="text-gray-600">✉️ info@owdglass.co.za</p>
                  <p className="text-gray-600">🌐 www.owdglass.co.za</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg min-w-[200px]">
              <div className="text-sm text-gray-600 font-semibold mb-2 tracking-wide">QUOTATION</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{quote.quoteNumber}</h2>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700"><span className="font-medium">Date:</span> {new Date(quote.createdDate).toLocaleDateString('en-ZA')}</p>
                <p className="text-gray-700"><span className="font-medium">Valid:</span> 10 days</p>
                <p className="text-gray-700"><span className="font-medium">Status:</span> <span className="text-green-600 font-medium">Active</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Project Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Customer & Project Information
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Customer Details</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="text-gray-600 text-sm">Name:</span> <span className="font-medium text-gray-900">{quote.customer.name}</span></p>
                <p><span className="text-gray-600 text-sm">Email:</span> <span className="font-medium text-gray-900">{quote.customer.email}</span></p>
                {quote.customer.phone && <p><span className="text-gray-600 text-sm">Phone:</span> <span className="font-medium text-gray-900">{quote.customer.phone}</span></p>}
                <p><span className="text-gray-600 text-sm">Address:</span> <span className="font-medium text-gray-900">{quote.customer.address}</span></p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Project Specifications</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="text-gray-600 text-sm">Total Items:</span> <span className="font-medium text-gray-900">{quote.items.length} units</span></p>
                <p><span className="text-gray-600 text-sm">Glass Type:</span> <span className="font-medium text-gray-900">{quote.items[0]?.description.includes('Low-E') ? 'Low-E Energy Efficient' : 'Standard Clear'}</span></p>
                <p><span className="text-gray-600 text-sm">Compliance:</span> <span className="font-medium text-gray-900">SANS 10400-N</span></p>
                <p><span className="text-gray-600 text-sm">Safety Glass:</span> <span className={`font-medium ${quote.requiresSafetyGlass ? 'text-amber-600' : 'text-green-600'}`}>{quote.requiresSafetyGlass ? 'Required' : 'Not Required'}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Items with Diagrams */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Detailed Glazing Schedule
          </h3>
          
          <div className="space-y-6">
            {quote.items.map((item, index) => {
              // Generate reference code
              const generateRef = (desc: string, idx: number): string => {
                const num = String(idx + 1).padStart(2, '0');
                if (desc.toLowerCase().includes('window')) return `W${num}`;
                if (desc.toLowerCase().includes('door')) return `D${num}`;
                return `P${num}`;
              };
              
              const ref = generateRef(item.description, index);
              const widthMm = parseInt(item.size_mm.split(' x ')[0]);
              const heightMm = parseInt(item.size_mm.split(' x ')[1]);
              
              // Calculate proportional diagram size
              const maxSize = 200; // max pixels
              const aspectRatio = widthMm / heightMm;
              let diagramWidth, diagramHeight;
              
              if (aspectRatio > 1) {
                diagramWidth = Math.min(maxSize, widthMm / 8);
                diagramHeight = diagramWidth / aspectRatio;
              } else {
                diagramHeight = Math.min(maxSize, heightMm / 8);
                diagramWidth = diagramHeight * aspectRatio;
              }
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Diagram */}
                    <div className="lg:w-1/3">
                      <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                        <div className="text-center mb-3">
                          <span className="text-sm font-bold text-gray-800">{ref}</span>
                          <span className="text-xs text-gray-600 ml-2">({item.description.includes('door') ? 'DOOR' : item.description.includes('window') ? 'WINDOW' : 'PANEL'})</span>
                        </div>
                        
                        {/* Proportional diagram */}
                        <div className="relative flex justify-center items-center" style={{minHeight: `${diagramHeight + 40}px`}}>
                          {/* Width measurement (top) */}
                          <div className="absolute" style={{top: '0px', left: '50%', transform: 'translateX(-50%)'}}>
                            <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 border border-gray-300 rounded">
                              {widthMm}mm
                            </span>
                          </div>
                          
                          {/* Height measurement (left side) */}
                          <div className="absolute" style={{left: '0px', top: '50%', transform: 'translateY(-50%)'}}>
                            <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 border border-gray-300 rounded">
                              {heightMm}mm
                            </span>
                          </div>
                          
                          {/* Window/Door diagram */}
                          <div 
                            className="relative bg-white border-4 border-gray-600 rounded shadow-lg"
                            style={{
                              width: `${diagramWidth}px`,
                              height: `${diagramHeight}px`,
                              marginLeft: '40px',
                              marginTop: '20px'
                            }}
                          >
                            {/* Inner frame */}
                            <div className="absolute inset-2 border-2 border-gray-400 bg-blue-50 bg-opacity-30">
                              {/* Window divisions based on type */}
                              {item.description.toLowerCase().includes('door') ? (
                                <>
                                  {/* Vertical division for door */}
                                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-500 transform -translate-x-1/2"></div>
                                  {/* Door handle */}
                                  <div className="absolute left-1/2 top-1/2 w-6 h-1 bg-gray-700 transform -translate-x-1/2 -translate-y-1/2"></div>
                                </>
                              ) : aspectRatio > 2 ? (
                                <>
                                  {/* Multiple vertical divisions for wide windows */}
                                  {[...Array(Math.floor(aspectRatio))].map((_, i) => (
                                    <div 
                                      key={i}
                                      className="absolute top-0 bottom-0 w-0.5 bg-gray-500"
                                      style={{left: `${((i + 1) / (Math.floor(aspectRatio) + 1)) * 100}%`}}
                                    ></div>
                                  ))}
                                </>
                              ) : (
                                <>
                                  {/* Cross division for standard windows */}
                                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-500 transform -translate-x-1/2"></div>
                                  {diagramHeight > diagramWidth / 2 && (
                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-500 transform -translate-y-1/2"></div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {/* Safety glass indicator */}
                            {item.is_safety_glass && (
                              <div className="absolute bottom-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                                SG
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="lg:w-2/3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">{item.systemName || item.description}</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-gray-600">Reference:</span> <span className="font-bold text-gray-900">{ref}</span></p>
                            <p><span className="text-gray-600">Type:</span> <span className="font-medium">{item.description.includes('door') ? 'Door' : item.description.includes('window') ? 'Window' : item.description.includes('Certificate') ? 'Documentation' : 'Panel'}</span></p>
                            {item.size_mm !== 'N/A' && (
                              <>
                                <p><span className="text-gray-600">Size:</span> <span className="font-medium">{item.size_mm}</span></p>
                                <p><span className="text-gray-600">Area:</span> <span className="font-medium">{((widthMm * heightMm) / 1000000).toFixed(2)}m²</span></p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1 text-sm">
                            {item.glassSpec && (
                              <>
                                <p><span className="text-gray-600">Glass Type:</span> <span className="font-medium">{item.glassSpec.type}</span></p>
                                <p><span className="text-gray-600">Thickness:</span> <span className="font-medium">{item.glassSpec.thickness}</span></p>
                              </>
                            )}
                            {item.frameColor && item.powderCoatCode && (
                              <p><span className="text-gray-600">Frame Finish:</span> <span className="font-medium">{item.frameColor} {item.powderCoatCode}</span></p>
                            )}
                            {item.is_safety_glass && (
                              <>
                                <p><span className="text-gray-600">Safety Rating:</span> <span className="font-medium text-green-600">SANS 1263-1 Compliant</span></p>
                                <p><span className="text-gray-600">Compliance:</span> <span className="font-medium text-green-600">SANS 10400-N</span></p>
                              </>
                            )}
                            {!item.is_safety_glass && item.size_mm !== 'N/A' && (
                              <p><span className="text-gray-600">Safety Rating:</span> <span className="font-medium text-gray-600">Standard Grade</span></p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Pricing */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-end">
                        <div className="text-sm text-gray-600">
                          <p>Unit Price: <span className="font-medium text-gray-900">R {item.unitPrice.toFixed(2)}/m²</span></p>
                          <p>Quantity: <span className="font-medium text-gray-900">{item.quantity}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Price:</p>
                          <p className="text-xl font-bold text-gray-900">R {item.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Quote Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">R {quote.subtotal.toFixed(2)}</span>
            </div>
            {quote.discountAmount > 0 && (
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Discount ({quote.discountPercent}%):</span>
                <span className="font-semibold text-green-600">-R {quote.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600">VAT ({quote.vatRate}%):</span>
              <span className="font-semibold text-gray-900">R {quote.vatAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-900">
                <span>TOTAL:</span>
                <span>R {quote.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>


        {/* Footer */}
        <div className="bg-gray-800 rounded-lg p-6 text-white text-center">
          <h3 className="text-lg font-bold mb-2">Thank you for choosing OWD Glass!</h3>
          <p className="text-gray-300 text-sm mb-4">To accept this quote or make changes, please contact us</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a href="mailto:info@owdglass.co.za" className="bg-white text-gray-800 px-4 py-2.5 rounded-md font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Us
            </a>
            <a href="tel:+27123456789" className="bg-gray-700 text-white px-4 py-2.5 rounded-md font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Us
            </a>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-xs">SANS 10400-N Compliant | All prices include VAT | Quote valid for 10 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
