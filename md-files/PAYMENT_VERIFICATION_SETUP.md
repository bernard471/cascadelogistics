# Payment Verification System Setup Guide

## Overview
This system allows users to submit payment proof for their shipments and admins to verify those payments. Payment proof images are stored using Vercel Blob Storage.

## Features

### User Dashboard
- **Submit Payment Proof** (`/user-dashboard/payment-proof`)
  - Search for shipment by tracking ID
  - Submit payment details (amount, payment method, proof image)
  - View submission status

### Admin Dashboard
- **Payment Verification** (`/admin-dashboard/payments`)
  - View all payment submissions
  - Filter by status (pending, verified, rejected)
  - Verify or reject payments
  - Add rejection reasons and admin notes

## Setup Instructions

### 1. Install Dependencies
The `@vercel/blob` package has already been installed. If you need to reinstall:
```bash
npm install @vercel/blob
```

### 2. Environment Variables
Add the following to your `.env.local` file:

```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

**How to get your Vercel Blob token:**
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Storage" → "Blob"
4. Create a new Blob store (if you haven't already)
5. Copy the `BLOB_READ_WRITE_TOKEN` from the store settings

**For local development:**
- You can use Vercel CLI: `vercel env pull .env.local`
- Or manually add the token from your Vercel dashboard

### 3. Database Collection
The system uses a MongoDB collection called `payment_proofs`. It will be created automatically when the first payment proof is submitted.

**Collection Schema:**
```typescript
{
  paymentId: string,        // Auto-generated (PAY######)
  trackingId: string,       // Shipment tracking ID
  shipmentId: string,       // Shipment _id
  userId: string,           // User who submitted
  amount: number,           // Amount paid in USD
  paymentMethod: string,    // 'mobile-money' | 'bank-transfer' | 'cash' | 'other'
  paymentMethodDetails?: string,
  proofImageUrl: string,    // Vercel Blob Storage URL
  proofImageName: string,  // Original filename
  status: string,           // 'pending' | 'verified' | 'rejected'
  verifiedBy?: string,      // Admin user ID
  verifiedAt?: Date,
  rejectionReason?: string,
  submittedAt: Date,
  updatedAt: Date,
  notes?: string
}
```

## API Routes

### User Routes

#### `POST /api/payments`
Submit payment proof
- **Body:** FormData with:
  - `trackingId` (string, required)
  - `amount` (string, required)
  - `paymentMethod` (string, required)
  - `paymentMethodDetails` (string, optional)
  - `notes` (string, optional)
  - `proofImage` (File, required - max 10MB, JPEG/PNG/WebP)

#### `GET /api/payments`
Get user's payment proofs
- **Query params:**
  - `status` (optional): 'pending' | 'verified' | 'rejected' | 'all'
  - `trackingId` (optional): Filter by tracking ID

### Admin Routes

#### `GET /api/admin/payments`
Get all payment proofs (admin only)
- **Query params:**
  - `status` (optional): Filter by status
  - `trackingId` (optional): Search by tracking ID
  - `limit` (optional): Pagination limit (default: 50)
  - `skip` (optional): Pagination skip (default: 0)
- **Returns:** Payments with user info, stats, and pagination

#### `GET /api/admin/payments/[id]`
Get single payment proof (admin only)

#### `PATCH /api/admin/payments/[id]`
Verify or reject payment (admin only)
- **Body:**
  - `status` (required): 'verified' | 'rejected'
  - `rejectionReason` (required if status is 'rejected')
  - `notes` (optional): Admin notes

## File Storage

### Vercel Blob Storage
- Images are stored in: `payment-proofs/{userId}/{trackingId}-{timestamp}-{filename}`
- Access: Public (images are publicly accessible via URL)
- Max file size: 10MB
- Supported formats: JPEG, PNG, WebP

### Image URLs
Payment proof images are stored with public access and can be viewed/downloaded directly via the blob URL.

## Usage Flow

### User Flow
1. User navigates to "Payment Proof" in dashboard
2. User searches for shipment by tracking ID
3. User fills in payment details and uploads proof image
4. Payment proof is submitted with status "pending"
5. User can view their submission status

### Admin Flow
1. Admin navigates to "Payment Verification" in dashboard
2. Admin sees list of all payment submissions
3. Admin can filter by status or search by tracking ID
4. Admin clicks "View" to see payment details and proof image
5. Admin verifies or rejects the payment
6. If rejected, admin must provide a reason
7. System updates payment status and optionally updates shipment

## Security

- All routes require authentication
- Admin routes require admin role
- Users can only submit payment proof for their own shipments
- Users cannot modify payment proofs after submission
- Only admins can verify/reject payments
- Image uploads are validated for size and type

## Notes

- Payment proofs are linked to shipments via `trackingId` and `shipmentId`
- Only one pending/verified payment proof can exist per shipment
- Rejected payments can be resubmitted (old ones remain for record)
- Payment verification does not automatically update shipment payment status (can be extended if needed)

