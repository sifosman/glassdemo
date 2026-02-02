import { v4 as uuidv4 } from 'uuid';
import { ProductPricingService } from './productPricingService';

export interface Customer {
  name: string;
  email: string;
  address: string;
  phone?: string;
}

export interface GlassItem {
  width_mm: number;
  height_mm: number;
  type: string; // 'window' or 'door'
  glassType: string;
  frameColor: string;
  thickness?: number;
}

export interface CalculatedItem {
  description: string;
  quantity: number;
  size_mm: string;
  area_m2: number;
  unitPrice: number;
  totalPrice: number;
  product_code: string;
  is_safety_glass: boolean;
  systemName?: string;
  glassSpec?: { type: string; thickness: string };
  powderCoatCode?: string;
  frameColor?: string;
}

export interface Quote {
  quoteNumber: string;
  customer: Customer;
  items: CalculatedItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  requiresSafetyGlass: boolean;
  safetyReason?: string;
  createdDate: string;
  expiryDate: string;
}

export class GlassQuoteService {
  private pricingService: ProductPricingService;

  constructor() {
    this.pricingService = new ProductPricingService();
  }

  async calculateQuote(customer: Customer, items: GlassItem[]): Promise<Quote> {
    // Initialize the pricing service
    await this.pricingService.initialize();
    
    const quoteNumber = this.generateQuoteNumber();
    const calculatedItems: CalculatedItem[] = [];
    let subtotal = 0;
    let requiresSafetyGlass = false;
    const safetyReasons: string[] = [];

    // Calculate each item
    for (const item of items) {
      const pricing = this.pricingService.calculateItemPricing(
        item.width_mm,
        item.height_mm,
        item.type,
        item.glassType,
        item.frameColor,
        item.thickness
      );

      calculatedItems.push({
        description: pricing.description,
        quantity: 1,
        size_mm: `${item.width_mm} x ${item.height_mm}`,
        area_m2: pricing.area_m2,
        unitPrice: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        product_code: pricing.product.product_code,
        is_safety_glass: pricing.isSafetyGlass,
        systemName: pricing.systemName,
        glassSpec: pricing.glassSpec,
        powderCoatCode: pricing.powderCoatCode,
        frameColor: pricing.frameColor
      });

      subtotal += pricing.totalPrice;

      if (pricing.isSafetyGlass) {
        requiresSafetyGlass = true;
        safetyReasons.push(`${item.type} requires safety glass`);
      }
    }

    // Group identical items
    const groupedItems = this.groupIdenticalItems(calculatedItems);

    // Recalculate subtotal after grouping
    subtotal = groupedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Add glazing certificate as line item if safety glass is required
    if (requiresSafetyGlass) {
      groupedItems.push({
        description: 'Glazing Certificate',
        quantity: 1,
        size_mm: 'N/A',
        area_m2: 0,
        unitPrice: 368.49,
        totalPrice: 368.49,
        product_code: 'CERT-GLAZE',
        is_safety_glass: false,
        systemName: 'Documentation & Certification',
        frameColor: undefined
      });
      subtotal += 368.49;
    }

    // Get company settings
    const vatRate = this.pricingService.getVatRate();
    const validityDays = this.pricingService.getQuoteValidityDays();

    // Calculate VAT
    const vatAmount = subtotal * (vatRate / 100);

    // Calculate total (no discounts for now)
    const discountPercent = 0;
    const discountAmount = 0;
    const total = subtotal + vatAmount;

    // Calculate expiry date
    const createdDate = new Date();
    const expiryDate = new Date(createdDate);
    expiryDate.setDate(expiryDate.getDate() + validityDays);

    return {
      quoteNumber,
      customer,
      items: groupedItems,
      subtotal,
      vatRate,
      vatAmount,
      discountPercent,
      discountAmount,
      total,
      requiresSafetyGlass,
      safetyReason: safetyReasons.join(', ') || undefined,
      createdDate: createdDate.toISOString(),
      expiryDate: expiryDate.toISOString()
    };
  }

  // Group identical items together
  private groupIdenticalItems(items: CalculatedItem[]): CalculatedItem[] {
    const grouped = new Map<string, CalculatedItem>();

    for (const item of items) {
      // Create a unique key based on item properties
      const key = `${item.systemName}-${item.size_mm}-${item.glassSpec?.type}-${item.glassSpec?.thickness}-${item.frameColor}-${item.powderCoatCode}`;
      
      if (grouped.has(key)) {
        // Item already exists, increment quantity and total
        const existing = grouped.get(key)!;
        existing.quantity += 1;
        existing.totalPrice += item.totalPrice;
      } else {
        // New item, add to map
        grouped.set(key, { ...item });
      }
    }

    return Array.from(grouped.values());
  }

  private generateQuoteNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `Q${year}${month}${day}-${random}`;
  }

  // Get available product categories
  async getProductCategories(): Promise<string[]> {
    await this.pricingService.initialize();
    const products = this.pricingService.getProductsByCategory('');
    const categories = [...new Set(products.map(p => p.category))];
    return categories;
  }

  // Get products by category
  async getProductsByCategory(category: string) {
    await this.pricingService.initialize();
    return this.pricingService.getProductsByCategory(category);
  }

  // Get product by code
  async getProductByCode(productCode: string) {
    await this.pricingService.initialize();
    return this.pricingService.getProductByCode(productCode);
  }
}
