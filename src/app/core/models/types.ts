export interface AppUser {
  email: string;
  name: string;
  role: 'Super Admin' | 'School Admin';
  institution: string; // "All" or a specific institution like "AKCP"
}

export interface Location {
  id: string;
  institution: string;
  building: string;
  floor: string;
  department: string;
  room: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  prefix: string;
  email?: string;
  active: boolean;
}

export interface MasterOption {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  gst?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  paymentTerms?: string;
  active: boolean;
}

export interface Asset {
  id: string; // Unique Asset ID
  name: string;
  category: string;
  barcode: string;
  qrCode: string;
  brand: string;
  model: string;
  serialNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchaseDate: string;
  purchaseOrder?: string;
  billNumber?: string;
  billDate?: string;
  vendor: string;
  warrantyDetails: string;
  status: 'Idle' | 'Active' | 'Under Service' | 'Transferred' | 'Missing' | 'Condemned' | 'Damaged';
  remarks: string;
  locationId: string; // reference to Location
  locationText?: string; // Formatted location text
  containerId?: string; // If placed inside a container (e.g. Fridge ID)
  isContainer: boolean; // True for Fridge, Cabinet, Storage Rack, etc.
}

export interface VerificationRequest {
  id: string;
  schoolAdminEmail: string;
  schoolAdminName: string;
  institution: string;
  assetId: string;
  assetName: string;
  changeType: 'Quantity Update' | 'Mark Damaged' | 'Mark Missing' | 'Add Asset' | 'Mark Active' | 'Mark Under Service' | 'Mark Condemned' | 'Status Update';
  previousValue: string;
  newValue: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
  comments?: string; // Super Admin comments
}

export interface AuditLog {
  id: string;
  date: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  reason: string;
}
