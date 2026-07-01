export const APPWRITE_CONFIG = {
  // Replace these with your actual Appwrite credentials
  ENDPOINT: 'https://sgp.cloud.appwrite.io/v1',
  PROJECT_ID: '6a34f13000199b2e511f', // Enter your Appwrite Project ID here
  DATABASE_ID: 'kare-db',
  
  COLLECTIONS: {
    USERS: 'users',
    ASSETS: 'assets',
    LOCATIONS: 'locations',
    REQUESTS: 'requests',
    AUDIT_LOGS: 'audit_logs'
  },
  
  BUCKETS: {
    ASSET_ATTACHMENTS: 'asset-attachments'
  }
};
