import { supabase, Database } from '@/lib/supabase';

type Product = Database['public']['Tables']['products']['Row'];

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

// SANS 10400-N Safety Constants
const SANS_AREA_LIMIT_M2 = 1.5; // 4mm float illegal if pane > 1.5m²

// Glass size deduction configuration
// Based on professional aluminum window installation standards
type DeductionConfig = {
  frameTolerance_mm: number;  // 10mm total (5mm per side for silicone/sealing)
  profileDeductions: {
    [profileName: string]: number;  // Profile-specific glass pocket deduction
  };
  defaultProfileDeduction_mm: number;  // 38mm standard for most aluminum windows
};

const DEFAULT_DEDUCTION_CONFIG: DeductionConfig = {
  frameTolerance_mm: 10,  // 5mm per side
  profileDeductions: {
    'crealco_swift_28': 38,
    'crealco_swift_34': 38,
    'crealco_swift_38': 38,
    'crealco_clip_44': 45,
    'casement_30.5': 38,
    'casement_38': 38,
    'shopfront': 45,
    'sliding_door': 45
  },
  defaultProfileDeduction_mm: 38
};

export class ProductPricingService {
  private products: Product[] = [];
  private companyConfig: CompanyConfig | null = null;
  private productsLoaded: boolean = false;
  private configLoaded: boolean = false;

  // Wastage factors per SANS industry standards
  private readonly WASTAGE = {
    aluminum: 1.15, // 15% wastage for aluminum profiles (can't buy half a 6m bar)
    glass: 1.15     // 15% wastage for glass offcuts
  };

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
    for (const [key, value] of Object.entries(glassTypeMapping)) {
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

  // Calculate glass size from opening size using professional deduction logic
  // This is the "Secret Sauce" - opening size minus frame tolerance and profile deduction
  private calculateGlassSizeFromOpening(
    openingWidth_mm: number,
    openingHeight_mm: number,
    type: string
  ): {
    openingWidth_mm: number;
    openingHeight_mm: number;
    glassWidth_mm: number;
    glassHeight_mm: number;
    frameTolerance_mm: number;
    profileDeduction_mm: number;
    totalDeduction_mm: number;
  } {
    const config = DEFAULT_DEDUCTION_CONFIG;
    
    // Determine profile type from item type
    const normalizedType = type.toLowerCase();
    let profileKey = 'default';
    
    if (normalizedType.includes('shopfront') || normalizedType.includes('shop_front')) {
      profileKey = 'shopfront';
    } else if (normalizedType.includes('sliding_door') || normalizedType.includes('sliding door')) {
      profileKey = 'sliding_door';
    } else if (normalizedType.includes('door')) {
      profileKey = 'crealco_clip_44';
    } else if (normalizedType.includes('window')) {
      // Use Swift 28 as default for windows
      profileKey = 'crealco_swift_28';
    }
    
    // Get profile-specific deduction (glass pocket depth)
    const profileDeduction_mm = config.profileDeductions[profileKey] || config.defaultProfileDeduction_mm;
    
    // Total deduction: frame tolerance (10mm) + profile deduction (38-45mm)
    const totalDeduction_mm = config.frameTolerance_mm + profileDeduction_mm;
    
    // Calculate glass size (opening minus total deduction on both dimensions)
    // The deduction is applied to both width and height
    const glassWidth_mm = Math.max(0, openingWidth_mm - totalDeduction_mm);
    const glassHeight_mm = Math.max(0, openingHeight_mm - totalDeduction_mm);
    
    return {
      openingWidth_mm,
      openingHeight_mm,
      glassWidth_mm,
      glassHeight_mm,
      frameTolerance_mm: config.frameTolerance_mm,
      profileDeduction_mm,
      totalDeduction_mm
    };
  }

  // Get glass specification based on type, safety requirements, and SANS 10400-N area limits
  private getGlassSpec(glassType: string, isSafetyGlass: boolean, area_m2: number): { type: string, thickness: string, sansUpgraded: boolean } {
    // SANS 10400-N: 4mm Float glass is illegal if pane > 1.5m²
    const requiresSafetyDueToArea = area_m2 > SANS_AREA_LIMIT_M2;
    
    if (isSafetyGlass || requiresSafetyDueToArea) {
      return {
        type: 'PVB Laminated Safety Glass',
        thickness: '6.38mm',
        sansUpgraded: requiresSafetyDueToArea && !isSafetyGlass
      };
    }
    
    // Standard glass specifications
    const normalized = glassType.toLowerCase();
    if (normalized.includes('low-e')) {
      return { type: 'Low-E Energy Efficient', thickness: '6mm', sansUpgraded: false };
    } else if (normalized.includes('tinted')) {
      return { type: 'Tinted Float', thickness: '6mm', sansUpgraded: false };
    } else if (normalized.includes('frosted')) {
      return { type: 'Frosted Obscure', thickness: '6mm', sansUpgraded: false };
    }
    
    // Default: Clear Float (only allowed if area <= 1.5m² per SANS)
    return { type: 'Clear Float', thickness: '4mm', sansUpgraded: false };
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
    // STEP 1: Calculate glass size from opening size using professional deductions
    // Incoming width_mm/height_mm are treated as OPENING sizes (brick opening)
    const sizeCalculation = this.calculateGlassSizeFromOpening(width_mm, height_mm, type);
    
    // STEP 2: Calculate pricing area using the GLASS size (not opening size)
    // This is the "Secret Sauce" - professional software prices the glass, not the hole
    const glassArea_m2 = (sizeCalculation.glassWidth_mm * sizeCalculation.glassHeight_mm) / 1000000;
    
    // Keep original opening area for reference
    const openingArea_m2 = (sizeCalculation.openingWidth_mm * sizeCalculation.openingHeight_mm) / 1000000;
    
    // Apply minimum area rule (from your config)
    const minOrderValue = this.companyConfig?.quote_settings?.min_order_value || 500;
    const minArea = 0.25; // Standard minimum area
    
    // Determine if safety glass is required (based on glass size, not opening size)
    const isSafetyGlass = this.requiresSafetyGlass(type, glassArea_m2);
    
    // Get proper glass spec (now includes SANS 10400-N area limit check)
    const glassSpec = this.getGlassSpec(glassType, isSafetyGlass, glassArea_m2);
    
    // Update isSafetyGlass if SANS area limit triggered upgrade
    const finalIsSafetyGlass = isSafetyGlass || glassSpec.sansUpgraded;
    
    // Find the best product (use updated safety status)
    let product = this.findBestProduct(glassType, finalIsSafetyGlass, thickness);
    
    // If no product found in database, create fallback
    if (!product) {
      console.log(`No database product found for ${glassType} glass${finalIsSafetyGlass ? ' (safety required)' : ''}, creating fallback product`);
      product = this.createFallbackProduct(glassType, finalIsSafetyGlass, thickness);
    }

    // Calculate pricing using GLASS area with SANS wastage factors
    // Formula: (Glass m² × Rate) × Wastage
    const billableArea = Math.max(glassArea_m2, minArea);
    const unitPrice = product.price_per_sqm;
    const basePrice = billableArea * unitPrice;
    
    // Apply SANS wastage factor (15% for glass offcuts)
    const priceWithWastage = basePrice * this.WASTAGE.glass;

    // Apply minimum charge if applicable
    const finalPrice = Math.max(priceWithWastage, product.min_charge || 0);

    // Get system name and powder coat code
    const systemName = this.getSystemName(type);
    const powderCoatCode = this.getPowderCoatCode(frameColor);

    return {
      product,
      // Opening size (what the contractor provides)
      openingWidth_mm: sizeCalculation.openingWidth_mm,
      openingHeight_mm: sizeCalculation.openingHeight_mm,
      openingArea_m2,
      // Glass size (what we actually price - after deductions)
      glassWidth_mm: sizeCalculation.glassWidth_mm,
      glassHeight_mm: sizeCalculation.glassHeight_mm,
      glassArea_m2,
      // Deduction details (for transparency in quote)
      frameTolerance_mm: sizeCalculation.frameTolerance_mm,
      profileDeduction_mm: sizeCalculation.profileDeduction_mm,
      totalDeduction_mm: sizeCalculation.totalDeduction_mm,
      // Pricing with SANS wastage applied
      area_m2: billableArea,
      unitPrice,
      wastageFactor: this.WASTAGE.glass,
      basePrice,
      totalPrice: finalPrice,
      isSafetyGlass: finalIsSafetyGlass,
      sansUpgraded: glassSpec.sansUpgraded,
      sansUpgradeReason: glassSpec.sansUpgraded ? `SANS 10400-N: Area ${glassArea_m2.toFixed(2)}m² exceeds 1.5m² limit for 4mm float glass` : undefined,
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
    const doorProximity = this.companyConfig?.safety_glass_locations?.door_proximity_mm || 300;
    const lowLevelHeight = this.companyConfig?.safety_glass_locations?.low_level_height_mm || 800;

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
