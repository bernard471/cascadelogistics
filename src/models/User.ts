export interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  bio?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: boolean;
  image?: string;
  profileImage?: string; // Base64 encoded profile image
  memberSince?: Date; // When user joined
  totalShipments?: number; // Total shipments created
  deliveredShipments?: number; // Successfully delivered shipments
  resetToken?: string; // Password reset token
  resetTokenExpiry?: Date; // Password reset token expiry
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

