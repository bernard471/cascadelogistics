import type { ObjectId } from "mongodb";
import type { ShipmentDocument } from "./Shipment";

export interface PaymentProof {
  _id?: string;
  paymentId: string; // Auto-generated ID (PAY######)
  trackingId: string; // Reference to shipment tracking ID
  shipmentId: string; // Reference to shipment _id
  userId?: string; // Reference to dashboard user; partner submissions may not have one
  publicId?: string;
  organizationId?: ObjectId;
  apiClientId?: ObjectId;
  environment?: 'test' | 'live';
  shipmentPublicId?: string;
  idempotencyRecordId?: ObjectId;
  submittedVia?: 'dashboard' | 'partner_api';
  submittedByPrincipal?: { type: 'user' | 'api_client'; id: string };
  
  // Payment Details
  amount: number; // Amount paid in USD
  currency?: string;
  paymentMethod: 'mobile-money' | 'bank-transfer' | 'cash' | 'other';
  paymentMethodDetails?: string; // Additional details (e.g., MTN, Vodafone, etc.)
  
  // Proof Image
  proofImageUrl: string; // Vercel Blob Storage URL
  proofImageName: string; // Original filename
  proofs?: ShipmentDocument[]; // Partner API supports multiple files
  
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
