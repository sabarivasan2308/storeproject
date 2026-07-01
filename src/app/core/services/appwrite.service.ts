import { Injectable, signal, computed } from '@angular/core';
import { Client, Account, Databases, ID, Query } from 'appwrite';
import { APPWRITE_CONFIG } from '../config/appwrite.config';
import { MockDatabase, AppUser, Asset, Location, VerificationRequest, AuditLog } from './mock-db';

@Injectable({
  providedIn: 'root'
})
export class AppwriteService {
  private client!: Client;
  private account!: Account;
  private databases!: Databases;
  
  // State Signals
  isUsingMock = signal<boolean>(true);
  currentUser = signal<AppUser | null>(null);
  
  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    // Attempt to connect to real Appwrite
    try {
      if (
        APPWRITE_CONFIG.PROJECT_ID && 
        APPWRITE_CONFIG.PROJECT_ID !== 'kare-asset-system' && 
        APPWRITE_CONFIG.PROJECT_ID.trim() !== ''
      ) {
        this.client = new Client()
          .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
          .setProject(APPWRITE_CONFIG.PROJECT_ID);
        
        this.account = new Account(this.client);
        this.databases = new Databases(this.client);
        
        // Check if there is an active session
        try {
          const userSession = await this.account.get();
          // Fetch role from users collection
          let role: 'Super Admin' | 'School Admin' = 'School Admin';
          let institution = '';
          
          try {
            const userDoc = await this.databases.getDocument(
              APPWRITE_CONFIG.DATABASE_ID,
              APPWRITE_CONFIG.COLLECTIONS.USERS,
              userSession.$id
            );
            role = userDoc['role'];
            institution = userDoc['institution'];
          } catch {
            // Default role if metadata document not found yet
            role = userSession.email.includes('super') ? 'Super Admin' : 'School Admin';
            institution = 'AKCP';
          }
          
          this.currentUser.set({
            email: userSession.email,
            name: userSession.name,
            role,
            institution
          });
          this.isUsingMock.set(false);
          console.log('Appwrite Integration initialized successfully.');
        } catch (err: any) {
          // If the error is 401 (Unauthorized), it means the server is online but there is no active session.
          // Otherwise (paused project, DNS resolution failure, network off, status code 0), fall back to Mock Database.
          if (err && err.code === 401) {
            this.isUsingMock.set(false);
            console.log('Appwrite initialized. No active session.');
          } else {
            console.warn('Appwrite project is paused or offline. Falling back to Mock Database:', err);
            this.useMockDatabase();
          }
        }
      } else {
        console.warn('Appwrite Project ID not set. Falling back to Mock Database.');
        this.useMockDatabase();
      }
    } catch (e) {
      console.error('Appwrite connection failed. Falling back to Mock Database:', e);
      this.useMockDatabase();
    }
  }

  private useMockDatabase() {
    this.isUsingMock.set(true);
    MockDatabase.init();
    
    // Check if there was a saved session in local storage
    const savedUser = localStorage.getItem('kare_logged_user');
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  // Authentication Operations
  async login(email: string, password: string): Promise<AppUser> {
    if (this.isUsingMock()) {
      // Simulate validation
      const users: AppUser[] = JSON.parse(localStorage.getItem('kare_users') || '[]');
      const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (matchedUser) {
        this.currentUser.set(matchedUser);
        localStorage.setItem('kare_logged_user', JSON.stringify(matchedUser));
        
        // Log action
        MockDatabase.addAuditLog({
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: matchedUser.email,
          userName: matchedUser.name,
          action: 'User Logged In',
          details: `Role: ${matchedUser.role}, Institution: ${matchedUser.institution}`,
          reason: 'System authentication'
        });
        
        return matchedUser;
      } else {
        throw new Error('Invalid email or password. Use pre-seeded email like super@kare.edu or akcp@kare.edu');
      }
    } else {
      // Live Appwrite Authentication
      try {
        try {
          await this.account.deleteSession('current');
        } catch (sessionErr) {
          // Ignore if there is no active session to delete
        }
        await this.account.createEmailPasswordSession(email, password);
        const userSession = await this.account.get();
        
        let role: 'Super Admin' | 'School Admin' = 'School Admin';
        let institution = 'AKCP';
        
        try {
          const userDoc = await this.databases.getDocument(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTIONS.USERS,
            userSession.$id
          );
          role = userDoc['role'];
          institution = userDoc['institution'];
        } catch {
          role = userSession.email.includes('super') ? 'Super Admin' : 'School Admin';
        }
        
        const loggedUser: AppUser = {
          email: userSession.email,
          name: userSession.name,
          role,
          institution
        };
        
        this.currentUser.set(loggedUser);
        return loggedUser;
      } catch (err: any) {
        // Fallback to Mock Database if live login fails due to paused/offline project
        if (err && (err.type === 'project_paused' || err.code === 403 || err.code === 0 || !err.code || err.message?.includes('paused') || err.message?.includes('Network Error') || err.message?.includes('fetch'))) {
          console.warn('Appwrite login failed due to offline/paused state. Falling back to Mock Database.');
          this.useMockDatabase();
          return this.login(email, password); // Retry using mock database
        }
        throw new Error(err.message || 'Login failed.');
      }
    }
  }

  async logout(): Promise<void> {
    const user = this.currentUser();
    if (this.isUsingMock()) {
      if (user) {
        MockDatabase.addAuditLog({
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: user.email,
          userName: user.name,
          action: 'User Logged Out',
          details: '',
          reason: 'User session terminated'
        });
      }
      this.currentUser.set(null);
      localStorage.removeItem('kare_logged_user');
    } else {
      try {
        await this.account.deleteSession('current');
        this.currentUser.set(null);
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
  }

  // Helper to determine prefix based on institution name
  private getPrefixForInstitution(inst?: string): string {
    const target = inst || this.currentUser()?.institution;
    if (!target) return 'kare';
    const name = target.toLowerCase();
    if (name.includes('akcp')) return 'akcp';
    if (name.includes('linga')) return 'linga';
    if (name.includes('akcas')) return 'akcas';
    if (name.includes('cshm')) return 'cshm';
    return 'kare';
  }

  // Helper to get collection information for an asset
  private getAssetCollectionInfo(asset: Asset, locations: Location[]): { prefix: string, baseColl: string, collId: string } {
    const loc = locations.find(l => l.id === asset.locationId);
    const inst = loc ? loc.institution : (this.currentUser()?.institution || 'KARE');
    const prefix = this.getPrefixForInstitution(inst);
    
    let baseColl = 'assets';
    const cat = asset.category.toLowerCase();
    if (cat.includes('furniture')) {
      baseColl = 'furniture';
    } else if (cat.includes('reagent') || cat.includes('kit') || cat.includes('glass') || cat.includes('crockery') || cat.includes('utensil')) {
      baseColl = 'consumables';
    }
    
    return {
      prefix,
      baseColl,
      collId: `${prefix}_${baseColl}`
    };
  }

  // Location Operations
  async getLocations(): Promise<Location[]> {
    if (this.isUsingMock()) {
      return MockDatabase.getLocations();
    } else {
      const user = this.currentUser();
      if (user && user.role === 'School Admin') {
        const prefix = this.getPrefixForInstitution(user.institution);
        const response = await this.databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          `${prefix}_locations`
        );
        return response.documents.map(d => ({
          id: d.$id,
          institution: d['institution'],
          building: d['building'],
          floor: d['floor'],
          department: d['department'],
          room: d['room']
        }));
      } else {
        const prefixes = ['akcp', 'linga', 'akcas', 'cshm', 'kare'];
        const promises = prefixes.map(async prefix => {
          try {
            const response = await this.databases.listDocuments(
              APPWRITE_CONFIG.DATABASE_ID,
              `${prefix}_locations`
            );
            return response.documents.map(d => ({
              id: d.$id,
              institution: d['institution'],
              building: d['building'],
              floor: d['floor'],
              department: d['department'],
              room: d['room']
            }));
          } catch (e) {
            console.error(`Error loading locations for ${prefix}:`, e);
            return [];
          }
        });
        const results = await Promise.all(promises);
        return results.flat();
      }
    }
  }

  async addLocation(loc: Location): Promise<void> {
    if (this.isUsingMock()) {
      MockDatabase.addLocation(loc);
    } else {
      const prefix = this.getPrefixForInstitution(loc.institution);
      await this.databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        `${prefix}_locations`,
        ID.unique(),
        {
          id: loc.id,
          institution: loc.institution,
          building: loc.building,
          floor: loc.floor,
          department: loc.department,
          room: loc.room
        }
      );
    }
  }

  // Asset Operations
  async getAssets(): Promise<Asset[]> {
    if (this.isUsingMock()) {
      return MockDatabase.getAssets();
    } else {
      const user = this.currentUser();
      const locs = await this.getLocations();
      
      let prefixes = ['akcp', 'linga', 'akcas', 'cshm', 'kare'];
      if (user && user.role === 'School Admin') {
        prefixes = [this.getPrefixForInstitution(user.institution)];
      }
      
      const itemTypes = ['assets', 'consumables', 'furniture'];
      const promises: Promise<Asset[]>[] = [];
      
      for (const prefix of prefixes) {
        for (const itemType of itemTypes) {
          promises.push((async () => {
            try {
              const response = await this.databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                `${prefix}_${itemType}`
              );
              return response.documents.map(d => {
                const a: Asset = {
                  id: d['id'],
                  name: d['name'],
                  category: d['category'],
                  barcode: d['barcode'] || '',
                  qrCode: d['qrCode'] || '',
                  brand: d['brand'] || '',
                  model: d['model'] || '',
                  serialNumber: d['serialNumber'] || '',
                  quantity: d['quantity'],
                  unitPrice: d['unitPrice'],
                  totalPrice: d['totalPrice'],
                  purchaseDate: d['purchaseDate'] || '',
                  vendor: d['vendor'] || '',
                  warrantyDetails: d['warrantyDetails'] || '',
                  status: d['status'],
                  remarks: d['remarks'] || '',
                  locationId: d['locationId'],
                  containerId: d['containerId'] || undefined,
                  isContainer: d['isContainer'] || false
                };
                const loc = locs.find(l => l.id === a.locationId);
                if (loc) {
                  a.locationText = `${loc.institution} -> ${loc.building} -> ${loc.floor} -> ${loc.department} -> ${loc.room}`;
                }
                return a;
              });
            } catch (e) {
              console.error(`Error fetching assets for ${prefix}_${itemType}:`, e);
              return [];
            }
          })());
        }
      }
      
      const results = await Promise.all(promises);
      return results.flat();
    }
  }

  async addAsset(asset: Asset): Promise<void> {
    const user = this.currentUser();
    if (this.isUsingMock()) {
      MockDatabase.addAsset(asset);
      if (user) {
        MockDatabase.addAuditLog({
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: user.email,
          userName: user.name,
          action: 'Added Asset',
          details: `Asset ID: ${asset.id}, Name: ${asset.name}, Quantity: ${asset.quantity}`,
          reason: 'Manual addition'
        });
      }
    } else {
      const locs = await this.getLocations();
      const { collId } = this.getAssetCollectionInfo(asset, locs);
      
      const docData = {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        barcode: asset.barcode || '',
        qrCode: asset.qrCode || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        quantity: asset.quantity,
        unitPrice: asset.unitPrice,
        totalPrice: asset.totalPrice,
        purchaseDate: asset.purchaseDate || '',
        vendor: asset.vendor || '',
        warrantyDetails: asset.warrantyDetails || '',
        status: asset.status,
        remarks: asset.remarks || '',
        locationId: asset.locationId,
        containerId: asset.containerId || '',
        isContainer: asset.isContainer || false
      };
      
      await this.databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        collId,
        asset.id,
        docData
      );

      if (user) {
        await this.addAuditLog({
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: user.email,
          userName: user.name,
          action: 'Added Asset',
          details: `Asset ID: ${asset.id}, Name: ${asset.name}, Quantity: ${asset.quantity}`,
          reason: 'Manual addition'
        }, asset);
      }
    }
  }

  async updateAsset(asset: Asset): Promise<void> {
    const user = this.currentUser();
    if (this.isUsingMock()) {
      const prev = MockDatabase.getAssetById(asset.id);
      MockDatabase.updateAsset(asset);
      if (user && prev) {
        MockDatabase.addAuditLog({
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: user.email,
          userName: user.name,
          action: 'Updated Asset Details',
          details: `Asset ID: ${asset.id}, Previous Quantity: ${prev.quantity}, New Quantity: ${asset.quantity}`,
          reason: 'Manual details update'
        });
      }
    } else {
      const locs = await this.getLocations();
      const { collId } = this.getAssetCollectionInfo(asset, locs);
      
      const docData = {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        barcode: asset.barcode || '',
        qrCode: asset.qrCode || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        quantity: asset.quantity,
        unitPrice: asset.unitPrice,
        totalPrice: asset.totalPrice,
        purchaseDate: asset.purchaseDate || '',
        vendor: asset.vendor || '',
        warrantyDetails: asset.warrantyDetails || '',
        status: asset.status,
        remarks: asset.remarks || '',
        locationId: asset.locationId,
        containerId: asset.containerId || '',
        isContainer: asset.isContainer || false
      };
      
      let existingCollId = collId;
      const allColls = ['assets', 'consumables', 'furniture'];
      const prefixes = ['akcp', 'linga', 'akcas', 'cshm', 'kare'];
      let found = false;
      
      for (const pref of prefixes) {
        for (const type of allColls) {
          const testColl = `${pref}_${type}`;
          try {
            await this.databases.getDocument(
              APPWRITE_CONFIG.DATABASE_ID,
              testColl,
              asset.id
            );
            existingCollId = testColl;
            found = true;
            break;
          } catch {}
        }
        if (found) break;
      }
      
      if (found && existingCollId !== collId) {
        await this.databases.deleteDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          existingCollId,
          asset.id
        );
        await this.databases.createDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          collId,
          asset.id,
          docData
        );
      } else {
        await this.databases.updateDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          existingCollId,
          asset.id,
          docData
        );
      }
      
      if (user) {
        await this.addAuditLog({
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: user.email,
          userName: user.name,
          action: 'Updated Asset Details',
          details: `Asset ID: ${asset.id}, Name: ${asset.name}`,
          reason: 'Manual details update'
        }, asset);
      }
    }
  }

  async deleteAsset(id: string): Promise<void> {
    const user = this.currentUser();
    if (this.isUsingMock()) {
      const asset = MockDatabase.getAssetById(id);
      MockDatabase.deleteAsset(id);
      if (user && asset) {
        MockDatabase.addAuditLog({
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: user.email,
          userName: user.name,
          action: 'Deleted Asset',
          details: `Asset ID: ${id}, Name: ${asset.name}`,
          reason: 'Manual deletion'
        });
      }
    } else {
      let asset: Asset | null = null;
      let foundCollId = '';
      const allColls = ['assets', 'consumables', 'furniture'];
      const prefixes = ['akcp', 'linga', 'akcas', 'cshm', 'kare'];
      
      for (const pref of prefixes) {
        for (const type of allColls) {
          const testColl = `${pref}_${type}`;
          try {
            const d = await this.databases.getDocument(
              APPWRITE_CONFIG.DATABASE_ID,
              testColl,
              id
            );
            foundCollId = testColl;
            asset = {
              id: d['id'],
              name: d['name'],
              category: d['category'],
              barcode: d['barcode'] || '',
              qrCode: d['qrCode'] || '',
              brand: d['brand'] || '',
              model: d['model'] || '',
              serialNumber: d['serialNumber'] || '',
              quantity: d['quantity'],
              unitPrice: d['unitPrice'],
              totalPrice: d['totalPrice'],
              purchaseDate: d['purchaseDate'] || '',
              vendor: d['vendor'] || '',
              warrantyDetails: d['warrantyDetails'] || '',
              status: d['status'],
              remarks: d['remarks'] || '',
              locationId: d['locationId'],
              containerId: d['containerId'] || undefined,
              isContainer: d['isContainer'] || false
            };
            break;
          } catch {}
        }
        if (asset) break;
      }
      
      if (foundCollId) {
        await this.databases.deleteDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          foundCollId,
          id
        );
        
        if (user && asset) {
          await this.addAuditLog({
            id: 'AUD-' + Date.now(),
            date: new Date().toISOString().replace('T', ' ').substring(0, 19),
            userEmail: user.email,
            userName: user.name,
            action: 'Deleted Asset',
            details: `Asset ID: ${id}, Name: ${asset.name}`,
            reason: 'Manual deletion'
          }, asset);
        }
      }
    }
  }

  // Stock Verification & Approval Operations
  async getRequests(): Promise<VerificationRequest[]> {
    if (this.isUsingMock()) {
      return MockDatabase.getRequests();
    } else {
      const user = this.currentUser();
      let prefixes = ['akcp', 'linga', 'akcas', 'cshm', 'kare'];
      if (user && user.role === 'School Admin') {
        prefixes = [this.getPrefixForInstitution(user.institution)];
      }
      
      const promises = prefixes.map(async prefix => {
        try {
          const response = await this.databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            `${prefix}_requests`
          );
          return response.documents.map(d => ({
            id: d.$id,
            schoolAdminEmail: d['schoolAdminEmail'],
            schoolAdminName: d['schoolAdminName'],
            institution: d['institution'],
            assetId: d['assetId'],
            assetName: d['assetName'],
            changeType: d['changeType'],
            previousValue: d['previousValue'],
            newValue: d['newValue'],
            reason: d['reason'],
            status: d['status'],
            timestamp: d['timestamp'],
            comments: d['comments'] || ''
          }));
        } catch (e) {
          console.error(`Error fetching requests for ${prefix}:`, e);
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      return results.flat();
    }
  }

  async submitRequest(req: Omit<VerificationRequest, 'id' | 'status' | 'timestamp'>): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const requestId = 'REQ-' + Date.now();
    const newReq: VerificationRequest = {
      ...req,
      id: requestId,
      status: 'Pending',
      timestamp
    };
    
    if (this.isUsingMock()) {
      MockDatabase.addRequest(newReq);
      MockDatabase.addAuditLog({
        id: 'AUD-' + Date.now(),
        date: newReq.timestamp,
        userEmail: newReq.schoolAdminEmail,
        userName: newReq.schoolAdminName,
        action: `Submitted verification request: ${newReq.changeType}`,
        details: `Asset: ${newReq.assetName} (${newReq.assetId}). Diff: ${newReq.previousValue} -> ${newReq.newValue}`,
        reason: newReq.reason
      });
    } else {
      const prefix = this.getPrefixForInstitution(req.institution);
      await this.databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        `${prefix}_requests`,
        requestId,
        {
          id: requestId,
          schoolAdminEmail: req.schoolAdminEmail,
          schoolAdminName: req.schoolAdminName,
          institution: req.institution,
          assetId: req.assetId,
          assetName: req.assetName,
          changeType: req.changeType,
          previousValue: req.previousValue,
          newValue: req.newValue,
          reason: req.reason,
          status: 'Pending',
          timestamp,
          comments: ''
        }
      );
      
      await this.addAuditLog({
        id: 'AUD-' + Date.now(),
        date: timestamp,
        userEmail: req.schoolAdminEmail,
        userName: req.schoolAdminName,
        action: `Submitted verification request: ${req.changeType}`,
        details: `Asset: ${req.assetName} (${req.assetId}). Diff: ${req.previousValue} -> ${req.newValue}`,
        reason: req.reason
      });
    }
  }

  async processRequest(requestId: string, approve: boolean, comments: string): Promise<void> {
    const reviewer = this.currentUser();
    if (!reviewer) return;
    
    if (this.isUsingMock()) {
      const requests = MockDatabase.getRequests();
      const reqIndex = requests.findIndex(r => r.id === requestId);
      if (reqIndex !== -1) {
        const req = requests[reqIndex];
        req.status = approve ? 'Approved' : 'Rejected';
        req.comments = comments;
        MockDatabase.saveRequests(requests);
        
        if (approve) {
          const asset = MockDatabase.getAssetById(req.assetId);
          if (asset) {
            if (req.changeType === 'Quantity Update') {
              const qtyNum = parseInt(req.newValue.replace(/\D/g, ''));
              if (!isNaN(qtyNum)) {
                asset.quantity = qtyNum;
                asset.totalPrice = asset.quantity * asset.unitPrice;
              }
            } else if (req.changeType === 'Mark Damaged') {
              asset.status = 'Damaged';
            } else if (req.changeType === 'Mark Missing') {
              asset.status = 'Missing';
            } else if (req.changeType === 'Mark Active') {
              asset.status = 'Active';
            } else if (req.changeType === 'Add Asset') {
              asset.status = 'Active';
              asset.remarks = asset.remarks.replace('Approval Pending.', 'Approved.');
            }
            MockDatabase.updateAsset(asset);
          }
        }
        
        MockDatabase.addAuditLog({
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: reviewer.email,
          userName: reviewer.name,
          action: `${req.status} Verification Request`,
          details: `Request ID: ${requestId}. School Admin: ${req.schoolAdminName}. Comment: ${comments}`,
          reason: approve ? 'Approval criteria met' : 'Disapproved by Super Admin'
        });
      }
    } else {
      const status = approve ? 'Approved' : 'Rejected';
      let foundCollId = '';
      let foundPrefix = '';
      let reqData: any = null;
      const prefixes = ['akcp', 'linga', 'akcas', 'cshm', 'kare'];
      
      for (const pref of prefixes) {
        const testColl = `${pref}_requests`;
        try {
          const d = await this.databases.getDocument(
            APPWRITE_CONFIG.DATABASE_ID,
            testColl,
            requestId
          );
          foundCollId = testColl;
          foundPrefix = pref;
          reqData = d;
          break;
        } catch {}
      }
      
      if (foundCollId && reqData) {
        await this.databases.updateDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          foundCollId,
          requestId,
          { status, comments }
        );
        
        if (approve) {
          const assetId = reqData['assetId'];
          const changeType = reqData['changeType'];
          const newValue = reqData['newValue'];
          
          let foundAssetColl = '';
          let assetData: any = null;
          const allColls = ['assets', 'consumables', 'furniture'];
          
          for (const type of allColls) {
            const testAssetColl = `${foundPrefix}_${type}`;
            try {
              const d = await this.databases.getDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                testAssetColl,
                assetId
              );
              foundAssetColl = testAssetColl;
              assetData = d;
              break;
            } catch {}
          }
          
          if (foundAssetColl && assetData) {
            const updatedAsset = { ...assetData };
            delete updatedAsset.$id;
            delete updatedAsset.$collectionId;
            delete updatedAsset.$databaseId;
            delete updatedAsset.$createdAt;
            delete updatedAsset.$updatedAt;
            delete updatedAsset.$permissions;
            
            if (changeType === 'Quantity Update') {
              const qtyNum = parseInt(newValue.replace(/\D/g, ''));
              if (!isNaN(qtyNum)) {
                updatedAsset.quantity = qtyNum;
                updatedAsset.totalPrice = updatedAsset.quantity * updatedAsset.unitPrice;
              }
            } else if (changeType === 'Mark Damaged') {
              updatedAsset.status = 'Damaged';
            } else if (changeType === 'Mark Missing') {
              updatedAsset.status = 'Missing';
            } else if (changeType === 'Mark Active') {
              updatedAsset.status = 'Active';
            } else if (changeType === 'Add Asset') {
              updatedAsset.status = 'Active';
              updatedAsset.remarks = (updatedAsset.remarks || '').replace('Approval Pending.', 'Approved.');
            }
            
            await this.databases.updateDocument(
              APPWRITE_CONFIG.DATABASE_ID,
              foundAssetColl,
              assetId,
              updatedAsset
            );
          }
        }
        
        await this.addAuditLog({
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: reviewer.email,
          userName: reviewer.name,
          action: `${status} Verification Request`,
          details: `Request ID: ${requestId}. School Admin: ${reqData.schoolAdminName}. Comment: ${comments}`,
          reason: approve ? 'Approval criteria met' : 'Disapproved by Super Admin'
        });
      }
    }
  }

  // Audit Logs Operations
  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isUsingMock()) {
      return MockDatabase.getAuditLogs();
    } else {
      const user = this.currentUser();
      let prefixes = ['akcp', 'linga', 'akcas', 'cshm', 'kare'];
      if (user && user.role === 'School Admin') {
        prefixes = [this.getPrefixForInstitution(user.institution)];
      }
      
      const promises = prefixes.map(async prefix => {
        try {
          const response = await this.databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            `${prefix}_audit_logs`
          );
          return response.documents.map(d => ({
            id: d.$id,
            date: d['date'],
            userEmail: d['userEmail'],
            userName: d['userName'],
            action: d['action'],
            details: d['details'],
            reason: d['reason'] || ''
          }));
        } catch (e) {
          console.error(`Error fetching audit logs for ${prefix}:`, e);
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      const allLogs = results.flat();
      return allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }

  async addAuditLog(log: AuditLog, asset?: Asset): Promise<void> {
    if (this.isUsingMock()) {
      MockDatabase.addAuditLog(log);
    } else {
      let inst = this.currentUser()?.institution || 'KARE';
      if (inst === 'All' && asset) {
        const locs = await this.getLocations();
        const loc = locs.find(l => l.id === asset.locationId);
        if (loc) inst = loc.institution;
      }
      const prefix = this.getPrefixForInstitution(inst);
      await this.databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        `${prefix}_audit_logs`,
        log.id || ID.unique(),
        {
          id: log.id || ID.unique(),
          date: log.date,
          userEmail: log.userEmail,
          userName: log.userName,
          action: log.action,
          details: log.details,
          reason: log.reason || ''
        }
      );
    }
  }
}
