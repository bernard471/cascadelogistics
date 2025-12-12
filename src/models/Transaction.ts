export interface Transaction {
  _id?: string;
  transactionId: string; // Auto-generated (TXN######)
  shipmentId: string; // Reference to Shipment
  userId: string; // Reference to User
  amount: number;
  currency: string; // USD, EUR, GBP, AED
  paymentMethod: 'credit-card' | 'debit-card' | 'paypal' | 'bank-transfer' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Billing Details
  billingName?: string;
  billingEmail?: string;
  billingAddress?: string;
  
  // Payment Gateway Details
  gatewayTransactionId?: string;
  gatewayResponse?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
}

export interface RevenueStats {
  totalRevenue: number;
  totalProfit: number;
  pendingPayments: number;
  avgTransaction: number;
  monthlyRevenue: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  revenueByService: {
    service: string;
    revenue: number;
    percentage: number;
  }[];
}

