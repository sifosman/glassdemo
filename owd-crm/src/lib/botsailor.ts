// BotSailor WhatsApp API integration with business-specific credentials

interface BotSailorConfig {
  apiToken: string
  phoneId: string
}

interface WhatsAppMessage {
  to: string
  type: 'text' | 'template' | 'image' | 'document'
  text?: string
  templateName?: string
  templateLanguage?: string
  templateComponents?: unknown[]
  mediaUrl?: string
  caption?: string
}

export class BotSailorClient {
  private apiToken: string
  private phoneId: string
  private baseUrl = 'https://botsailor.com/api/v1'

  constructor(config: BotSailorConfig) {
    this.apiToken = config.apiToken
    this.phoneId = config.phoneId
  }

  async sendMessage(message: WhatsAppMessage): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/whatsapp/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        phone_id: this.phoneId,
        to: message.to,
        type: message.type,
        text: message.text,
        template_name: message.templateName,
        template_language: message.templateLanguage,
        template_components: message.templateComponents,
        media_url: message.mediaUrl,
        caption: message.caption,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`BotSailor API error: ${error}`)
    }

    return await response.json()
  }

  async sendQuoteNotification(params: {
    customerPhone: string
    customerName: string
    quoteTotal: number
    quoteType: string
    pdfUrl?: string
  }): Promise<unknown> {
    const message = `Hello ${params.customerName},\n\nYour ${params.quoteType} quote has been generated.\n\nTotal: R${params.quoteTotal.toFixed(2)}\n\nPlease review the attached PDF for full details.\n\nThank you for choosing us!`

    // If PDF is available, send as document
    if (params.pdfUrl) {
      return this.sendMessage({
        to: params.customerPhone,
        type: 'document',
        mediaUrl: params.pdfUrl,
        caption: message,
      })
    }

    // Otherwise send as text
    return this.sendMessage({
      to: params.customerPhone,
      type: 'text',
      text: message,
    })
  }

  async sendRepairRequestConfirmation(params: {
    customerPhone: string
    customerName: string
    serviceType: string
    urgency: string
    preferredDate?: string
  }): Promise<unknown> {
    const urgencyEmoji = {
      emergency: '🚨',
      high: '⚠️',
      medium: '📋',
      low: '📅',
    }[params.urgency] || '📋'

    const message = `Hello ${params.customerName},\n\n${urgencyEmoji} Your repair request has been received.\n\nService: ${params.serviceType}\nPriority: ${params.urgency.toUpperCase()}${params.preferredDate ? `\nPreferred: ${params.preferredDate}` : ''}\n\nOur team will contact you shortly to confirm.\n\nReference: #${Date.now().toString(36).toUpperCase()}`

    return this.sendMessage({
      to: params.customerPhone,
      type: 'text',
      text: message,
    })
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/whatsapp/phones`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      if (!response.ok) return false

      const data = await response.json()
      // Check if the configured phone ID exists in the response
      const phones = Array.isArray(data) ? data : data.phones || []
      return phones.some((p: {id: string}) => p.id === this.phoneId)
    } catch {
      return false
    }
  }
}

// Factory function to create BotSailor client for a business
export async function createBusinessBotSailorClient(
  supabaseClient: { 
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: { botsailor_api_token: string; botsailor_phone_id: string } | null }>
        }
      }
    }
  },
  businessId: string
): Promise<BotSailorClient | null> {
  const { data: business } = await supabaseClient
    .from('businesses')
    .select('botsailor_api_token, botsailor_phone_id')
    .eq('id', businessId)
    .single()

  if (!business?.botsailor_api_token || !business?.botsailor_phone_id) {
    return null
  }

  return new BotSailorClient({
    apiToken: business.botsailor_api_token,
    phoneId: business.botsailor_phone_id,
  })
}
