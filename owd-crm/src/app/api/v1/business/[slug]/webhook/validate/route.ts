import { createClient } from '@/utils/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Webhook secret validation helper
async function validateWebhookSecret(supabase: ReturnType<typeof createClient>, slug: string, secret: string | null) {
  if (!secret) {
    return { valid: false, business: null, error: 'Missing webhook secret' }
  }

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, slug, webhook_secret, botsailor_api_token, botsailor_phone_id, payfast_merchant_id, payfast_merchant_key, payfast_passphrase')
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

// POST /api/v1/business/[slug]/webhook/validate
// Validates webhook secret without performing any action
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient()
    const { slug } = params
    
    // Get webhook secret from header
    const webhookSecret = request.headers.get('x-webhook-secret')
    
    const { valid, business, error } = await validateWebhookSecret(supabase, slug, webhookSecret)
    
    if (!valid || !business) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
      message: 'Webhook secret validated successfully',
    })
  } catch (error) {
    console.error('Webhook validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
