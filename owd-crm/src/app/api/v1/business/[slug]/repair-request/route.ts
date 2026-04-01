import { createClient } from '@/utils/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Webhook secret validation helper
async function validateWebhookSecret(supabase: ReturnType<typeof createClient>, slug: string, secret: string | null) {
  if (!secret) {
    return { valid: false, business: null, error: 'Missing webhook secret' }
  }

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, slug, webhook_secret, botsailor_api_token, botsailor_phone_id')
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

interface RepairRequest {
  customer_name: string
  customer_phone: string
  customer_email?: string
  service_type: 'emergency_repair' | 'scheduled_repair' | 'installation' | 'measurement'
  address: string
  description?: string
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  preferred_date?: string
  images?: string[]
}

// POST /api/v1/business/[slug]/repair-request
// Creates a repair request and notifies via BotSailor
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
    const body: RepairRequest = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.customer_phone || !body.service_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customer_name, customer_phone, service_type' },
        { status: 400 }
      )
    }

    // Create customer if not exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert({
        name: body.customer_name,
        phone: body.customer_phone,
        email: body.customer_email,
        address: body.address,
        business_id: business.id,
      }, { onConflict: 'business_id,phone' })
      .select()
      .single()

    if (customerError) {
      console.error('Customer creation error:', customerError)
    }

    // Create repair request
    const { data: repairRequest, error: repairError } = await supabase
      .from('repair_requests')
      .insert({
        business_id: business.id,
        customer_id: customer?.id,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        service_type: body.service_type,
        address: body.address,
        description: body.description,
        urgency: body.urgency,
        preferred_date: body.preferred_date,
        images: body.images,
        status: 'pending',
      })
      .select()
      .single()

    if (repairError || !repairRequest) {
      return NextResponse.json(
        { success: false, error: 'Failed to create repair request', details: repairError },
        { status: 500 }
      )
    }

    // Send WhatsApp notification via BotSailor if configured
    if (business.botsailor_api_token && business.botsailor_phone_id) {
      try {
        await sendWhatsAppNotification({
          apiToken: business.botsailor_api_token,
          phoneId: business.botsailor_phone_id,
          phoneNumber: body.customer_phone,
          message: formatRepairRequestMessage(body),
        })
      } catch (notifyError) {
        console.error('WhatsApp notification error:', notifyError)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      repair_request: {
        id: repairRequest.id,
        customer_name: body.customer_name,
        service_type: body.service_type,
        status: 'pending',
      },
      message: 'Repair request created successfully',
    })
  } catch (error) {
    console.error('Repair request error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper to send WhatsApp via BotSailor
async function sendWhatsAppNotification({
  apiToken,
  phoneId,
  phoneNumber,
  message,
}: {
  apiToken: string
  phoneId: string
  phoneNumber: string
  message: string
}) {
  const response = await fetch('https://botsailor.com/api/v1/whatsapp/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      phone_id: phoneId,
      to: phoneNumber,
      type: 'text',
      text: message,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`BotSailor API error: ${error}`)
  }

  return await response.json()
}

function formatRepairRequestMessage(request: RepairRequest): string {
  return `Hello ${request.customer_name},

Thank you for your repair request. We have received your inquiry for ${request.service_type.replace('_', ' ')}.

Request Details:
- Service Type: ${request.service_type.replace('_', ' ').toUpperCase()}
- Urgency: ${request.urgency.toUpperCase()}
${request.preferred_date ? `- Preferred Date: ${request.preferred_date}` : ''}

Our team will contact you shortly to confirm your appointment.

Best regards,
OWD Glass Team`
}
