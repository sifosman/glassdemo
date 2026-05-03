import { supabase, Database } from '@/lib/supabase';
import { Quote } from './glassQuoteService';

type Customer = Database['public']['Tables']['customers']['Row'];
type QuoteRecord = Database['public']['Tables']['quotes']['Row'];
type QuoteItem = Database['public']['Tables']['quote_items']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

type QuoteWithPaymentDetails = Quote & {
  status: string;
  depositRequired: number;
  depositAmount: number;
  depositPaid: number;
  depositPaidAt?: string;
  acceptedAt?: string;
  balancePaid?: number;
  balancePaidAt?: string;
  fullyPaidAt?: string;
  pdfUrl?: string;
  invoicePdfUrl?: string;
  statementPdfUrl?: string;
};

type CreateInvoiceInput = {
  quote_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  billing_address?: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  pdf_url: string;
  pdf_storage_path?: string;
};

export class DatabaseService {
  // Save a complete quote with customer and items
  static async saveQuote(quote: Quote): Promise<string> {
    try {
      // First, create or find the customer
      let customer: Customer;
      
      // Check if customer already exists by phone (primary key in your schema)
      const { data: existingCustomer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', quote.customer.phone || quote.customer.email)
        .single();

      if (customerError && customerError.code !== 'PGRST116') {
        throw customerError;
      }

      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        // Create new customer
        const { data: newCustomer, error: createCustomerError } = await supabase
          .from('customers')
          .insert({
            phone: quote.customer.phone || quote.customer.email,
            name: quote.customer.name,
            email: quote.customer.email,
            address: quote.customer.address,
            total_quotes: 1
          })
          .select()
          .single();

        if (createCustomerError) throw createCustomerError;
        customer = newCustomer;
      }

      // Create the quote
      const depositRequired = 50;
      const depositAmount = Number((quote.total * (depositRequired / 100)).toFixed(2));

      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          quote_number: quote.quoteNumber,
          customer_id: customer.id,
          customer_name: quote.customer.name,
          customer_phone: quote.customer.phone || quote.customer.email,
          customer_email: quote.customer.email,
          installation_address: quote.customer.address,
          requires_safety_glass: quote.requiresSafetyGlass,
          safety_reason: quote.safetyReason,
          subtotal: quote.subtotal,
          vat_rate: quote.vatRate,
          vat_amount: quote.vatAmount,
          discount_percent: quote.discountPercent,
          discount_amount: quote.discountAmount,
          total: quote.total,
          deposit_required: depositRequired,
          deposit_amount: depositAmount,
          deposit_paid: 0,
          status: 'sent',
          source: 'whatsapp',
          expiry_date: quote.expiryDate
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const quoteItems = quote.items.map(item => {
        // Use glass size (actual manufactured size) for database storage
        const hasDimensions = item.glassSize_mm && item.glassSize_mm.includes(' x ');
        const [widthValue, heightValue] = hasDimensions
          ? item.glassSize_mm.split(' x ')
          : ['0', '0'];

        return {
          quote_id: newQuote.id,
          product_id: null, // We'll need to find the product ID
          description: item.description,
          quantity: item.quantity,
          width_mm: parseInt(widthValue, 10),
          height_mm: parseInt(heightValue, 10),
          unit_price: item.unitPrice,
          line_total: item.totalPrice
        };
      });

      // Find product IDs for each item
      for (let i = 0; i < quoteItems.length; i++) {
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('product_code', quote.items[i].product_code)
          .single();
        
        if (product) {
          quoteItems[i].product_id = product.id;
        }
      }

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      return quote.quoteNumber;
    } catch (error) {
      console.error('Error saving quote to database:', error);
      throw error;
    }
  }

  // Get a complete quote by reference number
  static async getQuote(quoteNumber: string): Promise<QuoteWithPaymentDetails | null> {
    try {
      // Get the quote with customer
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (
            name,
            email,
            address,
            phone
          )
        `)
        .eq('quote_number', quoteNumber)
        .single();

      if (quoteError) {
        if (quoteError.code === 'PGRST116') {
          return null; // Quote not found
        }
        throw quoteError;
      }

      // Get the quote items with products
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          products (
            product_code,
            name,
            category,
            glass_type,
            thickness_mm,
            is_safety_glass
          )
        `)
        .eq('quote_id', quoteData.id);

      if (itemsError) throw itemsError;

      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('pdf_url')
        .eq('quote_id', quoteData.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (invoicesError) throw invoicesError;
      const invoicePdfUrl = invoicesData?.[0]?.pdf_url || undefined;

      // Transform the data to match our Quote interface
      const transformedQuote: QuoteWithPaymentDetails = {
        quoteNumber: quoteData.quote_number,
        customer: {
          name: quoteData.customers.name,
          email: quoteData.customers.email,
          address: quoteData.customers.address,
          phone: quoteData.customers.phone
        },
        items: itemsData.map(item => {
          const isSafetyGlass = item.products?.is_safety_glass || false;
          const glassType = item.products?.glass_type || 'Clear';
          
          // Determine system name based on description or product
          let systemName = 'Crealco Swift 38 Panel';
          if (item.description) {
            if (item.description.toLowerCase().includes('door')) {
              systemName = 'Crealco Clip 44 Shop Front';
            } else if (item.description.toLowerCase().includes('window')) {
              systemName = 'Crealco Swift 28 Window';
            } else if (item.description.toLowerCase().includes('certificate')) {
              systemName = 'Documentation & Certification';
            }
          }
          
          // Determine glass spec
          let glassSpec = { type: 'Clear Float', thickness: '4mm' };
          if (isSafetyGlass) {
            glassSpec = { type: 'PVB Laminated Safety Glass', thickness: '6.38mm' };
          } else if (glassType.toLowerCase().includes('low-e')) {
            glassSpec = { type: 'Low-E Energy Efficient', thickness: '6mm' };
          }
          
          return {
            description: item.description || (item.products ? 
              `${item.products.name} - ${item.products.category} (${item.products.glass_type})` : 
              systemName),
            quantity: item.quantity,
            openingSize_mm: `${item.width_mm} x ${item.height_mm}`,
            openingArea_m2: item.area_sqm,
            glassSize_mm: `${item.width_mm} x ${item.height_mm}`,
            area_m2: item.area_sqm,
            unitPrice: item.unit_price,
            totalPrice: item.line_total,
            product_code: item.products?.product_code || 'CUSTOM',
            is_safety_glass: isSafetyGlass,
            systemName: systemName,
            glassSpec: glassSpec,
            powderCoatCode: 'PIS71149',
            frameColor: 'Charcoal Matt'
          };
        }),
        subtotal: quoteData.subtotal,
        vatRate: quoteData.vat_rate,
        vatAmount: quoteData.vat_amount,
        discountPercent: quoteData.discount_percent,
        discountAmount: quoteData.discount_amount,
        total: quoteData.total,
        requiresSafetyGlass: quoteData.requires_safety_glass,
        safetyReason: quoteData.safety_reason || undefined,
        createdDate: quoteData.created_at,
        expiryDate: quoteData.expiry_date || '',
        // Estimate fields (NEW)
        isEstimate: true,
        contingencyTotal: 0,
        hardwareTotal: 0,
        estimateDisclaimer: 'This is an ESTIMATE based on provided measurements. Final price confirmed after free site inspection. Full refund if final price varies >20%.',
        pdfUrl: quoteData.pdf_url || undefined,
        invoicePdfUrl,
        statementPdfUrl: quoteData.statement_pdf_url || undefined,
        status: quoteData.status,
        depositRequired: quoteData.deposit_required,
        depositAmount: quoteData.deposit_amount,
        depositPaid: quoteData.deposit_paid,
        depositPaidAt: quoteData.deposit_paid_at || undefined,
        acceptedAt: quoteData.accepted_at || undefined,
        balancePaid: quoteData.balance_paid,
        balancePaidAt: quoteData.balance_paid_at || undefined,
        fullyPaidAt: quoteData.fully_paid_at || undefined
      };

      return transformedQuote;
    } catch (error) {
      console.error('Error fetching quote from database:', error);
      throw error;
    }
  }

  // Update quote status
  static async updateQuoteStatus(quoteNumber: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status,
          [status === 'accepted' ? 'accepted_at' : 'updated_at']: new Date().toISOString()
        })
        .eq('quote_number', quoteNumber);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw error;
    }
  }

  // Update quote PDF URL
  static async updateQuotePdfUrl(quoteNumber: string, pdfUrl: string, storagePath?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ pdf_url: pdfUrl, ...(storagePath ? { pdf_storage_path: storagePath } : {}) })
        .eq('quote_number', quoteNumber);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating quote PDF URL:', error);
      throw error;
    }
  }

  // Create an invoice
  static async createInvoice(invoiceData: CreateInvoiceInput): Promise<void> {
    try {
      // First find the quote to get the IDs
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('id, customer_id')
        .eq('quote_number', invoiceData.quote_number)
        .single();

      if (quoteError) throw quoteError;

      // Generate a unique invoice number
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoiceNumber = `INV${year}${month}-${random}`;

      const { error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          quote_id: quote.id,
          quote_number: invoiceData.quote_number,
          customer_id: quote.customer_id,
          customer_name: invoiceData.customer_name,
          customer_phone: invoiceData.customer_phone,
          customer_email: invoiceData.customer_email,
          billing_address: invoiceData.billing_address,
          invoice_type: 'deposit',
          subtotal: invoiceData.subtotal,
          vat_amount: invoiceData.vat_amount,
          total: invoiceData.total,
          amount_paid: invoiceData.amount_paid,
          balance_due: invoiceData.balance_due,
          status: 'paid',
          pdf_url: invoiceData.pdf_url,
          ...(invoiceData.pdf_storage_path ? { pdf_storage_path: invoiceData.pdf_storage_path } : {}),
          paid_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Get all quotes for a customer
  static async getCustomerQuotes(customerEmail: string): Promise<Quote[]> {
    try {
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (
            name,
            email,
            address,
            phone
          )
        `)
        .eq('customers.email', customerEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each quote, get the items and transform
      const fullQuotes: Quote[] = [];
      
      for (const quoteData of quotes) {
        const { data: itemsData } = await supabase
          .from('quote_items')
          .select(`
            *,
            products (
              product_code,
              name,
              category,
              glass_type,
              thickness_mm,
              is_safety_glass
            )
          `)
          .eq('quote_id', quoteData.id);

        const transformedQuote: Quote = {
          quoteNumber: quoteData.quote_number,
          customer: {
            name: quoteData.customers.name,
            email: quoteData.customers.email,
            address: quoteData.customers.address,
            phone: quoteData.customers.phone
          },
          items: (itemsData || []).map(item => {
            const isSafetyGlass = item.products?.is_safety_glass || false;
            const glassType = item.products?.glass_type || 'Clear';
            
            let systemName = 'Crealco Swift 38 Panel';
            if (item.description) {
              if (item.description.toLowerCase().includes('door')) {
                systemName = 'Crealco Clip 44 Shop Front';
              } else if (item.description.toLowerCase().includes('window')) {
                systemName = 'Crealco Swift 28 Window';
              } else if (item.description.toLowerCase().includes('certificate')) {
                systemName = 'Documentation & Certification';
              }
            }
            
            let glassSpec = { type: 'Clear Float', thickness: '4mm' };
            if (isSafetyGlass) {
              glassSpec = { type: 'PVB Laminated Safety Glass', thickness: '6.38mm' };
            } else if (glassType.toLowerCase().includes('low-e')) {
              glassSpec = { type: 'Low-E Energy Efficient', thickness: '6mm' };
            }
            
            return {
              description: item.description || (item.products ? 
                `${item.products.name} - ${item.products.category} (${item.products.glass_type})` : 
                systemName),
              quantity: item.quantity,
              openingSize_mm: `${item.width_mm} x ${item.height_mm}`,
              openingArea_m2: item.area_sqm,
              glassSize_mm: `${item.width_mm} x ${item.height_mm}`,
              area_m2: item.area_sqm,
              unitPrice: item.unit_price,
              totalPrice: item.line_total,
              product_code: item.products?.product_code || 'CUSTOM',
              is_safety_glass: isSafetyGlass,
              systemName: systemName,
              glassSpec: glassSpec,
              powderCoatCode: 'PIS71149',
              frameColor: 'Charcoal Matt'
            };
          }),
          subtotal: quoteData.subtotal,
          vatRate: quoteData.vat_rate,
          vatAmount: quoteData.vat_amount,
          discountPercent: quoteData.discount_percent,
          discountAmount: quoteData.discount_amount,
          total: quoteData.total,
          requiresSafetyGlass: quoteData.requires_safety_glass,
          safetyReason: quoteData.safety_reason || undefined,
          createdDate: quoteData.created_at,
          expiryDate: quoteData.expiry_date || '',
          // Estimate fields (NEW)
          isEstimate: true,
          contingencyTotal: 0,
          hardwareTotal: 0,
          estimateDisclaimer: 'This is an ESTIMATE based on provided measurements. Final price confirmed after free site inspection. Full refund if final price varies >20%.'
        };

        fullQuotes.push(transformedQuote);
      }

      return fullQuotes;
    } catch (error) {
      console.error('Error fetching customer quotes:', error);
      throw error;
    }
  }

  // Get all available products
  static async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('in_stock', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get products by category
  static async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .eq('in_stock', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }
}
