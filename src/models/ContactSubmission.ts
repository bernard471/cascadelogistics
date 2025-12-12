export interface ContactSubmission {
  _id?: string;
  submissionId: string; // Auto-generated (CON######)
  
  // Contact Information
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message?: string;
  
  // Form Source
  source: 'contact-page' | 'contact-modal'; // Which form was used
  
  // Status
  status: 'new' | 'in-progress' | 'responded' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Response
  adminResponse?: string;
  respondedBy?: string; // Admin/Staff name
  respondedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ContactSubmissionStats {
  total: number;
  new: number;
  inProgress: number;
  responded: number;
  closed: number;
  urgent: number;
}
