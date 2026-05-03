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
  opening_mechanism?: string; // 'side_hung', 'top_hung', 'sliding', 'fixed', 'unknown'
  quantity?: number; // Number of identical items (defaults to 1)
}

export interface CalculatedItem {
  description: string;
  quantity: number;
  // Opening size (what contractor provides)
  openingSize_mm: string;
  openingArea_m2: number;
  // Glass size (actual glass after deductions)
  glassSize_mm: string;
  area_m2: number;
  unitPrice: number;
  totalPrice: number;
  product_code: string;
  is_safety_glass: boolean;
  systemName?: string;
  glassSpec?: { type: string; thickness: string };
  powderCoatCode?: string;
  frameColor?: string;
  // Deduction details for transparency
  frameTolerance_mm?: number;
  profileDeduction_mm?: number;
  totalDeduction_mm?: number;
  // SANS 10400-N compliance fields
  wastageFactor?: number;
  basePrice?: number;
  sansUpgraded?: boolean;
  sansUpgradeReason?: string;
  // Hardware and BOM fields (NEW)
  opening_mechanism?: string;
  hardware_cost?: number;
  hardware_kit_name?: string;
  contingency_percent?: number;
  contingency_amount?: number;
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
  // Estimate fields (NEW)
  isEstimate: boolean;
  contingencyTotal: number;
  hardwareTotal: number;
  estimateDisclaimer: string;
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
    let hardwareTotal = 0;
    let contingencyTotal = 0;
    
    for (const item of items) {
      const pricing = this.pricingService.calculateItemPricing(
        item.width_mm,
        item.height_mm,
        item.type,
        item.glassType,
        item.frameColor,
        item.thickness
      );

      // Calculate hardware cost based on opening mechanism
      const openingMechanism = item.opening_mechanism || 'unknown';
      const hardwareCost = this.calculateHardwareCost(
        openingMechanism,
        item.width_mm,
        item.height_mm
      );

      // Calculate contingency based on opening mechanism certainty
      const contingencyPercent = this.getContingencyPercent(openingMechanism);
      const contingencyAmount = (pricing.totalPrice + hardwareCost) * (contingencyPercent / 100);

      const itemQuantity = item.quantity || 1;
      const unitPriceWithExtras = pricing.unitPrice + hardwareCost + contingencyAmount;
      const totalPriceWithExtras = unitPriceWithExtras * itemQuantity;

      calculatedItems.push({
        description: pricing.description,
        quantity: itemQuantity,
        // Opening size (what contractor provides from sketch)
        openingSize_mm: `${pricing.openingWidth_mm} x ${pricing.openingHeight_mm}`,
        openingArea_m2: pricing.openingArea_m2,
        // Glass size (after deductions - what we actually price)
        glassSize_mm: `${pricing.glassWidth_mm} x ${pricing.glassHeight_mm}`,
        area_m2: pricing.area_m2,
        unitPrice: unitPriceWithExtras,
        totalPrice: totalPriceWithExtras,
        product_code: pricing.product.product_code,
        is_safety_glass: pricing.isSafetyGlass,
        systemName: pricing.systemName,
        glassSpec: pricing.glassSpec,
        powderCoatCode: pricing.powderCoatCode,
        frameColor: pricing.frameColor,
        // Deduction details for transparency
        frameTolerance_mm: pricing.frameTolerance_mm,
        profileDeduction_mm: pricing.profileDeduction_mm,
        totalDeduction_mm: pricing.totalDeduction_mm,
        // SANS 10400-N compliance fields
        wastageFactor: pricing.wastageFactor,
        basePrice: pricing.basePrice,
        sansUpgraded: pricing.sansUpgraded,
        sansUpgradeReason: pricing.sansUpgradeReason,
        // Hardware and BOM fields (NEW)
        opening_mechanism: openingMechanism,
        hardware_cost: hardwareCost,
        hardware_kit_name: this.getHardwareKitName(openingMechanism),
        contingency_percent: contingencyPercent,
        contingency_amount: contingencyAmount
      });

      subtotal += totalPriceWithExtras;
      hardwareTotal += hardwareCost * itemQuantity;
      contingencyTotal += contingencyAmount * itemQuantity;

      if (pricing.isSafetyGlass) {
        requiresSafetyGlass = true;
        if (pricing.sansUpgraded) {
          safetyReasons.push(`${item.type}: ${pricing.sansUpgradeReason}`);
        } else {
          safetyReasons.push(`${item.type} requires safety glass`);
        }
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
        openingSize_mm: 'N/A',
        openingArea_m2: 0,
        glassSize_mm: 'N/A',
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
      expiryDate: expiryDate.toISOString(),
      // Estimate fields (NEW)
      isEstimate: true,
      contingencyTotal,
      hardwareTotal,
      estimateDisclaimer: 'This is an ESTIMATE based on provided measurements. Final price confirmed after free site inspection. Full refund if final price varies >20%.'
    };
  }

  // Get contingency percentage based on opening mechanism certainty
  private getContingencyPercent(openingMechanism: string): number {
    switch (openingMechanism) {
      case 'side_hung':
      case 'top_hung':
        return 0; // Confident, no contingency needed
      case 'sliding':
        return 0; // Confident, no contingency needed
      case 'fixed':
        return 8; // Customer might change mind and want opening
      case 'unknown':
      default:
        return 12; // Uncertain, higher contingency for margin protection
    }
  }

  // Get hardware kit name for display
  private getHardwareKitName(openingMechanism: string): string {
    switch (openingMechanism) {
      case 'side_hung':
        return 'Side Hung Window Kit';
      case 'top_hung':
        return 'Top Hung Window Kit';
      case 'sliding':
        return 'Sliding Window Kit';
      case 'fixed':
        return 'Fixed Window Kit';
      case 'unknown':
      default:
        return 'Standard Window Kit (Conservative)';
    }
  }

  // Calculate hardware cost based on opening mechanism and dimensions
  private calculateHardwareCost(
    openingMechanism: string,
    width_mm: number,
    height_mm: number
  ): number {
    // Base hardware costs for each mechanism type
    const baseHardwareCosts: Record<string, number> = {
      side_hung: 650, // Friction stays (2x R285) + handle (R95) + lock (R155) + screws (~R30)
      top_hung: 595,  // Shorter stays (2x R320) + cockspur handle (R115) + lock (R155)
      sliding: 285,    // Rollers (2x R75) + handle (R135)
      fixed: 21,      // Just screws (6x R3.50)
      unknown: 650    // Default to side hung pricing for margin protection
    };

    const baseCost = baseHardwareCosts[openingMechanism] || baseHardwareCosts.unknown;

    // Calculate gasket length (perimeter in meters)
    const perimeterMeters = (2 * (width_mm + height_mm)) / 1000;
    const gasketCostPerMeter = 16; // Average gasket cost
    const gasketCost = perimeterMeters * gasketCostPerMeter;

    return baseCost + gasketCost;
  }

  // Group identical items together
  private groupIdenticalItems(items: CalculatedItem[]): CalculatedItem[] {
    const grouped = new Map<string, CalculatedItem>();

    for (const item of items) {
      // Create a unique key based on item properties (using glass size for grouping)
      const key = `${item.systemName}-${item.glassSize_mm}-${item.glassSpec?.type}-${item.glassSpec?.thickness}-${item.frameColor}-${item.powderCoatCode}`;
      
      if (grouped.has(key)) {
        // Item already exists, increment quantity and total
        const existing = grouped.get(key)!;
        existing.quantity += item.quantity;
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
