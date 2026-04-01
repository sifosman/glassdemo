import { createClient } from '@/utils/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { generateQuotePDF } from '@/lib/pdf-generator'

// Webhook secret validation helper
async function validateWebhookSecret(supabase: ReturnType<typeof createClient>, slug: string, secret: string | null) {
  if (!secret) {
    return { valid: false, business: null, error: 'Missing webhook secret' }
  }

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, slug, webhook_secret, botsailor_api_token, botsailor_phone_id, primary_color, logo_url')
    .eq('slug', slug)
    .single()

  if (error || !business) {
    return { valid: false, business: null, error: 'Business not found' }
  }

  if (business.webhook_secret !== secret) {
    return { valid: false, business: null, error: 'Invalid webhook secret' }
  }

  return { valid: true, business, error: null }
}

interface QuoteItem {
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  total_price: number
}

interface QuoteRequest {
  customer_name: string
  customer_email?: string
  customer_phone?: string
  customer_address?: string
  quote_type: 'shower_door' | 'mirror' | 'glass_repair' | 'custom'
  measurements?: {
    width?: number
    height?: number
    thickness?: number
  }
  items: QuoteItem[]
  subtotal: number
  vat_amount: number
  total: number
  notes?: string
}

// POST /api/v1/business/[slug]/generate-quote
// Generates a quote and creates PDF
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient()
    const { slug } = params

    // Validate webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret')
    const { valid, business, error: authError } = await validateWebhookSecret(supabase, slug, webhookSecret)

    if (!valid || !business) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: QuoteRequest = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customer_name, items' },
        { status: 400 }
      )
    }

    // Create customer if not exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert({
        name: body.customer_name,
        email: body.customer_email,
        phone: body.customer_phone,
        address: body.customer_address,
        business_id: business.id,
      }, { onConflict: 'business_id,email' })
      .select()
      .single()

    if (customerError) {
      console.error('Customer creation error:', customerError)
    }

    // Create quote record
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        business_id: business.id,
        customer_id: customer?.id,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        quote_type: body.quote_type,
        measurements: body.measurements,
        subtotal: body.subtotal,
        vat_amount: body.vat_amount,
        total: body.total,
        notes: body.notes,
        status: 'generated',
      })
      .select()
      .single()

    if (quoteError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Failed to create quote', details: quoteError },
        { status: 500 }
      )
    }

    // Create quote items
    const quoteItems = body.items.map(item => ({
      quote_id: quote.id,
      business_id: business.id,
      product_name: item.product_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(quoteItems)

    if (itemsError) {
      console.error('Quote items creation error:', itemsError)
    }

    // Generate PDF
    const pdfBuffer = await generateQuotePDF({
      quote,
      items: body.items,
      business: {
        name: business.name,
        primaryColor: business.primary_color || '#0d9488',
        logoUrl: business.logo_url,
      },
    })

    // Upload PDF to storage
    const fileName = `quotes/${business.id}/${quote.id}.pdf`
    const { error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('documents')
      .getPublicUrl(fileName)

    // Update quote with PDF URL
    await supabase
      .from('quotes')
      .update({ pdf_url: publicUrl })
      .eq('id', quote.id)

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        customer_name: body.customer_name,
        total: body.total,
        pdf_url: publicUrl,
      },
      message: 'Quote generated successfully',
    })
  } catch (error) {
    console.error('Generate quote error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
