import { Injectable, signal } from '@angular/core';
import { Client, Account, Databases, ID, Query, Teams, Storage, Permission, Role } from 'appwrite';
import { APPWRITE_CONFIG } from '../config/appwrite.config';
import { MockDatabase } from './mock-db';
import {
  AppUser,
  Asset,
  Location,
  VerificationRequest,
  AuditLog,
  School,
  MasterOption,
  Vendor,
  ProcurementBill,
  ProcurementBillItem,
  ProcurementDraftItem,
  ProductMaster,
  AssetTransfer,
  MaintenanceRecord,
  WarrantyRecord
} from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class AppwriteService {
  private client!: Client;
  private account!: Account;
  private databases!: Databases;
  private teams!: Teams;
  private storage!: Storage;
  private schoolCache: School[] = [];
  private mockSubscribers: Array<{ channels: string[]; callback: (event: any) => void }> = [];
  private verifiedSchoolScopes: string[] | null = null;
  
  // State Signals
  isUsingMock = signal<boolean>(false);
  currentUser = signal<AppUser | null>(null);

  async getCurrentUser(forceRefresh = false): Promise<AppUser | null> {
    const user = this.currentUser();
    if (user && !forceRefresh) return user;

    const storedMock = localStorage.getItem('isUsingMock');
    if (this.isUsingMock() || storedMock === 'true') {
      const storedUser = localStorage.getItem('mockUser');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          this.currentUser.set(parsed);
          return parsed;
        } catch {}
      }
      return null;
    }

    if (this.account) {
      try {
        const userSession = await this.account.get();
        let role: 'Super Admin' | 'School Admin' = 'School Admin';
        let institution = 'AKCP';

        try {
          const teamsList = await this.teams.list();
          const teamIds = teamsList.teams.map(t => t.$id);

          if (teamIds.includes('super_admin')) {
            role = 'Super Admin';
            institution = 'KARE';
          } else {
            role = 'School Admin';
            const schoolTeam = teamIds.find(id => id.startsWith('school_'));
            if (schoolTeam) {
              institution = await this.getInstitutionNameForPrefix(schoolTeam.replace('school_', ''));
            }
          }
        } catch (teamErr) {
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
        }

        const loggedUser: AppUser = {
          email: userSession.email,
          name: userSession.name,
          role,
          institution
        };
        this.currentUser.set(loggedUser);
        return loggedUser;
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  private getPermissionsForPrefix(prefix: string): string[] {
    const normalizedPrefix = prefix.toLowerCase();
    return [
      Permission.read(Role.team('super_admin')),
      Permission.read(Role.team(`school_${normalizedPrefix}`)),
      Permission.create(Role.team('super_admin')),
      Permission.create(Role.team(`school_${normalizedPrefix}`)),
      Permission.update(Role.team('super_admin')),
      Permission.update(Role.team(`school_${normalizedPrefix}`)),
      Permission.delete(Role.team('super_admin')),
      Permission.delete(Role.team(`school_${normalizedPrefix}`))
    ];
  }

  private getCatalogPermissions(): string[] {
    return [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.team('super_admin'))
    ];
  }

  private async getVerifiedSchoolPrefixesForScope(): Promise<string[]> {
    if (this.isUsingMock()) {
      const user = this.currentUser();
      if (!user) return [];
      if (user.role === 'Super Admin') {
        const schools = await this.getSchools();
        return schools.map(s => s.prefix);
      }
      return [this.getPrefixForInstitution(user.institution)];
    }

    if (this.verifiedSchoolScopes) {
      return this.verifiedSchoolScopes;
    }

    try {
      const teamsList = await this.teams.list();
      const teamIds = teamsList.teams.map(t => t.$id);

      if (teamIds.includes('super_admin')) {
        const schools = await this.getSchools();
        this.verifiedSchoolScopes = schools.map(s => s.prefix);
      } else {
        const prefixes: string[] = [];
        for (const id of teamIds) {
          if (id.startsWith('school_')) {
            prefixes.push(id.replace('school_', ''));
          }
        }
        this.verifiedSchoolScopes = prefixes;
      }
      return this.verifiedSchoolScopes;
    } catch (e) {
      console.error('Error fetching verified school scopes:', e);
      this.verifiedSchoolScopes = null;
      return [];
    }
  }

  public resolveSchoolPrefix(schoolNameOrId?: string): string {
    const target = schoolNameOrId || this.currentUser()?.institution;
    if (!target) return 'kare';
    return this.getPrefixForInstitution(target);
  }

  private async enforceSchoolScope(institutionOrPrefix: string): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      throw new Error('Unauthorized: No active user session.');
    }
    if (this.isUsingMock()) {
      if (user.role === 'Super Admin') return;
      const userPrefix = this.getPrefixForInstitution(user.institution);
      const targetPrefix = this.getPrefixForInstitution(institutionOrPrefix);
      if (userPrefix !== targetPrefix) {
        throw new Error(`Unauthorized: Operation not permitted for institution ${institutionOrPrefix}.`);
      }
      return;
    }

    const allowedScopes = await this.getVerifiedSchoolPrefixesForScope();
    const targetPrefix = this.getPrefixForInstitution(institutionOrPrefix);
    if (!allowedScopes.includes(targetPrefix)) {
      throw new Error(`Unauthorized: Operation not permitted for institution ${institutionOrPrefix}.`);
    }
  }

  
  constructor() {
    // Synchronously restore mock session from localStorage before initializeService runs,
    // so that router guards running on app boot will immediately see the user.
    const storedMock = localStorage.getItem('isUsingMock');
    if (storedMock === 'true') {
      this.isUsingMock.set(true);
      const storedUser = localStorage.getItem('mockUser');
      if (storedUser) {
        try {
          this.currentUser.set(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored mock user:', e);
        }
      }
    }
    this.initializeService();
  }

  subscribeToRealtime(channels: string | string[], callback: (event: any) => void): () => void {
    const channelList = Array.isArray(channels) ? channels : [channels];
    if (this.isUsingMock()) {
      console.log('Realtime subscription registered (Mock Mode). Channels:', channelList);
      const sub = { channels: channelList, callback };
      this.mockSubscribers.push(sub);
      return () => {
        this.mockSubscribers = this.mockSubscribers.filter(s => s !== sub);
        console.log('Realtime subscription removed (Mock Mode). Channels:', channelList);
      };
    }
    return this.client.subscribe(channelList, callback);
  }

  getRealtimeChannels(user: AppUser | null, schools: School[] = []): string[] {
    if (!user) return [];
    const dbId = APPWRITE_CONFIG.DATABASE_ID;
    let prefixes: string[] = [];
    
    if (user.role === 'Super Admin') {
      if (schools && schools.length > 0) {
        prefixes = schools.map(s => this.getPrefixForInstitution(s.name));
      } else {
        prefixes = ['kare', 'akcp', 'vsp'];
      }
    } else {
      const pref = this.getPrefixForInstitution(user.institution);
      prefixes.push(pref);
    }
    
    const uniquePrefixes = Array.from(new Set(prefixes));
    const channels: string[] = [];
    const baseColls = ['assets', 'consumables', 'furniture', 'requests', 'audit_logs', 'locations', 'bills', 'bill_items', 'asset_transfers'];
    
    for (const pref of uniquePrefixes) {
      for (const base of baseColls) {
        channels.push(`databases.${dbId}.collections.${pref}_${base}.documents`);
      }
    }
    return channels;
  }

  public triggerMockRealtimeEvent(collectionBaseName: string, eventType: 'create' | 'update' | 'delete', payload: any, prefix?: string) {
    if (!this.isUsingMock()) return;
    
    const dbId = APPWRITE_CONFIG.DATABASE_ID;
    let targetPrefix = prefix;
    if (!targetPrefix) {
      if (payload.schoolId) {
        targetPrefix = payload.schoolId;
      } else if (payload.institution) {
        targetPrefix = this.getPrefixForInstitution(payload.institution);
      } else if (payload.locationText) {
        const inst = payload.locationText.split(' - ')[0];
        targetPrefix = this.getPrefixForInstitution(inst);
      } else {
        targetPrefix = this.currentUser() ? this.getPrefixForInstitution(this.currentUser()!.institution) : 'kare';
      }
    }
    
    const collectionId = `${targetPrefix}_${collectionBaseName}`;
    const channel = `databases.${dbId}.collections.${collectionId}.documents`;
    const docId = payload.$id || payload.id;
    const docChannel = `databases.${dbId}.collections.${collectionId}.documents.${docId}`;
    const eventName = `databases.${dbId}.collections.${collectionId}.documents.${docId}.${eventType}`;
    
    const event = {
      events: [eventName],
      channels: [channel, docChannel],
      timestamp: new Date().toISOString(),
      payload: {
        ...payload,
        $id: docId
      }
    };
    
    for (const sub of this.mockSubscribers) {
      if (sub.channels.includes(channel) || sub.channels.includes(docChannel)) {
        try {
          sub.callback(event);
        } catch (e) {
          console.error('[Mock Realtime] Subscriber callback failed:', e);
        }
      }
    }
  }

  private async initializeService() {
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
        this.teams = new Teams(this.client);
        this.storage = new Storage(this.client);
        
        // If we are already running in mock mode from localStorage, don't check real Appwrite session
        if (this.isUsingMock()) {
          console.log('Appwrite Service initialized in Mock Mode from storage.');
          return;
        }

        try {
          const userSession = await this.account.get();
          let role: 'Super Admin' | 'School Admin' = 'School Admin';
          let institution = 'AKCP';
          
          try {
            const teamsList = await this.teams.list();
            const teamIds = teamsList.teams.map(t => t.$id);
            
            if (teamIds.includes('super_admin')) {
              role = 'Super Admin';
              institution = 'KARE';
            } else {
              role = 'School Admin';
              const schoolTeam = teamIds.find(id => id.startsWith('school_'));
              if (schoolTeam) {
                institution = await this.getInstitutionNameForPrefix(schoolTeam.replace('school_', ''));
              }
            }
          } catch (teamErr) {
            console.error('Failed to retrieve verified teams, falling back to profile document:', teamErr);
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
              institution = await this.getInstitutionNameForPrefix('akcp');
            }
          }
          
          this.currentUser.set({
            email: userSession.email,
            name: userSession.name,
            role,
            institution
          });
          console.log('Appwrite Integration initialized successfully.');
        } catch (err: any) {
          if (err && err.code === 401) {
            console.log('Appwrite initialized. No active session.');
          } else {
            console.error('Appwrite service error during initialization:', err);
            // Fall back to mock mode if connection or API fails
            this.isUsingMock.set(true);
            localStorage.setItem('isUsingMock', 'true');
          }
        }
      } else {
        console.warn('Appwrite Project ID is not configured properly. Falling back to local MockDatabase.');
        this.isUsingMock.set(true);
        localStorage.setItem('isUsingMock', 'true');
      }
    } catch (e) {
      console.warn('Appwrite connection failed. Falling back to local MockDatabase.', e);
      this.isUsingMock.set(true);
      localStorage.setItem('isUsingMock', 'true');
    }
  }

  // Authentication Operations
  async login(email: string, password: string): Promise<AppUser> {
    const storedMock = localStorage.getItem('isUsingMock');
    if (this.isUsingMock() || storedMock === 'true') {
      return this.mockLogin(email, password);
    }
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
        const teamsList = await this.teams.list();
        const teamIds = teamsList.teams.map(t => t.$id);
        
        if (teamIds.includes('super_admin')) {
          role = 'Super Admin';
          institution = 'KARE';
        } else {
          role = 'School Admin';
          const schoolTeam = teamIds.find(id => id.startsWith('school_'));
          if (schoolTeam) {
            institution = await this.getInstitutionNameForPrefix(schoolTeam.replace('school_', ''));
          }
        }
      } catch (teamErr) {
        console.error('Failed to retrieve verified teams during login, falling back to profile document:', teamErr);
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
      }
      
      const loggedUser: AppUser = {
        email: userSession.email,
        name: userSession.name,
        role,
        institution
      };
      
      this.isUsingMock.set(false);
      localStorage.setItem('isUsingMock', 'false');
      localStorage.removeItem('mockUser');
      
      this.currentUser.set(loggedUser);
      return loggedUser;
    } catch (err: any) {
      console.warn('Appwrite login failed. Attempting local mock login...', err);
      try {
        const mockUser = await this.mockLogin(email, password);
        return mockUser;
      } catch (mockErr: any) {
        throw new Error(err.message || 'Login failed.');
      }
    }
  }

  private mockLogin(email: string, password: string): Promise<AppUser> {
    const defaultUsers = [
      { email: 'super@kare.edu', name: 'Dr. Suresh Kumar', role: 'Super Admin', institution: 'All' },
      { email: 'kare@kare.edu', name: 'Mr. Rajesh Kannan', role: 'School Admin', institution: 'KARE' },
      { email: 'akcp@kare.edu', name: 'Prof. Ramesh Patel', role: 'School Admin', institution: 'AKCP' },
      { email: 'linga@kare.edu', name: 'Sister Mary Joseph', role: 'School Admin', institution: 'LINGA Global School' },
      { email: 'akcas@kare.edu', name: 'Dr. Anjali Verma', role: 'School Admin', institution: 'AKCAS' },
      { email: 'cshm@kare.edu', name: 'Dr. R. Banupriya', role: 'School Admin', institution: 'CSHM' },
      { email: 'akbed@kare.edu', name: 'Dr. S. Rajan', role: 'School Admin', institution: 'AK B.Ed College' },
      { email: 'kmch@kare.edu', name: 'Dr. P. Sandeep', role: 'School Admin', institution: 'KMCH' }
    ];
    const user = defaultUsers.find(u => u.email === email);
    if (user) {
      const loggedUser: AppUser = {
        email: user.email,
        name: user.name,
        role: user.role as 'Super Admin' | 'School Admin',
        institution: user.institution
      };
      this.isUsingMock.set(true);
      this.currentUser.set(loggedUser);
      localStorage.setItem('isUsingMock', 'true');
      localStorage.setItem('mockUser', JSON.stringify(loggedUser));
      return Promise.resolve(loggedUser);
    }
    return Promise.reject(new Error('Invalid email or password.'));
  }

  async logout(): Promise<void> {
    try {
      const storedMock = localStorage.getItem('isUsingMock') === 'true' || this.isUsingMock();
      
      // Clean up localStorage and reset signals
      localStorage.removeItem('mockUser');
      localStorage.removeItem('isUsingMock');
      this.isUsingMock.set(false);
      this.currentUser.set(null);
      this.verifiedSchoolScopes = null;
      
      if (!storedMock) {
        try {
          if (this.account) {
            await this.account.deleteSession('current');
          }
        } catch (sessionErr) {
          console.warn('Real Appwrite session deletion failed or not found:', sessionErr);
        }
      }
    } catch (err) {
      console.error('Logout failed:', err);
      this.currentUser.set(null);
    }
  }

  async getSchools(): Promise<School[]> {
    if (this.isUsingMock()) {
      return [
        { id: '1', name: 'KARE', prefix: 'kare', code: 'kare', active: true },
        { id: '2', name: 'AKCP', prefix: 'akcp', code: 'akcp', active: true },
        { id: '3', name: 'LINGA Global School', prefix: 'linga', code: 'linga', active: true },
        { id: '4', name: 'AKCAS', prefix: 'akcas', code: 'akcas', active: true },
        { id: '5', name: 'CSHM', prefix: 'cshm', code: 'cshm', active: true },
        { id: '6', name: 'AK B.Ed College', prefix: 'akbed', code: 'akbed', active: true },
        { id: '7', name: 'KMCH', prefix: 'kmch', code: 'kmch', active: true }
      ];
    }
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        'master_schools',
        [Query.limit(100)]
      );
      const schools = response.documents
        .map(d => ({
          id: d.$id,
          name: d['name'],
          code: d['code'],
          prefix: d['prefix'],
          email: d['email'] || '',
          active: d['active'] !== false
        }))
        .filter(s => s.active)
        .sort((a, b) => a.name.localeCompare(b.name));
      this.schoolCache = schools;
      return schools;
    } catch (e) {
      console.error('Error loading school master data:', e);
      return this.getSchoolsFromUsers();
    }
  }

  private async getSchoolsFromUsers(): Promise<School[]> {
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.USERS,
        [Query.limit(100)]
      );
      const schoolMap = new Map<string, School>();
      for (const d of response.documents) {
        if (d['role'] !== 'School Admin') continue;
        const name = d['institution'];
        const prefix = (d['email'] || name).split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '');
        schoolMap.set(name, {
          id: prefix,
          name,
          code: prefix.toUpperCase(),
          prefix,
          email: d['email'] || '',
          active: true
        });
      }
      const schools = Array.from(schoolMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      this.schoolCache = schools;
      return schools;
    } catch (err) {
      console.error('Error deriving school master data from users:', err);
      return this.schoolCache;
    }
  }

  async getCategories(): Promise<MasterOption[]> {
    if (this.isUsingMock()) {
      return [
        { id: '1', name: 'Computers', description: '', active: true },
        { id: '2', name: 'Furniture', description: '', active: true },
        { id: '3', name: 'Lab Equipment', description: '', active: true },
        { id: '4', name: 'Consumables', description: '', active: true },
        { id: '5', name: 'Refrigerators', description: '', active: true }
      ];
    }
    return this.getMasterOptions('master_categories');
  }

  async getStatuses(): Promise<MasterOption[]> {
    if (this.isUsingMock()) {
      return [
        { id: '1', name: 'Active', description: '', active: true },
        { id: '2', name: 'Idle', description: '', active: true },
        { id: '3', name: 'Under Service', description: '', active: true },
        { id: '4', name: 'Transferred', description: '', active: true },
        { id: '5', name: 'Missing', description: '', active: true },
        { id: '6', name: 'Damaged', description: '', active: true },
        { id: '7', name: 'Condemned', description: '', active: true }
      ];
    }
    return this.getMasterOptions('master_statuses');
  }

  async getVendors(onlyActive = false): Promise<Vendor[]> {
    if (this.isUsingMock()) {
      const all = MockDatabase.getVendors();
      const result = onlyActive ? all.filter(v => v.active) : all;
      return result.sort((a, b) => a.name.localeCompare(b.name));
    }
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        'master_vendors',
        [Query.limit(100)]
      );
      const all = response.documents
        .map(d => ({
          id: d.$id,
          name: d['name'],
          gst: d['gst'] || '',
          address: d['address'] || '',
          phone: d['phone'] || '',
          email: d['email'] || '',
          website: d['website'] || '',
          paymentTerms: d['paymentTerms'] || '',
          active: d['active'] !== false
        }));
      const result = onlyActive ? all.filter(v => v.active) : all;
      return result.sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.error('Error loading vendor master data:', e);
      return [];
    }
  }

  async saveVendor(vendor: Vendor): Promise<Vendor> {
    if (this.isUsingMock()) {
      if (vendor.id) {
        MockDatabase.updateVendor(vendor);
        return vendor;
      } else {
        const newVendor = { ...vendor, id: 'VEND-' + Date.now() };
        MockDatabase.addVendor(newVendor);
        return newVendor;
      }
    }
    const data = {
      name: vendor.name,
      gst: vendor.gst || '',
      address: vendor.address || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      website: vendor.website || '',
      paymentTerms: vendor.paymentTerms || '',
      active: vendor.active !== false
    };
    if (vendor.id) {
      await this.databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        'master_vendors',
        vendor.id,
        data
      );
      return { ...vendor, ...data };
    } else {
      const id = ID.unique();
      await this.databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        'master_vendors',
        id,
        data,
        this.getCatalogPermissions()
      );
      return { ...vendor, ...data, id };
    }
  }

  async deleteVendor(id: string): Promise<void> {
    if (this.isUsingMock()) {
      MockDatabase.deleteVendor(id);
      return;
    }
    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      'master_vendors',
      id,
      { active: false }
    );
  }

  // Note: getAssetTransfers and transferAsset have been consolidated below to lines 1017+.

  private async getMasterOptions(collectionId: string): Promise<MasterOption[]> {
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        collectionId,
        [Query.limit(100)]
      );
      return response.documents
        .map(d => ({
          id: d.$id,
          name: d['name'],
          description: d['description'] || '',
          active: d['active'] !== false
        }))
        .filter(o => o.active)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.error(`Error loading ${collectionId}:`, e);
      return [];
    }
  }

  private async getInstitutionNameForPrefix(prefix: string): Promise<string> {
    const normalized = prefix.toLowerCase();
    const schools = this.schoolCache.length ? this.schoolCache : await this.getSchools();
    return schools.find(s => s.prefix.toLowerCase() === normalized)?.name || prefix.toUpperCase();
  }

  private async getSchoolPrefixesForScope(): Promise<string[]> {
    const user = this.currentUser();
    if (user && user.role === 'School Admin') {
      return [this.getPrefixForInstitution(user.institution)];
    }

    const schools = await this.getSchools();
    return schools.map(s => s.prefix);
  }

  // Helper to determine prefix based on institution name
  public getPrefixForInstitution(inst?: string): string {
    const target = inst || this.currentUser()?.institution;
    if (!target) return 'kare';
    const name = target.toLowerCase();
    const school = this.schoolCache.find(s =>
      s.name.toLowerCase() === name ||
      s.code.toLowerCase() === name ||
      s.prefix.toLowerCase() === name
    );
    if (school) return school.prefix;
    return name.replace(/[^a-z0-9]+/g, '').substring(0, 24) || 'kare';
  }

  private toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private sanitizeIdPart(value: string, fallback = 'item'): string {
    return (value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24) || fallback;
  }

  private getLocationLabel(loc?: Location): string {
    if (!loc) return '';
    return `${loc.institution} -> ${loc.building} -> ${loc.floor} -> ${loc.department} -> ${loc.room}`;
  }

  private mapBillDocument(d: any): ProcurementBill {
    return {
      id: d.$id || d['id'],
      billNumber: d['billNumber'] || '',
      purchaseOrderNumber: d['purchaseOrderNumber'] || '',
      invoiceNumber: d['invoiceNumber'] || '',
      vendorId: d['vendorId'] || '',
      vendorName: d['vendorName'] || '',
      schoolId: d['schoolId'] || '',
      schoolName: d['schoolName'] || '',
      departmentId: d['departmentId'] || '',
      departmentName: d['departmentName'] || '',
      purchaseDate: d['purchaseDate'] || '',
      billingDate: d['billingDate'] || '',
      gstPercent: this.toNumber(d['gstPercent']),
      gstAmount: this.toNumber(d['gstAmount']),
      transportCharges: this.toNumber(d['transportCharges']),
      packingCharges: this.toNumber(d['packingCharges']),
      insuranceCharges: this.toNumber(d['insuranceCharges']),
      otherCharges: this.toNumber(d['otherCharges']),
      discount: this.toNumber(d['discount']),
      subtotal: this.toNumber(d['subtotal']),
      grandTotal: this.toNumber(d['grandTotal']),
      paymentStatus: d['paymentStatus'] || 'Pending',
      paymentMethod: d['paymentMethod'] || '',
      invoiceAttachmentIds: d['invoiceAttachmentIds'] || [],
      remarks: d['remarks'] || '',
      createdBy: d['createdBy'] || '',
      approvedBy: d['approvedBy'] || '',
      approvalDate: d['approvalDate'] || '',
      associatedAssetIds: d['associatedAssetIds'] || [],
      createdAt: d['createdAt'] || d.$createdAt || ''
    };
  }

  private mapBillItemDocument(d: any): ProcurementBillItem {
    return {
      id: d.$id || d['id'],
      billId: d['billId'] || '',
      productId: d['productId'] || '',
      productName: d['productName'] || '',
      category: d['category'] || '',
      brand: d['brand'] || '',
      model: d['model'] || '',
      manufacturer: d['manufacturer'] || '',
      specifications: d['specifications'] || '',
      barcode: d['barcode'] || '',
      quantity: this.toNumber(d['quantity']),
      unitPrice: this.toNumber(d['unitPrice']),
      gstPercent: this.toNumber(d['gstPercent']),
      gstAmount: this.toNumber(d['gstAmount']),
      itemTotal: this.toNumber(d['itemTotal']),
      warrantyDetails: d['warrantyDetails'] || '',
      locationId: d['locationId'] || '',
      generatedAssetIds: d['generatedAssetIds'] || []
    };
  }

  async getBills(): Promise<ProcurementBill[]> {
    if (this.isUsingMock()) {
      const all = MockDatabase.getBills();
      const user = this.currentUser();
      if (user?.role === 'School Admin') {
        return all.filter(b => b.schoolName === user.institution);
      }
      return all;
    }
    try {
      const user = this.currentUser();
      const queries = [Query.limit(100), Query.orderDesc('$createdAt')];
      if (user?.role === 'School Admin') {
        queries.push(Query.equal('schoolName', user.institution));
      }
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.BILLS,
        queries
      );
      return response.documents.map(d => this.mapBillDocument(d));
    } catch (e) {
      console.error('Error loading bills:', e);
      return [];
    }
  }

  async getBillItems(billId: string): Promise<ProcurementBillItem[]> {
    if (this.isUsingMock()) {
      const assets = MockDatabase.getAssets().filter(a => a.billId === billId);
      const groups = new Map<string, Asset[]>();
      for (const a of assets) {
        const itemId = a.billItemId || 'default-item';
        if (!groups.has(itemId)) {
          groups.set(itemId, []);
        }
        groups.get(itemId)!.push(a);
      }
      const billItems: ProcurementBillItem[] = [];
      for (const [itemId, groupAssets] of groups.entries()) {
        const first = groupAssets[0];
        const qty = groupAssets.length;
        const total = first.unitPrice * qty;
        const bill = MockDatabase.getBills().find(b => b.id === billId);
        const gstPercent = bill?.gstPercent || 18;
        const gstAmount = (total * gstPercent) / 100;
        billItems.push({
          id: itemId,
          billId: billId,
          productId: first.productId || '',
          productName: first.name,
          category: first.category,
          brand: first.brand,
          model: first.model,
          manufacturer: '',
          specifications: first.remarks,
          barcode: first.barcode,
          quantity: qty,
          unitPrice: first.unitPrice,
          gstPercent: gstPercent,
          gstAmount: Math.round(gstAmount),
          itemTotal: Math.round(total),
          warrantyDetails: first.warrantyDetails,
          locationId: first.locationId,
          generatedAssetIds: groupAssets.map(a => a.id)
        });
      }
      return billItems;
    }
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.BILL_ITEMS,
        [Query.equal('billId', billId), Query.limit(100)]
      );
      return response.documents.map(d => this.mapBillItemDocument(d));
    } catch (e) {
      console.error(`Error loading bill items for ${billId}:`, e);
      return [];
    }
  }

  async updateBillPayment(
    bill: ProcurementBill,
    paymentStatus: ProcurementBill['paymentStatus'],
    paymentMethod: string
  ): Promise<void> {
    if (this.isUsingMock()) {
      const bills = MockDatabase.getBills();
      const b = bills.find(x => x.id === bill.id);
      if (b) {
        b.paymentStatus = paymentStatus;
        b.paymentMethod = paymentMethod;
        MockDatabase.saveBills(bills);
        
        const prefix = this.getPrefixForInstitution(b.schoolName);
        this.triggerMockRealtimeEvent('bills', 'update', b, prefix);
      }
      const user = this.currentUser();
      await this.addProcurementAuditLog({
        billId: bill.id,
        action: 'Payment Updated',
        details: `${bill.billNumber} payment changed to ${paymentStatus}${paymentMethod ? ` via ${paymentMethod}` : ''}.`,
        userEmail: user?.email || 'system',
        userName: user?.name || 'System'
      });
      return;
    }
    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.BILLS,
      bill.id,
      { paymentStatus, paymentMethod }
    );
    const user = this.currentUser();
    await this.addProcurementAuditLog({
      billId: bill.id,
      action: 'Payment Updated',
      details: `${bill.billNumber} payment changed to ${paymentStatus}${paymentMethod ? ` via ${paymentMethod}` : ''}.`,
      userEmail: user?.email || 'system',
      userName: user?.name || 'System'
    });
  }

  async uploadInvoiceAttachment(bill: ProcurementBill, file: File): Promise<string> {
    if (this.isUsingMock()) {
      const mockId = 'FILE-' + Date.now();
      const nextIds = Array.from(new Set([...(bill.invoiceAttachmentIds || []), mockId]));
      const bills = MockDatabase.getBills();
      const b = bills.find(x => x.id === bill.id);
      if (b) {
        b.invoiceAttachmentIds = nextIds;
        MockDatabase.saveBills(bills);
      }
      const user = this.currentUser();
      await this.addProcurementAuditLog({
        billId: bill.id,
        action: 'Invoice Attachment Uploaded',
        details: `${file.name} uploaded as mock attachment ${mockId}.`,
        userEmail: user?.email || 'system',
        userName: user?.name || 'System'
      });
      return mockId;
    }
    const uploaded = await this.storage.createFile(
      APPWRITE_CONFIG.BUCKETS.INVOICE_ATTACHMENTS,
      ID.unique(),
      file
    );
    const nextIds = Array.from(new Set([...(bill.invoiceAttachmentIds || []), uploaded.$id]));
    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.BILLS,
      bill.id,
      { invoiceAttachmentIds: nextIds }
    );
    const user = this.currentUser();
    await this.addProcurementAuditLog({
      billId: bill.id,
      action: 'Invoice Attachment Uploaded',
      details: `${file.name} uploaded to shared attachment bucket.`,
      userEmail: user?.email || 'system',
      userName: user?.name || 'System'
    });
    return uploaded.$id;
  }

  private mapProductDocument(d: any): ProductMaster {
    return {
      id: d.$id,
      barcode: d['barcode'] || '',
      name: d['name'] || '',
      category: d['category'] || '',
      brand: d['brand'] || '',
      model: d['model'] || '',
      manufacturer: d['manufacturer'] || '',
      specifications: d['specifications'] || '',
      suggestedWarranty: d['suggestedWarranty'] || '',
      imageUrl: d['imageUrl'] || '',
      active: d['active'] !== false
    };
  }

  async getProducts(): Promise<ProductMaster[]> {
    if (this.isUsingMock()) {
      return MockDatabase.getProducts().sort((a, b) => a.name.localeCompare(b.name));
    }
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PRODUCTS,
        [Query.limit(100), Query.orderAsc('name')]
      );
      return response.documents.map(d => this.mapProductDocument(d));
    } catch (e) {
      console.error('Error loading product master:', e);
      return [];
    }
  }

  async saveProduct(product: ProductMaster): Promise<ProductMaster> {
    if (this.isUsingMock()) {
      if (product.id) {
        MockDatabase.updateProduct(product);
        return product;
      } else {
        const newProd = { ...product, id: 'PROD-' + Date.now() };
        MockDatabase.addProduct(newProd);
        return newProd;
      }
    }
    const data = {
      barcode: product.barcode || '',
      name: product.name,
      category: product.category,
      brand: product.brand || '',
      model: product.model || '',
      manufacturer: product.manufacturer || '',
      specifications: product.specifications || '',
      suggestedWarranty: product.suggestedWarranty || '',
      imageUrl: product.imageUrl || '',
      active: product.active !== false
    };
    const id = product.id || ID.unique();
    if (product.id) {
      await this.databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PRODUCTS,
        product.id,
        data
      );
      return { ...product, ...data, id: product.id };
    }
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.PRODUCTS,
      id,
      data,
      this.getCatalogPermissions()
    );
    return { ...product, ...data, id };
  }

  async lookupProductByBarcode(barcode: string): Promise<ProductMaster | null> {
    if (this.isUsingMock()) {
      if (!barcode.trim()) return null;
      return MockDatabase.getProducts().find(p => p.barcode === barcode.trim()) || null;
    }
    if (!barcode.trim()) return null;
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PRODUCTS,
        [Query.equal('barcode', barcode.trim()), Query.limit(1)]
      );
      const d = response.documents[0];
      if (!d) return null;
      return this.mapProductDocument(d);
    } catch (e) {
      console.error('Barcode lookup failed:', e);
      return null;
    }
  }

  private async ensureProductFromItem(item: ProcurementDraftItem): Promise<string> {
    const existing = item.barcode ? await this.lookupProductByBarcode(item.barcode) : null;
    if (existing) return existing.id;

    const productId = ID.unique();
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.PRODUCTS,
      productId,
      {
        barcode: item.barcode || '',
        name: item.productName,
        category: item.category,
        brand: item.brand || '',
        model: item.model || '',
        manufacturer: item.manufacturer || '',
        specifications: item.specifications || '',
        suggestedWarranty: item.warrantyDetails || '',
        imageUrl: '',
        active: true
      },
      this.getCatalogPermissions()
    );
    return productId;
  }

  async createProcurementBill(input: {
    schoolId: string;
    schoolName: string;
    vendorId: string;
    vendorName: string;
    purchaseOrderNumber: string;
    invoiceNumber: string;
    purchaseDate: string;
    billingDate: string;
    departmentId: string;
    departmentName: string;
    gstPercent: number;
    transportCharges: number;
    packingCharges: number;
    insuranceCharges: number;
    otherCharges: number;
    discount: number;
    paymentStatus: ProcurementBill['paymentStatus'];
    paymentMethod: string;
    remarks: string;
    items: ProcurementDraftItem[];
  }): Promise<ProcurementBill> {
    await this.enforceSchoolScope(input.schoolName);
    if (this.isUsingMock()) {
      const user = this.currentUser();
      const billId = 'BILL-' + Date.now();
      const now = new Date().toISOString();
      const items = input.items.filter(item => item.productName.trim() && item.quantity > 0);
      if (!items.length) {
        throw new Error('Add at least one product before saving procurement.');
      }

      const lineSubtotal = items.reduce((sum, item) => sum + this.toNumber(item.unitPrice) * this.toNumber(item.quantity), 0);
      const lineGst = items.reduce((sum, item) => {
        const gstPercent = item.gstPercent || input.gstPercent || 0;
        return sum + (this.toNumber(item.unitPrice) * this.toNumber(item.quantity) * gstPercent / 100);
      }, 0);
      const grandTotal = lineSubtotal + lineGst + input.transportCharges + input.packingCharges + input.insuranceCharges + input.otherCharges - input.discount;
      const billNumber = `BILL-${this.getPrefixForInstitution(input.schoolName).toUpperCase()}-${Date.now()}`;

      const locs = MockDatabase.getLocations();
      const generatedAssetIds: string[] = [];

      for (const [itemIndex, item] of items.entries()) {
        const billItemId = 'BITEM-' + Date.now() + '-' + itemIndex;
        const location = locs.find(l => l.id === item.locationId);
        const schoolPrefix = this.getPrefixForInstitution(input.schoolName).toUpperCase().slice(0, 8);
        const categoryCode = (item.category || item.productName || 'AS').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'AS';

        let product = MockDatabase.getProducts().find(p => p.barcode === item.barcode);
        if (!product) {
          product = {
            id: 'PROD-' + Date.now() + '-' + itemIndex,
            barcode: item.barcode || '',
            name: item.productName,
            category: item.category,
            brand: item.brand || '',
            model: item.model || '',
            manufacturer: item.manufacturer || '',
            specifications: item.specifications || '',
            suggestedWarranty: item.warrantyDetails || '',
            imageUrl: '',
            active: true
          };
          MockDatabase.addProduct(product);
        }

        for (let i = 1; i <= item.quantity; i++) {
          const assetId = `${categoryCode}-${schoolPrefix}-${Date.now().toString().slice(-6)}-${itemIndex + 1}${String(i).padStart(3, '0')}`;
          const asset: Asset = {
            id: assetId,
            name: item.productName,
            category: item.category,
            barcode: item.barcode ? `${item.barcode}-${String(i).padStart(3, '0')}` : `BAR-${assetId}`,
            qrCode: assetId,
            brand: item.brand || '',
            model: item.model || '',
            serialNumber: '',
            quantity: 1,
            unitPrice: this.toNumber(item.unitPrice),
            totalPrice: this.toNumber(item.unitPrice),
            purchaseDate: input.purchaseDate,
            purchaseOrder: input.purchaseOrderNumber,
            billNumber,
            billDate: input.billingDate,
            billId,
            billItemId,
            productId: product.id,
            schoolId: input.schoolId,
            departmentId: input.departmentId,
            department: location?.department || input.departmentName,
            building: location?.building || '',
            room: location?.room || '',
            locationLabel: this.getLocationLabel(location),
            generatedFromProcurement: true,
            vendor: input.vendorName,
            warrantyDetails: item.warrantyDetails || '',
            status: 'Active',
            remarks: `Generated from procurement bill ${billNumber}. ${item.specifications || ''}`.trim(),
            locationId: item.locationId,
            isContainer: false
          };
          MockDatabase.addAsset(asset);
          generatedAssetIds.push(assetId);
          
          const prefix = this.getPrefixForInstitution(input.schoolName);
          const { baseColl } = this.getAssetCollectionInfo(asset, locs);
          this.triggerMockRealtimeEvent(baseColl, 'create', asset, prefix);
        }
      }

      const bill: ProcurementBill = {
        id: billId,
        billNumber,
        purchaseOrderNumber: input.purchaseOrderNumber,
        invoiceNumber: input.invoiceNumber,
        vendorId: input.vendorId || '',
        vendorName: input.vendorName,
        schoolId: input.schoolId,
        schoolName: input.schoolName,
        departmentId: input.departmentId,
        departmentName: input.departmentName,
        purchaseDate: input.purchaseDate,
        billingDate: input.billingDate,
        gstPercent: input.gstPercent || 0,
        gstAmount: Math.round(lineGst),
        transportCharges: input.transportCharges || 0,
        packingCharges: input.packingCharges || 0,
        insuranceCharges: input.insuranceCharges || 0,
        otherCharges: input.otherCharges || 0,
        discount: input.discount || 0,
        subtotal: Math.round(lineSubtotal),
        grandTotal: Math.round(grandTotal),
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod || '',
        invoiceAttachmentIds: [],
        remarks: input.remarks || '',
        createdBy: user?.email || 'system',
        approvedBy: '',
        approvalDate: '',
        associatedAssetIds: generatedAssetIds,
        createdAt: now
      };
      MockDatabase.addBill(bill);

      const prefix = this.getPrefixForInstitution(input.schoolName);
      this.triggerMockRealtimeEvent('bills', 'create', bill, prefix);

      const auditLog = {
        id: 'AUD-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userEmail: user?.email || 'system',
        userName: user?.name || 'System',
        action: 'Procurement Created',
        details: `${billNumber} created with ${items.length} product lines and ${generatedAssetIds.length} generated assets.`,
        reason: 'Procurement form submission'
      };
      MockDatabase.addAuditLog(auditLog);
      this.triggerMockRealtimeEvent('audit_logs', 'create', auditLog, prefix);

      return bill;
    }
    const user = this.currentUser();
    const billId = ID.unique();
    const now = new Date().toISOString();
    const items = input.items.filter(item => item.productName.trim() && item.quantity > 0);
    if (!items.length) {
      throw new Error('Add at least one product before saving procurement.');
    }

    const lineSubtotal = items.reduce((sum, item) => sum + this.toNumber(item.unitPrice) * this.toNumber(item.quantity), 0);
    const lineGst = items.reduce((sum, item) => {
      const gstPercent = item.gstPercent || input.gstPercent || 0;
      return sum + (this.toNumber(item.unitPrice) * this.toNumber(item.quantity) * gstPercent / 100);
    }, 0);
    const grandTotal = lineSubtotal + lineGst + input.transportCharges + input.packingCharges + input.insuranceCharges + input.otherCharges - input.discount;
    const billNumber = `BILL-${this.getPrefixForInstitution(input.schoolName).toUpperCase()}-${Date.now()}`;

    const prefix = this.getPrefixForInstitution(input.schoolName);
    const permissions = this.getPermissionsForPrefix(prefix);

    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.BILLS,
      billId,
      {
        id: billId,
        billNumber,
        purchaseOrderNumber: input.purchaseOrderNumber,
        invoiceNumber: input.invoiceNumber,
        vendorId: input.vendorId || '',
        vendorName: input.vendorName,
        schoolId: input.schoolId,
        schoolName: input.schoolName,
        departmentId: input.departmentId,
        departmentName: input.departmentName,
        purchaseDate: input.purchaseDate,
        billingDate: input.billingDate,
        gstPercent: input.gstPercent || 0,
        gstAmount: Math.round(lineGst),
        transportCharges: input.transportCharges || 0,
        packingCharges: input.packingCharges || 0,
        insuranceCharges: input.insuranceCharges || 0,
        otherCharges: input.otherCharges || 0,
        discount: input.discount || 0,
        subtotal: Math.round(lineSubtotal),
        grandTotal: Math.round(grandTotal),
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod || '',
        invoiceAttachmentIds: [],
        remarks: input.remarks || '',
        createdBy: user?.email || 'system',
        approvedBy: '',
        approvalDate: '',
        associatedAssetIds: [],
        createdAt: now
      },
      permissions
    );

    const generatedAssetIds: string[] = [];

    for (const [itemIndex, item] of items.entries()) {
      const productId = await this.ensureProductFromItem(item);
      const billItemId = ID.unique();
      const schoolPrefix = this.getPrefixForInstitution(input.schoolName).toUpperCase().slice(0, 8);
      const categoryCode = (item.category || item.productName || 'AS').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'AS';

      const itemAssetIds: string[] = [];

      for (let i = 1; i <= item.quantity; i++) {
        const assetId = `${categoryCode}-${schoolPrefix}-${Date.now().toString().slice(-6)}-${itemIndex + 1}${String(i).padStart(3, '0')}`;
        const asset: Asset = {
          id: assetId,
          name: item.productName,
          category: item.category,
          barcode: item.barcode ? `${item.barcode}-${String(i).padStart(3, '0')}` : `BAR-${assetId}`,
          qrCode: assetId,
          brand: item.brand || '',
          model: item.model || '',
          serialNumber: '',
          quantity: 1,
          unitPrice: this.toNumber(item.unitPrice),
          totalPrice: this.toNumber(item.unitPrice),
          purchaseDate: input.purchaseDate,
          purchaseOrder: input.purchaseOrderNumber,
          billNumber,
          billDate: input.billingDate,
          billId,
          billItemId,
          productId,
          schoolId: input.schoolId,
          departmentId: input.departmentId,
          department: input.departmentName,
          building: '',
          room: '',
          locationLabel: '',
          generatedFromProcurement: true,
          vendor: input.vendorName,
          warrantyDetails: item.warrantyDetails || '',
          status: 'Active',
          remarks: `Generated from procurement bill ${billNumber}. ${item.specifications || ''}`.trim(),
          locationId: item.locationId,
          isContainer: false
        };
        await this.addAsset(asset);
        generatedAssetIds.push(assetId);
        itemAssetIds.push(assetId);
      }

      const itemTotal = this.toNumber(item.unitPrice) * this.toNumber(item.quantity);
      const itemGst = itemTotal * (item.gstPercent || input.gstPercent || 0) / 100;

      await this.databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.BILL_ITEMS,
        billItemId,
        {
          id: billItemId,
          billId,
          productId,
          productName: item.productName,
          category: item.category,
          brand: item.brand || '',
          model: item.model || '',
          manufacturer: item.manufacturer || '',
          specifications: item.specifications || '',
          barcode: item.barcode || '',
          quantity: this.toNumber(item.quantity),
          unitPrice: this.toNumber(item.unitPrice),
          gstPercent: item.gstPercent || input.gstPercent || 0,
          gstAmount: Math.round(itemGst),
          itemTotal: Math.round(itemTotal),
          warrantyDetails: item.warrantyDetails || '',
          locationId: item.locationId,
          generatedAssetIds: itemAssetIds
        },
        permissions
      );
    }

    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.BILLS,
      billId,
      { associatedAssetIds: generatedAssetIds }
    );

    await this.addProcurementAuditLog({
      billId,
      action: 'Procurement Created',
      details: `${billNumber} created with ${items.length} product lines and ${generatedAssetIds.length} generated assets.`,
      userEmail: user?.email || 'system',
      userName: user?.name || 'System',
      schoolName: input.schoolName
    });

    return {
      id: billId,
      billNumber,
      purchaseOrderNumber: input.purchaseOrderNumber,
      invoiceNumber: input.invoiceNumber,
      vendorId: input.vendorId || '',
      vendorName: input.vendorName,
      schoolId: input.schoolId,
      schoolName: input.schoolName,
      departmentId: input.departmentId,
      departmentName: input.departmentName,
      purchaseDate: input.purchaseDate,
      billingDate: input.billingDate,
      gstPercent: input.gstPercent || 0,
      gstAmount: Math.round(lineGst),
      transportCharges: input.transportCharges || 0,
      packingCharges: input.packingCharges || 0,
      insuranceCharges: input.insuranceCharges || 0,
      otherCharges: input.otherCharges || 0,
      discount: input.discount || 0,
      subtotal: Math.round(lineSubtotal),
      grandTotal: Math.round(grandTotal),
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod || '',
      invoiceAttachmentIds: [],
      remarks: input.remarks || '',
      createdBy: user?.email || 'system',
      approvedBy: '',
      approvalDate: '',
      associatedAssetIds: generatedAssetIds,
      createdAt: now
    };
  }

  private async addProcurementAuditLog(log: {
    billId: string;
    action: string;
    details: string;
    userEmail: string;
    userName: string;
    schoolName?: string;
  }): Promise<void> {
    if (this.isUsingMock()) {
      const auditLog = {
        id: 'AUD-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userEmail: log.userEmail,
        userName: log.userName,
        action: log.action,
        details: log.details,
        reason: 'Procurement action'
      };
      MockDatabase.addAuditLog(auditLog);
      
      const inst = log.schoolName || this.currentUser()?.institution || 'KARE';
      const prefix = this.getPrefixForInstitution(inst);
      this.triggerMockRealtimeEvent('audit_logs', 'create', auditLog, prefix);
      return;
    }
    try {
      const inst = log.schoolName || this.currentUser()?.institution || 'KARE';
      const prefix = this.getPrefixForInstitution(inst);
      await this.databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROCUREMENT_AUDIT_LOGS,
        ID.unique(),
        {
          billId: log.billId,
          date: new Date().toISOString(),
          userEmail: log.userEmail,
          userName: log.userName,
          action: log.action,
          details: log.details
        },
        this.getPermissionsForPrefix(prefix)
      );
    } catch (e) {
      console.error('Unable to write procurement audit log:', e);
    }
  }

  private mapTransferDocument(d: any): AssetTransfer {
    return {
      id: d.$id,
      assetId: d['assetId'] || '',
      fromDepartmentId: d['fromDepartmentId'] || '',
      fromDepartmentName: d['fromDepartmentName'] || '',
      toDepartmentId: d['toDepartmentId'] || '',
      toDepartmentName: d['toDepartmentName'] || '',
      transferDate: d['transferDate'] || '',
      transferReason: d['transferReason'] || '',
      transferredBy: d['transferredBy'] || '',
      approvedBy: d['approvedBy'] || ''
    };
  }

  async getAssetTransfers(assetId: string): Promise<AssetTransfer[]> {
    if (this.isUsingMock()) {
      return MockDatabase.getTransfers(assetId);
    }
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.ASSET_TRANSFERS,
        [Query.equal('assetId', assetId), Query.limit(100), Query.orderDesc('transferDate')]
      );
      return response.documents.map(d => this.mapTransferDocument(d));
    } catch (e) {
      console.error(`Error loading transfer history for ${assetId}:`, e);
      return [];
    }
  }

  async transferAsset(input: {
    asset: Asset;
    toLocationId: string;
    reason: string;
    approvedBy: string;
  }): Promise<void> {
    const assetInst = input.asset.schoolId || input.asset.locationLabel || 'KARE';
    await this.enforceSchoolScope(assetInst);

    if (this.isUsingMock()) {
      const locs = MockDatabase.getLocations();
      const nextLocation = locs.find(l => l.id === input.toLocationId);
      if (!nextLocation) {
        throw new Error('Target location was not found.');
      }
      await this.enforceSchoolScope(nextLocation.institution);
      const user = this.currentUser();
      const updatedAsset: Asset = {
        ...input.asset,
        locationId: nextLocation.id,
        schoolId: this.getPrefixForInstitution(nextLocation.institution),
        departmentId: `${nextLocation.institution}:${nextLocation.department}`,
        department: nextLocation.department,
        building: nextLocation.building,
        room: nextLocation.room,
        locationLabel: this.getLocationLabel(nextLocation),
        status: 'Transferred'
      };
      MockDatabase.updateAsset(updatedAsset);
      const transferLog = {
        id: 'TR-' + Date.now(),
        assetId: input.asset.id,
        fromDepartmentId: input.asset.departmentId || '',
        fromDepartmentName: input.asset.department || '',
        toDepartmentId: updatedAsset.departmentId || '',
        toDepartmentName: updatedAsset.department || '',
        transferDate: new Date().toISOString(),
        transferReason: input.reason,
        transferredBy: user?.email || 'system',
        approvedBy: input.approvedBy || user?.email || ''
      };
      MockDatabase.addTransfer(transferLog);

      const fromPrefix = this.getPrefixForInstitution(assetInst);
      const toPrefix = this.getPrefixForInstitution(nextLocation.institution);
      const { baseColl } = this.getAssetCollectionInfo(updatedAsset, locs);
      
      this.triggerMockRealtimeEvent(baseColl, 'update', updatedAsset, fromPrefix);
      this.triggerMockRealtimeEvent(baseColl, 'create', updatedAsset, toPrefix);
      this.triggerMockRealtimeEvent('asset_transfers', 'create', transferLog, fromPrefix);
      this.triggerMockRealtimeEvent('asset_transfers', 'create', transferLog, toPrefix);
      return;
    }
    const locs = await this.getLocations();
    const nextLocation = locs.find(l => l.id === input.toLocationId);
    if (!nextLocation) {
      throw new Error('Target location was not found.');
    }
    await this.enforceSchoolScope(nextLocation.institution);

    const user = this.currentUser();
    const updatedAsset: Asset = {
      ...input.asset,
      locationId: nextLocation.id,
      schoolId: this.getPrefixForInstitution(nextLocation.institution),
      departmentId: `${nextLocation.institution}:${nextLocation.department}`,
      department: nextLocation.department,
      building: nextLocation.building,
      room: nextLocation.room,
      locationLabel: this.getLocationLabel(nextLocation),
      status: 'Transferred'
    };

    await this.updateAsset(updatedAsset);

    const fromPrefix = this.getPrefixForInstitution(assetInst);
    const toPrefix = this.getPrefixForInstitution(nextLocation.institution);
    const permissions = [
      Permission.read(Role.team('super_admin')),
      Permission.read(Role.team(`school_${fromPrefix}`)),
      Permission.read(Role.team(`school_${toPrefix}`)),
      Permission.create(Role.team('super_admin')),
      Permission.create(Role.team(`school_${fromPrefix}`)),
      Permission.update(Role.team('super_admin')),
      Permission.update(Role.team(`school_${fromPrefix}`)),
      Permission.delete(Role.team('super_admin'))
    ];

    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.ASSET_TRANSFERS,
      ID.unique(),
      {
        assetId: input.asset.id,
        fromDepartmentId: input.asset.departmentId || '',
        fromDepartmentName: input.asset.department || '',
        toDepartmentId: updatedAsset.departmentId || '',
        toDepartmentName: updatedAsset.department || '',
        transferDate: new Date().toISOString(),
        transferReason: input.reason,
        transferredBy: user?.email || 'system',
        approvedBy: input.approvedBy || user?.email || ''
      },
      permissions
    );
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

  public mapAssetDocument(d: any, locs: Location[]): Asset {
    const asset: Asset = {
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
      purchaseOrder: d['purchaseOrder'] || '',
      billNumber: d['billNumber'] || '',
      billDate: d['billDate'] || '',
      billId: d['billId'] || '',
      billItemId: d['billItemId'] || '',
      productId: d['productId'] || '',
      schoolId: d['schoolId'] || '',
      departmentId: d['departmentId'] || '',
      department: d['department'] || '',
      building: d['building'] || '',
      room: d['room'] || '',
      locationLabel: d['locationLabel'] || '',
      generatedFromProcurement: d['generatedFromProcurement'] || false,
      vendor: d['vendor'] || '',
      warrantyDetails: d['warrantyDetails'] || '',
      status: d['status'],
      remarks: d['remarks'] || '',
      locationId: d['locationId'],
      containerId: d['containerId'] || undefined,
      isContainer: d['isContainer'] || false
    };
    const loc = locs.find(l => l.id === asset.locationId);
    if (loc) {
      asset.locationText = `${loc.institution} -> ${loc.building} -> ${loc.floor} -> ${loc.department} -> ${loc.room}`;
    }
    return asset;
  }

  public mapRequestDocument(d: any): VerificationRequest {
    return {
      id: d.$id || d.id,
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
      comments: d['comments'] || '',
      approverHistory: d['approverHistory'] || '[]',
      rejectionReason: d['rejectionReason'] || ''
    };
  }

  public mapAuditLogDocument(d: any): AuditLog {
    return {
      id: d.$id || d.id,
      date: d['date'],
      userEmail: d['userEmail'],
      userName: d['userName'],
      action: d['action'],
      details: d['details'],
      reason: d['reason'] || ''
    };
  }

  private isPendingAddition(asset: Asset): boolean {
    return asset.remarks.includes('Approval Pending.');
  }

  private createAssetDocumentData(asset: Asset) {
    const data: any = {
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
      purchaseOrder: asset.purchaseOrder || '',
      billNumber: asset.billNumber || '',
      billDate: asset.billDate || '',
      vendor: asset.vendor || '',
      warrantyDetails: asset.warrantyDetails || '',
      status: asset.status,
      remarks: asset.remarks || '',
      locationId: asset.locationId,
      containerId: asset.containerId || '',
      isContainer: asset.isContainer || false
    };
    const optionalFields: Array<keyof Asset> = [
      'billId',
      'billItemId',
      'productId',
      'schoolId',
      'departmentId',
      'department',
      'building',
      'room',
      'locationLabel',
      'generatedFromProcurement'
    ];
    for (const key of optionalFields) {
      const value = asset[key];
      if (value !== undefined && value !== '') {
        data[key] = value;
      }
    }
    return data;
  }

  // Location Operations
  async getLocations(): Promise<Location[]> {
    if (this.isUsingMock()) {
      const all = MockDatabase.getLocations();
      const user = this.currentUser();
      if (user && user.role === 'School Admin') {
        return all.filter(l => l.institution === user.institution);
      }
      return all;
    }
    const user = this.currentUser();
    if (user && user.role === 'School Admin') {
      await this.getSchools();
      const prefix = this.getPrefixForInstitution(user.institution);
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        `${prefix}_locations`,
        [Query.limit(100)]
      );
      return response.documents.map(d => ({
        id: d['id'] || d.$id,
        institution: d['institution'],
        building: d['building'],
        floor: d['floor'],
        department: d['department'],
        room: d['room']
      }));
    } else {
      const prefixes = await this.getSchoolPrefixesForScope();
      const promises = prefixes.map(async prefix => {
        try {
          const response = await this.databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            `${prefix}_locations`,
            [Query.limit(100)]
          );
          return response.documents.map(d => ({
            id: d['id'] || d.$id,
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

  async addLocation(loc: Location): Promise<void> {
    if (this.isUsingMock()) {
      MockDatabase.addLocation(loc);
      const prefix = this.getPrefixForInstitution(loc.institution);
      this.triggerMockRealtimeEvent('locations', 'create', loc, prefix);
      return;
    }
    await this.getSchools();
    const prefix = this.getPrefixForInstitution(loc.institution);
    const docId = loc.id || ID.unique();
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      `${prefix}_locations`,
      docId,
      {
        id: docId,
        institution: loc.institution,
        building: loc.building,
        floor: loc.floor,
        department: loc.department,
        room: loc.room
      }
    );
  }

  // Asset Operations
  async getAssets(): Promise<Asset[]> {
    if (this.isUsingMock()) {
      const all = MockDatabase.getAssets();
      const user = this.currentUser();
      if (user && user.role === 'School Admin') {
        const locs = MockDatabase.getLocations();
        return all.filter(a => {
          const loc = locs.find(l => l.id === a.locationId);
          return loc?.institution === user.institution;
        });
      }
      return all;
    }
    const user = this.currentUser();
    const locs = await this.getLocations();
    
    let prefixes = await this.getSchoolPrefixesForScope();
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
              `${prefix}_${itemType}`,
              [Query.limit(100)]
            );
            return response.documents
              .map(d => this.mapAssetDocument(d, locs))
              .filter(asset => !this.isPendingAddition(asset));
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

  async addAsset(asset: Asset): Promise<void> {
    if (this.isUsingMock()) {
      MockDatabase.addAsset(asset);
      const user = this.currentUser();
      const auditLog = {
        id: 'AUD-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userEmail: user ? user.email : 'system@mock.com',
        userName: user ? user.name : 'System',
        action: 'Added Asset',
        details: `Asset ID: ${asset.id}, Name: ${asset.name}, Quantity: ${asset.quantity}`,
        reason: 'Manual addition'
      };
      if (user) {
        MockDatabase.addAuditLog(auditLog);
      }
      const locs = await this.getLocations();
      const { prefix, baseColl } = this.getAssetCollectionInfo(asset, locs);
      this.triggerMockRealtimeEvent(baseColl, 'create', asset, prefix);
      if (user) {
        this.triggerMockRealtimeEvent('audit_logs', 'create', auditLog, prefix);
      }
      return;
    }
    const user = this.currentUser();
    const locs = await this.getLocations();
    const { collId } = this.getAssetCollectionInfo(asset, locs);
    
    const docData = this.createAssetDocumentData(asset);
    
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

  async addProposedAsset(asset: Asset): Promise<void> {
    if (this.isUsingMock()) {
      MockDatabase.addAsset(asset);
      const locs = await this.getLocations();
      const { prefix, baseColl } = this.getAssetCollectionInfo(asset, locs);
      this.triggerMockRealtimeEvent(baseColl, 'create', asset, prefix);
      return;
    }
    const locs = await this.getLocations();
    const { collId } = this.getAssetCollectionInfo(asset, locs);
    
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      collId,
      asset.id,
      this.createAssetDocumentData(asset)
    );
  }

  async deleteProposedAsset(asset: Asset): Promise<void> {
    if (this.isUsingMock()) {
      MockDatabase.deleteAsset(asset.id);
      const locs = await this.getLocations();
      const { prefix, baseColl } = this.getAssetCollectionInfo(asset, locs);
      this.triggerMockRealtimeEvent(baseColl, 'delete', asset, prefix);
      return;
    }
    const locs = await this.getLocations();
    const { collId } = this.getAssetCollectionInfo(asset, locs);
    
    await this.databases.deleteDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      collId,
      asset.id
    );
  }

  async updateAsset(asset: Asset): Promise<void> {
    if (this.isUsingMock()) {
      MockDatabase.updateAsset(asset);
      const user = this.currentUser();
      const auditLog = {
        id: 'AUD-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userEmail: user ? user.email : 'system@mock.com',
        userName: user ? user.name : 'System',
        action: 'Updated Asset Details',
        details: `Asset ID: ${asset.id}, Name: ${asset.name}`,
        reason: 'Manual details update'
      };
      if (user) {
        MockDatabase.addAuditLog(auditLog);
      }
      const locs = await this.getLocations();
      const { prefix, baseColl } = this.getAssetCollectionInfo(asset, locs);
      this.triggerMockRealtimeEvent(baseColl, 'update', asset, prefix);
      if (user) {
        this.triggerMockRealtimeEvent('audit_logs', 'create', auditLog, prefix);
      }
      return;
    }
    const user = this.currentUser();
    const locs = await this.getLocations();
    const { collId } = this.getAssetCollectionInfo(asset, locs);
    
    const docData = this.createAssetDocumentData(asset);
    
    let existingCollId = collId;
    const allColls = ['assets', 'consumables', 'furniture'];
    const prefixes = await this.getSchoolPrefixesForScope();
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

  async deleteAsset(id: string): Promise<void> {
    if (this.isUsingMock()) {
      const asset = MockDatabase.getAssetById(id);
      if (asset) {
        MockDatabase.deleteAsset(id);
        const user = this.currentUser();
        const auditLog = {
          id: 'AUD-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          userEmail: user ? user.email : 'system@mock.com',
          userName: user ? user.name : 'System',
          action: 'Deleted Asset',
          details: `Asset ID: ${id}, Name: ${asset.name}`,
          reason: 'Manual deletion'
        };
        if (user) {
          MockDatabase.addAuditLog(auditLog);
        }
        const locs = await this.getLocations();
        const { prefix, baseColl } = this.getAssetCollectionInfo(asset, locs);
        this.triggerMockRealtimeEvent(baseColl, 'delete', asset, prefix);
        if (user) {
          this.triggerMockRealtimeEvent('audit_logs', 'create', auditLog, prefix);
        }
      }
      return;
    }
    const user = this.currentUser();
    let asset: Asset | null = null;
    let foundCollId = '';
    const allColls = ['assets', 'consumables', 'furniture'];
    const prefixes = await this.getSchoolPrefixesForScope();
    
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
          asset = this.mapAssetDocument(d, []);
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

  // Stock Verification & Approval Operations
  async getRequests(): Promise<VerificationRequest[]> {
    if (this.isUsingMock()) {
      const all = MockDatabase.getRequests();
      const user = this.currentUser();
      if (user && user.role === 'School Admin') {
        return all.filter(r => r.institution === user.institution);
      }
      return all;
    }
    const user = this.currentUser();
    let prefixes = await this.getSchoolPrefixesForScope();
    if (user && user.role === 'School Admin') {
      prefixes = [this.getPrefixForInstitution(user.institution)];
    }
    
    const promises = prefixes.map(async prefix => {
      try {
        const response = await this.databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          `${prefix}_requests`,
          [Query.limit(100)]
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
          comments: d['comments'] || '',
          approverHistory: d['approverHistory'] || '[]',
          rejectionReason: d['rejectionReason'] || ''
        }));
      } catch (e) {
        console.error(`Error fetching requests for ${prefix}:`, e);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    return results.flat();
  }

  async submitRequest(req: Omit<VerificationRequest, 'id' | 'status' | 'timestamp'> & { status?: VerificationRequest['status'] }): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const requestId = 'REQ-' + Date.now();
    const initialStatus = req.status || 'Pending Department';

    const initialHistory = JSON.stringify([
      {
        status: initialStatus,
        updatedBy: req.schoolAdminEmail,
        updaterName: req.schoolAdminName,
        timestamp,
        comments: req.reason || 'Request submitted'
      }
    ]);

    if (this.isUsingMock()) {
      const newReq: VerificationRequest = {
        ...req,
        id: requestId,
        status: initialStatus,
        timestamp,
        comments: '',
        approverHistory: initialHistory,
        rejectionReason: ''
      };
      MockDatabase.addRequest(newReq);
      const auditLog = {
        id: 'AUD-' + Date.now(),
        date: timestamp,
        userEmail: req.schoolAdminEmail,
        userName: req.schoolAdminName,
        action: `Submitted verification request: ${req.changeType}`,
        details: `Asset: ${req.assetName} (${req.assetId}). Diff: ${req.previousValue} -> ${req.newValue}`,
        reason: req.reason
      };
      MockDatabase.addAuditLog(auditLog);
      
      const prefix = this.getPrefixForInstitution(req.institution);
      this.triggerMockRealtimeEvent('requests', 'create', newReq, prefix);
      this.triggerMockRealtimeEvent('audit_logs', 'create', auditLog, prefix);
      return;
    }
    
    await this.getSchools();
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
        status: initialStatus,
        timestamp,
        comments: '',
        approverHistory: initialHistory,
        rejectionReason: ''
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

  async processRequest(requestId: string, approve: boolean, comments: string): Promise<void> {
    const reviewer = this.currentUser();
    if (!reviewer) {
      throw new Error('Not authenticated');
    }
    if (reviewer.role !== 'Super Admin') {
      throw new Error('Unauthorized: Only Super Admins can process verification requests.');
    }
    if (this.isUsingMock()) {
      const reqs = MockDatabase.getRequests();
      const reqData = reqs.find(r => r.id === requestId);
      if (!reqData) return;
      
      const currentStatus = reqData.status;
      let nextStatus: VerificationRequest['status'] = 'Pending';
      if (approve) {
        if (currentStatus === 'Pending Department') {
          nextStatus = 'Pending Super Admin';
        } else {
          nextStatus = 'Approved';
        }
      } else {
        nextStatus = 'Rejected';
      }
      
      reqData.status = nextStatus;
      reqData.comments = comments;
      if (!approve) {
        reqData.rejectionReason = comments;
      }
      
      // Append history
      let historyList: any[] = [];
      try {
        historyList = JSON.parse(reqData.approverHistory || '[]');
      } catch (e) {
        historyList = [];
      }
      historyList.push({
        status: nextStatus,
        updatedBy: reviewer.email,
        updaterName: reviewer.name,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        comments: comments || (approve ? 'Approved stage' : 'Rejected request')
      });
      reqData.approverHistory = JSON.stringify(historyList);
      
      MockDatabase.saveRequests(reqs);
      
      const prefix = this.getPrefixForInstitution(reqData.institution);
      this.triggerMockRealtimeEvent('requests', 'update', reqData, prefix);
      
      // If approved, update actual asset
      if (nextStatus === 'Approved') {
        const assetId = reqData.assetId;
        const changeType = reqData.changeType;
        const newValue = reqData.newValue;
        
        const asset = MockDatabase.getAssetById(assetId);
        if (asset) {
          if (changeType === 'Quantity Update') {
            const qtyNum = parseInt(newValue.replace(/\D/g, ''));
            if (!isNaN(qtyNum)) {
              asset.quantity = qtyNum;
              asset.totalPrice = asset.quantity * asset.unitPrice;
            }
          } else if (changeType.startsWith('Mark ')) {
            asset.status = changeType.substring(5) as any;
          } else if (changeType === 'Add Asset') {
            asset.status = 'Active';
            asset.remarks = (asset.remarks || '').replace('Approval Pending.', 'Approved.');
          }
          MockDatabase.updateAsset(asset);
          
          const locs = await this.getLocations();
          const { prefix: assetPrefix, baseColl } = this.getAssetCollectionInfo(asset, locs);
          this.triggerMockRealtimeEvent(baseColl, 'update', asset, assetPrefix);
        }
      } else if (nextStatus === 'Rejected' && reqData.changeType === 'Add Asset') {
        const assetId = reqData.assetId;
        const asset = MockDatabase.getAssetById(assetId);
        if (asset && asset.remarks.includes('Approval Pending.')) {
          MockDatabase.deleteAsset(assetId);
          
          const locs = await this.getLocations();
          const { prefix: assetPrefix, baseColl } = this.getAssetCollectionInfo(asset, locs);
          this.triggerMockRealtimeEvent(baseColl, 'delete', asset, assetPrefix);
        }
      }
      
      const auditLog = {
        id: 'AUD-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userEmail: reviewer.email,
        userName: reviewer.name,
        action: `${nextStatus} Verification Request`,
        details: `Request ID: ${requestId}. School Admin: ${reqData.schoolAdminName}. Comment: ${comments}`,
        reason: approve ? 'Approval criteria met' : 'Disapproved by Super Admin'
      };
      MockDatabase.addAuditLog(auditLog);
      this.triggerMockRealtimeEvent('audit_logs', 'create', auditLog, prefix);
      return;
    }
    
    let foundCollId = '';
    let foundPrefix = '';
    let reqData: any = null;
    const prefixes = await this.getSchoolPrefixesForScope();
    
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
      const currentStatus = reqData['status'];
      let nextStatus: VerificationRequest['status'] = 'Pending';
      if (approve) {
        if (currentStatus === 'Pending Department') {
          nextStatus = 'Pending Super Admin';
        } else {
          nextStatus = 'Approved';
        }
      } else {
        nextStatus = 'Rejected';
      }

      // Append history
      let historyList: any[] = [];
      try {
        historyList = JSON.parse(reqData['approverHistory'] || '[]');
      } catch (e) {
        historyList = [];
      }
      historyList.push({
        status: nextStatus,
        updatedBy: reviewer.email,
        updaterName: reviewer.name,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        comments: comments || (approve ? 'Approved stage' : 'Rejected request')
      });

      const updatePayload: any = {
        status: nextStatus,
        comments,
        approverHistory: JSON.stringify(historyList),
        rejectionReason: !approve ? comments : (reqData['rejectionReason'] || '')
      };

      await this.databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        foundCollId,
        requestId,
        updatePayload
      );
      
      const assetId = reqData['assetId'];
      const changeType = reqData['changeType'];
      const newValue = reqData['newValue'];
      
      if (nextStatus === 'Approved') {
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
          } else if (changeType.startsWith('Mark ')) {
            updatedAsset.status = changeType.substring(5);
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
      } else if (nextStatus === 'Rejected' && changeType === 'Add Asset') {
        const allColls = ['assets', 'consumables', 'furniture'];
        for (const type of allColls) {
          const testAssetColl = `${foundPrefix}_${type}`;
          try {
            const d = await this.databases.getDocument(
              APPWRITE_CONFIG.DATABASE_ID,
              testAssetColl,
              assetId
            );
            if ((d['remarks'] || '').includes('Approval Pending.')) {
              await this.databases.deleteDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                testAssetColl,
                assetId
              );
            }
            break;
          } catch {}
        }
      }
      
      await this.addAuditLog({
        id: 'AUD-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userEmail: reviewer.email,
        userName: reviewer.name,
        action: `${nextStatus} Verification Request`,
        details: `Request ID: ${requestId}. School Admin: ${reqData.schoolAdminName}. Comment: ${comments}`,
        reason: approve ? 'Approval criteria met' : 'Disapproved by Super Admin'
      });
    }
  }

  // Audit Logs Operations
  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isUsingMock()) {
      const all = MockDatabase.getAuditLogs();
      const user = this.currentUser();
      if (user && user.role === 'School Admin') {
        return all.filter(l => l.userEmail.includes(user.email.split('@')[0]) || l.userEmail === user.email);
      }
      return all;
    }
    const user = this.currentUser();
    let prefixes = await this.getSchoolPrefixesForScope();
    if (user && user.role === 'School Admin') {
      prefixes = [this.getPrefixForInstitution(user.institution)];
    }
    
    const promises = prefixes.map(async prefix => {
      try {
        const response = await this.databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          `${prefix}_audit_logs`,
          [Query.limit(100)]
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

  async addAuditLog(log: AuditLog, asset?: Asset): Promise<void> {
    if (this.isUsingMock()) {
      MockDatabase.addAuditLog(log);
      return;
    }
    await this.getSchools();
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

  // Maintenance Operations
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    if (this.isUsingMock()) {
      return MockDatabase.getMaintenanceRecords();
    }
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.MAINTENANCE,
        [Query.limit(100)]
      );
      return response.documents.map(d => ({
        id: d.$id,
        assetId: d['assetId'],
        assetName: d['assetName'],
        serviceDate: d['serviceDate'],
        technicianName: d['technicianName'] || 'Service Dept',
        technicianContact: d['technicianContact'] || '',
        serviceType: d['serviceType'] || 'Preventive',
        cost: d['cost'] || 0,
        description: d['description'] || '',
        status: d['status'] || 'Scheduled',
        partsReplaced: d['partsReplaced'] || '',
        nextDueDate: d['nextDueDate'] || '',
        schoolId: d['schoolId'],
        createdBy: d['createdBy'] || 'System',
        createdAt: d['createdAt'] || new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error fetching maintenance records from Appwrite:', e);
      return MockDatabase.getMaintenanceRecords();
    }
  }

  async addMaintenanceRecord(record: Omit<MaintenanceRecord, 'id'>): Promise<MaintenanceRecord> {
    const prefix = this.resolveSchoolPrefix(record.schoolId);
    await this.enforceSchoolScope(prefix);
    if (this.isUsingMock()) {
      return MockDatabase.addMaintenanceRecord({ ...record, schoolId: prefix });
    }
    const id = 'MNT-' + Date.now();
    const newRecord: MaintenanceRecord = { id, ...record, schoolId: prefix };
    const permissions = this.getPermissionsForPrefix(prefix);
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.MAINTENANCE,
      id,
      newRecord,
      permissions
    );
    return newRecord;
  }

  async updateMaintenanceRecord(idOrRecord: string | MaintenanceRecord, data?: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const id = typeof idOrRecord === 'string' ? idOrRecord : idOrRecord.id;
    const updateData = typeof idOrRecord === 'string' ? data! : idOrRecord;
    if (this.isUsingMock()) {
      return MockDatabase.updateMaintenanceRecord({ id, ...updateData } as MaintenanceRecord);
    }
    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.MAINTENANCE,
      id,
      updateData
    );
    return { id, ...updateData } as MaintenanceRecord;
  }

  async deleteMaintenanceRecord(id: string): Promise<boolean> {
    if (this.isUsingMock()) {
      return MockDatabase.deleteMaintenanceRecord(id);
    }
    await this.databases.deleteDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.MAINTENANCE,
      id
    );
    return true;
  }

  // Warranty Operations
  async getWarrantyRecords(): Promise<WarrantyRecord[]> {
    if (this.isUsingMock()) {
      return MockDatabase.getWarrantyRecords();
    }
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.WARRANTY,
        [Query.limit(100)]
      );
      return response.documents.map(d => ({
        id: d.$id,
        assetId: d['assetId'],
        assetName: d['assetName'],
        provider: d['provider'] || '',
        contactPerson: d['contactPerson'] || '',
        phone: d['phone'] || d['contactPhone'] || '',
        email: d['email'] || d['contactEmail'] || '',
        startDate: d['startDate'] || '',
        expiryDate: d['expiryDate'] || d['endDate'] || '',
        amcCost: d['amcCost'] || 0,
        terms: d['terms'] || d['coverageDetails'] || '',
        schoolId: d['schoolId'],
        renewalAlertSent: d['renewalAlertSent'] || false,
        createdAt: d['createdAt'] || new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error fetching warranty records from Appwrite:', e);
      return MockDatabase.getWarrantyRecords();
    }
  }

  async addWarrantyRecord(record: Omit<WarrantyRecord, 'id'>): Promise<WarrantyRecord> {
    const prefix = this.resolveSchoolPrefix(record.schoolId);
    await this.enforceSchoolScope(prefix);
    if (this.isUsingMock()) {
      return MockDatabase.addWarrantyRecord({ ...record, schoolId: prefix });
    }
    const id = 'WRN-' + Date.now();
    const newRecord: WarrantyRecord = { id, ...record, schoolId: prefix };
    const permissions = this.getPermissionsForPrefix(prefix);
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.WARRANTY,
      id,
      newRecord,
      permissions
    );
    return newRecord;
  }

  async updateWarrantyRecord(idOrRecord: string | WarrantyRecord, data?: Partial<WarrantyRecord>): Promise<WarrantyRecord> {
    const id = typeof idOrRecord === 'string' ? idOrRecord : idOrRecord.id;
    const updateData = typeof idOrRecord === 'string' ? data! : idOrRecord;
    if (this.isUsingMock()) {
      return MockDatabase.updateWarrantyRecord({ id, ...updateData } as WarrantyRecord);
    }
    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.WARRANTY,
      id,
      updateData
    );
    return { id, ...updateData } as WarrantyRecord;
  }

  async deleteWarrantyRecord(id: string): Promise<boolean> {
    if (this.isUsingMock()) {
      return MockDatabase.deleteWarrantyRecord(id);
    }
    await this.databases.deleteDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.WARRANTY,
      id
    );
    return true;
  }
}
