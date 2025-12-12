export interface SupportTicket {
  _id?: string;
  userId: string; // Reference to User
  ticketNumber: string; // Auto-generated unique ticket number
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category?: 'shipment' | 'billing' | 'account' | 'technical' | 'general';
  relatedShipmentId?: string; // Optional reference to Shipment
  
  // Response
  responses?: {
    message: string;
    respondedBy: string; // Admin/Staff name
    respondedAt: Date;
    isStaff: boolean;
  }[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

