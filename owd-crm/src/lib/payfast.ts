// PayFast payment integration with business-specific credentials

import { createHash } from 'crypto'

interface PayFastConfig {
  merchantId: string
  merchantKey: string
  passphrase?: string
  sandbox?: boolean
}

interface PaymentData {
  amount: number
  itemName: string
  itemDescription?: string
  returnUrl?: string
  cancelUrl?: string
  notifyUrl?: string
  email?: string
  name?: string
  customStr1?: string
  customStr2?: string
  customStr3?: string
  customStr4?: string
  customStr5?: string
}

export class PayFastClient {
  private merchantId: string
  private merchantKey: string
  private passphrase?: string
  private sandbox: boolean
  private baseUrl: string

  constructor(config: PayFastConfig) {
    this.merchantId = config.merchantId
    this.merchantKey = config.merchantKey
    this.passphrase = config.passphrase
    this.sandbox = config.sandbox ?? false
    this.baseUrl = this.sandbox
      ? 'https://sandbox.payfast.co.za'
      : 'https://www.payfast.co.za'
  }

  // Generate payment form data
  generatePaymentForm(data: PaymentData): {
    url: string
    fields: Record<string, string>
    signature: string
  } {
    const fields: Record<string, string> = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      amount: data.amount.toFixed(2),
      item_name: data.itemName,
      ...(data.itemDescription && { item_description: data.itemDescription }),
      ...(data.returnUrl && { return_url: data.returnUrl }),
      ...(data.cancelUrl && { cancel_url: data.cancelUrl }),
      ...(data.notifyUrl && { notify_url: data.notifyUrl }),
      ...(data.email && { email_address: data.email }),
      ...(data.name && { name_first: data.name }),
      ...(data.customStr1 && { custom_str1: data.customStr1 }),
      ...(data.customStr2 && { custom_str2: data.customStr2 }),
      ...(data.customStr3 && { custom_str3: data.customStr3 }),
      ...(data.customStr4 && { custom_str4: data.customStr4 }),
      ...(data.customStr5 && { custom_str5: data.customStr5 }),
    }

    // Remove merchant_key from signature generation
    const signatureFields = { ...fields }
    delete signatureFields.merchant_key

    const signature = this.generateSignature(signatureFields)

    return {
      url: `${this.baseUrl}/eng/process`,
      fields: {
        ...fields,
        signature,
      },
      signature,
    }
  }

  // Verify payment notification (ITN)
  verifyNotification(notificationData: Record<string, string>): boolean {
    const receivedSignature = notificationData.signature
    
    // Remove signature from data before generating new signature
    const dataToVerify = { ...notificationData }
    delete dataToVerify.signature
    delete dataToVerify['s'] // sometimes sent as 's' instead of 'signature'

    const calculatedSignature = this.generateSignature(dataToVerify)

    return receivedSignature === calculatedSignature
  }

  // Validate payment data received from PayFast
  async validateItn(paymentData: Record<string, string>): Promise<boolean> {
    // 1. Verify signature
    if (!this.verifyNotification(paymentData)) {
      return false
    }

    // 2. Verify with PayFast server
    try {
      const response = await fetch(`${this.baseUrl}/eng/query/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(paymentData).toString(),
      })

      const result = await response.text()
      return result === 'VALID'
    } catch {
      return false
    }
  }

  private generateSignature(data: Record<string, string>): string {
    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort()
    
    // Create parameter string
    const paramString = sortedKeys
      .filter(key => data[key] !== undefined && data[key] !== null && data[key] !== '')
      .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
      .join('&')

    // Add passphrase if available
    const stringToHash = this.passphrase
      ? `${paramString}&passphrase=${this.passphrase}`
      : paramString

    return createHash('md5').update(stringToHash).digest('hex')
  }
}

// Factory function to create PayFast client for a business
export async function createBusinessPayFastClient(
  supabaseClient: { 
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: { payfast_merchant_id: string; payfast_merchant_key: string; payfast_passphrase?: string } | null }>
        }
      }
    }
  },
  businessId: string,
  sandbox?: boolean
): Promise<PayFastClient | null> {
  const { data: business } = await supabaseClient
    .from('businesses')
    .select('payfast_merchant_id, payfast_merchant_key, payfast_passphrase')
    .eq('id', businessId)
    .single()

  if (!business?.payfast_merchant_id || !business?.payfast_merchant_key) {
    return null
  }

  return new PayFastClient({
    merchantId: business.payfast_merchant_id,
    merchantKey: business.payfast_merchant_key,
    passphrase: business.payfast_passphrase,
    sandbox,
  })
}

// Helper to generate invoice payment URL
export function generateInvoicePaymentUrl(
  payfastClient: PayFastClient,
  params: {
    invoiceId: string
    amount: number
    customerEmail: string
    customerName: string
    returnUrl: string
    cancelUrl: string
    notifyUrl: string
  }
): string {
  const { url, fields } = payfastClient.generatePaymentForm({
    amount: params.amount,
    itemName: `Invoice #${params.invoiceId}`,
    itemDescription: 'Payment for glass products/services',
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
    notifyUrl: params.notifyUrl,
    email: params.customerEmail,
    name: params.customerName,
    customStr1: params.invoiceId,
    customStr2: 'invoice_payment',
  })

  // Build query string
  const searchParams = new URLSearchParams()
  Object.entries(fields).forEach(([key, value]) => {
    searchParams.append(key, value)
  })

  return `${url}?${searchParams.toString()}`
}
