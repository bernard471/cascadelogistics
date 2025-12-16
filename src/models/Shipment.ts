export interface ShipmentDocument {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 data URL or remote URL
  uploadedAt: Date | string;
}

export interface Shipment {
  _id?: string;
  trackingId: string;
  userId: string; // Reference to User
  
  // Sender Information
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderCountry: string;
  
  // Receiver Information
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverCountry: string;
  
  // Shipment Details
  packageType: 'document' | 'parcel' | 'package' | 'fragile' | 'electronics' | 'other';
  weight: number; // in kg
  dimensions?: string; // L x W x H
  quantity: number;
  description: string;
  declaredValue: number; // in USD
  goodsType?: 'normal' | 'special' | 'battery'; // Goods type for pricing calculation
  
  // Service Details
  serviceType: 'standard' | 'express' | 'overnight' | 'economy';
  servicePrice?: number; // Calculated price based on service type, goods type, weight, and dimensions
  pickupDate?: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  specialInstructions?: string;
  
  // Wholesale Purchase Information (for packages sent directly to warehouse)
  wholesalePurchases?: Array<{
    name: string; // Name used to purchase from wholesale shop
    trackingNumber: string; // Tracking number from wholesale shop
  }>;
  
  // Shipping Mark
  shippingMarkName?: string; // User-provided name for shipping mark (middle part)
  shippingMark?: string; // Auto-generated shipping mark: GSL000/[NAME]-(888) for sea or GSL000/[NAME]-air for air
  
  // Status
  status: 'pending' | 'arrived-at-warehouse' | 'ready-for-shipment' | 'in-transit' | 'arrived-at-warehouse-ghana' | 'ready-for-pickup' | 'delivered' | 'cancelled' | 'on-hold';
  currentLocation?: string;
  
  // Tracking Timeline
  timeline: {
    status: string;
    location: string;
    date: Date;
    time: string;
    completed: boolean;
    imageUrl?: string; // Vercel Blob Storage URL for update image
    imageName?: string; // Original filename of the image
  }[];
  
  // Invoice
  invoice?: {
    url: string; // Vercel Blob Storage URL
    fileName: string; // Original filename
    uploadedAt: Date; // Upload timestamp
    uploadedBy: string; // Admin/staff user ID who uploaded it
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  documents?: ShipmentDocument[];
}

// For client-side components
export interface ShipmentWithUser extends Shipment {
  userName: string;
  userEmail: string;
}
