// Core application types
export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User related types
export interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password?: string; // Optional for responses
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  bio?: string;
  role: 'user' | 'admin' | 'staff' | 'super_admin';
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date | string;
  updatedAt: Date | string;
  emailVerified?: boolean;
  verificationToken?: string; // Email verification token
  verificationTokenExpiry?: Date | string; // Email verification token expiry
  image?: string;
  profileImage?: string; // Base64 encoded profile image
  memberSince?: Date | string; // When user joined
  totalShipments?: number; // Total shipments created
  deliveredShipments?: number; // Successfully delivered shipments
  resetToken?: string; // Password reset token
  resetTokenExpiry?: Date | string; // Password reset token expiry
}

export interface UserWithStats extends User {
  totalShipments: number;
  deliveredShipments: number;
  registeredDate: string;
}

// Shipment related types
export interface ShipmentDocument {
  publicId?: string;
  name: string;
  type: string;
  size: number;
  data: string; // Legacy: base64 data URL; when url is set, data may be empty
  uploadedAt: Date | string;
  url?: string; // Vercel Blob Storage URL (preferred for new uploads)
  pathname?: string; // Vercel Blob pathname used to validate client uploads
}

export interface Shipment {
  _id?: string;
  publicId?: string;
  trackingId: string;
  userId?: string; // Cascade user reference; partner shipments may not have one
  createdVia?: 'dashboard' | 'admin' | 'partner_api';
  environment?: 'test' | 'live';
  organizationId?: string;
  apiClientId?: string;
  externalCustomerId?: string;
  externalReference?: string;
  declaredCurrency?: string;
  cascadeUserId?: string;
  createdByPrincipal?: {
    type: 'user' | 'admin' | 'staff' | 'api_client';
    id: string;
  };
  apiVersion?: 'v1';
  customer?: string; // Computed field for admin views
  customerEmail?: string; // Computed field for admin views
  partnerOrganization?: string;
  partnerOrganizationId?: string;
  partnerApplication?: string;
  partnerApplicationId?: string;
  partnerManagedCustomer?: boolean;
  
  // Sender Information
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderCountry: string;
  
  // Receiver Information
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverCountry: string;
  
  // Shipment Details
  packageType: 'document' | 'parcel' | 'package' | 'fragile' | 'electronics' | 'other';
  weight: number; // in kg
  dimensions?: string; // L x W x H
  quantity: number;
  description: string;
  declaredValue: number; // in USD
  goodsType?: 'normal' | 'special' | 'battery'; // Goods type for pricing calculation
  
  // Service Details
  serviceType: 'standard' | 'express' | 'overnight' | 'economy';
  servicePrice: number; // Calculated price based on service type, goods type, weight, and dimensions
  pickupDate?: Date | string;
  estimatedDelivery?: Date | string;
  actualDelivery?: Date | string;
  specialInstructions?: string;
  
  // Wholesale Purchase Information (for packages sent directly to warehouse)
  wholesalePurchases?: Array<{
    name: string; // Name used to purchase from wholesale shop
    trackingNumber: string; // Tracking number from wholesale shop
  }>;
  
  // DELTA Number (Admin/Staff only - groups shipments arriving to Ghana)
  deltaNumber?: string; // Format: DELTA + numbers (e.g., DELTA85720)
  
  // Status
  status: 'pending' | 'arrived-at-warehouse' | 'ready-for-shipment' | 'in-transit' | 'arrived-at-warehouse-ghana' | 'ready-for-pickup' | 'delivered' | 'cancelled' | 'on-hold';
  currentLocation?: string;
  
  // Tracking Timeline
  timeline: TimelineEvent[];
  
  // Invoice
  invoice?: {
    url: string; // Vercel Blob Storage URL
    fileName: string; // Original filename
    uploadedAt: Date | string; // Upload timestamp
    uploadedBy: string; // Admin/staff user ID who uploaded it
    pathname?: string;
  };
  
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
  documents?: ShipmentDocument[];
}

export interface TimelineEvent {
  status: string;
  location: string;
  date: Date | string;
  time: string;
  completed: boolean;
  imageUrl?: string; // Vercel Blob Storage URL for update image
  imageName?: string; // Original filename of the image
  details?: string[]; // Human-readable summary of fields changed in this update
}

// Payment Proof types
export interface PaymentProof {
  _id?: string;
  paymentId: string; // Auto-generated ID (PAY######)
  trackingId: string; // Reference to shipment tracking ID
  shipmentId: string; // Reference to shipment _id
  userId?: string; // Reference to dashboard user; partner submissions may not have one
  publicId?: string;
  organizationId?: string;
  apiClientId?: string;
  environment?: 'test' | 'live';
  shipmentPublicId?: string;
  submittedVia?: 'dashboard' | 'partner_api';
  
  // Payment Details
  amount: number; // Amount paid in USD
  currency?: string;
  paymentMethod: 'mobile-money' | 'bank-transfer' | 'cash' | 'other';
  paymentMethodDetails?: string; // Additional details (e.g., MTN, Vodafone, etc.)
  
  // Proof Image
  proofImageUrl: string; // Vercel Blob Storage URL
  proofImageName: string; // Original filename
  proofs?: ShipmentDocument[];
  
  // Status
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string; // Admin user ID who verified
  verifiedAt?: Date | string;
  rejectionReason?: string;
  
  // Metadata
  submittedAt: Date | string;
  updatedAt: Date | string;
  notes?: string; // User notes or admin notes
  
  // Computed fields for admin views
  userName?: string;
  userEmail?: string;
  shipmentStatus?: string;
}

// Notification types
export interface Notification {
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'update' | 'delivery' | 'pending' | 'shipment' | 'support';
  isRead: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  readAt?: Date | string;
  relatedShipmentId?: string;
  relatedTicketId?: string;
}

// Support Ticket types
export interface SupportTicket {
  _id?: string;
  userId: string;
  ticketNumber: string; // Auto-generated unique ticket number
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category?: 'shipment' | 'billing' | 'account' | 'technical' | 'general';
  relatedShipmentId?: string; // Optional reference to Shipment
  
  // Response
  responses?: TicketResponse[];
  
  // User info for admin views
  userName?: string;
  userEmail?: string;
  user?: string; // Computed field from firstName + lastName
  
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string;
}

// Admin support ticket with enriched user data
export interface AdminSupportTicket extends Omit<SupportTicket, 'userName' | 'userEmail'> {
  user: string; // Computed field from firstName + lastName
  userEmail: string; // User's email
}

export interface TicketResponse {
  message: string;
  respondedBy: string; // Admin/Staff name
  respondedAt: Date | string;
  isStaff: boolean;
}

// Staff types
export interface Staff {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'administrator' | 'manager' | 'operator' | 'support' | 'driver' | 'warehouse-staff';
  department: string;
  joinDate: Date | string;
  status: 'active' | 'on-leave' | 'suspended';
  permissions?: string[];
  salary?: number;
  employeeId?: string;
  address?: string;
  city?: string;
  country?: string;
  emergencyContact?: EmergencyContact;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Transaction types
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
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt?: Date | string;
  refundedAt?: Date | string;
  refundReason?: string;
}

// Contact Submission types
export interface ContactSubmission {
  _id?: string;
  submissionId: string; // Auto-generated
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  source: 'contact-page' | 'contact-modal';
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  adminResponse?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Newsletter Subscription types
export interface NewsletterSubscription {
  _id?: string;
  email: string;
  source: 'footer-top' | 'footer-gallery';
  status: 'active' | 'unsubscribed';
  subscribedAt: Date | string;
  unsubscribedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Dashboard Stats types
export interface UserStats {
  shipments: {
    total: number;
    inTransit: number;
    pending: number;
    delivered: number;
  };
  recentShipments: RecentShipment[];
  recentActivities: Activity[];
  notifications: {
    unread: number;
  };
  supportTickets: {
    open: number;
  };
}

export interface AdminStats {
  stats: {
    totalRevenue: number;
    totalUsers: number;
    totalShipments: number;
    activeShipments: number;
  };
  monthlyRevenue: MonthlyRevenue[];
  shipmentStatusData: StatusData[];
  topRoutes: RouteData[];
  recentActivities: Activity[];
}

export interface RecentShipment {
  _id: string;
  trackingId: string;
  destination: string;
  status: string;
  estimatedDelivery?: Date | string;
  createdAt: Date | string;
  deltaNumber?: string;
}

export interface Activity {
  action: string;
  time: string;
  type: string;
  subjectRole?: 'user' | 'admin' | 'staff' | 'super_admin';
  createdAt: Date | string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface StatusData {
  name: string;
  value: number;
}

export interface RouteData {
  route: string;
  shipments: number;
  revenue: string;
}

// Analytics types
export interface AnalyticsData {
  totals: {
    shipments: number;
    users: number;
    activeUsers: number;
  };
  revenueTrends: MonthlyRevenue[];
  customerGrowth: CustomerGrowth[];
  servicePerformance: ServicePerformance[];
  performanceMetrics: {
    avgDeliveryTime: number;
    onTimeDeliveryRate: number;
    totalDelivered: number;
  };
}

export interface CustomerGrowth {
  month: string;
  newCustomers: number;
  activeCustomers: number;
}

export interface ServicePerformance {
  service: string;
  shipments: number;
  revenue: number;
}

export interface DeltaReportRow {
  customerName: string;
  /** Wholesale / purchase shop tracking numbers only (not shipment tracking ID) */
  wholesaleTrackingNumbers: string[];
  description: string;
  quantity: number;
  totalWeightKg: number;
}

// Pagination types
export interface PaginationData {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  skip: number;
}

// API Response types for different endpoints
export interface UsersResponse {
  users: UserWithStats[];
  stats: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
  };
}

export interface ShipmentsResponse {
  shipments: Shipment[];
  stats: {
    total: number;
    inTransit: number;
    delivered: number;
    pending: number;
    cancelled: number;
  };
  page: number;
  totalPages: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export interface SupportTicketsResponse {
  tickets: SupportTicket[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  page: number;
  totalPages: number;
}

export interface ContactSubmissionsResponse {
  submissions: ContactSubmission[];
  stats: {
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  page: number;
  totalPages: number;
}

export interface NewsletterSubscriptionsResponse {
  subscriptions: NewsletterSubscription[];
  stats: {
    total: number;
    active: number;
    unsubscribed: number;
    topSource: number;
    gallerySource: number;
  };
  page: number;
  totalPages: number;
}

// Form data types
export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  bio?: string;
  profileImage?: string;
}

export interface ShipmentFormData {
  userId: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderCountry: string;
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverCountry: string;
  packageType: 'document' | 'parcel' | 'package' | 'fragile' | 'electronics' | 'other';
  weight: number;
  dimensions?: string;
  quantity: number;
  description: string;
  declaredValue: number;
  goodsType?: 'normal' | 'special' | 'battery';
  serviceType: 'standard' | 'express' | 'overnight' | 'economy';
  servicePrice: number;
  pickupDate?: string;
  estimatedDelivery?: string;
  specialInstructions?: string;
}

export interface SupportTicketFormData {
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'shipment' | 'billing' | 'account' | 'technical' | 'general';
  relatedShipmentId?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface NewsletterFormData {
  email: string;
}

// Modal props types
export interface ModalProps {
  onClose: () => void;
}

export interface ViewModalProps<T> extends ModalProps {
  data: T;
}

export interface EditModalProps<T> extends ModalProps {
  data: T;
  onSave: () => void;
}

export interface CreateModalProps extends ModalProps {
  onSave: () => void;
}

// Filter and search types
export interface FilterOptions {
  status?: string;
  priority?: string;
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// EmailJS types
export interface EmailJSParams {
  to_email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  user_email?: string;
  login_url?: string;
  reset_url?: string;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  month: string;
  revenue: number;
  shipments?: number;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  status?: number;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  success?: string;
}

// Component props types
export interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

export interface SectionProps {
  className?: string;
}

// Utility types
export type Status = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'delivered' | 'in-transit' | 'on-hold';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'user' | 'admin' | 'staff';
export type UserStatus = 'active' | 'suspended' | 'pending';
export type ServiceType = 'standard' | 'express' | 'overnight' | 'economy';
export type PackageType = 'document' | 'parcel' | 'package' | 'fragile' | 'electronics' | 'other';
export type PaymentMethod = 'credit-card' | 'debit-card' | 'paypal' | 'bank-transfer' | 'cash';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'AED';

// MongoDB Query types
export interface MongoQuery {
  [key: string]: unknown;
}

export interface MongoUpdateData {
  [key: string]: unknown;
}
