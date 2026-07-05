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
  { id: 'LOC-AKBED-001', institution: 'AK B.Ed College', building: 'Education Block', floor: 'Ground Floor', department: 'Computer Lab', room: 'CL-101' },
  { id: 'LOC-KMCH-001', institution: 'KMCH', building: 'Hospital Block', floor: 'Ground Floor', department: 'Emergency Ward', room: 'ER-001' }
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
  for (const loc of locationSeeds) {
    const school = schoolSeeds.find(s => s.name === loc.institution);
    if (!school) continue;
    const status = await ensureDocument(`${school.prefix}_locations`, loc.id, loc);
    summary.documentsCreatedOrUpdated.push(`${school.prefix}_locations.${loc.id}:${status}`);
  }

  summary.bucket = await ensureBucket();

  console.log(JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
