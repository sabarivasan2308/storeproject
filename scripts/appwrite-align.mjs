const endpoint = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const project = process.env.APPWRITE_PROJECT_ID || 'kare-store-project';
const key = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'kare-db';

if (!key) {
  console.error('APPWRITE_API_KEY is required.');
  process.exit(1);
}

const permissions = ['read("users")', 'create("users")', 'update("users")', 'delete("users")'];
const documentPermissions = ['read("users")', 'update("users")', 'delete("users")'];
const schoolSeeds = [
  { id: 'kare', name: 'KARE', code: 'KARE', prefix: 'kare', email: 'kare@kare.edu' },
  { id: 'akcp', name: 'AKCP', code: 'AKCP', prefix: 'akcp', email: 'akcp@kare.edu' },
  { id: 'linga', name: 'LINGA Global School', code: 'LINGA', prefix: 'linga', email: 'linga@kare.edu' },
  { id: 'akcas', name: 'AKCAS', code: 'AKCAS', prefix: 'akcas', email: 'akcas@kare.edu' },
  { id: 'cshm', name: 'CSHM', code: 'CSHM', prefix: 'cshm', email: 'cshm@kare.edu' },
  { id: 'akbed', name: 'AK B.Ed College', code: 'AKBED', prefix: 'akbed', email: 'akbed@kare.edu' },
  { id: 'kmch', name: 'KMCH', code: 'KMCH', prefix: 'kmch', email: 'kmch@kare.edu' }
];

const categorySeeds = [
  'Air Conditioners',
  'Computers',
  'Crockery',
  'Cutlery',
  'Furniture',
  'Glassware',
  'Kitchen Appliances',
  'Kitchen Equipment',
  'Kitchen Utensils',
  'Lab Reagents',
  'Medical Equipment',
  'Projectors',
  'Refrigerators',
  'Sample Kits'
];

const statusSeeds = [
  'Active',
  'Idle',
  'Under Service',
  'Transferred',
  'Missing',
  'Condemned',
  'Damaged',
  'Maintenance',
  'Disposed',
  'Reserved',
  'Returned',
  'Lost',
  'Scrapped'
];

const locationSeeds = [
  { id: 'LOC-003', institution: 'KARE', building: 'Admin Block', floor: 'First Floor', department: 'Finance Office', room: 'FN-105' },
  { id: 'LOC-KARE-002', institution: 'KARE', building: 'Admin Block', floor: 'Second Floor', department: 'IT Office', room: 'IT-204' },
  { id: 'LOC-001', institution: 'AKCP', building: 'Biotech Block', floor: 'First Floor', department: 'Microbiology Lab', room: 'MB-101' },
  { id: 'LOC-002', institution: 'AKCP', building: 'Biotech Block', floor: 'Second Floor', department: 'Research Store', room: 'RS-205' },
  { id: 'LOC-LINGA-001', institution: 'LINGA Global School', building: 'Primary Block', floor: 'Ground Floor', department: 'Computer Lab', room: 'CL-001' },
  { id: 'LOC-LINGA-002', institution: 'LINGA Global School', building: 'Primary Block', floor: 'First Floor', department: 'Smart Classroom', room: 'SC-102' },
  { id: 'LOC-AKCAS-001', institution: 'AKCAS', building: 'Science Block', floor: 'Second Floor', department: 'Physics Lab', room: 'PH-201' },
  { id: 'LOC-AKCAS-002', institution: 'AKCAS', building: 'Library Block', floor: 'Ground Floor', department: 'Digital Library', room: 'DL-001' },
  { id: 'LOC-CSHM-001', institution: 'CSHM', building: 'Hospitality Block', floor: 'Ground Floor', department: 'Bakery Kitchen', room: 'BK-001' },
  { id: 'LOC-CSHM-002', institution: 'CSHM', building: 'Hospitality Block', floor: 'Ground Floor', department: 'Training Restaurant', room: 'TR-001' },
  { id: 'LOC-CSHM-003', institution: 'CSHM', building: 'Hospitality Block', floor: 'First Floor', department: 'Housekeeping Lab', room: 'HK-101' },
  { id: 'LOC-AKBED-001', institution: 'AK B.Ed College', building: 'Education Block', floor: 'Ground Floor', department: 'Computer Lab', room: 'CL-101' },
  { id: 'LOC-AKBED-002', institution: 'AK B.Ed College', building: 'Education Block', floor: 'First Floor', department: 'Psychology Lab', room: 'PL-102' },
  { id: 'LOC-KMCH-001', institution: 'KMCH', building: 'Hospital Block', floor: 'Ground Floor', department: 'Emergency Ward', room: 'ER-001' },
  { id: 'LOC-KMCH-002', institution: 'KMCH', building: 'Hospital Block', floor: 'First Floor', department: 'Diagnostics Lab', room: 'DL-110' }
];

function asset(collection, data) {
  const quantity = data.quantity ?? 1;
  const unitPrice = data.unitPrice ?? 0;
  return {
    collection,
    id: data.id,
    data: {
      id: data.id,
      name: data.name,
      category: data.category,
      barcode: data.barcode || `BAR-${data.id}`,
      qrCode: data.qrCode || data.id,
      brand: data.brand || '',
      model: data.model || '',
      serialNumber: data.serialNumber || '',
      quantity,
      unitPrice,
      totalPrice: data.totalPrice ?? quantity * unitPrice,
      purchaseDate: data.purchaseDate || '2024-01-15',
      purchaseOrder: data.purchaseOrder || `PO-${data.id.replace(/[^A-Z0-9]/g, '').slice(0, 18)}`,
      billNumber: data.billNumber || `BILL-${data.id.replace(/[^A-Z0-9]/g, '').slice(0, 16)}`,
      billDate: data.billDate || data.purchaseDate || '2024-01-15',
      billId: data.billId || '',
      billItemId: data.billItemId || '',
      productId: data.productId || '',
      schoolId: data.schoolId || '',
      departmentId: data.departmentId || '',
      department: data.department || '',
      building: data.building || '',
      room: data.room || '',
      locationLabel: data.locationLabel || '',
      generatedFromProcurement: data.generatedFromProcurement || false,
      vendor: data.vendor || 'KARE Approved Vendor',
      warrantyDetails: data.warrantyDetails || '1 Year Standard Warranty',
      status: data.status || 'Active',
      remarks: data.remarks || 'Seeded enterprise demo asset.',
      locationId: data.locationId,
      containerId: data.containerId || '',
      isContainer: data.isContainer || false
    }
  };
}

const demoAssetSeeds = [
  asset('kare_assets', { id: 'AC-KARE-AD-F1-001', name: 'Daikin Split AC', category: 'Air Conditioners', brand: 'Daikin', model: 'FTKM50', serialNumber: 'DK-KARE-001', quantity: 2, unitPrice: 42000, purchaseDate: '2024-04-12', purchaseOrder: 'POKARE2024004', billNumber: 'BILLKARE0451', billDate: '2024-04-18', vendor: 'Daikin Comfort Zone', warrantyDetails: '5 Years Compressor Warranty', status: 'Active', locationId: 'LOC-003' }),
  asset('kare_assets', { id: 'SRV-KARE-IT-001', name: 'Dell Rack Server', category: 'Computers', brand: 'Dell', model: 'PowerEdge R250', serialNumber: 'DL-KARE-SRV-001', quantity: 1, unitPrice: 185000, purchaseDate: '2024-06-03', purchaseOrder: 'POKARE2024011', billNumber: 'BILLKARE0920', billDate: '2024-06-06', vendor: 'Dell Enterprise Partner', warrantyDetails: '3 Years ProSupport', status: 'Under Service', locationId: 'LOC-KARE-002' }),
  asset('akcp_assets', { id: 'FR-AKCP-BT-F1-001', name: 'Lab Refrigerator', category: 'Refrigerators', brand: 'Thermo Fisher', model: 'TSX-2305', serialNumber: 'TF-AKCP-001', quantity: 1, unitPrice: 125000, purchaseDate: '2023-08-10', purchaseOrder: 'POAKCP2023001', billNumber: 'BILLAKCP1001', billDate: '2023-08-14', vendor: 'BioLabs Equipment Ltd.', warrantyDetails: '2 Years Cooling Warranty', status: 'Active', locationId: 'LOC-001', isContainer: true }),
  asset('akcp_consumables', { id: 'CH-AKCP-BT-F1-002', name: 'Sodium Chloride AR Grade', category: 'Lab Reagents', brand: 'Merck', model: 'NaCl-500G', quantity: 24, unitPrice: 450, purchaseDate: '2024-02-22', purchaseOrder: 'POAKCP2024002', billNumber: 'BILLAKCP2002', billDate: '2024-02-24', vendor: 'Merck Chemicals', status: 'Idle', locationId: 'LOC-001', containerId: 'FR-AKCP-BT-F1-001' }),
  asset('akcp_consumables', { id: 'SK-AKCP-BT-F1-004', name: 'DNA Sample Kit', category: 'Sample Kits', brand: 'Roche', model: 'DNA-KIT-V1', quantity: 18, unitPrice: 3200, purchaseDate: '2024-03-15', purchaseOrder: 'POAKCP2024003', billNumber: 'BILLAKCP2031', billDate: '2024-03-17', vendor: 'Roche India', status: 'Active', locationId: 'LOC-002' }),
  asset('linga_assets', { id: 'PC-LINGA-PR-G-001', name: 'HP Desktop Workstation', category: 'Computers', brand: 'HP', model: 'ProDesk 400', serialNumber: 'HP-LINGA-001', quantity: 20, unitPrice: 48000, purchaseDate: '2026-06-15', purchaseOrder: 'POLINGA2026008', billNumber: 'BILL-DEMO-LINGA-2026-001', billDate: '2026-06-16', billId: 'bill-demo-linga-2026-001', billItemId: 'billitem-demo-linga-hp-desktop', productId: 'prod-hp-prodesk-400', schoolId: 'linga', departmentId: 'LINGA Global School:Computer Lab', department: 'Computer Lab', building: 'Primary Block', room: 'CL-001', locationLabel: 'LINGA Global School -> Primary Block -> Ground Floor -> Computer Lab -> CL-001', generatedFromProcurement: true, vendor: 'HP Retail Plaza', status: 'Active', locationId: 'LOC-LINGA-001' }),
  asset('linga_assets', { id: 'PJ-LINGA-SC-F1-002', name: 'Epson Classroom Projector', category: 'Projectors', brand: 'Epson', model: 'EB-X49', serialNumber: 'EP-LINGA-002', quantity: 4, unitPrice: 39000, purchaseDate: '2026-06-15', purchaseOrder: 'POLINGA2026008', billNumber: 'BILL-DEMO-LINGA-2026-001', billDate: '2026-06-16', billId: 'bill-demo-linga-2026-001', billItemId: 'billitem-demo-linga-epson-projector', productId: 'prod-epson-eb-x49', schoolId: 'linga', departmentId: 'LINGA Global School:Smart Classroom', department: 'Smart Classroom', building: 'Primary Block', room: 'SC-102', locationLabel: 'LINGA Global School -> Primary Block -> First Floor -> Smart Classroom -> SC-102', generatedFromProcurement: true, vendor: 'Epson Projector World', status: 'Missing', locationId: 'LOC-LINGA-002' }),
  asset('linga_furniture', { id: 'TB-LINGA-CL-003', name: 'Student Study Table', category: 'Furniture', brand: 'Godrej', model: 'EduDesk', quantity: 30, unitPrice: 4200, purchaseDate: '2023-11-05', purchaseOrder: 'POLINGA2023019', billNumber: 'BILLLINGA0912', billDate: '2023-11-08', vendor: 'Godrej Retail', status: 'Active', locationId: 'LOC-LINGA-002' }),
  asset('akcas_assets', { id: 'PJ-AKCAS-SC-F2-001', name: 'Sony Short Throw Projector', category: 'Projectors', brand: 'Sony', model: 'VPL-SX631', serialNumber: 'SN-AKCAS-001', quantity: 2, unitPrice: 61000, purchaseDate: '2024-05-05', purchaseOrder: 'POAKCAS2024001', billNumber: 'BILLAKCAS3001', billDate: '2024-05-08', vendor: 'Epson Projector World', status: 'Active', locationId: 'LOC-AKCAS-001' }),
  asset('akcas_assets', { id: 'PC-AKCAS-DL-002', name: 'Lenovo Thin Client', category: 'Computers', brand: 'Lenovo', model: 'ThinkCentre M70q', serialNumber: 'LN-AKCAS-002', quantity: 12, unitPrice: 52000, purchaseDate: '2024-04-01', purchaseOrder: 'POAKCAS2024005', billNumber: 'BILLAKCAS3010', billDate: '2024-04-04', vendor: 'Lenovo Commercial Store', status: 'Damaged', locationId: 'LOC-AKCAS-002' }),
  asset('cshm_consumables', { id: 'REF-CSHM-BTK-001', name: 'Samsung Double Door Refrigerator', category: 'Kitchen Equipment', brand: 'Samsung', model: 'RT34', serialNumber: 'SM-CSHM-001', quantity: 1, unitPrice: 56000, purchaseDate: '2023-07-10', purchaseOrder: 'POCSHM2023001', billNumber: 'BILLCSHM4010', billDate: '2023-07-12', vendor: 'Samsung Business Solutions', status: 'Active', locationId: 'LOC-CSHM-001', isContainer: true }),
  asset('cshm_consumables', { id: 'BL-CSHM-BTK-002', name: 'Philips Blender', category: 'Kitchen Appliances', brand: 'Philips', model: 'HL7756', quantity: 5, unitPrice: 3800, purchaseDate: '2026-05-10', purchaseOrder: 'POCSHM2026012', billNumber: 'BILL-DEMO-CSHM-2026-002', billDate: '2026-05-12', billId: 'bill-demo-cshm-2026-002', billItemId: 'billitem-demo-cshm-philips-blender', productId: 'prod-philips-hl7756', schoolId: 'cshm', departmentId: 'CSHM:Bakery Kitchen', department: 'Bakery Kitchen', building: 'Hospitality Block', room: 'BK-001', locationLabel: 'CSHM -> Hospitality Block -> Ground Floor -> Bakery Kitchen -> BK-001', generatedFromProcurement: true, vendor: 'Phillips Home Appliances', status: 'Active', locationId: 'LOC-CSHM-001' }),
  asset('cshm_consumables', { id: 'GL-CSHM-TR-012', name: 'Ocean Water Glass Set', category: 'Glassware', brand: 'Ocean', model: 'Classic-300', quantity: 160, unitPrice: 95, purchaseDate: '2024-01-28', purchaseOrder: 'POCSHM2024012', billNumber: 'BILLCSHM5008', billDate: '2024-01-30', vendor: 'Ocean Distributors', status: 'Damaged', locationId: 'LOC-CSHM-002' }),
  asset('cshm_furniture', { id: 'TB-CSHM-TR-007', name: 'Restaurant Training Table', category: 'Furniture', brand: 'Godrej', model: 'HotelPro', quantity: 8, unitPrice: 12500, purchaseDate: '2023-09-19', purchaseOrder: 'POCSHM2023014', billNumber: 'BILLCSHM4077', billDate: '2023-09-22', vendor: 'Godrej Retail', status: 'Active', locationId: 'LOC-CSHM-002' }),
  asset('cshm_assets', { id: 'VC-CSHM-HK-001', name: 'Industrial Vacuum Cleaner', category: 'Kitchen Equipment', brand: 'Karcher', model: 'NT-30', serialNumber: 'KR-CSHM-001', quantity: 2, unitPrice: 31000, purchaseDate: '2024-03-10', purchaseOrder: 'POCSHM2024021', billNumber: 'BILLCSHM5100', billDate: '2024-03-12', vendor: 'Hotelware Traders', status: 'Under Service', locationId: 'LOC-CSHM-003' }),
  asset('akbed_assets', { id: 'PC-AKBED-CL-001', name: 'Lenovo Teaching Lab Desktop', category: 'Computers', brand: 'Lenovo', model: 'V50t', serialNumber: 'LN-AKBED-001', quantity: 15, unitPrice: 45500, purchaseDate: '2024-02-05', purchaseOrder: 'POAKBED2024001', billNumber: 'BILLAKBED1001', billDate: '2024-02-08', vendor: 'Lenovo Commercial Store', status: 'Active', locationId: 'LOC-AKBED-001' }),
  asset('akbed_assets', { id: 'PJ-AKBED-PL-002', name: 'BenQ Interactive Projector', category: 'Projectors', brand: 'BenQ', model: 'EW800ST', serialNumber: 'BQ-AKBED-002', quantity: 1, unitPrice: 72000, purchaseDate: '2024-03-11', purchaseOrder: 'POAKBED2024003', billNumber: 'BILLAKBED1012', billDate: '2024-03-14', vendor: 'Epson Projector World', status: 'Idle', locationId: 'LOC-AKBED-002' }),
  asset('kmch_assets', { id: 'ECG-KMCH-ER-001', name: 'Philips ECG Machine', category: 'Medical Equipment', brand: 'Philips', model: 'PageWriter TC30', serialNumber: 'PH-KMCH-001', quantity: 2, unitPrice: 145000, purchaseDate: '2024-01-25', purchaseOrder: 'POKMCH2024001', billNumber: 'BILLKMCH2001', billDate: '2024-01-29', vendor: 'Philips Health Systems', status: 'Active', locationId: 'LOC-KMCH-001' }),
  asset('kmch_assets', { id: 'MON-KMCH-DL-002', name: 'Patient Multiparameter Monitor', category: 'Medical Equipment', brand: 'Mindray', model: 'uMEC12', serialNumber: 'MR-KMCH-002', quantity: 3, unitPrice: 98000, purchaseDate: '2026-07-01', purchaseOrder: 'POKMCH2026020', billNumber: 'BILL-DEMO-KMCH-2026-003', billDate: '2026-07-02', billId: 'bill-demo-kmch-2026-003', billItemId: 'billitem-demo-kmch-monitor', productId: 'prod-mindray-umec12', schoolId: 'kmch', departmentId: 'KMCH:Diagnostics Lab', department: 'Diagnostics Lab', building: 'Hospital Block', room: 'DL-110', locationLabel: 'KMCH -> Hospital Block -> First Floor -> Diagnostics Lab -> DL-110', generatedFromProcurement: true, vendor: 'Philips Health Systems', status: 'Maintenance', locationId: 'LOC-KMCH-002' })
];

const demoRequestSeeds = [
  { collection: 'akcp_requests', id: 'REQ-DEMO-AKCP-001', data: { id: 'REQ-DEMO-AKCP-001', schoolAdminEmail: 'akcp@kare.edu', schoolAdminName: 'AKCP Admin', institution: 'AKCP', assetId: 'CH-AKCP-BT-F1-002', assetName: 'Sodium Chloride AR Grade', changeType: 'Quantity Update', previousValue: '24 Units', newValue: '20 Units', reason: 'Physical verification found four opened bottles.', status: 'Pending', timestamp: '2026-07-05 09:30:00', comments: '' } },
  { collection: 'linga_requests', id: 'REQ-DEMO-LINGA-001', data: { id: 'REQ-DEMO-LINGA-001', schoolAdminEmail: 'linga@kare.edu', schoolAdminName: 'LINGA Admin', institution: 'LINGA Global School', assetId: 'PJ-LINGA-SC-F1-002', assetName: 'Epson Classroom Projector', changeType: 'Mark Missing', previousValue: 'Active', newValue: 'Missing', reason: 'Projector not found during classroom audit.', status: 'Pending', timestamp: '2026-07-05 10:10:00', comments: '' } },
  { collection: 'cshm_requests', id: 'REQ-DEMO-CSHM-001', data: { id: 'REQ-DEMO-CSHM-001', schoolAdminEmail: 'cshm@kare.edu', schoolAdminName: 'CSHM Admin', institution: 'CSHM', assetId: 'GL-CSHM-TR-012', assetName: 'Ocean Water Glass Set', changeType: 'Mark Damaged', previousValue: 'Active', newValue: 'Damaged', reason: 'Multiple glasses chipped after practical session.', status: 'Approved', timestamp: '2026-07-04 16:20:00', comments: 'Approved for replacement planning.' } }
];

const demoAuditLogSeeds = [
  { collection: 'kare_audit_logs', id: 'AUD-DEMO-KARE-001', data: { id: 'AUD-DEMO-KARE-001', date: '2026-07-05 08:45:00', userEmail: 'super@kare.edu', userName: 'Dr. Suresh Kumar', action: 'Seeded Demo Inventory', details: 'Enterprise demo records created across schools.', reason: 'Demo readiness' } },
  { collection: 'akcp_audit_logs', id: 'AUD-DEMO-AKCP-001', data: { id: 'AUD-DEMO-AKCP-001', date: '2026-07-05 09:30:00', userEmail: 'akcp@kare.edu', userName: 'AKCP Admin', action: 'Submitted verification request: Quantity Update', details: 'Asset CH-AKCP-BT-F1-002 requires quantity review.', reason: 'Stock verification' } },
  { collection: 'linga_audit_logs', id: 'AUD-DEMO-LINGA-001', data: { id: 'AUD-DEMO-LINGA-001', date: '2026-07-05 10:10:00', userEmail: 'linga@kare.edu', userName: 'LINGA Admin', action: 'Submitted verification request: Mark Missing', details: 'Projector missing from smart classroom.', reason: 'Classroom audit' } },
  { collection: 'cshm_audit_logs', id: 'AUD-DEMO-CSHM-001', data: { id: 'AUD-DEMO-CSHM-001', date: '2026-07-04 16:20:00', userEmail: 'super@kare.edu', userName: 'Dr. Suresh Kumar', action: 'Approved Verification Request', details: 'Approved damaged glassware request for CSHM.', reason: 'Replacement planning' } }
];

const demoProductSeeds = [
  { id: 'prod-hp-prodesk-400', data: { barcode: '8901001004001', name: 'HP Desktop Workstation', category: 'Computers', brand: 'HP', model: 'ProDesk 400', manufacturer: 'HP India', specifications: 'Intel i5, 16 GB RAM, 512 GB SSD, Windows Pro', suggestedWarranty: '3 Years Onsite Warranty', imageUrl: '', active: true } },
  { id: 'prod-epson-eb-x49', data: { barcode: '8901001004002', name: 'Epson Classroom Projector', category: 'Projectors', brand: 'Epson', model: 'EB-X49', manufacturer: 'Epson India', specifications: 'XGA classroom projector, HDMI, 3600 lumens', suggestedWarranty: '2 Years Lamp Warranty', imageUrl: '', active: true } },
  { id: 'prod-philips-hl7756', data: { barcode: '8901001004003', name: 'Philips Blender', category: 'Kitchen Appliances', brand: 'Philips', model: 'HL7756', manufacturer: 'Philips Domestic Appliances', specifications: '750 W mixer grinder with stainless steel jars', suggestedWarranty: '2 Years Product Warranty', imageUrl: '', active: true } },
  { id: 'prod-mindray-umec12', data: { barcode: '8901001004004', name: 'Patient Multiparameter Monitor', category: 'Medical Equipment', brand: 'Mindray', model: 'uMEC12', manufacturer: 'Mindray Medical', specifications: 'Multiparameter patient monitor with SpO2, ECG, NIBP, temperature', suggestedWarranty: '2 Years Medical Warranty', imageUrl: '', active: true } }
];

const demoBillSeeds = [
  {
    id: 'bill-demo-linga-2026-001',
    data: {
      billNumber: 'BILL-DEMO-LINGA-2026-001',
      purchaseOrderNumber: 'POLINGA2026008',
      invoiceNumber: 'INV-LINGA-10024',
      vendorId: 'hp-retail-plaza',
      vendorName: 'HP Retail Plaza',
      schoolId: 'linga',
      schoolName: 'LINGA Global School',
      departmentId: 'LINGA Global School:Computer Lab',
      departmentName: 'Computer Lab',
      purchaseDate: '2026-06-15',
      billingDate: '2026-06-16',
      gstPercent: 18,
      gstAmount: 200880,
      transportCharges: 5000,
      packingCharges: 2000,
      insuranceCharges: 3000,
      otherCharges: 0,
      discount: 10000,
      subtotal: 1116000,
      grandTotal: 1316880,
      paymentStatus: 'Paid',
      paymentMethod: 'NEFT',
      invoiceAttachmentIds: [],
      remarks: 'Demo multi-product electronics purchase for computer lab and smart classroom.',
      createdBy: 'super@kare.edu',
      approvedBy: 'super@kare.edu',
      approvalDate: '2026-06-16',
      associatedAssetIds: ['PC-LINGA-PR-G-001', 'PJ-LINGA-SC-F1-002'],
      createdAt: '2026-06-16T10:00:00.000Z'
    }
  },
  {
    id: 'bill-demo-cshm-2026-002',
    data: {
      billNumber: 'BILL-DEMO-CSHM-2026-002',
      purchaseOrderNumber: 'POCSHM2026012',
      invoiceNumber: 'INV-CSHM-22015',
      vendorId: 'phillips-home-appliances',
      vendorName: 'Phillips Home Appliances',
      schoolId: 'cshm',
      schoolName: 'CSHM',
      departmentId: 'CSHM:Bakery Kitchen',
      departmentName: 'Bakery Kitchen',
      purchaseDate: '2026-05-10',
      billingDate: '2026-05-12',
      gstPercent: 18,
      gstAmount: 3420,
      transportCharges: 1200,
      packingCharges: 350,
      insuranceCharges: 0,
      otherCharges: 250,
      discount: 500,
      subtotal: 19000,
      grandTotal: 23720,
      paymentStatus: 'Partially Paid',
      paymentMethod: 'UPI',
      invoiceAttachmentIds: [],
      remarks: 'Demo kitchen equipment purchase with partial payment pending.',
      createdBy: 'super@kare.edu',
      approvedBy: 'super@kare.edu',
      approvalDate: '2026-05-12',
      associatedAssetIds: ['BL-CSHM-BTK-002'],
      createdAt: '2026-05-12T11:30:00.000Z'
    }
  },
  {
    id: 'bill-demo-kmch-2026-003',
    data: {
      billNumber: 'BILL-DEMO-KMCH-2026-003',
      purchaseOrderNumber: 'POKMCH2026020',
      invoiceNumber: 'INV-KMCH-77301',
      vendorId: 'philips-health-systems',
      vendorName: 'Philips Health Systems',
      schoolId: 'kmch',
      schoolName: 'KMCH',
      departmentId: 'KMCH:Diagnostics Lab',
      departmentName: 'Diagnostics Lab',
      purchaseDate: '2026-07-01',
      billingDate: '2026-07-02',
      gstPercent: 12,
      gstAmount: 35280,
      transportCharges: 6000,
      packingCharges: 1500,
      insuranceCharges: 2500,
      otherCharges: 1000,
      discount: 0,
      subtotal: 294000,
      grandTotal: 340280,
      paymentStatus: 'Pending',
      paymentMethod: '',
      invoiceAttachmentIds: [],
      remarks: 'Demo medical equipment purchase pending finance clearance.',
      createdBy: 'super@kare.edu',
      approvedBy: '',
      approvalDate: '',
      associatedAssetIds: ['MON-KMCH-DL-002'],
      createdAt: '2026-07-02T09:15:00.000Z'
    }
  }
];

const demoBillItemSeeds = [
  { id: 'billitem-demo-linga-hp-desktop', data: { billId: 'bill-demo-linga-2026-001', productId: 'prod-hp-prodesk-400', productName: 'HP Desktop Workstation', category: 'Computers', brand: 'HP', model: 'ProDesk 400', manufacturer: 'HP India', specifications: 'Intel i5, 16 GB RAM, 512 GB SSD, Windows Pro', barcode: '8901001004001', quantity: 20, unitPrice: 48000, gstPercent: 18, gstAmount: 172800, itemTotal: 960000, warrantyDetails: '3 Years Onsite Warranty', locationId: 'LOC-LINGA-001', generatedAssetIds: ['PC-LINGA-PR-G-001'] } },
  { id: 'billitem-demo-linga-epson-projector', data: { billId: 'bill-demo-linga-2026-001', productId: 'prod-epson-eb-x49', productName: 'Epson Classroom Projector', category: 'Projectors', brand: 'Epson', model: 'EB-X49', manufacturer: 'Epson India', specifications: 'XGA classroom projector, HDMI, 3600 lumens', barcode: '8901001004002', quantity: 4, unitPrice: 39000, gstPercent: 18, gstAmount: 28080, itemTotal: 156000, warrantyDetails: '2 Years Lamp Warranty', locationId: 'LOC-LINGA-002', generatedAssetIds: ['PJ-LINGA-SC-F1-002'] } },
  { id: 'billitem-demo-cshm-philips-blender', data: { billId: 'bill-demo-cshm-2026-002', productId: 'prod-philips-hl7756', productName: 'Philips Blender', category: 'Kitchen Appliances', brand: 'Philips', model: 'HL7756', manufacturer: 'Philips Domestic Appliances', specifications: '750 W mixer grinder with stainless steel jars', barcode: '8901001004003', quantity: 5, unitPrice: 3800, gstPercent: 18, gstAmount: 3420, itemTotal: 19000, warrantyDetails: '2 Years Product Warranty', locationId: 'LOC-CSHM-001', generatedAssetIds: ['BL-CSHM-BTK-002'] } },
  { id: 'billitem-demo-kmch-monitor', data: { billId: 'bill-demo-kmch-2026-003', productId: 'prod-mindray-umec12', productName: 'Patient Multiparameter Monitor', category: 'Medical Equipment', brand: 'Mindray', model: 'uMEC12', manufacturer: 'Mindray Medical', specifications: 'Multiparameter patient monitor with SpO2, ECG, NIBP, temperature', barcode: '8901001004004', quantity: 3, unitPrice: 98000, gstPercent: 12, gstAmount: 35280, itemTotal: 294000, warrantyDetails: '2 Years Medical Warranty', locationId: 'LOC-KMCH-002', generatedAssetIds: ['MON-KMCH-DL-002'] } }
];

const demoTransferSeeds = [
  { id: 'transfer-demo-linga-projector-001', data: { assetId: 'PJ-LINGA-SC-F1-002', fromDepartmentId: 'LINGA Global School:Computer Lab', fromDepartmentName: 'Computer Lab', toDepartmentId: 'LINGA Global School:Smart Classroom', toDepartmentName: 'Smart Classroom', transferDate: '2026-06-20T09:30:00.000Z', transferReason: 'Moved projector from lab stock to classroom installation.', transferredBy: 'super@kare.edu', approvedBy: 'super@kare.edu' } },
  { id: 'transfer-demo-cshm-blender-001', data: { assetId: 'BL-CSHM-BTK-002', fromDepartmentId: 'CSHM:Training Restaurant', fromDepartmentName: 'Training Restaurant', toDepartmentId: 'CSHM:Bakery Kitchen', toDepartmentName: 'Bakery Kitchen', transferDate: '2026-05-18T14:00:00.000Z', transferReason: 'Transferred to bakery practical kitchen for regular use.', transferredBy: 'super@kare.edu', approvedBy: 'cshm@kare.edu' } }
];

const demoProcurementAuditSeeds = [
  { id: 'proc-audit-demo-linga-001', data: { billId: 'bill-demo-linga-2026-001', date: '2026-06-16T10:00:00.000Z', userEmail: 'super@kare.edu', userName: 'Dr. Suresh Kumar', action: 'Procurement Created', details: 'Demo LINGA bill created with two product lines and linked assets.' } },
  { id: 'proc-audit-demo-cshm-001', data: { billId: 'bill-demo-cshm-2026-002', date: '2026-05-12T11:30:00.000Z', userEmail: 'super@kare.edu', userName: 'Dr. Suresh Kumar', action: 'Payment Updated', details: 'Demo CSHM bill marked partially paid through UPI.' } },
  { id: 'proc-audit-demo-kmch-001', data: { billId: 'bill-demo-kmch-2026-003', date: '2026-07-02T09:15:00.000Z', userEmail: 'super@kare.edu', userName: 'Dr. Suresh Kumar', action: 'Procurement Created', details: 'Demo KMCH medical equipment bill created and pending payment.' } }
];

const userSeeds = [
  { id: 'super', email: 'super@kare.edu', name: 'Dr. Suresh Kumar', role: 'Super Admin', institution: 'KARE', teamId: 'super_admin' },
  ...schoolSeeds.map(school => ({
    id: school.prefix,
    email: school.email,
    name: `${school.code} Admin`,
    role: 'School Admin',
    institution: school.name,
    teamId: `school_${school.prefix}`
  }))
];

const baseAssetAttributes = [
  ['string', 'id', 255, true],
  ['string', 'name', 255, true],
  ['string', 'category', 255, true],
  ['string', 'barcode', 255, false],
  ['string', 'qrCode', 255, false],
  ['string', 'brand', 255, false],
  ['string', 'model', 255, false],
  ['string', 'serialNumber', 255, false],
  ['integer', 'quantity', null, true],
  ['integer', 'unitPrice', null, true],
  ['integer', 'totalPrice', null, true],
  ['string', 'purchaseDate', 255, false],
  ['string', 'purchaseOrder', 255, false],
  ['string', 'billNumber', 255, false],
  ['string', 'billDate', 255, false],
  ['string', 'billId', 255, false],
  ['string', 'billItemId', 255, false],
  ['string', 'productId', 255, false],
  ['string', 'schoolId', 255, false],
  ['string', 'departmentId', 255, false],
  ['string', 'department', 255, false],
  ['string', 'building', 255, false],
  ['string', 'room', 255, false],
  ['string', 'locationLabel', 1000, false],
  ['boolean', 'generatedFromProcurement', null, false],
  ['string', 'vendor', 255, false],
  ['string', 'warrantyDetails', 255, false],
  ['string', 'status', 255, true],
  ['string', 'remarks', 1000, false],
  ['string', 'locationId', 255, true],
  ['string', 'containerId', 255, false],
  ['boolean', 'isContainer', null, false]
];

const collectionSchemas = {
  locations: [
    ['string', 'id', 255, true],
    ['string', 'institution', 255, true],
    ['string', 'building', 255, true],
    ['string', 'floor', 255, true],
    ['string', 'department', 255, true],
    ['string', 'room', 255, true]
  ],
  assets: baseAssetAttributes,
  consumables: baseAssetAttributes,
  furniture: baseAssetAttributes,
  requests: [
    ['string', 'id', 255, true],
    ['string', 'schoolAdminEmail', 255, true],
    ['string', 'schoolAdminName', 255, true],
    ['string', 'institution', 255, true],
    ['string', 'assetId', 255, true],
    ['string', 'assetName', 255, true],
    ['string', 'changeType', 255, true],
    ['string', 'previousValue', 255, true],
    ['string', 'newValue', 255, true],
    ['string', 'reason', 1000, true],
    ['string', 'status', 255, true],
    ['string', 'timestamp', 255, true],
    ['string', 'comments', 1000, false]
  ],
  audit_logs: [
    ['string', 'id', 255, true],
    ['string', 'date', 255, true],
    ['string', 'userEmail', 255, true],
    ['string', 'userName', 255, true],
    ['string', 'action', 255, true],
    ['string', 'details', 1000, true],
    ['string', 'reason', 1000, false]
  ]
};

const masterSchemas = {
  users: [
    ['string', 'email', 255, true],
    ['string', 'name', 255, true],
    ['string', 'role', 255, true],
    ['string', 'institution', 255, true]
  ],
  master_schools: [
    ['string', 'name', 255, true],
    ['string', 'code', 64, true],
    ['string', 'prefix', 64, true],
    ['string', 'email', 255, false],
    ['boolean', 'active', null, false]
  ],
  master_categories: [
    ['string', 'name', 255, true],
    ['string', 'description', 1000, false],
    ['boolean', 'active', null, false]
  ],
  master_statuses: [
    ['string', 'name', 255, true],
    ['string', 'description', 1000, false],
    ['boolean', 'active', null, false]
  ],
  master_vendors: [
    ['string', 'name', 255, true],
    ['string', 'gst', 64, false],
    ['string', 'address', 1000, false],
    ['string', 'phone', 64, false],
    ['string', 'email', 255, false],
    ['string', 'website', 255, false],
    ['string', 'paymentTerms', 500, false],
    ['boolean', 'active', null, false]
  ]
};

const globalSchemas = {
  bills: [
    ['string', 'billNumber', 255, true],
    ['string', 'purchaseOrderNumber', 255, true],
    ['string', 'invoiceNumber', 255, true],
    ['string', 'vendorId', 255, false],
    ['string', 'vendorName', 255, true],
    ['string', 'schoolId', 255, true],
    ['string', 'schoolName', 255, true],
    ['string', 'departmentId', 255, false],
    ['string', 'departmentName', 255, false],
    ['string', 'purchaseDate', 255, true],
    ['string', 'billingDate', 255, true],
    ['integer', 'gstPercent', null, false],
    ['integer', 'gstAmount', null, false],
    ['integer', 'transportCharges', null, false],
    ['integer', 'packingCharges', null, false],
    ['integer', 'insuranceCharges', null, false],
    ['integer', 'otherCharges', null, false],
    ['integer', 'discount', null, false],
    ['integer', 'subtotal', null, false],
    ['integer', 'grandTotal', null, false],
    ['string', 'paymentStatus', 255, true],
    ['string', 'paymentMethod', 255, false],
    ['string', 'invoiceAttachmentIds', 255, false, true],
    ['string', 'remarks', 1000, false],
    ['string', 'createdBy', 255, true],
    ['string', 'approvedBy', 255, false],
    ['string', 'approvalDate', 255, false],
    ['string', 'associatedAssetIds', 255, false, true],
    ['string', 'createdAt', 255, true]
  ],
  bill_items: [
    ['string', 'billId', 255, true],
    ['string', 'productId', 255, false],
    ['string', 'productName', 255, true],
    ['string', 'category', 255, true],
    ['string', 'brand', 255, false],
    ['string', 'model', 255, false],
    ['string', 'manufacturer', 255, false],
    ['string', 'specifications', 1000, false],
    ['string', 'barcode', 255, false],
    ['integer', 'quantity', null, true],
    ['integer', 'unitPrice', null, true],
    ['integer', 'gstPercent', null, false],
    ['integer', 'gstAmount', null, false],
    ['integer', 'itemTotal', null, true],
    ['string', 'warrantyDetails', 255, false],
    ['string', 'locationId', 255, true],
    ['string', 'generatedAssetIds', 255, false, true]
  ],
  products: [
    ['string', 'barcode', 255, false],
    ['string', 'name', 255, true],
    ['string', 'category', 255, true],
    ['string', 'brand', 255, false],
    ['string', 'model', 255, false],
    ['string', 'manufacturer', 255, false],
    ['string', 'specifications', 1000, false],
    ['string', 'suggestedWarranty', 255, false],
    ['string', 'imageUrl', 1000, false],
    ['boolean', 'active', null, false]
  ],
  departments: [
    ['string', 'schoolId', 255, true],
    ['string', 'schoolName', 255, true],
    ['string', 'name', 255, true],
    ['boolean', 'active', null, false]
  ],
  asset_transfers: [
    ['string', 'assetId', 255, true],
    ['string', 'fromDepartmentId', 255, false],
    ['string', 'fromDepartmentName', 255, false],
    ['string', 'toDepartmentId', 255, true],
    ['string', 'toDepartmentName', 255, true],
    ['string', 'transferDate', 255, true],
    ['string', 'transferReason', 1000, true],
    ['string', 'transferredBy', 255, true],
    ['string', 'approvedBy', 255, false]
  ],
  procurement_audit_logs: [
    ['string', 'billId', 255, true],
    ['string', 'date', 255, true],
    ['string', 'userEmail', 255, true],
    ['string', 'userName', 255, true],
    ['string', 'action', 255, true],
    ['string', 'details', 1000, true]
  ],
  maintenance: [
    ['string', 'assetId', 255, true],
    ['string', 'assetName', 255, true],
    ['string', 'serviceDate', 255, true],
    ['string', 'technicianName', 255, false],
    ['string', 'technicianContact', 255, false],
    ['string', 'serviceType', 255, false],
    ['integer', 'cost', null, false],
    ['string', 'description', 1000, false],
    ['string', 'status', 255, false],
    ['string', 'partsReplaced', 1000, false],
    ['string', 'nextDueDate', 255, false],
    ['string', 'schoolId', 255, true],
    ['string', 'createdBy', 255, false],
    ['string', 'createdAt', 255, false]
  ],
  warranty: [
    ['string', 'assetId', 255, true],
    ['string', 'assetName', 255, true],
    ['string', 'provider', 255, false],
    ['string', 'contactPerson', 255, false],
    ['string', 'phone', 255, false],
    ['string', 'email', 255, false],
    ['string', 'startDate', 255, false],
    ['string', 'expiryDate', 255, false],
    ['integer', 'amcCost', null, false],
    ['string', 'terms', 1000, false],
    ['string', 'schoolId', 255, true],
    ['boolean', 'renewalAlertSent', null, false],
    ['string', 'createdAt', 255, false]
  ]
};

const collectionIndexes = {
  bills: [
    ['idx_bill_number', 'key', ['billNumber']],
    ['idx_invoice_number', 'key', ['invoiceNumber']],
    ['idx_vendor', 'key', ['vendorName']],
    ['idx_school', 'key', ['schoolName']],
    ['idx_department', 'key', ['departmentName']],
    ['idx_purchase_date', 'key', ['purchaseDate']],
    ['idx_billing_date', 'key', ['billingDate']],
    ['idx_payment_status', 'key', ['paymentStatus']]
  ],
  bill_items: [
    ['idx_bill_id', 'key', ['billId']],
    ['idx_product', 'key', ['productId']],
    ['idx_category', 'key', ['category']]
  ],
  products: [
    ['idx_barcode', 'key', ['barcode']],
    ['idx_product_name', 'key', ['name']],
    ['idx_product_category', 'key', ['category']]
  ],
  departments: [
    ['idx_department_school', 'key', ['schoolName']],
    ['idx_department_name', 'key', ['name']]
  ],
  asset_transfers: [
    ['idx_transfer_asset', 'key', ['assetId']],
    ['idx_transfer_date', 'key', ['transferDate']]
  ],
  procurement_audit_logs: [
    ['idx_procurement_bill', 'key', ['billId']],
    ['idx_procurement_date', 'key', ['date']]
  ],
  maintenance: [
    ['idx_mnt_school', 'key', ['schoolId']],
    ['idx_mnt_asset', 'key', ['assetId']]
  ],
  warranty: [
    ['idx_wrn_school', 'key', ['schoolId']],
    ['idx_wrn_asset', 'key', ['assetId']]
  ],
  assets: [
    ['idx_asset_bill', 'key', ['billId']],
    ['idx_asset_product', 'key', ['productId']],
    ['idx_asset_department', 'key', ['departmentId']]
  ],
  consumables: [
    ['idx_consumable_bill', 'key', ['billId']],
    ['idx_consumable_product', 'key', ['productId']],
    ['idx_consumable_department', 'key', ['departmentId']]
  ],
  furniture: [
    ['idx_furniture_bill', 'key', ['billId']],
    ['idx_furniture_product', 'key', ['productId']],
    ['idx_furniture_department', 'key', ['departmentId']]
  ]
};

async function request(method, path, body) {
  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers: {
      'X-Appwrite-Project': project,
      'X-Appwrite-Key': key,
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: response.ok, status: response.status, data };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function detectSchoolPrefix(documentId, data) {
  if (!data) return null;
  if (data.schoolId) return data.schoolId.toLowerCase();
  if (data.schoolPrefix) return data.schoolPrefix.toLowerCase();
  if (data.institution) {
    const s = schoolSeeds.find(s => s.name.toLowerCase() === data.institution.toLowerCase() || s.code.toLowerCase() === data.institution.toLowerCase());
    if (s) return s.prefix;
  }
  const strToSearch = `${documentId} ${data.billId || ''} ${data.assetId || ''} ${data.schoolName || ''}`.toLowerCase();
  for (const school of schoolSeeds) {
    if (strToSearch.includes(school.prefix)) {
      return school.prefix;
    }
  }
  return null;
}

async function ensureCollection(collectionId, name = collectionId, customPermissions = permissions, documentSecurity = false) {
  const result = await request('POST', `/databases/${databaseId}/collections`, {
    collectionId,
    name,
    permissions: customPermissions,
    documentSecurity,
    enabled: true
  });
  if (result.ok) return 'created';
  if (result.status === 409) {
    const updateResult = await request('PUT', `/databases/${databaseId}/collections/${collectionId}`, {
      name,
      permissions: customPermissions,
      documentSecurity,
      enabled: true
    });
    if (updateResult.ok) return 'aligned';
    throw new Error(`Update Collection ${collectionId}: ${updateResult.status} ${JSON.stringify(updateResult.data)}`);
  }
  throw new Error(`Collection ${collectionId}: ${result.status} ${JSON.stringify(result.data)}`);
}

async function ensureDatabase() {
  const existing = await request('GET', `/databases/${databaseId}`);
  if (existing.ok) return 'exists';
  const created = await request('POST', '/databases', {
    databaseId,
    name: 'KARE Store Database',
    enabled: true
  });
  if (created.ok) return 'created';
  if (created.status === 409) return 'exists';
  throw new Error(`Database ${databaseId}: ${created.status} ${JSON.stringify(created.data)}`);
}

async function ensureAttribute(collectionId, attribute) {
  const [type, keyName, size, required, array = false] = attribute;
  let path = `/databases/${databaseId}/collections/${collectionId}/attributes/${type}`;
  let body = { key: keyName, required, array };
  if (type === 'string') body.size = size;
  const result = await request('POST', path, body);
  if (result.ok) return 'created';
  if (result.status === 409) return 'exists';
  throw new Error(`Attribute ${collectionId}.${keyName}: ${result.status} ${JSON.stringify(result.data)}`);
}

async function ensureIndex(collectionId, index) {
  const [key, type, attributes, orders = []] = index;
  const result = await request('POST', `/databases/${databaseId}/collections/${collectionId}/indexes`, {
    key,
    type,
    attributes,
    orders
  });
  if (result.ok) return 'created';
  if (result.status === 409) return 'exists';
  throw new Error(`Index ${collectionId}.${key}: ${result.status} ${JSON.stringify(result.data)}`);
}

async function ensureDocument(collectionId, documentId, data, customPermissions = null) {
  let docPermissions = customPermissions;
  if (!docPermissions) {
    const schoolPrefix = detectSchoolPrefix(documentId, data);
    if (collectionId === 'users') {
      docPermissions = [
        'read("team:super_admin")', 'update("team:super_admin")', 'delete("team:super_admin")',
        `read("user:${documentId}")`, `update("user:${documentId}")`
      ];
    } else if (schoolPrefix) {
      docPermissions = [
        'read("team:super_admin")', 'update("team:super_admin")', 'delete("team:super_admin")',
        `read("team:school_${schoolPrefix}")`, `update("team:school_${schoolPrefix}")`, `delete("team:school_${schoolPrefix}")`
      ];
    } else {
      docPermissions = [
        'read("team:super_admin")', 'update("team:super_admin")', 'delete("team:super_admin")'
      ];
    }
  }

  const getResult = await request('GET', `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`);
  if (getResult.ok) {
    const updateResult = await request('PATCH', `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`, {
      data,
      permissions: docPermissions
    });
    if (!updateResult.ok) throw new Error(`Update ${collectionId}.${documentId}: ${updateResult.status} ${JSON.stringify(updateResult.data)}`);
    return 'updated';
  }
  const createResult = await request('POST', `/databases/${databaseId}/collections/${collectionId}/documents`, {
    documentId,
    data,
    permissions: docPermissions
  });
  if (createResult.ok) return 'created';
  if (createResult.status === 409) return 'exists';
  throw new Error(`Document ${collectionId}.${documentId}: ${createResult.status} ${JSON.stringify(createResult.data)}`);
}

async function ensureAuthUser(user) {
  const existing = await request('GET', `/users/${user.id}`);
  if (existing.ok) {
    await request('PATCH', `/users/${user.id}/name`, { name: user.name });
    const passwordResult = await request('PATCH', `/users/${user.id}/password`, { password: 'password123' });
    if (!passwordResult.ok) {
      throw new Error(`Password ${user.id}: ${passwordResult.status} ${JSON.stringify(passwordResult.data)}`);
    }
    return 'updated';
  }

  const created = await request('POST', '/users', {
    userId: user.id,
    email: user.email,
    password: 'password123',
    name: user.name
  });
  if (created.ok) return 'created';
  if (created.status === 409) return 'exists';
  throw new Error(`Auth user ${user.id}: ${created.status} ${JSON.stringify(created.data)}`);
}

async function ensureTeam(teamId, name) {
  const existing = await request('GET', `/teams/${teamId}`);
  if (existing.ok) return 'exists';
  const created = await request('POST', '/teams', {
    teamId,
    name
  });
  if (created.ok) return 'created';
  if (created.status === 409) return 'exists';
  throw new Error(`Team ${teamId}: ${created.status} ${JSON.stringify(created.data)}`);
}

async function ensureMembership(teamId, user) {
  const memberships = await request('GET', `/teams/${teamId}/memberships`);
  if (memberships.ok && (memberships.data.memberships || []).some(m => m.userId === user.id || m.userEmail === user.email)) {
    return 'exists';
  }

  const created = await request('POST', `/teams/${teamId}/memberships`, {
    userId: user.id,
    roles: [user.role === 'Super Admin' ? 'super_admin' : 'school_admin']
  });
  if (created.ok) return 'created';
  if (created.status === 409) return 'exists';
  throw new Error(`Membership ${teamId}.${user.id}: ${created.status} ${JSON.stringify(created.data)}`);
}

async function ensureBucket(bucketId, name) {
  const existing = await request('GET', `/storage/buckets/${bucketId}`);
  if (existing.ok) return 'exists';
  const created = await request('POST', '/storage/buckets', {
    bucketId,
    name,
    permissions,
    fileSecurity: false,
    enabled: true,
    maximumFileSize: 30000000,
    allowedFileExtensions: [],
    compression: 'none',
    encryption: true,
    antivirus: true
  });
  if (created.ok) return 'created';
  if (created.status === 409) return 'exists';
  if (created.status === 403 && created.data?.type === 'additional_resource_not_allowed') {
    return 'skipped-plan-limit';
  }
  throw new Error(`Bucket ${bucketId}: ${created.status} ${JSON.stringify(created.data)}`);
}

async function collectVendorNames() {
  const vendors = new Set();
  for (const school of schoolSeeds) {
    for (const kind of ['assets', 'consumables', 'furniture']) {
      const collectionId = `${school.prefix}_${kind}`;
      const result = await request('GET', `/databases/${databaseId}/collections/${collectionId}/documents?limit=100`);
      if (!result.ok) continue;
      for (const doc of result.data.documents || []) {
        if (doc.vendor) vendors.add(doc.vendor);
      }
    }
  }
  return Array.from(vendors).sort();
}

async function main() {
  const summary = {
    database: null,
    collectionsCreated: [],
    attributesCreated: [],
    indexesCreated: [],
    documentsCreatedOrUpdated: [],
    authUsers: [],
    teams: [],
    memberships: [],
    buckets: []
  };

  summary.database = await ensureDatabase();
  if (summary.database === 'created') await sleep(1000);

  for (const school of schoolSeeds) {
    for (const [kind, schema] of Object.entries(collectionSchemas)) {
      const collectionId = `${school.prefix}_${kind}`;
      const schoolPermissions = [
        'read("team:super_admin")', 'create("team:super_admin")', 'update("team:super_admin")', 'delete("team:super_admin")',
        `read("team:school_${school.prefix}")`, `create("team:school_${school.prefix}")`, `update("team:school_${school.prefix}")`, `delete("team:school_${school.prefix}")`
      ];
      const collectionStatus = await ensureCollection(collectionId, collectionId, schoolPermissions, false);
      if (collectionStatus === 'created' || collectionStatus === 'aligned') {
        summary.collectionsCreated.push(`${collectionId}:${collectionStatus}`);
        await sleep(500);
      }
      for (const attribute of schema) {
        const attributeStatus = await ensureAttribute(collectionId, attribute);
        if (attributeStatus === 'created') {
          summary.attributesCreated.push(`${collectionId}.${attribute[1]}`);
          await sleep(250);
        }
      }
    }
  }

  for (const [collectionId, schema] of Object.entries(masterSchemas)) {
    const isUsersCollection = collectionId === 'users';
    const masterPermissions = isUsersCollection
      ? [
          'create("users")',
          'read("team:super_admin")', 'create("team:super_admin")', 'update("team:super_admin")', 'delete("team:super_admin")'
        ]
      : [
          'read("users")',
          'read("team:super_admin")', 'create("team:super_admin")', 'update("team:super_admin")', 'delete("team:super_admin")'
        ];
    const docSec = isUsersCollection;
    const collectionStatus = await ensureCollection(collectionId, collectionId, masterPermissions, docSec);
    if (collectionStatus === 'created' || collectionStatus === 'aligned') {
      summary.collectionsCreated.push(`${collectionId}:${collectionStatus}`);
      await sleep(500);
    }
    for (const attribute of schema) {
      const attributeStatus = await ensureAttribute(collectionId, attribute);
      if (attributeStatus === 'created') {
        summary.attributesCreated.push(`${collectionId}.${attribute[1]}`);
        await sleep(250);
      }
    }
  }

  for (const [collectionId, schema] of Object.entries(globalSchemas)) {
    const globalPermissions = [
      'create("users")',
      'read("team:super_admin")', 'create("team:super_admin")', 'update("team:super_admin")', 'delete("team:super_admin")'
    ];
    const collectionStatus = await ensureCollection(collectionId, collectionId, globalPermissions, true);
    if (collectionStatus === 'created' || collectionStatus === 'aligned') {
      summary.collectionsCreated.push(`${collectionId}:${collectionStatus}`);
      await sleep(500);
    }
    for (const attribute of schema) {
      const attributeStatus = await ensureAttribute(collectionId, attribute);
      if (attributeStatus === 'created') {
        summary.attributesCreated.push(`${collectionId}.${attribute[1]}`);
        await sleep(250);
      }
    }
  }

  for (const school of schoolSeeds) {
    for (const kind of ['assets', 'consumables', 'furniture']) {
      const collectionId = `${school.prefix}_${kind}`;
      for (const index of collectionIndexes[kind] || []) {
        const indexStatus = await ensureIndex(collectionId, index);
        if (indexStatus === 'created') {
          summary.indexesCreated.push(`${collectionId}.${index[0]}`);
          await sleep(250);
        }
      }
    }
  }

  for (const [collectionId, indexes] of Object.entries(collectionIndexes)) {
    if (['assets', 'consumables', 'furniture'].includes(collectionId)) continue;
    for (const index of indexes) {
      const indexStatus = await ensureIndex(collectionId, index);
      if (indexStatus === 'created') {
        summary.indexesCreated.push(`${collectionId}.${index[0]}`);
        await sleep(250);
      }
    }
  }

  for (const user of userSeeds) {
    const userStatus = await ensureAuthUser(user);
    summary.authUsers.push(`${user.id}:${userStatus}`);
    const teamStatus = await ensureTeam(user.teamId, user.role === 'Super Admin' ? 'Super Admin' : `${user.institution} Admins`);
    summary.teams.push(`${user.teamId}:${teamStatus}`);
    const membershipStatus = await ensureMembership(user.teamId, user);
    summary.memberships.push(`${user.teamId}.${user.id}:${membershipStatus}`);
    const profileStatus = await ensureDocument('users', user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
      institution: user.institution
    });
    summary.documentsCreatedOrUpdated.push(`users.${user.id}:${profileStatus}`);
  }

  for (const school of schoolSeeds) {
    const { id, ...schoolData } = school;
    const status = await ensureDocument('master_schools', id, { ...schoolData, active: true });
    summary.documentsCreatedOrUpdated.push(`master_schools.${school.id}:${status}`);
  }
  for (const name of categorySeeds) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const status = await ensureDocument('master_categories', id, { name, description: '', active: true });
    summary.documentsCreatedOrUpdated.push(`master_categories.${id}:${status}`);
  }
  for (const name of statusSeeds) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const status = await ensureDocument('master_statuses', id, { name, description: '', active: true });
    summary.documentsCreatedOrUpdated.push(`master_statuses.${id}:${status}`);
  }

  for (const loc of locationSeeds) {
    const school = schoolSeeds.find(s => s.name === loc.institution);
    if (!school) continue;
    const status = await ensureDocument(`${school.prefix}_locations`, loc.id, loc);
    summary.documentsCreatedOrUpdated.push(`${school.prefix}_locations.${loc.id}:${status}`);
  }

  const departmentSeeds = new Map();
  for (const loc of locationSeeds) {
    const school = schoolSeeds.find(s => s.name === loc.institution);
    if (!school) continue;
    const id = `${school.prefix}-${loc.department}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 36);
    departmentSeeds.set(id, {
      schoolId: school.id,
      schoolName: school.name,
      name: loc.department,
      active: true
    });
  }
  for (const [id, data] of departmentSeeds.entries()) {
    const status = await ensureDocument('departments', id, data);
    summary.documentsCreatedOrUpdated.push(`departments.${id}:${status}`);
  }

  for (const item of demoProductSeeds) {
    const status = await ensureDocument('products', item.id, item.data);
    summary.documentsCreatedOrUpdated.push(`products.${item.id}:${status}`);
  }

  for (const item of demoAssetSeeds) {
    const status = await ensureDocument(item.collection, item.id, item.data);
    summary.documentsCreatedOrUpdated.push(`${item.collection}.${item.id}:${status}`);
  }

  for (const item of demoBillSeeds) {
    const status = await ensureDocument('bills', item.id, item.data);
    summary.documentsCreatedOrUpdated.push(`bills.${item.id}:${status}`);
  }

  for (const item of demoBillItemSeeds) {
    const status = await ensureDocument('bill_items', item.id, item.data);
    summary.documentsCreatedOrUpdated.push(`bill_items.${item.id}:${status}`);
  }

  for (const item of demoTransferSeeds) {
    const status = await ensureDocument('asset_transfers', item.id, item.data);
    summary.documentsCreatedOrUpdated.push(`asset_transfers.${item.id}:${status}`);
  }

  for (const item of demoProcurementAuditSeeds) {
    const status = await ensureDocument('procurement_audit_logs', item.id, item.data);
    summary.documentsCreatedOrUpdated.push(`procurement_audit_logs.${item.id}:${status}`);
  }

  for (const item of demoRequestSeeds) {
    const status = await ensureDocument(item.collection, item.id, item.data);
    summary.documentsCreatedOrUpdated.push(`${item.collection}.${item.id}:${status}`);
  }

  for (const item of demoAuditLogSeeds) {
    const status = await ensureDocument(item.collection, item.id, item.data);
    summary.documentsCreatedOrUpdated.push(`${item.collection}.${item.id}:${status}`);
  }

  for (const name of await collectVendorNames()) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 128);
    const status = await ensureDocument('master_vendors', id, {
      name,
      gst: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      paymentTerms: '',
      active: true
    });
    summary.documentsCreatedOrUpdated.push(`master_vendors.${id}:${status}`);
  }

  summary.buckets.push(`asset-attachments:${await ensureBucket('asset-attachments', 'Asset Attachments')}`);
  summary.buckets.push('invoice-attachments:uses-asset-attachments');

  console.log(JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
