export interface Staff {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'administrator' | 'manager' | 'operator' | 'support' | 'driver' | 'warehouse-staff';
  department: string;
  joinDate: Date;
  status: 'active' | 'on-leave' | 'suspended';
  permissions?: string[];
  salary?: number;
  employeeId?: string;
  address?: string;
  city?: string;
  country?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

