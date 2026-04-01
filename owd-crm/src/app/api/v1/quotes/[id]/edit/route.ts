import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase'
import { GlassQuoteService, GlassItem, Quote } from '@/services/glassQuoteService'
import { PDFService } from '@/services/pdfService'
import * as z from 'zod'

const itemSchema = z.object({
  id: z.string().optional(),
  width_mm: z.number(),
  height_mm: z.number(),
  type: z.enum(['window', 'door']),
  glassType: z.string(),
  frameColor: z.string(),
  thickness: z.number().optional()
})

const editQuoteSchema = z.object({
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_email: z.string().optional().or(z.literal('')),
  installation_address: z.string().optional(),
  project_description: z.string().optional(),
  installation_type: z.string().optional(),
  discount_percent: z.number().default(0),
  items: z.array(itemSchema)
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = editQuoteSchema.parse(body)

    // 1. Fetch existing quote
    const { data: existingQuote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', params.id)
      .single()

    if (quoteError || !existingQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // 2. Update customer (Optional: if the schema links them closely)
    if (existingQuote.customer_id) {
      await supabase
        .from('customers')
        .update({
          name: validatedData.customer_name,
          phone: validatedData.customer_phone,
          email: validatedData.customer_email,
          address: validatedData.installation_address
        })
        .eq('id', existingQuote.customer_id)
    }

    // 3. Recalculate quote using GlassQuoteService
    const quoteService = new GlassQuoteService()
    const customerObj = {
      name: validatedData.customer_name,
      phone: validatedData.customer_phone,
      email: validatedData.customer_email || '',
      address: validatedData.installation_address || ''
    }

    const newCalculatedQuote = await quoteService.calculateQuote(
      customerObj, 
      validatedData.items as GlassItem[]
    )

    // 4. Update the quote record
    const { error: updateQuoteError } = await supabase
      .from('quotes')
      .update({
        customer_name: validatedData.customer_name,
        customer_phone: validatedData.customer_phone,
        customer_email: validatedData.customer_email,
        installation_address: validatedData.installation_address,
        project_description: validatedData.project_description,
        installation_type: validatedData.installation_type,
        subtotal: newCalculatedQuote.subtotal,
        vat_rate: newCalculatedQuote.vatRate,
        vat_amount: newCalculatedQuote.vatAmount,
        discount_percent: validatedData.discount_percent,
        // Assuming simple discount logic for now
        discount_amount: (newCalculatedQuote.subtotal + newCalculatedQuote.vatAmount) * (validatedData.discount_percent / 100),
        total: (newCalculatedQuote.subtotal + newCalculatedQuote.vatAmount) * (1 - (validatedData.discount_percent / 100)),
        requires_safety_glass: newCalculatedQuote.requiresSafetyGlass,
        safety_reason: newCalculatedQuote.safetyReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateQuoteError) {
      console.error('Error updating quote:', updateQuoteError)
      return NextResponse.json({ error: 'Failed to update quote record' }, { status: 500 })
    }

    // 5. Update quote items
    // First delete all existing items
    await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', params.id)

    // Then insert the new items
    const itemsToInsert = validatedData.items.map((item) => {
      // Find the corresponding calculated item (this is a simplified mapping, 
      // in reality the service groups items, so we might just want to store the raw inputs
      // and let the PDF generation re-calculate or store the calculated grouped items)
      return {
        quote_id: params.id,
        width_mm: item.width_mm,
        height_mm: item.height_mm,
        type: item.type,
        glass_type: item.glassType,
        frame_color: item.frameColor,
        thickness_mm: item.thickness,
        // These fields might need adjustment based on the exact DB schema
      }
    })

    const { error: insertItemsError } = await supabase
      .from('quote_items')
      .insert(itemsToInsert)

    if (insertItemsError) {
      console.error('Error inserting items:', insertItemsError)
      return NextResponse.json({ error: 'Failed to update quote items' }, { status: 500 })
    }

    // 6. Regenerate PDF
    try {
      const pdfService = new PDFService()
      
      // We need to pass the full quote object to generateQuotePDF
      // Constructing it from what we have
      const fullQuote = {
        id: params.id,
        quoteNumber: existingQuote.quote_number,
        customer: customerObj,
        items: newCalculatedQuote.items,
        subtotal: newCalculatedQuote.subtotal,
        vatRate: newCalculatedQuote.vatRate,
        vatAmount: newCalculatedQuote.vatAmount,
        discountPercent: validatedData.discount_percent,
        discountAmount: (newCalculatedQuote.subtotal + newCalculatedQuote.vatAmount) * (validatedData.discount_percent / 100),
        total: (newCalculatedQuote.subtotal + newCalculatedQuote.vatAmount) * (1 - (validatedData.discount_percent / 100)),
        requiresSafetyGlass: newCalculatedQuote.requiresSafetyGlass,
        safetyReason: newCalculatedQuote.safetyReason,
        createdDate: existingQuote.created_at,
        expiryDate: existingQuote.expiry_date || newCalculatedQuote.expiryDate
      }

      const buffer = await pdfService.generateQuotePDF(fullQuote as unknown as Quote)
      
      // The savePDF method uses the supabase client internally, we need to make sure 
      // we pass the quoteNumber for the path
      const { pdfUrl, storagePath } = await pdfService.savePDF(buffer, existingQuote.quote_number)
      
      // Update quote with new PDF URL
      await supabase
        .from('quotes')
        .update({ 
          pdf_url: pdfUrl,
          pdf_storage_path: storagePath
        })
        .eq('id', params.id)
        
    } catch (pdfError) {
      console.error('Error regenerating PDF:', pdfError)
      // We don't fail the whole request if PDF generation fails, just clear the URL
      await supabase
        .from('quotes')
        .update({ pdf_url: null })
        .eq('id', params.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error editing quote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
