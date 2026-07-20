import { Vendor, ProcurementBill, ProductMaster, AssetTransfer, AppUser, Location, Asset, VerificationRequest, AuditLog, MaintenanceRecord, WarrantyRecord } from '../models/types';

// Initial Mock Seed Data
const SEED_USERS: AppUser[] = [
  { email: 'super@kare.edu', name: 'Dr. Suresh Kumar', role: 'Super Admin', institution: 'All' },
  { email: 'kare@kare.edu', name: 'Mr. Rajesh Kannan', role: 'School Admin', institution: 'KARE' },
  { email: 'akcp@kare.edu', name: 'Prof. Ramesh Patel', role: 'School Admin', institution: 'AKCP' },
  { email: 'linga@kare.edu', name: 'Sister Mary Joseph', role: 'School Admin', institution: 'LINGA Global School' },
  { email: 'akcas@kare.edu', name: 'Dr. Anjali Verma', role: 'School Admin', institution: 'AKCAS' },
  { email: 'cshm@kare.edu', name: 'Dr. R. Banupriya', role: 'School Admin', institution: 'CSHM' },
  { email: 'akbed@kare.edu', name: 'Dr. S. Rajan', role: 'School Admin', institution: 'AK B.Ed College' },
  { email: 'kmch@kare.edu', name: 'Dr. P. Sandeep', role: 'School Admin', institution: 'KMCH' }
];

const SEED_LOCATIONS: Location[] = [
  { id: 'LOC-001', institution: 'AKCP', building: 'Biotech Block', floor: 'First Floor', department: 'Biotechnology', room: 'BT-101' },
  { id: 'LOC-002', institution: 'AKCP', building: 'Pharma Block', floor: 'Ground Floor', department: 'Pharmaceutics', room: 'PH-102' },
  { id: 'LOC-003', institution: 'KARE', building: 'Admin Block', floor: 'First Floor', department: 'Finance Office', room: 'FN-105' },
  { id: 'LOC-004', institution: 'LINGA Global School', building: 'Primary Block', floor: 'Ground Floor', department: 'Computer Lab', room: 'CL-02' },
  { id: 'LOC-005', institution: 'AKCAS', building: 'Science Block', floor: 'Second Floor', department: 'Chemistry', room: 'CH-201' },
  { id: 'LOC-CSHM-001', institution: 'CSHM', building: 'CSHM Annex', floor: 'Ground Floor', department: 'Catering Science', room: 'Basic Training Kitchen' },
  { id: 'LOC-CSHM-002', institution: 'CSHM', building: 'CSHM Annex', floor: 'Ground Floor', department: 'Catering Science', room: 'Training Restaurant' },
  { id: 'LOC-CSHM-003', institution: 'CSHM', building: 'CSHM Annex', floor: 'First Floor', department: 'Catering Science', room: 'Model Guest Room' },
  { id: 'LOC-AKBED-001', institution: 'AK B.Ed College', building: 'Education Block', floor: 'Ground Floor', department: 'Pedagogy', room: 'ED-101' },
  { id: 'LOC-KMCH-001', institution: 'KMCH', building: 'Medical Block', floor: 'First Floor', department: 'Clinical Medicine', room: 'MD-201' }
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
  },
  {
    id: 'PC-AKBED-001',
    name: 'Lenovo ThinkCentre PC',
    category: 'Computers',
    barcode: 'BAR-AKBED-PC-001',
    qrCode: 'PC-AKBED-001',
    brand: 'Lenovo',
    model: 'M70q',
    serialNumber: 'LN-SN-1122',
    quantity: 15,
    unitPrice: 42000,
    totalPrice: 630000,
    purchaseDate: '2025-06-10',
    purchaseOrder: 'PO-AKBED-2025-001',
    billNumber: 'BILL-AKBED-0011',
    billDate: '2025-06-10',
    vendor: 'Lenovo Commercial Store',
    warrantyDetails: '3 Years Onsite Warranty',
    status: 'Active',
    remarks: 'For B.Ed student lab classwork',
    locationId: 'LOC-AKBED-001',
    isContainer: false
  },
  {
    id: 'PM-KMCH-001',
    name: 'Patient Monitor Pulse Oximeter',
    category: 'Medical Equipment',
    barcode: 'BAR-KMCH-PM-001',
    qrCode: 'PM-KMCH-001',
    brand: 'Philips',
    model: 'Goldway G30E',
    serialNumber: 'PL-SN-9988',
    quantity: 5,
    unitPrice: 85000,
    totalPrice: 425000,
    purchaseDate: '2025-02-15',
    purchaseOrder: 'PO-KMCH-2025-004',
    billNumber: 'BILL-KMCH-0450',
    billDate: '2025-02-15',
    vendor: 'Philips Health Systems',
    warrantyDetails: '2 Years Medical Warranty',
    status: 'Active',
    remarks: 'For emergency ward patient monitoring',
    locationId: 'LOC-KMCH-001',
    isContainer: false
  },
  {
    id: 'PR-CSHM-001',
    name: 'Preethi Mixer Grinder (Damaged)',
    category: 'Kitchen Appliances',
    barcode: 'BAR-CSHM-MG-005',
    qrCode: 'PR-CSHM-001',
    brand: 'Preethi',
    model: 'Blue Leaf Gold',
    serialNumber: 'SN-MG-77882',
    quantity: 1,
    unitPrice: 6500,
    totalPrice: 6500,
    purchaseDate: '2024-02-18',
    purchaseOrder: 'PO-CSHM-2024-002',
    billNumber: 'BILL-CSHM-1189',
    billDate: '2024-02-18',
    vendor: 'Preethi Appliances',
    warrantyDetails: 'Jar coupling damaged during practicals',
    status: 'Damaged',
    remarks: 'Jar coupling damaged during practicals',
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
    status: 'Pending Super Admin',
    timestamp: '2026-06-18 14:32:00',
    comments: '',
    approverHistory: JSON.stringify([
      {
        status: 'Pending Department',
        updatedBy: 'akcp@kare.edu',
        updaterName: 'Prof. Ramesh Patel',
        timestamp: '2026-06-18 14:32:00',
        comments: 'Request created'
      },
      {
        status: 'Pending Super Admin',
        updatedBy: 'akcp-dept@kare.edu',
        updaterName: 'Dr. Head of Biotech',
        timestamp: '2026-06-18 15:00:00',
        comments: 'Approved by department head'
      }
    ]),
    rejectionReason: ''
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

const SEED_VENDORS: Vendor[] = [
  { id: 'VEND-001', name: 'Dell Technologies India', gst: '29AAAAA0000A1Z5', address: 'Dell India, Bangalore, Karnataka', phone: '+91-80-60001111', email: 'sales@dell.co.in', website: 'https://dell.co.in', paymentTerms: 'Net 30', active: true },
  { id: 'VEND-002', name: 'Laxmi Furniture House', gst: '33BBBBB1111B2Z6', address: '12, College Road, Madurai, Tamil Nadu', phone: '+91-452-2345678', email: 'laxmi.furniture@gmail.com', website: '', paymentTerms: 'Net 15', active: true },
  { id: 'VEND-003', name: 'Standard Scientific Supplies', gst: '33CCCCC2222C3Z7', address: '45, Industrial Estate, Sivakasi, Tamil Nadu', phone: '+91-4562-223344', email: 'info@stdscientific.com', website: 'https://stdscientific.com', paymentTerms: 'Cash on Delivery', active: true }
];

const SEED_PRODUCTS: ProductMaster[] = [
  { id: 'PROD-001', barcode: '8901234567890', name: 'Latitude 3440 Laptop', category: 'Computers', brand: 'Dell', model: 'Latitude 3440', manufacturer: 'Dell Inc.', specifications: 'Intel i5, 16GB RAM, 512GB SSD, 14" screen', suggestedWarranty: '36 Months', imageUrl: '', active: true },
  { id: 'PROD-002', barcode: '8901234567891', name: 'Ergonomic Office Chair', category: 'Furniture', brand: 'Laxmi', model: 'Ergo-Comfort', manufacturer: 'Laxmi Furniture', specifications: 'Mesh back, adjustable height, lumbar support', suggestedWarranty: '12 Months', imageUrl: '', active: true },
  { id: 'PROD-003', barcode: '8901234567892', name: 'Lab Autoclave Vertical', category: 'Medical Equipment', brand: 'Equitron', model: 'EQ-20', manufacturer: 'Equitron Med', specifications: '74 Liters, stainless steel, digital controller', suggestedWarranty: '24 Months', imageUrl: '', active: true }
];

const SEED_BILLS: ProcurementBill[] = [
  {
    id: 'BILL-001',
    billNumber: 'DELL-2026-004',
    purchaseOrderNumber: 'PO-2026-001',
    invoiceNumber: 'INV-DELL-9988',
    vendorId: 'VEND-001',
    vendorName: 'Dell Technologies India',
    schoolId: 'akcp',
    schoolName: 'AKCP',
    departmentId: 'AKCP:Biotechnology',
    departmentName: 'Biotechnology',
    purchaseDate: '2026-01-10',
    billingDate: '2026-01-12',
    gstPercent: 18,
    gstAmount: 18000,
    transportCharges: 1500,
    packingCharges: 500,
    insuranceCharges: 0,
    otherCharges: 0,
    discount: 2000,
    subtotal: 100000,
    grandTotal: 118000,
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer',
    invoiceAttachmentIds: [],
    remarks: 'Delivered and verified laptop batch.',
    createdBy: 'super@kare.edu',
    approvedBy: 'super@kare.edu',
    approvalDate: '2026-01-13',
    associatedAssetIds: ['FR-AKCP-BT-F1-001'],
    createdAt: '2026-01-10T10:00:00Z'
  }
];

const SEED_TRANSFERS: AssetTransfer[] = [
  {
    id: 'TRF-001',
    assetId: 'FR-AKCP-BT-F1-001',
    fromDepartmentId: 'LOC-001',
    fromDepartmentName: 'Biotechnology',
    toDepartmentId: 'LOC-001',
    toDepartmentName: 'Biotechnology',
    transferDate: '2025-01-10 11:00:00',
    transferReason: 'Initial placement on receipt',
    transferredBy: 'super@kare.edu',
    approvedBy: 'super@kare.edu'
  },
  {
    id: 'TRF-002',
    assetId: 'REF-CSHM-BTK-001',
    fromDepartmentId: 'LOC-CSHM-001',
    fromDepartmentName: 'Catering Science',
    toDepartmentId: 'LOC-CSHM-001',
    toDepartmentName: 'Catering Science',
    transferDate: '2023-08-12 10:00:00',
    transferReason: 'Initial setup in Basic Training Kitchen',
    transferredBy: 'super@kare.edu',
    approvedBy: 'super@kare.edu'
  }
];

const SEED_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'MNT-001',
    assetId: 'CP-AKCP-CSE-001',
    assetName: 'Dell OptiPlex 7090 Desktop',
    serviceDate: '2026-03-15',
    technicianName: 'Suresh Service Team',
    technicianContact: '+91 98765 43210',
    serviceType: 'Preventive',
    cost: 1500,
    description: 'Routine RAM & cooling fan cleaning and thermal paste re-application.',
    status: 'Completed',
    partsReplaced: 'Thermal Paste, Dust Filters',
    nextDueDate: '2026-09-15',
    schoolId: 'AKCP',
    createdBy: 'super@kare.edu',
    createdAt: '2026-03-15T10:00:00Z'
  },
  {
    id: 'MNT-002',
    assetId: 'MM-CSHM-BTK-010',
    assetName: 'Meat Mincer',
    serviceDate: '2026-06-01',
    technicianName: 'Hobart Care Technician',
    technicianContact: '+91 91234 56789',
    serviceType: 'Corrective',
    cost: 4500,
    description: 'Motor gear alignment and blade sharpening.',
    status: 'In Progress',
    partsReplaced: 'Blade Assembly',
    nextDueDate: '2026-12-01',
    schoolId: 'CSHM',
    createdBy: 'cshm@kare.edu',
    createdAt: '2026-06-01T14:30:00Z'
  }
];

const SEED_WARRANTY: WarrantyRecord[] = [
  {
    id: 'WAR-001',
    assetId: 'CP-AKCP-CSE-001',
    assetName: 'Dell OptiPlex 7090 Desktop',
    provider: 'Dell India Pvt Ltd',
    contactPerson: 'Karan Sharma',
    phone: '1800-425-4026',
    email: 'support@dell.co.in',
    startDate: '2024-01-15',
    expiryDate: '2027-01-15',
    amcCost: 12000,
    terms: '3-Year On-Site ProSupport Plus with Accidental Damage Protection',
    schoolId: 'AKCP',
    renewalAlertSent: false,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'WAR-002',
    assetId: 'MM-CSHM-BTK-010',
    assetName: 'Meat Mincer',
    provider: 'Hobart Equipment India',
    contactPerson: 'Anil Mehta',
    phone: '044-24567890',
    email: 'service@hobart.in',
    startDate: '2025-05-10',
    expiryDate: '2026-08-10',
    amcCost: 8500,
    terms: 'Annual Preventive Maintenance Contract (2 Free Inspections/Year)',
    schoolId: 'CSHM',
    renewalAlertSent: true,
    createdAt: '2025-05-10T00:00:00Z'
  }
];

export class MockDatabase {
  static init() {
    const storedUsers = localStorage.getItem('kare_users');
    let needsReset = false;
    
    if (storedUsers) {
      try {
        const users = JSON.parse(storedUsers);
        if (Array.isArray(users) && (!users.some(u => u.email === 'cshm@kare.edu') || !users.some(u => u.email === 'akbed@kare.edu') || !users.some(u => u.email === 'kare@kare.edu'))) {
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
      localStorage.setItem('kare_vendors', JSON.stringify(SEED_VENDORS));
      localStorage.setItem('kare_products', JSON.stringify(SEED_PRODUCTS));
      localStorage.setItem('kare_bills', JSON.stringify(SEED_BILLS));
      localStorage.setItem('kare_transfers', JSON.stringify(SEED_TRANSFERS));
      localStorage.setItem('kare_maintenance', JSON.stringify(SEED_MAINTENANCE));
      localStorage.setItem('kare_warranty', JSON.stringify(SEED_WARRANTY));
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
      if (!localStorage.getItem('kare_vendors')) {
        localStorage.setItem('kare_vendors', JSON.stringify(SEED_VENDORS));
      }
      if (!localStorage.getItem('kare_products')) {
        localStorage.setItem('kare_products', JSON.stringify(SEED_PRODUCTS));
      }
      if (!localStorage.getItem('kare_bills')) {
        localStorage.setItem('kare_bills', JSON.stringify(SEED_BILLS));
      }
      if (!localStorage.getItem('kare_transfers')) {
        localStorage.setItem('kare_transfers', JSON.stringify(SEED_TRANSFERS));
      }
      if (!localStorage.getItem('kare_maintenance')) {
        localStorage.setItem('kare_maintenance', JSON.stringify(SEED_MAINTENANCE));
      }
      if (!localStorage.getItem('kare_warranty')) {
        localStorage.setItem('kare_warranty', JSON.stringify(SEED_WARRANTY));
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

  // Vendors CRUD
  static getVendors(): Vendor[] {
    this.init();
    return JSON.parse(localStorage.getItem('kare_vendors') || '[]');
  }
  static saveVendors(vendors: Vendor[]) {
    localStorage.setItem('kare_vendors', JSON.stringify(vendors));
  }
  static addVendor(vendor: Vendor) {
    const vendors = this.getVendors();
    vendors.push(vendor);
    this.saveVendors(vendors);
  }
  static updateVendor(updated: Vendor) {
    const vendors = this.getVendors().map(v => v.id === updated.id ? updated : v);
    this.saveVendors(vendors);
  }
  static deleteVendor(id: string) {
    const vendors = this.getVendors().map(v => v.id === id ? { ...v, active: false } : v);
    this.saveVendors(vendors);
  }

  // Products CRUD
  static getProducts(): ProductMaster[] {
    this.init();
    return JSON.parse(localStorage.getItem('kare_products') || '[]');
  }
  static saveProducts(products: ProductMaster[]) {
    localStorage.setItem('kare_products', JSON.stringify(products));
  }
  static addProduct(prod: ProductMaster) {
    const prods = this.getProducts();
    prods.push(prod);
    this.saveProducts(prods);
  }
  static updateProduct(updated: ProductMaster) {
    const prods = this.getProducts().map(p => p.id === updated.id ? updated : p);
    this.saveProducts(prods);
  }

  // Bills CRUD
  static getBills(): ProcurementBill[] {
    this.init();
    return JSON.parse(localStorage.getItem('kare_bills') || '[]');
  }
  static saveBills(bills: ProcurementBill[]) {
    localStorage.setItem('kare_bills', JSON.stringify(bills));
  }
  static addBill(bill: ProcurementBill) {
    const bills = this.getBills();
    bills.push(bill);
    this.saveBills(bills);
  }
  static updateBill(updated: ProcurementBill) {
    const bills = this.getBills().map(b => b.id === updated.id ? updated : b);
    this.saveBills(bills);
  }

  // Transfers CRUD
  static getTransfers(assetId?: string): AssetTransfer[] {
    this.init();
    const list: AssetTransfer[] = JSON.parse(localStorage.getItem('kare_transfers') || '[]');
    if (assetId) {
      return list.filter(t => t.assetId === assetId);
    }
    return list;
  }
  static addTransfer(transfer: AssetTransfer) {
    const list = this.getTransfers();
    list.push(transfer);
    localStorage.setItem('kare_transfers', JSON.stringify(list));
  }

  // Maintenance CRUD
  static getMaintenanceRecords(schoolId?: string): MaintenanceRecord[] {
    this.init();
    const list: MaintenanceRecord[] = JSON.parse(localStorage.getItem('kare_maintenance') || '[]');
    if (schoolId && schoolId !== 'All') {
      return list.filter(m => m.schoolId === schoolId);
    }
    return list;
  }
  static saveMaintenanceRecords(records: MaintenanceRecord[]) {
    localStorage.setItem('kare_maintenance', JSON.stringify(records));
  }
  static addMaintenanceRecord(rec: Omit<MaintenanceRecord, 'id'> | MaintenanceRecord): MaintenanceRecord {
    const list = this.getMaintenanceRecords();
    const fullRec: MaintenanceRecord = 'id' in rec && rec.id ? (rec as MaintenanceRecord) : { id: 'MNT-' + Date.now(), ...rec };
    list.push(fullRec);
    this.saveMaintenanceRecords(list);
    return fullRec;
  }
  static updateMaintenanceRecord(updated: MaintenanceRecord): MaintenanceRecord {
    const list = this.getMaintenanceRecords().map(m => m.id === updated.id ? updated : m);
    this.saveMaintenanceRecords(list);
    return updated;
  }
  static deleteMaintenanceRecord(id: string): boolean {
    const list = this.getMaintenanceRecords().filter(m => m.id !== id);
    this.saveMaintenanceRecords(list);
    return true;
  }

  // Warranty CRUD
  static getWarrantyRecords(schoolId?: string): WarrantyRecord[] {
    this.init();
    const list: WarrantyRecord[] = JSON.parse(localStorage.getItem('kare_warranty') || '[]');
    if (schoolId && schoolId !== 'All') {
      return list.filter(w => w.schoolId === schoolId);
    }
    return list;
  }
  static saveWarrantyRecords(records: WarrantyRecord[]) {
    localStorage.setItem('kare_warranty', JSON.stringify(records));
  }
  static addWarrantyRecord(rec: Omit<WarrantyRecord, 'id'> | WarrantyRecord): WarrantyRecord {
    const list = this.getWarrantyRecords();
    const fullRec: WarrantyRecord = 'id' in rec && rec.id ? (rec as WarrantyRecord) : { id: 'WRN-' + Date.now(), ...rec };
    list.push(fullRec);
    this.saveWarrantyRecords(list);
    return fullRec;
  }
  static updateWarrantyRecord(updated: WarrantyRecord): WarrantyRecord {
    const list = this.getWarrantyRecords().map(w => w.id === updated.id ? updated : w);
    this.saveWarrantyRecords(list);
    return updated;
  }
  static deleteWarrantyRecord(id: string): boolean {
    const list = this.getWarrantyRecords().filter(w => w.id !== id);
    this.saveWarrantyRecords(list);
    return true;
  }
}
