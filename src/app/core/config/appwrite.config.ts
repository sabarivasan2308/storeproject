export const APPWRITE_CONFIG = {
  // Replace these with your actual Appwrite credentials
  ENDPOINT: 'https://sgp.cloud.appwrite.io/v1',
  PROJECT_ID: 'kare-store-project',
  DATABASE_ID: 'kare-db',
  
  COLLECTIONS: {
    USERS: 'users',
    ASSETS: 'assets',
    LOCATIONS: 'locations',
    REQUESTS: 'requests',
    AUDIT_LOGS: 'audit_logs',
    BILLS: 'bills',
    BILL_ITEMS: 'bill_items',
    PRODUCTS: 'products',
    DEPARTMENTS: 'departments',
    ASSET_TRANSFERS: 'asset_transfers',
    PROCUREMENT_AUDIT_LOGS: 'procurement_audit_logs',
    MAINTENANCE: 'maintenance',
    WARRANTY: 'warranty'
  },
  
  BUCKETS: {
    ASSET_ATTACHMENTS: 'asset-attachments',
    INVOICE_ATTACHMENTS: 'asset-attachments'
  }
};
