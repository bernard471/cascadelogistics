export interface Notification {
  _id?: string;
  userId: string; // Reference to User
  type: 'delivery' | 'update' | 'alert' | 'pending' | 'payment' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  relatedShipmentId?: string; // Optional reference to Shipment
  createdAt: Date;
  readAt?: Date;
}

export type NotificationFilter = 'all' | 'unread' | 'read';

