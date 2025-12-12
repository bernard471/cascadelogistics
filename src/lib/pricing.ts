// Shared pricing configuration and calculation logic
// Based on Guangzhou Swift Logistics actual rates

export interface PricingConfig {
  sea: {
    normal: { basePrice: number; label: string; days: string };
    special: { basePrice: number; label: string; days: string };
    battery: { basePrice: number; label: string; days: string };
    unit: string;
    maxWeightPerCBM: number;
  };
  air: {
    normal: { basePrice: number; label: string; days: string };
    special: { basePrice: number; label: string; days: string };
    battery: { basePrice: number; label: string; days: string };
    unit: string;
  };
  express: {
    general: { basePrice: number; label: string; days: string };
    special: { basePrice: number; label: string; days: string };
    mobile: { basePrice: number; label: string; days: string; unit: string };
    laptop: { basePrice: number; label: string; days: string; unit: string };
    tablet: { basePrice: number; label: string; days: string; unit: string };
    battery: { basePrice: number; label: string; days: string; unit: string };
    unit: string;
  };
}

export const pricingConfig: PricingConfig = {
  sea: {
    normal: { basePrice: 240, label: "Sea Shipping - Normal Goods", days: "35-45" },
    special: { basePrice: 260, label: "Sea Shipping - Special Goods", days: "35-45" },
    battery: { basePrice: 280, label: "Sea Shipping - Battery Goods", days: "35-45" },
    unit: "CBM",
    maxWeightPerCBM: 500, // kg
  },
  air: {
    normal: { basePrice: 15, label: "Air Shipping - General Goods", days: "5-7" },
    special: { basePrice: 18, label: "Air Shipping - Special Goods", days: "5-7" },
    battery: { basePrice: 20, label: "Air Shipping - Battery Goods", days: "5-7" },
    unit: "KG",
  },
  express: {
    general: { basePrice: 18, label: "Express Air - General Goods", days: "2-5" },
    special: { basePrice: 20, label: "Express Air - Special Goods", days: "2-5" },
    mobile: { basePrice: 25, label: "Express Air - Mobile Phones", days: "2-5", unit: "Unit" },
    laptop: { basePrice: 30, label: "Express Air - Laptop", days: "2-5", unit: "KG" },
    tablet: { basePrice: 25, label: "Express Air - Tablets", days: "2-5", unit: "Unit" },
    battery: { basePrice: 20, label: "Express Air - Battery", days: "2-5", unit: "Unit" },
    unit: "KG",
  },
};

export type GoodsType = 'normal' | 'special' | 'battery';
export type ServiceType = 'standard' | 'express' | 'overnight' | 'economy';

// Map service types to actual shipping methods
export const serviceTypeMap: Record<ServiceType, 'sea' | 'air' | 'express'> = {
  standard: 'air',      // Air Shipping
  express: 'express',   // Express Air Shipping
  overnight: 'sea',    // Sea Shipping
  economy: 'air',      // Default to air for economy
};

/**
 * Calculate volume in CBM from dimensions
 */
export function calculateVolume(length: number, width: number, height: number, quantity: number): number {
  // Convert cm to meters, then calculate CBM
  const lengthM = length / 100;
  const widthM = width / 100;
  const heightM = height / 100;
  return lengthM * widthM * heightM * quantity;
}

/**
 * Parse dimensions string (e.g., "30 x 20 x 15") to length, width, height
 */
export function parseDimensions(dimensions: string): { length: number; width: number; height: number } | null {
  if (!dimensions) return null;
  
  const parts = dimensions.split(/[xX×]/).map(p => parseFloat(p.trim()));
  if (parts.length === 3 && parts.every(p => !isNaN(p) && p > 0)) {
    return { length: parts[0], width: parts[1], height: parts[2] };
  }
  return null;
}

/**
 * Calculate shipping price based on service type, goods type, weight, dimensions, and description
 */
export function calculateShippingPrice(
  serviceType: ServiceType,
  goodsType: GoodsType,
  weight: number,
  quantity: number,
  dimensions?: string,
  description?: string,
  packageType?: string
): number {
  const shippingMethod = serviceTypeMap[serviceType];
  let totalCost = 0;

  if (shippingMethod === 'sea') {
    // Sea shipping: Calculate based on CBM
    const dims = dimensions ? parseDimensions(dimensions) : null;
    
    if (!dims) {
      // If no dimensions, estimate based on weight (minimum 1 CBM)
      const estimatedCBM = Math.max(1, Math.ceil(weight / pricingConfig.sea.maxWeightPerCBM));
      const config = pricingConfig.sea[goodsType];
      totalCost = estimatedCBM * config.basePrice;
    } else {
      const volumeCBM = calculateVolume(dims.length, dims.width, dims.height, quantity);
      const config = pricingConfig.sea[goodsType];
      const maxWeightPerCBM = pricingConfig.sea.maxWeightPerCBM;
      
      // Calculate weight-based CBM (if weight exceeds 500kg per CBM)
      const weightBasedCBM = Math.ceil(weight / maxWeightPerCBM);
      const actualCBM = Math.max(volumeCBM, weightBasedCBM);
      
      totalCost = actualCBM * config.basePrice;
    }
  } else if (shippingMethod === 'express') {
    // Express air shipping: Check for special electronics
    let config;
    let totalUnits: number;

    if (packageType === 'electronics' && description) {
      const descLower = description.toLowerCase();
      if (descLower.includes('mobile') || descLower.includes('phone')) {
        config = pricingConfig.express.mobile;
        totalUnits = quantity;
      } else if (descLower.includes('laptop')) {
        config = pricingConfig.express.laptop;
        totalUnits = weight;
      } else if (descLower.includes('tablet')) {
        config = pricingConfig.express.tablet;
        totalUnits = quantity;
      } else if (descLower.includes('battery')) {
        config = pricingConfig.express.battery;
        totalUnits = quantity;
      } else {
        config = goodsType === 'special' ? pricingConfig.express.special : pricingConfig.express.general;
        totalUnits = weight;
      }
    } else {
      config = goodsType === 'special' ? pricingConfig.express.special : pricingConfig.express.general;
      totalUnits = weight;
    }

    totalCost = totalUnits * config.basePrice;
  } else {
    // Air shipping
    const config = pricingConfig.air[goodsType];
    totalCost = weight * config.basePrice;
  }

  return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
}

/**
 * Get service label and description
 */
export function getServiceInfo(serviceType: ServiceType, goodsType: GoodsType = 'normal'): { label: string; description: string } {
  const shippingMethod = serviceTypeMap[serviceType];
  
  if (shippingMethod === 'sea') {
    const config = pricingConfig.sea[goodsType];
    return { label: config.label, description: `${config.days} days` };
  } else if (shippingMethod === 'express') {
    const config = pricingConfig.express[goodsType === 'special' ? 'special' : 'general'];
    return { label: config.label, description: `${config.days} days` };
  } else {
    const config = pricingConfig.air[goodsType];
    return { label: config.label, description: `${config.days} days` };
  }
}

