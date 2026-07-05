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
  asset('linga_assets', { id: 'PC-LINGA-PR-G-001', name: 'HP Desktop Workstation', category: 'Computers', brand: 'HP', model: 'ProDesk 400', serialNumber: 'HP-LINGA-001', quantity: 20, unitPrice: 48000, purchaseDate: '2024-01-18', purchaseOrder: 'POLINGA2024001', billNumber: 'BILLLINGA1001', billDate: '2024-01-20', vendor: 'HP Retail Plaza', status: 'Active', locationId: 'LOC-LINGA-001' }),
  asset('linga_assets', { id: 'PJ-LINGA-SC-F1-002', name: 'Epson Classroom Projector', category: 'Projectors', brand: 'Epson', model: 'EB-X49', serialNumber: 'EP-LINGA-002', quantity: 4, unitPrice: 39000, purchaseDate: '2024-02-12', purchaseOrder: 'POLINGA2024002', billNumber: 'BILLLINGA1008', billDate: '2024-02-14', vendor: 'Epson Projector World', status: 'Missing', locationId: 'LOC-LINGA-002' }),
  asset('linga_furniture', { id: 'TB-LINGA-CL-003', name: 'Student Study Table', category: 'Furniture', brand: 'Godrej', model: 'EduDesk', quantity: 30, unitPrice: 4200, purchaseDate: '2023-11-05', purchaseOrder: 'POLINGA2023019', billNumber: 'BILLLINGA0912', billDate: '2023-11-08', vendor: 'Godrej Retail', status: 'Active', locationId: 'LOC-LINGA-002' }),
  asset('akcas_assets', { id: 'PJ-AKCAS-SC-F2-001', name: 'Sony Short Throw Projector', category: 'Projectors', brand: 'Sony', model: 'VPL-SX631', serialNumber: 'SN-AKCAS-001', quantity: 2, unitPrice: 61000, purchaseDate: '2024-05-05', purchaseOrder: 'POAKCAS2024001', billNumber: 'BILLAKCAS3001', billDate: '2024-05-08', vendor: 'Epson Projector World', status: 'Active', locationId: 'LOC-AKCAS-001' }),
  asset('akcas_assets', { id: 'PC-AKCAS-DL-002', name: 'Lenovo Thin Client', category: 'Computers', brand: 'Lenovo', model: 'ThinkCentre M70q', serialNumber: 'LN-AKCAS-002', quantity: 12, unitPrice: 52000, purchaseDate: '2024-04-01', purchaseOrder: 'POAKCAS2024005', billNumber: 'BILLAKCAS3010', billDate: '2024-04-04', vendor: 'Lenovo Commercial Store', status: 'Damaged', locationId: 'LOC-AKCAS-002' }),
  asset('cshm_consumables', { id: 'REF-CSHM-BTK-001', name: 'Samsung Double Door Refrigerator', category: 'Kitchen Equipment', brand: 'Samsung', model: 'RT34', serialNumber: 'SM-CSHM-001', quantity: 1, unitPrice: 56000, purchaseDate: '2023-07-10', purchaseOrder: 'POCSHM2023001', billNumber: 'BILLCSHM4010', billDate: '2023-07-12', vendor: 'Samsung Business Solutions', status: 'Active', locationId: 'LOC-CSHM-001', isContainer: true }),
  asset('cshm_consumables', { id: 'BL-CSHM-BTK-002', name: 'Philips Blender', category: 'Kitchen Appliances', brand: 'Philips', model: 'HL7756', quantity: 5, unitPrice: 3800, purchaseDate: '2023-08-02', purchaseOrder: 'POCSHM2023006', billNumber: 'BILLCSHM4022', billDate: '2023-08-04', vendor: 'Phillips Home Appliances', status: 'Active', locationId: 'LOC-CSHM-001' }),
  asset('cshm_consumables', { id: 'GL-CSHM-TR-012', name: 'Ocean Water Glass Set', category: 'Glassware', brand: 'Ocean', model: 'Classic-300', quantity: 160, unitPrice: 95, purchaseDate: '2024-01-28', purchaseOrder: 'POCSHM2024012', billNumber: 'BILLCSHM5008', billDate: '2024-01-30', vendor: 'Ocean Distributors', status: 'Damaged', locationId: 'LOC-CSHM-002' }),
  asset('cshm_furniture', { id: 'TB-CSHM-TR-007', name: 'Restaurant Training Table', category: 'Furniture', brand: 'Godrej', model: 'HotelPro', quantity: 8, unitPrice: 12500, purchaseDate: '2023-09-19', purchaseOrder: 'POCSHM2023014', billNumber: 'BILLCSHM4077', billDate: '2023-09-22', vendor: 'Godrej Retail', status: 'Active', locationId: 'LOC-CSHM-002' }),
  asset('cshm_assets', { id: 'VC-CSHM-HK-001', name: 'Industrial Vacuum Cleaner', category: 'Kitchen Equipment', brand: 'Karcher', model: 'NT-30', serialNumber: 'KR-CSHM-001', quantity: 2, unitPrice: 31000, purchaseDate: '2024-03-10', purchaseOrder: 'POCSHM2024021', billNumber: 'BILLCSHM5100', billDate: '2024-03-12', vendor: 'Hotelware Traders', status: 'Under Service', locationId: 'LOC-CSHM-003' }),
  asset('akbed_assets', { id: 'PC-AKBED-CL-001', name: 'Lenovo Teaching Lab Desktop', category: 'Computers', brand: 'Lenovo', model: 'V50t', serialNumber: 'LN-AKBED-001', quantity: 15, unitPrice: 45500, purchaseDate: '2024-02-05', purchaseOrder: 'POAKBED2024001', billNumber: 'BILLAKBED1001', billDate: '2024-02-08', vendor: 'Lenovo Commercial Store', status: 'Active', locationId: 'LOC-AKBED-001' }),
  asset('akbed_assets', { id: 'PJ-AKBED-PL-002', name: 'BenQ Interactive Projector', category: 'Projectors', brand: 'BenQ', model: 'EW800ST', serialNumber: 'BQ-AKBED-002', quantity: 1, unitPrice: 72000, purchaseDate: '2024-03-11', purchaseOrder: 'POAKBED2024003', billNumber: 'BILLAKBED1012', billDate: '2024-03-14', vendor: 'Epson Projector World', status: 'Idle', locationId: 'LOC-AKBED-002' }),
  asset('kmch_assets', { id: 'ECG-KMCH-ER-001', name: 'Philips ECG Machine', category: 'Medical Equipment', brand: 'Philips', model: 'PageWriter TC30', serialNumber: 'PH-KMCH-001', quantity: 2, unitPrice: 145000, purchaseDate: '2024-01-25', purchaseOrder: 'POKMCH2024001', billNumber: 'BILLKMCH2001', billDate: '2024-01-29', vendor: 'Philips Health Systems', status: 'Active', locationId: 'LOC-KMCH-001' }),
  asset('kmch_assets', { id: 'MON-KMCH-DL-002', name: 'Patient Multiparameter Monitor', category: 'Medical Equipment', brand: 'Mindray', model: 'uMEC12', serialNumber: 'MR-KMCH-002', quantity: 3, unitPrice: 98000, purchaseDate: '2024-04-20', purchaseOrder: 'POKMCH2024004', billNumber: 'BILLKMCH2030', billDate: '2024-04-22', vendor: 'Philips Health Systems', status: 'Maintenance', locationId: 'LOC-KMCH-002' })
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

async function ensureCollection(collectionId, name = collectionId) {
  const result = await request('POST', `/databases/${databaseId}/collections`, {
    collectionId,
    name,
    permissions,
    documentSecurity: false,
    enabled: true
  });
  if (result.ok) return 'created';
  if (result.status === 409) return 'exists';
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
  const [type, keyName, size, required] = attribute;
  let path = `/databases/${databaseId}/collections/${collectionId}/attributes/${type}`;
  let body = { key: keyName, required, array: false };
  if (type === 'string') body.size = size;
  const result = await request('POST', path, body);
  if (result.ok) return 'created';
  if (result.status === 409) return 'exists';
  throw new Error(`Attribute ${collectionId}.${keyName}: ${result.status} ${JSON.stringify(result.data)}`);
}

async function ensureDocument(collectionId, documentId, data) {
  const getResult = await request('GET', `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`);
  if (getResult.ok) {
    const updateResult = await request('PATCH', `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`, { data });
    if (!updateResult.ok) throw new Error(`Update ${collectionId}.${documentId}: ${updateResult.status} ${JSON.stringify(updateResult.data)}`);
    return 'updated';
  }
  const createResult = await request('POST', `/databases/${databaseId}/collections/${collectionId}/documents`, {
    documentId,
    data,
    permissions: documentPermissions
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

async function ensureBucket() {
  const existing = await request('GET', '/storage/buckets/asset-attachments');
  if (existing.ok) return 'exists';
  const created = await request('POST', '/storage/buckets', {
    bucketId: 'asset-attachments',
    name: 'Asset Attachments',
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
  throw new Error(`Bucket asset-attachments: ${created.status} ${JSON.stringify(created.data)}`);
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
    documentsCreatedOrUpdated: [],
    authUsers: [],
    teams: [],
    memberships: [],
    bucket: null
  };

  summary.database = await ensureDatabase();
  if (summary.database === 'created') await sleep(1000);

  for (const school of schoolSeeds) {
    for (const [kind, schema] of Object.entries(collectionSchemas)) {
      const collectionId = `${school.prefix}_${kind}`;
      const collectionStatus = await ensureCollection(collectionId);
      if (collectionStatus === 'created') {
        summary.collectionsCreated.push(collectionId);
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
    const collectionStatus = await ensureCollection(collectionId);
    if (collectionStatus === 'created') {
      summary.collectionsCreated.push(collectionId);
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

  for (const item of demoAssetSeeds) {
    const status = await ensureDocument(item.collection, item.id, item.data);
    summary.documentsCreatedOrUpdated.push(`${item.collection}.${item.id}:${status}`);
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

  summary.bucket = await ensureBucket();

  console.log(JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
