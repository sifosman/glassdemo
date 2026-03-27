import axios from 'axios';

export class BotSailorService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly phoneNumberId: string;

  constructor() {
    // These should be stored in environment variables
    this.baseUrl = process.env.BOTSAILOR_API_BASE_URL || 'https://botsailor.com';
    this.apiKey = process.env.BOTSAILOR_API_KEY || '';
    this.phoneNumberId = process.env.BOTSAILOR_PHONE_NUMBER_ID || '';
  }

  async sendPDFToWhatsApp(whatsappUserId: string, pdfUrl: string, quoteReference: string): Promise<void> {
    try {
      const message = `🔷 *OWD Glass Quote ${quoteReference}*\n\nYour glass quotation is ready!\n\n📋 View your detailed quote here:\n${pdfUrl}\n\nQuote valid for 10 days.\n\nFor any questions, please contact us:\n📧 info@owdglass.co.za\n📞 +27 12 345 6789\n\nSANS 10400-N Compliant ✅`;

      await this.sendTextMessage(whatsappUserId, message);

      console.log(`PDF quote ${quoteReference} sent successfully to ${whatsappUserId}`);
      
    } catch (error) {
      console.error('Error sending PDF via BotSailor:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
      }
      
      throw new Error('Failed to send WhatsApp message via BotSailor');
    }
  }

  async sendQuoteLinkToWhatsApp(whatsappUserId: string, quoteUrl: string, quoteReference: string): Promise<void> {
    try {
      const message = `🔷 *OWD Glass Quote ${quoteReference}*\n\nYour glass quotation is ready!\n\n📋 View your detailed quote here:\n${quoteUrl}\n\nQuote valid for 10 days.\n\nFor any questions, please contact us:\n📧 info@owdglass.co.za\n📞 +27 12 345 6789\n\nSANS 10400-N Compliant ✅`;

      await this.sendTextMessage(whatsappUserId, message);

      console.log(`Quote link ${quoteReference} sent successfully to ${whatsappUserId}`);
      
    } catch (error) {
      console.error('Error sending quote link via BotSailor:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
      }
      
      throw new Error('Failed to send WhatsApp message via BotSailor');
    }
  }

  async sendInvoiceToWhatsApp(whatsappUserId: string, pdfUrl: string, quoteReference: string): Promise<void> {
    try {
      const message = `✅ *Payment Received - OWD Glass*\n\nThank you for your deposit payment for Quote ${quoteReference}!\n\n📋 Your official invoice/receipt is attached.\n\nOur scheduling team will contact you shortly to arrange the installation.\n\nQuestions? Contact us:\n📧 info@owdglass.co.za\n📞 +27 12 345 6789\n\nOWD Glass - Professional Glazing Solutions`;

      const payload = {
        apiToken: this.apiKey,
        phone_number_id: this.phoneNumberId,
        message: message,
        phone_number: whatsappUserId,
        type: "file",
        file: {
          url: pdfUrl,
          filename: `${quoteReference}-invoice.pdf`
        }
      };

      const endpoint = `${this.baseUrl}/api/v1/whatsapp/send`.replace(/\/+/g, '/');

      const response = await axios.post(endpoint, payload);

      if (response.data.status !== "1") {
        throw new Error(`BotSailor API returned status: ${response.data.message}`);
      }

      console.log(`Invoice PDF for quote ${quoteReference} sent successfully to ${whatsappUserId}`);
      
    } catch (error) {
      console.error('Error sending invoice PDF via BotSailor:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
      }
      
      throw new Error('Failed to send WhatsApp message via BotSailor');
    }
  }

  async sendPaymentConfirmation(whatsappUserId: string, referenceNumber: string, amount: number): Promise<void> {
    try {
      const message = `✅ *Payment Received - OWD Glass*\n\nThank you for your payment!\n\n📋 Reference: ${referenceNumber}\n💰 Amount Paid: R${amount.toFixed(2)}\n\nOne of our expert technicians will contact you within 2 hours to schedule your repair assessment.\n\n🔧 What happens next:\n• We'll call you to arrange a convenient time\n• Our technician will assess the damage on-site\n• You'll receive an official quote for the repair work\n\nQuestions? Contact us:\n📧 info@owdglass.co.za\n📞 +27 12 345 6789\n\nOWD Glass - Professional Glazing Solutions`;

      await this.sendTextMessage(whatsappUserId, message);

      console.log(`Payment confirmation sent successfully to ${whatsappUserId} for ${referenceNumber}`);
      
    } catch (error) {
      console.error('Error sending payment confirmation via BotSailor:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
      }
      
      throw new Error('Failed to send WhatsApp message via BotSailor');
    }
  }

  async sendTextMessage(whatsappUserId: string, message: string): Promise<void> {
    try {
      const payload = {
        apiToken: this.apiKey,
        phone_number_id: this.phoneNumberId,
        message: message,
        phone_number: whatsappUserId
      };

      const endpoint = `${this.baseUrl}/api/v1/whatsapp/send`.replace(/\/+/g, '/');

      const response = await axios.post(endpoint, payload);

      if (response.data.status !== "1") {
        throw new Error(`BotSailor API returned status: ${response.data.message}`);
      }

      console.log(`Text message sent successfully to ${whatsappUserId}`);
      
    } catch (error) {
      console.error('Error sending text message via BotSailor:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
      }
      
      throw new Error('Failed to send WhatsApp message via BotSailor');
    }
  }
}
