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
  status: 'Idle' | 'Active' | 'Under Service' | 'Transferred' | 'Missing' | 'Condemned';
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

// Initial Mock Seed Data
const SEED_USERS: AppUser[] = [
  { email: 'super@kare.edu', name: 'Dr. Suresh Kumar', role: 'Super Admin', institution: 'All' },
  { email: 'akcp@kare.edu', name: 'Prof. Ramesh Patel', role: 'School Admin', institution: 'AKCP' },
  { email: 'linga@kare.edu', name: 'Sister Mary Joseph', role: 'School Admin', institution: 'LINGA Global School' },
  { email: 'akcas@kare.edu', name: 'Dr. Anjali Verma', role: 'School Admin', institution: 'AKCAS' },
  { email: 'cshm@kare.edu', name: 'Dr. R. Banupriya', role: 'School Admin', institution: 'CSHM' }
];

const SEED_LOCATIONS: Location[] = [
  { id: 'LOC-001', institution: 'AKCP', building: 'Biotech Block', floor: 'First Floor', department: 'Biotechnology', room: 'BT-101' },
  { id: 'LOC-002', institution: 'AKCP', building: 'Pharma Block', floor: 'Ground Floor', department: 'Pharmaceutics', room: 'PH-102' },
  { id: 'LOC-003', institution: 'KARE', building: 'Admin Block', floor: 'First Floor', department: 'Finance Office', room: 'FN-105' },
  { id: 'LOC-004', institution: 'LINGA Global School', building: 'Primary Block', floor: 'Ground Floor', department: 'Computer Lab', room: 'CL-02' },
  { id: 'LOC-005', institution: 'AKCAS', building: 'Science Block', floor: 'Second Floor', department: 'Chemistry', room: 'CH-201' },
  { id: 'LOC-CSHM-001', institution: 'CSHM', building: 'CSHM Annex', floor: 'Ground Floor', department: 'Catering Science', room: 'Basic Training Kitchen' },
  { id: 'LOC-CSHM-002', institution: 'CSHM', building: 'CSHM Annex', floor: 'Ground Floor', department: 'Catering Science', room: 'Training Restaurant' },
  { id: 'LOC-CSHM-003', institution: 'CSHM', building: 'CSHM Annex', floor: 'First Floor', department: 'Catering Science', room: 'Model Guest Room' }
];

const SEED_ASSETS: Asset[] = [
  {
    id: 'FR-AKCP-BT-F1-001',
    name: 'Scientific Refrigerator (Large)',
    category: 'Refrigerators',
    barcode: 'BAR-AKCP-FR-001',
    qrCode: 'FR-AKCP-BT-F1-001',
    brand: 'Samsung',
    model: 'SR-500X',
    serialNumber: 'SN-987234982',
    quantity: 1,
    unitPrice: 75000,
    totalPrice: 75000,
    purchaseDate: '2025-01-10',
    purchaseOrder: 'PO-AKCP-2025-001',
    billNumber: 'BILL-AKCP-1001',
    billDate: '2025-01-10',
    vendor: 'BioLabs Equipment Ltd.',
    warrantyDetails: '3 Years Warranty',
    status: 'Active',
    remarks: 'Acts as container for lab reagents and chemicals',
    locationId: 'LOC-001',
    isContainer: true
  },
  {
    id: 'CH-AKCP-BT-F1-002',
    name: 'Chemical A (Ethanol)',
    category: 'Lab Reagents',
    barcode: 'BAR-AKCP-CH-002',
    qrCode: 'CH-AKCP-BT-F1-002',
    brand: 'Merck',
    model: 'Pure Grade 99%',
    serialNumber: 'LOT-ETH-2026',
    quantity: 120,
    unitPrice: 350,
    totalPrice: 42000,
    purchaseDate: '2026-02-15',
    purchaseOrder: 'PO-AKCP-2026-042',
    billNumber: 'BILL-AKCP-2098',
    billDate: '2026-02-15',
    vendor: 'Merck Chemicals',
    warrantyDetails: 'Expiry: 2028-02',
    status: 'Active',
    remarks: 'Stored inside Refrigerator FR-AKCP-BT-F1-001',
    locationId: 'LOC-001',
    containerId: 'FR-AKCP-BT-F1-001',
    isContainer: false
  },
  {
    id: 'CH-AKCP-BT-F1-003',
    name: 'Chemical B (Methanol)',
    category: 'Lab Reagents',
    barcode: 'BAR-AKCP-CH-003',
    qrCode: 'CH-AKCP-BT-F1-003',
    brand: 'Sigma-Aldrich',
    model: 'HPLC Grade',
    serialNumber: 'LOT-METH-1092',
    quantity: 80,
    unitPrice: 400,
    totalPrice: 32000,
    purchaseDate: '2026-03-01',
    purchaseOrder: 'PO-AKCP-2026-045',
    billNumber: 'BILL-AKCP-2122',
    billDate: '2026-03-01',
    vendor: 'Sigma Biotech',
    warrantyDetails: 'Expiry: 2027-09',
    status: 'Active',
    remarks: 'Stored inside Refrigerator FR-AKCP-BT-F1-001',
    locationId: 'LOC-001',
    containerId: 'FR-AKCP-BT-F1-001',
    isContainer: false
  },
  {
    id: 'SK-AKCP-BT-F1-004',
    name: 'Sample Testing Kits',
    category: 'Sample Kits',
    barcode: 'BAR-AKCP-SK-004',
    qrCode: 'SK-AKCP-BT-F1-004',
    brand: 'Roche Diagnostics',
    model: 'KARE-V1',
    serialNumber: 'LOT-RC-402',
    quantity: 50,
    unitPrice: 1200,
    totalPrice: 60000,
    purchaseDate: '2026-04-10',
    purchaseOrder: 'PO-AKCP-2026-099',
    billNumber: 'BILL-AKCP-2349',
    billDate: '2026-04-10',
    vendor: 'Roche India',
    warrantyDetails: 'Expiry: 2026-12',
    status: 'Active',
    remarks: 'Stored inside Refrigerator FR-AKCP-BT-F1-001',
    locationId: 'LOC-001',
    containerId: 'FR-AKCP-BT-F1-001',
    isContainer: false
  },
  {
    id: 'PC-LINGA-PR-G-001',
    name: 'HP EliteDesk Desktop PC',
    category: 'Computers',
    barcode: 'BAR-LINGA-PC-001',
    qrCode: 'PC-LINGA-PR-G-001',
    brand: 'HP',
    model: 'EliteDesk 800 G9',
    serialNumber: 'HP-SN-8712398',
    quantity: 25,
    unitPrice: 55000,
    totalPrice: 1375000,
    purchaseDate: '2024-11-20',
    purchaseOrder: 'PO-LINGA-2024-012',
    billNumber: 'BILL-LINGA-5541',
    billDate: '2024-11-20',
    vendor: 'HP Retail Plaza',
    warrantyDetails: '5 Years Extended Warranty',
    status: 'Active',
    remarks: 'Primary Computer Lab systems',
    locationId: 'LOC-004',
    isContainer: false
  },
  {
    id: 'PJ-AKCAS-SC-F2-001',
    name: 'Epson Interactive Projector',
    category: 'Projectors',
    barcode: 'BAR-AKCAS-PJ-001',
    qrCode: 'PJ-AKCAS-SC-F2-001',
    brand: 'Epson',
    model: 'EB-725Wi',
    serialNumber: 'EP-SN-23098',
    quantity: 1,
    unitPrice: 95000,
    totalPrice: 95000,
    purchaseDate: '2025-05-18',
    purchaseOrder: 'PO-AKCAS-2025-081',
    billNumber: 'BILL-AKCAS-9981',
    billDate: '2025-05-18',
    vendor: 'Epson Projector World',
    warrantyDetails: '2 Years Lamp Warranty',
    status: 'Active',
    remarks: 'Smart Chemistry Classroom',
    locationId: 'LOC-005',
    isContainer: false
  },
  {
    id: 'AC-KARE-AD-F1-001',
    name: 'Daikin Split Air Conditioner 2 Ton',
    category: 'Air Conditioners',
    barcode: 'BAR-KARE-AC-001',
    qrCode: 'AC-KARE-AD-F1-001',
    brand: 'Daikin',
    model: 'DK-FTKF60',
    serialNumber: 'DK-SN-390234',
    quantity: 2,
    unitPrice: 48000,
    totalPrice: 96000,
    purchaseDate: '2024-03-12',
    purchaseOrder: 'PO-KARE-2024-004',
    billNumber: 'BILL-KARE-0451',
    billDate: '2024-03-12',
    vendor: 'Daikin Comfort Zone',
    warrantyDetails: '10 Years Compressor Warranty',
    status: 'Active',
    remarks: 'Installed in Finance Room',
    locationId: 'LOC-003',
    isContainer: false
  },
  {
    id: 'REF-CSHM-BTK-001',
    name: 'Commercial Refrigerator (Large)',
    category: 'Kitchen Equipment',
    barcode: 'BAR-CSHM-REF-001',
    qrCode: 'REF-CSHM-BTK-001',
    brand: 'Samsung',
    model: 'SR-Kitchen-500',
    serialNumber: 'SN-REF-998822',
    quantity: 1,
    unitPrice: 85000,
    totalPrice: 85000,
    purchaseDate: '2023-08-12',
    purchaseOrder: 'PO-CSHM-2023-098',
    billNumber: 'BILL-CSHM-9981',
    billDate: '2023-08-12',
    vendor: 'Samsung Business Solutions',
    warrantyDetails: '5 Years Compressor Warranty',
    status: 'Active',
    remarks: 'Primary refrigeration unit for Basic Training Kitchen. Acts as a container for hand blender and ingredients.',
    locationId: 'LOC-CSHM-001',
    isContainer: true
  },
  {
    id: 'BL-CSHM-BTK-002',
    name: 'Phillips Hand Blender',
    category: 'Kitchen Appliances',
    barcode: 'BAR-CSHM-BL-002',
    qrCode: 'BL-CSHM-BTK-002',
    brand: 'Phillips',
    model: 'HL1655/00',
    serialNumber: 'SN-BL-33441',
    quantity: 1,
    unitPrice: 2500,
    totalPrice: 2500,
    purchaseDate: '2024-04-10',
    purchaseOrder: 'PO-CSHM-2024-012',
    billNumber: 'BILL-CSHM-1124',
    billDate: '2024-04-10',
    vendor: 'Phillips Home Appliances',
    warrantyDetails: '2 Years Product Warranty',
    status: 'Active',
    remarks: 'Stored inside Refrigerator REF-CSHM-BTK-001',
    locationId: 'LOC-CSHM-001',
    containerId: 'REF-CSHM-BTK-001',
    isContainer: false
  },
  {
    id: 'MO-CSHM-BTK-003',
    name: 'LG Microwave Oven',
    category: 'Kitchen Appliances',
    barcode: 'BAR-CSHM-MO-003',
    qrCode: 'MO-CSHM-BTK-003',
    brand: 'LG',
    model: 'MC2886BRUM',
    serialNumber: 'SN-MO-55662',
    quantity: 1,
    unitPrice: 18000,
    totalPrice: 18000,
    purchaseDate: '2023-11-05',
    purchaseOrder: 'PO-CSHM-2023-144',
    billNumber: 'BILL-CSHM-3312',
    billDate: '2023-11-05',
    vendor: 'LG Electronics',
    warrantyDetails: '1 Year Product, 5 Years Magnetron Warranty',
    status: 'Active',
    remarks: 'Used for baking and quick training modules.',
    locationId: 'LOC-CSHM-001',
    isContainer: false
  },
  {
    id: 'MG-CSHM-BTK-004',
    name: 'Preethi Mixer Grinder',
    category: 'Kitchen Appliances',
    barcode: 'BAR-CSHM-MG-004',
    qrCode: 'MG-CSHM-BTK-004',
    brand: 'Preethi',
    model: 'Blue Leaf Gold',
    serialNumber: 'SN-MG-77881',
    quantity: 1,
    unitPrice: 6500,
    totalPrice: 6500,
    purchaseDate: '2024-02-18',
    purchaseOrder: 'PO-CSHM-2024-002',
    billNumber: 'BILL-CSHM-1189',
    billDate: '2024-02-18',
    vendor: 'Preethi Appliances',
    warrantyDetails: '2 Years Warranty',
    status: 'Active',
    remarks: 'Used for grinding masalas in training kitchen.',
    locationId: 'LOC-CSHM-001',
    isContainer: false
  },
  {
    id: 'OV-CSHM-BTK-005',
    name: 'Commercial Oven',
    category: 'Kitchen Equipment',
    barcode: 'BAR-CSHM-OV-005',
    qrCode: 'OV-CSHM-BTK-005',
    brand: 'Bajaj',
    model: 'OTG 50L',
    serialNumber: 'SN-OV-99881',
    quantity: 1,
    unitPrice: 35000,
    totalPrice: 35000,
    purchaseDate: '2022-05-20',
    purchaseOrder: 'PO-CSHM-2022-051',
    billNumber: 'BILL-CSHM-0982',
    billDate: '2022-05-20',
    vendor: 'Bajaj Electricals',
    warrantyDetails: '2 Years Warranty',
    status: 'Active',
    remarks: 'Main deck oven for baking instruction.',
    locationId: 'LOC-CSHM-001',
    isContainer: false
  },
  {
    id: 'CT-CSHM-TR-006',
    name: 'All-Purpose Spoon (AP Spoon)',
    category: 'Cutlery',
    barcode: 'BAR-CSHM-CT-006',
    qrCode: 'CT-CSHM-TR-006',
    brand: 'Clay Craft',
    model: 'Classic AP',
    serialNumber: 'N/A',
    quantity: 36,
    unitPrice: 120,
    totalPrice: 4320,
    purchaseDate: '2024-10-15',
    purchaseOrder: 'PO-CSHM-2024-098',
    billNumber: 'BILL-CSHM-8712',
    billDate: '2024-10-15',
    vendor: 'Hotelware Traders',
    warrantyDetails: 'N/A',
    status: 'Active',
    remarks: 'Training restaurant inventory.',
    locationId: 'LOC-CSHM-002',
    isContainer: false
  },
  {
    id: 'TB-CSHM-TR-007',
    name: 'Round Dining Table',
    category: 'Furniture',
    barcode: 'BAR-CSHM-TB-007',
    qrCode: 'TB-CSHM-TR-007',
    brand: 'Godrej Interio',
    model: 'Round Banquet',
    serialNumber: 'N/A',
    quantity: 2,
    unitPrice: 12000,
    totalPrice: 24000,
    purchaseDate: '2023-01-22',
    purchaseOrder: 'PO-CSHM-2023-001',
    billNumber: 'BILL-CSHM-0051',
    billDate: '2023-01-22',
    vendor: 'Godrej Retail',
    warrantyDetails: '1 Year Warranty',
    status: 'Active',
    remarks: 'Used for table setup practice.',
    locationId: 'LOC-CSHM-002',
    isContainer: false
  },
  {
    id: 'LD-CSHM-BTK-008',
    name: 'Dosa Ladle',
    category: 'Kitchen Utensils',
    barcode: 'BAR-CSHM-LD-008',
    qrCode: 'LD-CSHM-BTK-008',
    brand: 'Local Artisan',
    model: 'Stainless Steel 12 inch',
    serialNumber: 'N/A',
    quantity: 2,
    unitPrice: 150,
    totalPrice: 300,
    purchaseDate: '2015-06-15',
    purchaseOrder: 'PO-CSHM-2015-010',
    billNumber: 'BILL-CSHM-2015-010',
    billDate: '2015-06-15',
    vendor: 'Local Market',
    warrantyDetails: 'N/A',
    status: 'Condemned',
    remarks: 'Damaged during practical. Recommended for condemnation by Dr. J. Prabhu.',
    locationId: 'LOC-CSHM-001',
    isContainer: false
  },
  {
    id: 'LD-CSHM-BTK-009',
    name: 'Frying Ladle',
    category: 'Kitchen Utensils',
    barcode: 'BAR-CSHM-LD-009',
    qrCode: 'LD-CSHM-BTK-009',
    brand: 'Local Artisan',
    model: 'Stainless Steel Mesh',
    serialNumber: 'N/A',
    quantity: 1,
    unitPrice: 200,
    totalPrice: 200,
    purchaseDate: '2015-06-15',
    purchaseOrder: 'PO-CSHM-2015-011',
    billNumber: 'BILL-CSHM-2015-011',
    billDate: '2015-06-15',
    vendor: 'Local Market',
    warrantyDetails: 'N/A',
    status: 'Condemned',
    remarks: 'Damaged during practical. Recommended for condemnation by Dr. J. Prabhu.',
    locationId: 'LOC-CSHM-001',
    isContainer: false
  },
  {
    id: 'MM-CSHM-BTK-010',
    name: 'Meat Mincer',
    category: 'Kitchen Equipment',
    barcode: 'BAR-CSHM-MM-010',
    qrCode: 'MM-CSHM-BTK-010',
    brand: 'Hobart',
    model: 'M-100',
    serialNumber: 'SN-MM-12098',
    quantity: 1,
    unitPrice: 15000,
    totalPrice: 15000,
    purchaseDate: '2015-07-20',
    purchaseOrder: 'PO-CSHM-2015-020',
    billNumber: 'BILL-CSHM-2015-020',
    billDate: '2015-07-20',
    vendor: 'Hobart India',
    warrantyDetails: 'Expired',
    status: 'Condemned',
    remarks: 'Old and got damaged. Recommended for condemnation by Dr. J. Prabhu.',
    locationId: 'LOC-CSHM-001',
    isContainer: false
  },
  {
    id: 'PM-CSHM-BTK-011',
    name: 'Pasta Machine',
    category: 'Kitchen Equipment',
    barcode: 'BAR-CSHM-PM-011',
    qrCode: 'PM-CSHM-BTK-011',
    brand: 'Imperia',
    model: 'SP-150',
    serialNumber: 'SN-PM-4453',
    quantity: 1,
    unitPrice: 12000,
    totalPrice: 12000,
    purchaseDate: '2015-08-10',
    purchaseOrder: 'PO-CSHM-2015-030',
    billNumber: 'BILL-CSHM-2015-030',
    billDate: '2015-08-10',
    vendor: 'Italian Import Co.',
    warrantyDetails: 'Expired',
    status: 'Condemned',
    remarks: 'Old and got damaged. Recommended for condemnation by Dr. J. Prabhu.',
    locationId: 'LOC-CSHM-001',
    isContainer: false
  },
  {
    id: 'GL-CSHM-TR-012',
    name: 'Brandy Balloon Glass',
    category: 'Glassware',
    barcode: 'BAR-CSHM-GL-012',
    qrCode: 'GL-CSHM-TR-012',
    brand: 'Ocean Glass',
    model: 'Brandy-300',
    serialNumber: 'N/A',
    quantity: 1,
    unitPrice: 180,
    totalPrice: 180,
    purchaseDate: '2015-09-05',
    purchaseOrder: 'PO-CSHM-2015-040',
    billNumber: 'BILL-CSHM-2015-040',
    billDate: '2015-09-05',
    vendor: 'Ocean Distributors',
    warrantyDetails: 'N/A',
    status: 'Condemned',
    remarks: 'Broken during practical. Recommended for condemnation by Dr. S. Senthilkumar.',
    locationId: 'LOC-CSHM-002',
    isContainer: false
  },
  {
    id: 'GL-CSHM-TR-013',
    name: 'Pilsner Glass',
    category: 'Glassware',
    barcode: 'BAR-CSHM-GL-013',
    qrCode: 'GL-CSHM-TR-013',
    brand: 'Ocean Glass',
    model: 'Pilsner-400',
    serialNumber: 'N/A',
    quantity: 4,
    unitPrice: 150,
    totalPrice: 600,
    purchaseDate: '2015-09-05',
    purchaseOrder: 'PO-CSHM-2015-041',
    billNumber: 'BILL-CSHM-2015-041',
    billDate: '2015-09-05',
    vendor: 'Ocean Distributors',
    warrantyDetails: 'N/A',
    status: 'Condemned',
    remarks: 'Broken during practical. Recommended for condemnation by Dr. S. Senthilkumar.',
    locationId: 'LOC-CSHM-002',
    isContainer: false
  },
  {
    id: 'TC-CSHM-TR-014',
    name: 'Tea Cup with Saucer',
    category: 'Crockery',
    barcode: 'BAR-CSHM-TC-014',
    qrCode: 'TC-CSHM-TR-014',
    brand: 'Clay Craft',
    model: 'TeaClassic',
    serialNumber: 'N/A',
    quantity: 2,
    unitPrice: 250,
    totalPrice: 500,
    purchaseDate: '2023-05-14',
    purchaseOrder: 'PO-CSHM-2023-080',
    billNumber: 'BILL-CSHM-0870',
    billDate: '2023-05-14',
    vendor: 'Hotelware Traders',
    warrantyDetails: 'N/A',
    status: 'Missing',
    remarks: 'Missing since audit. Staff responsible: Mrs. R. Banupriya.',
    locationId: 'LOC-CSHM-002',
    isContainer: false
  },
  {
    id: 'ML-CSHM-BTK-015',
    name: 'Tart Mould (Small)',
    category: 'Kitchen Utensils',
    barcode: 'BAR-CSHM-ML-015',
    qrCode: 'ML-CSHM-BTK-015',
    brand: 'Local Baker',
    model: 'Tart-S',
    serialNumber: 'N/A',
    quantity: 5,
    unitPrice: 40,
    totalPrice: 200,
    purchaseDate: '2024-01-10',
    purchaseOrder: 'PO-CSHM-2024-050',
    billNumber: 'BILL-CSHM-0520',
    billDate: '2024-01-10',
    vendor: 'Local Baker Suppliers',
    warrantyDetails: 'N/A',
    status: 'Missing',
    remarks: 'Missing since audit. Staff responsible: Mrs. R. Banupriya.',
    locationId: 'LOC-CSHM-001',
    isContainer: false
  },
  {
    id: 'ML-CSHM-BTK-016',
    name: 'Muffin Mould (Small)',
    category: 'Kitchen Utensils',
    barcode: 'BAR-CSHM-ML-016',
    qrCode: 'ML-CSHM-BTK-016',
    brand: 'Local Baker',
    model: 'Muffin-S',
    serialNumber: 'N/A',
    quantity: 5,
    unitPrice: 60,
    totalPrice: 300,
    purchaseDate: '2024-01-10',
    purchaseOrder: 'PO-CSHM-2024-051',
    billNumber: 'BILL-CSHM-0521',
    billDate: '2024-01-10',
    vendor: 'Local Baker Suppliers',
    warrantyDetails: 'N/A',
    status: 'Missing',
    remarks: 'Missing since audit. Staff responsible: Mrs. R. Banupriya.',
    locationId: 'LOC-CSHM-001',
    isContainer: false
  }
];;

const SEED_REQUESTS: VerificationRequest[] = [
  {
    id: 'REQ-001',
    schoolAdminEmail: 'akcp@kare.edu',
    schoolAdminName: 'Prof. Ramesh Patel',
    institution: 'AKCP',
    assetId: 'CH-AKCP-BT-F1-002',
    assetName: 'Chemical A (Ethanol)',
    changeType: 'Quantity Update',
    previousValue: '120 Units',
    newValue: '115 Units',
    reason: '5 bottles damaged during laboratory practicals',
    status: 'Pending',
    timestamp: '2026-06-18 14:32:00'
  }
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    date: '2026-06-18 14:32:00',
    userEmail: 'akcp@kare.edu',
    userName: 'Prof. Ramesh Patel',
    action: 'Submitted stock verification request',
    details: 'Asset: Chemical A (Ethanol). Updated quantity: 120 -> 115.',
    reason: '5 bottles damaged during laboratory practicals'
  }
];

export class MockDatabase {
  static init() {
    const storedUsers = localStorage.getItem('kare_users');
    let needsReset = false;
    
    if (storedUsers) {
      try {
        const users = JSON.parse(storedUsers);
        if (Array.isArray(users) && !users.some(u => u.email === 'cshm@kare.edu')) {
          needsReset = true;
        }
      } catch (e) {
        needsReset = true;
      }
    } else {
      needsReset = true;
    }

    if (needsReset) {
      console.warn('Stale mock database cache detected. Re-initializing mock database with CSHM support.');
      localStorage.setItem('kare_users', JSON.stringify(SEED_USERS));
      localStorage.setItem('kare_locations', JSON.stringify(SEED_LOCATIONS));
      localStorage.setItem('kare_assets', JSON.stringify(SEED_ASSETS));
      localStorage.setItem('kare_requests', JSON.stringify(SEED_REQUESTS));
      localStorage.setItem('kare_audit_logs', JSON.stringify(SEED_AUDIT_LOGS));
    } else {
      if (!localStorage.getItem('kare_users')) {
        localStorage.setItem('kare_users', JSON.stringify(SEED_USERS));
      }
      if (!localStorage.getItem('kare_locations')) {
        localStorage.setItem('kare_locations', JSON.stringify(SEED_LOCATIONS));
      }
      if (!localStorage.getItem('kare_assets')) {
        localStorage.setItem('kare_assets', JSON.stringify(SEED_ASSETS));
      }
      if (!localStorage.getItem('kare_requests')) {
        localStorage.setItem('kare_requests', JSON.stringify(SEED_REQUESTS));
      }
      if (!localStorage.getItem('kare_audit_logs')) {
        localStorage.setItem('kare_audit_logs', JSON.stringify(SEED_AUDIT_LOGS));
      }
    }
  }

  static getLocations(): Location[] {
    this.init();
    return JSON.parse(localStorage.getItem('kare_locations') || '[]');
  }

  static addLocation(loc: Location) {
    this.init();
    const locs = this.getLocations();
    locs.push(loc);
    localStorage.setItem('kare_locations', JSON.stringify(locs));
  }

  static getAssets(): Asset[] {
    this.init();
    const assets: Asset[] = JSON.parse(localStorage.getItem('kare_assets') || '[]');
    const locs = this.getLocations();
    return assets.map(a => {
      const loc = locs.find(l => l.id === a.locationId);
      if (loc) {
        a.locationText = `${loc.institution} -> ${loc.building} -> ${loc.floor} -> ${loc.department} -> ${loc.room}`;
      } else {
        a.locationText = 'Unknown';
      }
      return a;
    });
  }

  static getAssetById(id: string): Asset | undefined {
    return this.getAssets().find(a => a.id === id);
  }

  static saveAssets(assets: Asset[]) {
    localStorage.setItem('kare_assets', JSON.stringify(assets));
  }

  static addAsset(asset: Asset) {
    const assets = this.getAssets();
    assets.push(asset);
    this.saveAssets(assets);
  }

  static updateAsset(updatedAsset: Asset) {
    const assets = this.getAssets().map(a => a.id === updatedAsset.id ? updatedAsset : a);
    this.saveAssets(assets);
  }

  static deleteAsset(id: string) {
    const assets = this.getAssets().filter(a => a.id !== id);
    this.saveAssets(assets);
  }

  static getRequests(): VerificationRequest[] {
    this.init();
    return JSON.parse(localStorage.getItem('kare_requests') || '[]');
  }

  static saveRequests(reqs: VerificationRequest[]) {
    localStorage.setItem('kare_requests', JSON.stringify(reqs));
  }

  static addRequest(req: VerificationRequest) {
    const reqs = this.getRequests();
    reqs.push(req);
    this.saveRequests(reqs);
  }

  static getAuditLogs(): AuditLog[] {
    this.init();
    return JSON.parse(localStorage.getItem('kare_audit_logs') || '[]');
  }

  static addAuditLog(log: AuditLog) {
    this.init();
    const logs = this.getAuditLogs();
    logs.unshift(log); // Add to top (newest first)
    localStorage.setItem('kare_audit_logs', JSON.stringify(logs));
  }
}
