import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface QuoteData {
  quote: {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone?: string
    quote_type: string
    total: number
    vat_amount: number
    subtotal: number
    notes?: string
    created_at?: string
  }
  items: Array<{
    product_name: string
    description?: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  business: {
    name: string
    primaryColor: string
    logoUrl?: string
  }
}

export async function generateQuotePDF(data: QuoteData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  let y = height - 50
  
  // Header
  page.drawText(data.business.name, {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0.051, 0.58, 0.533), // Teal color
  })
  
  y -= 30
  page.drawText('QUOTATION', {
    x: 50,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  })
  
  y -= 40
  
  // Quote Info
  page.drawText(`Quote #: ${data.quote.id.slice(0, 8)}`, {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })
  
  y -= 15
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })
  
  y -= 40
  
  // Customer Info
  page.drawText('BILL TO:', {
    x: 50,
    y,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  })
  
  y -= 18
  page.drawText(data.quote.customer_name, {
    x: 50,
    y,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  })
  
  if (data.quote.customer_email) {
    y -= 14
    page.drawText(data.quote.customer_email, {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
  }
  
  if (data.quote.customer_phone) {
    y -= 14
    page.drawText(data.quote.customer_phone, {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
  }
  
  y -= 40
  
  // Items Table Header
  page.drawRectangle({
    x: 50,
    y: y - 20,
    width: width - 100,
    height: 25,
    color: rgb(0.95, 0.95, 0.95),
  })
  
  page.drawText('Item', { x: 55, y: y - 12, size: 10, font: boldFont })
  page.drawText('Qty', { x: 280, y: y - 12, size: 10, font: boldFont })
  page.drawText('Price', { x: 340, y: y - 12, size: 10, font: boldFont })
  page.drawText('Total', { x: 450, y: y - 12, size: 10, font: boldFont })
  
  y -= 35
  
  // Items
  for (const item of data.items) {
    page.drawText(item.product_name.substring(0, 35), {
      x: 55,
      y,
      size: 9,
      font,
    })
    
    page.drawText(item.quantity.toString(), {
      x: 285,
      y,
      size: 9,
      font,
    })
    
    page.drawText(`R${item.unit_price.toFixed(2)}`, {
      x: 340,
      y,
      size: 9,
      font,
    })
    
    page.drawText(`R${item.total_price.toFixed(2)}`, {
      x: 450,
      y,
      size: 9,
      font,
    })
    
    y -= 18
  }
  
  y -= 20
  
  // Totals
  const lineX = 320
  page.drawLine({
    start: { x: lineX, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  })
  
  y -= 20
  page.drawText('Subtotal:', { x: lineX, y, size: 10, font })
  page.drawText(`R${data.quote.subtotal.toFixed(2)}`, { x: 450, y, size: 10, font })
  
  y -= 16
  page.drawText('VAT (15%):', { x: lineX, y, size: 10, font })
  page.drawText(`R${data.quote.vat_amount.toFixed(2)}`, { x: 450, y, size: 10, font })
  
  y -= 20
  page.drawLine({
    start: { x: lineX, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  })
  
  y -= 22
  page.drawText('TOTAL:', { x: lineX, y, size: 12, font: boldFont })
  page.drawText(`R${data.quote.total.toFixed(2)}`, { x: 450, y, size: 12, font: boldFont })
  
  // Footer
  y = 80
  page.drawText('Thank you for your business!', {
    x: width / 2 - 80,
    y,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })
  
  y -= 15
  page.drawText('This quote is valid for 30 days from the date of issue.', {
    x: width / 2 - 130,
    y,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })
  
  return await pdfDoc.save()
}
