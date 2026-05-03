import axios from 'axios';

export class MetaWhatsAppService {
  private readonly apiToken: string;
  private readonly phoneNumberId: string;
  private readonly graphApiVersion: string = 'v19.0';

  constructor() {
    this.apiToken = process.env.WHATSAPP_META_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  private get baseUrl(): string {
    return `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}`;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  async sendTextMessage(whatsappUserId: string, message: string): Promise<void> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: whatsappUserId,
        type: 'text',
        text: { body: message },
      };

      const response = await axios.post(`${this.baseUrl}/messages`, payload, {
        headers: this.headers,
      });

      if (response.data?.error) {
        throw new Error(`Meta API error: ${JSON.stringify(response.data.error)}`);
      }

      console.log(`Text message sent to ${whatsappUserId}`);
    } catch (error) {
      console.error('Error sending text message via Meta API:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error('Failed to send WhatsApp message via Meta API');
    }
  }

  async sendDocumentMessage(
    whatsappUserId: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<void> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: whatsappUserId,
        type: 'document',
        document: {
          link: documentUrl,
          filename,
          ...(caption ? { caption } : {}),
        },
      };

      const response = await axios.post(`${this.baseUrl}/messages`, payload, {
        headers: this.headers,
      });

      if (response.data?.error) {
        throw new Error(`Meta API error: ${JSON.stringify(response.data.error)}`);
      }

      console.log(`Document sent to ${whatsappUserId}: ${filename}`);
    } catch (error) {
      console.error('Error sending document via Meta API:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to send WhatsApp document: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error('Failed to send WhatsApp document via Meta API');
    }
  }

  async sendQuotePdfToWhatsApp(
    whatsappUserId: string,
    pdfUrl: string,
    quoteUrl: string,
    quoteReference: string
  ): Promise<void> {
    const caption =
      `🔷 *OWD Glass Quote ${quoteReference}*\n\n` +
      `Your glass quotation is ready.\n\n` +
      `🌐 View online: ${quoteUrl}\n\n` +
      `Quote valid for 7 days. 50% deposit to proceed.\n\n` +
      `Questions? Contact us:\n📧 info@owdglass.co.za\n📞 +27 66 307 7449\n\n` +
      `SANS 10400-N Compliant ✅`;

    try {
      await this.sendDocumentMessage(whatsappUserId, pdfUrl, `${quoteReference}.pdf`, caption);
    } catch (error) {
      console.error('PDF send failed, falling back to text message:', error);
      await this.sendTextMessage(whatsappUserId, caption);
    }
  }

  async sendQuoteLinkToWhatsApp(
    whatsappUserId: string,
    quoteUrl: string,
    quoteReference: string
  ): Promise<void> {
    const message =
      `🔷 *OWD Glass Quote ${quoteReference}*\n\n` +
      `Your glass quotation is ready!\n\n` +
      `📋 View your detailed quote here:\n${quoteUrl}\n\n` +
      `Quote valid for 7 days. 50% deposit to proceed.\n\n` +
      `Questions? Contact us:\n📧 info@owdglass.co.za\n📞 +27 66 307 7449\n\n` +
      `SANS 10400-N Compliant ✅`;

    await this.sendTextMessage(whatsappUserId, message);
  }

  async sendInvoiceToWhatsApp(
    whatsappUserId: string,
    pdfUrl: string,
    quoteReference: string,
    depositPaid: number,
    totalAmount: number
  ): Promise<void> {
    const remainingBalance = totalAmount - depositPaid;
    const caption =
      `✅ *Payment Received - OWD Glass*\n\n` +
      `Thank you for your deposit for Quote ${quoteReference}!\n\n` +
      `📋 *Payment Summary:*\n` +
      `• Total Quote: R${totalAmount.toFixed(2)}\n` +
      `• Deposit Paid: R${depositPaid.toFixed(2)}\n` +
      `• Remaining Balance: R${remainingBalance.toFixed(2)}\n\n` +
      `Our scheduling team will contact you shortly to arrange installation.\n\n` +
      `Questions? Contact us:\n📧 info@owdglass.co.za\n📞 +27 66 307 7449\n\n` +
      `OWD Glass - Professional Glazing Solutions`;

    try {
      await this.sendDocumentMessage(whatsappUserId, pdfUrl, `${quoteReference}-invoice.pdf`, caption);
    } catch (error) {
      console.error('Invoice PDF send failed, falling back to text message:', error);
      await this.sendTextMessage(whatsappUserId, caption);
    }
  }

  async sendPaymentConfirmation(
    whatsappUserId: string,
    referenceNumber: string,
    amount: number
  ): Promise<void> {
    const message =
      `✅ *Payment Received - OWD Glass*\n\n` +
      `Thank you for your payment!\n\n` +
      `📋 Reference: ${referenceNumber}\n` +
      `💰 Amount Paid: R${amount.toFixed(2)}\n\n` +
      `One of our expert technicians will contact you within 2 hours to schedule your repair assessment.\n\n` +
      `🔧 What happens next:\n` +
      `• We'll call you to arrange a convenient time\n` +
      `• Our technician will assess the damage on-site\n` +
      `• You'll receive an official quote for the repair work\n\n` +
      `Questions? Contact us:\n📧 info@owdglass.co.za\n📞 +27 66 307 7449\n\n` +
      `OWD Glass - Professional Glazing Solutions`;

    await this.sendTextMessage(whatsappUserId, message);
  }

  async send24HourReminder(
    whatsappUserId: string,
    referenceNumber: string,
    systemType: string,
    callOutFee: number,
    checkoutUrl: string
  ): Promise<void> {
    const message =
      `⏰ *Friendly Reminder - OWD Glass*\n\n` +
      `Hi there! You recently requested a repair quote for your ${systemType}.\n\n` +
      `📋 Quote: ${referenceNumber}\n` +
      `💰 Call-out Fee: R${callOutFee.toFixed(2)}\n\n` +
      `Your quote is still pending. Secure your booking:\n👉 ${checkoutUrl}\n\n` +
      `Questions? Reply to this message or call us:\n📞 +27 66 307 7449\n\n` +
      `OWD Glass - Professional Glazing Solutions`;

    await this.sendTextMessage(whatsappUserId, message);
  }

  async send72HourReminder(
    whatsappUserId: string,
    referenceNumber: string,
    checkoutUrl: string
  ): Promise<void> {
    const message =
      `⏰ *Second Reminder - OWD Glass*\n\n` +
      `We noticed you haven't completed your booking yet for ${referenceNumber}.\n\n` +
      `⚠️ Our schedule fills up quickly! Pay now to secure your preferred date:\n👉 ${checkoutUrl}\n\n` +
      `Need help? Call us or reply here:\n📞 +27 66 307 7449\n📧 info@owdglass.co.za\n\n` +
      `OWD Glass - Professional Glazing Solutions`;

    await this.sendTextMessage(whatsappUserId, message);
  }

  async send7DayReminder(
    whatsappUserId: string,
    referenceNumber: string,
    callOutFee: number,
    checkoutUrl: string
  ): Promise<void> {
    const message =
      `⏰ *Final Reminder - OWD Glass*\n\n` +
      `Your repair quote ${referenceNumber} will expire soon.\n\n` +
      `💰 Final amount: R${callOutFee.toFixed(2)}\n👉 ${checkoutUrl}\n\n` +
      `This is our last reminder. If you're no longer interested, no action is needed.\n\n` +
      `Still need help? We're here:\n📞 +27 66 307 7449\n\n` +
      `OWD Glass - Professional Glazing Solutions`;

    await this.sendTextMessage(whatsappUserId, message);
  }
}
