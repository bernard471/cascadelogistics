export interface NewsletterSubscription {
  _id?: string;
  email: string;
  source: 'footer-top' | 'footer-gallery'; // Track which form was used
  subscribedAt: Date;
  status: 'active' | 'unsubscribed';
  unsubscribedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}
