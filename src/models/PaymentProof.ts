export interface PaymentProof {
  _id?: string;
  paymentId: string; // Auto-generated ID (PAY######)
  trackingId: string; // Reference to shipment tracking ID
  shipmentId: string; // Reference to shipment _id
  userId: string; // Reference to user who submitted
  
  // Payment Details
  amount: number; // Amount paid in USD
  paymentMethod: 'mobile-money' | 'bank-transfer' | 'cash' | 'other';
  paymentMethodDetails?: string; // Additional details (e.g., MTN, Vodafone, etc.)
  
  // Proof Image
  proofImageUrl: string; // Vercel Blob Storage URL
  proofImageName: string; // Original filename
  
  // Status
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string; // Admin user ID who verified
  verifiedAt?: Date;
  rejectionReason?: string;
  
  // Metadata
  submittedAt: Date;
  updatedAt: Date;
  notes?: string; // User notes or admin notes
}

