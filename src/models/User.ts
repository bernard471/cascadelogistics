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
  stateRegion?: string;
  addressLine2?: string;
  digitalAddress?: string;
  bio?: string;
  role: 'user' | 'admin' | 'staff';
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: boolean;
  verificationToken?: string; // Email verification token
  verificationTokenExpiry?: Date; // Email verification token expiry
  image?: string;
  profileImage?: string; // Base64 encoded profile image
  memberSince?: Date; // When user joined
  totalShipments?: number; // Total shipments created
  deliveredShipments?: number; // Successfully delivered shipments
  resetToken?: string; // Password reset token
  resetTokenExpiry?: Date; // Password reset token expiry
  emailNormalized?: string;
  usernameNormalized?: string;
  identityVerificationId?: string;
  identityVerificationStatus?: 'pending' | 'under-review' | 'verified' | 'rejected' | 'resubmission-required';
  identityVerifiedAt?: Date;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'staff';
}
