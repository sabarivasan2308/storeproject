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
  location?: string;
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
  billId?: string;
  billItemId?: string;
  productId?: string;
  schoolId?: string;
  departmentId?: string;
  department?: string;
  building?: string;
  room?: string;
  locationLabel?: string;
  generatedFromProcurement?: boolean;
  vendor: string;
  warrantyDetails: string;
  status: 'Idle' | 'Active' | 'Under Service' | 'Transferred' | 'Missing' | 'Condemned' | 'Damaged';
  remarks: string;
  locationId: string; // reference to Location
  locationText?: string; // Formatted location text
  containerId?: string; // If placed inside a container (e.g. Fridge ID)
  isContainer: boolean; // True for Fridge, Cabinet, Storage Rack, etc.
}

export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Cancelled';

export interface ProcurementBill {
  id: string;
  billNumber: string;
  purchaseOrderNumber: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  schoolId: string;
  schoolName: string;
  departmentId: string;
  departmentName: string;
  purchaseDate: string;
  billingDate: string;
  gstPercent: number;
  gstAmount: number;
  transportCharges: number;
  packingCharges: number;
  insuranceCharges: number;
  otherCharges: number;
  discount: number;
  subtotal: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  invoiceAttachmentIds: string[];
  remarks: string;
  createdBy: string;
  approvedBy: string;
  approvalDate: string;
  associatedAssetIds: string[];
  createdAt: string;
}

export interface ProcurementBillItem {
  id: string;
  billId: string;
  productId: string;
  productName: string;
  category: string;
  brand: string;
  model: string;
  manufacturer: string;
  specifications: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
  gstAmount: number;
  itemTotal: number;
  warrantyDetails: string;
  locationId: string;
  generatedAssetIds: string[];
}

export interface ProductMaster {
  id: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  manufacturer: string;
  specifications: string;
  suggestedWarranty: string;
  imageUrl?: string;
  active: boolean;
}

export interface Department {
  id: string;
  schoolId: string;
  schoolName: string;
  name: string;
  active: boolean;
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  fromDepartmentId: string;
  fromDepartmentName: string;
  toDepartmentId: string;
  toDepartmentName: string;
  transferDate: string;
  transferReason: string;
  transferredBy: string;
  approvedBy: string;
}

export interface ProcurementDraftItem {
  productName: string;
  category: string;
  brand: string;
  model: string;
  manufacturer: string;
  specifications: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
  warrantyDetails: string;
  locationId: string;
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
