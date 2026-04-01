import { createClient } from '@/utils/supabase-browser';

// Need to define a minimal product type since we don't have the generated Database type here yet
type Product = {
  id: string;
  category: string;
  name: string;
  glass_type: string;
  is_safety_glass: boolean;
  thickness_mm: number;
  in_stock: boolean;
  price_per_sqm: number;
  min_charge: number | null;
  product_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Create a singleton instance for the service
const supabase = createClient();

type CompanyConfig = {
  quote_settings?: {
    vat_rate?: number;
    validity_days?: number;
    deposit_percentage?: number;
    min_order_value?: number;
  };
  safety_glass_locations?: {
    locations?: string[];
    door_proximity_mm?: number;
    low_level_height_mm?: number;
  };
  [key: string]: unknown;
};

export class ProductPricingService {
  private products: Product[] = [];
  private companyConfig: CompanyConfig | null = null;
  private productsLoaded: boolean = false;
  private configLoaded: boolean = false;

  constructor() {
    // Don't call async methods in constructor
  }

  // Initialize the service - call this before using
  async initialize() {
    if (!this.productsLoaded) {
      await this.loadProducts();
    }
    if (!this.configLoaded) {
      await this.loadCompanyConfig();
    }
  }

  private async loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      this.products = data || [];
      this.productsLoaded = true;
      console.log(`Loaded ${this.products.length} products`);
    } catch (error) {
      console.error('Error loading products:', error);
      this.products = [];
    }
  }

  private async loadCompanyConfig() {
    try {
      const { data, error } = await supabase
        .from('company_config')
        .select('key, value')
        .in('key', ['quote_settings', 'safety_glass_locations']);

      if (error) throw error;
      
      const config: CompanyConfig = {};
      (data || []).forEach((row) => {
        config[row.key] = row.value as unknown;
      });
      this.companyConfig = config;
      this.configLoaded = true;
    } catch (error) {
      console.error('Error loading company config:', error);
    }
  }

  // Find the best product match based on glass type and requirements
  private findBestProduct(glassType: string, isSafetyGlass: boolean, thickness?: number): Product | null {
    // First try to find in database products
    const matchingProducts = this.products.filter(product => {
      const glassTypeMatch = product.glass_type?.toLowerCase() === glassType.toLowerCase();
      const safetyMatch = isSafetyGlass ? product.is_safety_glass : true;
      return glassTypeMatch && safetyMatch && product.in_stock;
    });

    // If thickness is specified, prioritize exact matches
    if (thickness && matchingProducts.length > 1) {
      const exactThickness = matchingProducts.find(p => p.thickness_mm === thickness);
      if (exactThickness) return exactThickness;
    }

    // Return the first matching product or null
    return matchingProducts.length > 0 ? matchingProducts[0] : null;
  }

  // Create fallback product when database product not found
  private createFallbackProduct(glassType: string, isSafetyGlass: boolean, thickness?: number): Product {
    // Map common glass industry terms to product names
    const glassTypeMapping: { [key: string]: { name: string, basePrice: number, safetyPrice: number } } = {
      'clear': { name: 'Clear Annealed Glass', basePrice: 450, safetyPrice: 650 },
      'tinted': { name: 'Tinted Glass', basePrice: 550, safetyPrice: 750 },
      'frosted': { name: 'Frosted Glass', basePrice: 600, safetyPrice: 800 },
      'mirror': { name: 'Mirror Glass', basePrice: 700, safetyPrice: 900 },
      'low-e': { name: 'Low-E Energy Efficient Glass', basePrice: 800, safetyPrice: 1000 },
      'patterned': { name: 'Patterned Glass', basePrice: 650, safetyPrice: 850 },
      'tempered': { name: 'Tempered Safety Glass', basePrice: 750, safetyPrice: 750 },
      'laminated': { name: 'Laminated Safety Glass', basePrice: 900, safetyPrice: 900 }
    };

    // Handle variations and synonyms
    const normalizedGlassType = glassType.toLowerCase().replace(/[^a-z]/g, '');
    let mappedType = 'clear'; // default
    
    // Find the best match
    for (const [key] of Object.entries(glassTypeMapping)) {
      if (normalizedGlassType.includes(key) || key.includes(normalizedGlassType)) {
        mappedType = key;
        break;
      }
    }

    const mapped = glassTypeMapping[mappedType];
    const basePrice = mapped.basePrice;
    const safetyPrice = mapped.safetyPrice;
    const finalPrice = isSafetyGlass ? safetyPrice : basePrice;

    // Adjust price based on thickness
    let thicknessMultiplier = 1;
    if (thickness) {
      if (thickness >= 12) thicknessMultiplier = 1.5;
      else if (thickness >= 10) thicknessMultiplier = 1.3;
      else if (thickness >= 8) thicknessMultiplier = 1.2;
    }

    return {
      id: `fallback-${glassType}-${isSafetyGlass ? 'safety' : 'standard'}`,
      product_code: `FALLBACK-${glassType.toUpperCase()}-${isSafetyGlass ? 'SAFETY' : 'STD'}`,
      name: mapped.name + (isSafetyGlass ? ' (Safety)' : ''),
      category: 'Glass',
      glass_type: glassType,
      thickness_mm: thickness || 6,
      is_safety_glass: isSafetyGlass,
      price_per_sqm: finalPrice * thicknessMultiplier,
      min_charge: 250,
      in_stock: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Product;
  }

  // Get system name based on type
  private getSystemName(type: string): string {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('door')) {
      return 'Crealco Clip 44 Shop Front';
    } else if (normalizedType.includes('window')) {
      return 'Crealco Swift 28 Window';
    }
    return 'Crealco Swift 38 Panel';
  }

  // Get powder coat color code
  private getPowderCoatCode(frameColor: string): string {
    const colorCodes: { [key: string]: string } = {
      'charcoal': 'PIS71149',
      'charcoal matt': 'PIS71149',
      'black': 'PIS71050',
      'white': 'PIS71010',
      'bronze': 'PIS71060',
      'grey': 'PIS71100'
    };
    
    const normalized = frameColor.toLowerCase();
    for (const [color, code] of Object.entries(colorCodes)) {
      if (normalized.includes(color)) {
        return code;
      }
    }
    return 'PIS71149'; // Default to charcoal
  }

  // Get glass specification based on type and safety requirements
  private getGlassSpec(glassType: string, isSafetyGlass: boolean): { type: string, thickness: string } {
    if (isSafetyGlass) {
      // Safety glass uses 6.38mm PVB Laminated
      return {
        type: 'PVB Laminated Safety Glass',
        thickness: '6.38mm'
      };
    }
    
    // Standard glass specifications
    const normalized = glassType.toLowerCase();
    if (normalized.includes('low-e')) {
      return { type: 'Low-E Energy Efficient', thickness: '6mm' };
    } else if (normalized.includes('tinted')) {
      return { type: 'Tinted Float', thickness: '6mm' };
    } else if (normalized.includes('frosted')) {
      return { type: 'Frosted Obscure', thickness: '6mm' };
    }
    
    // Default: Clear Float
    return { type: 'Clear Float', thickness: '4mm' };
  }

  // Calculate pricing for a single item
  calculateItemPricing(
    width_mm: number, 
    height_mm: number, 
    type: string, // 'window' or 'door'
    glassType: string,
    frameColor: string,
    thickness?: number
  ) {
    // Calculate area in m²
    const area_m2 = (width_mm * height_mm) / 1000000;
    
    // Apply minimum area rule (from your config)
    // const minOrderValue = this.companyConfig?.quote_settings?.min_order_value || 500;
    const minArea = 0.25; // Standard minimum area
    
    // Determine if safety glass is required
    const isSafetyGlass = this.requiresSafetyGlass(type, area_m2);
    
    // Get proper glass spec
    const glassSpec = this.getGlassSpec(glassType, isSafetyGlass);
    
    // Find the best product
    let product = this.findBestProduct(glassType, isSafetyGlass, thickness);
    
    // If no product found in database, create fallback
    if (!product) {
      console.log(`No database product found for ${glassType} glass${isSafetyGlass ? ' (safety required)' : ''}, creating fallback product`);
      product = this.createFallbackProduct(glassType, isSafetyGlass, thickness);
    }

    // Calculate pricing
    const billableArea = Math.max(area_m2, minArea);
    const unitPrice = product.price_per_sqm;
    const totalPrice = billableArea * unitPrice;

    // Apply minimum charge if applicable
    // const finalPrice = Math.max(totalPrice, product.min_charge || 0);

    // Get system name and powder coat code
    const systemName = this.getSystemName(type);
    const powderCoatCode = this.getPowderCoatCode(frameColor);

    return {
      product,
      area_m2: billableArea,
      unitPrice,
      totalPrice,
      isSafetyGlass,
      systemName,
      glassSpec,
      powderCoatCode,
      frameColor,
      description: systemName
    };
  }

  // Check if safety glass is required based on your business rules
  private requiresSafetyGlass(type: string, area_m2: number): boolean {
    const safetyLocations = this.companyConfig?.safety_glass_locations?.locations || [];
    // const doorProximity = this.companyConfig?.safety_glass_locations?.door_proximity_mm || 300;
    // const lowLevelHeight = this.companyConfig?.safety_glass_locations?.low_level_height_mm || 800;

    // Doors always require safety glass
    if (type.toLowerCase() === 'door') {
      return true;
    }

    // Check other safety locations
    return safetyLocations.some((location: string) => {
      switch (location) {
        case 'shower':
        case 'sidelight':
        case 'balustrade':
        case 'overhead':
          return true;
        case 'low_level_window':
          // This would need height information, for now assume based on area
          return area_m2 > 1.0; // Large windows might be low level
        default:
          return false;
      }
    });
  }

  // Get all available products for a category
  getProductsByCategory(category: string): Product[] {
    return this.products.filter(product => 
      product.category === category && 
      product.is_active && 
      product.in_stock
    );
  }

  // Get product by code
  getProductByCode(productCode: string): Product | null {
    return this.products.find(product => 
      product.product_code === productCode && 
      product.is_active
    ) || null;
  }

  // Get company configuration
  getCompanyConfig() {
    return this.companyConfig;
  }

  // Get VAT rate from config
  getVatRate(): number {
    return this.companyConfig?.quote_settings?.vat_rate || 15;
  }

  // Get quote validity days
  getQuoteValidityDays(): number {
    return this.companyConfig?.quote_settings?.validity_days || 7;
  }

  // Get deposit percentage
  getDepositPercentage(): number {
    return this.companyConfig?.quote_settings?.deposit_percentage || 50;
  }
}
