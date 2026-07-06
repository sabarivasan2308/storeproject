import { Injectable, signal } from '@angular/core';
import { Client, Account, Databases, ID, Query, Teams, Storage } from 'appwrite';
import { APPWRITE_CONFIG } from '../config/appwrite.config';
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
  AssetTransfer
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
  
  // State Signals
  isUsingMock = signal<boolean>(false);
  currentUser = signal<AppUser | null>(null);
  
  constructor() {
    this.initializeService();
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
          }
        }
      } else {
        console.error('Appwrite Project ID is not configured properly.');
      }
    } catch (e) {
      console.error('Appwrite connection failed:', e);
    }
  }

  // Authentication Operations
  async login(email: string, password: string): Promise<AppUser> {
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
      
      this.currentUser.set(loggedUser);
      return loggedUser;
    } catch (err: any) {
      throw new Error(err.message || 'Login failed.');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.account.deleteSession('current');
      this.currentUser.set(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  async getSchools(): Promise<School[]> {
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
    return this.getMasterOptions('master_categories');
  }

  async getStatuses(): Promise<MasterOption[]> {
    return this.getMasterOptions('master_statuses');
  }

  async getVendors(): Promise<Vendor[]> {
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        'master_vendors',
        [Query.limit(100)]
      );
      return response.documents
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
        }))
        .filter(v => v.active)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.error('Error loading vendor master data:', e);
      return [];
    }
  }

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
  private getPrefixForInstitution(inst?: string): string {
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
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.BILLS,
        [Query.limit(100), Query.orderDesc('$createdAt')]
      );
      const bills = response.documents.map(d => this.mapBillDocument(d));
      const user = this.currentUser();
      if (user?.role === 'School Admin') {
        return bills.filter(b => b.schoolName === user.institution);
      }
      return bills;
    } catch (e) {
      console.error('Error loading bills:', e);
      return [];
    }
  }

  async getBillItems(billId: string): Promise<ProcurementBillItem[]> {
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
      data
    );
    return { ...product, ...data, id };
  }

  async lookupProductByBarcode(barcode: string): Promise<ProductMaster | null> {
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
      }
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

    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.BILLS,
      billId,
      {
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
      }
    );

    const locs = await this.getLocations();
    const generatedAssetIds: string[] = [];

    for (const [itemIndex, item] of items.entries()) {
      const productId = await this.ensureProductFromItem(item);
      const billItemId = ID.unique();
      const itemTotal = this.toNumber(item.unitPrice) * this.toNumber(item.quantity);
      const itemGstPercent = item.gstPercent || input.gstPercent || 0;
      const itemGstAmount = itemTotal * itemGstPercent / 100;
      const itemAssetIds: string[] = [];
      const location = locs.find(l => l.id === item.locationId);
      const schoolPrefix = this.getPrefixForInstitution(input.schoolName).toUpperCase().slice(0, 8);
      const categoryCode = (item.category || item.productName || 'AS').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'AS';

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
        await this.addAsset(asset);
        generatedAssetIds.push(assetId);
        itemAssetIds.push(assetId);
      }

      await this.databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.BILL_ITEMS,
        billItemId,
        {
          billId,
          productId,
          productName: item.productName,
          category: item.category,
          brand: item.brand || '',
          model: item.model || '',
          manufacturer: item.manufacturer || '',
          specifications: item.specifications || '',
          barcode: item.barcode || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstPercent: itemGstPercent,
          gstAmount: Math.round(itemGstAmount),
          itemTotal: Math.round(itemTotal),
          warrantyDetails: item.warrantyDetails || '',
          locationId: item.locationId,
          generatedAssetIds: itemAssetIds
        }
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
      userName: user?.name || 'System'
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
  }): Promise<void> {
    try {
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
        }
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
    const locs = await this.getLocations();
    const nextLocation = locs.find(l => l.id === input.toLocationId);
    if (!nextLocation) {
      throw new Error('Target location was not found.');
    }

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
      }
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

  private mapAssetDocument(d: any, locs: Location[]): Asset {
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
    const locs = await this.getLocations();
    const { collId } = this.getAssetCollectionInfo(asset, locs);
    
    await this.databases.deleteDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      collId,
      asset.id
    );
  }

  async updateAsset(asset: Asset): Promise<void> {
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

  async submitRequest(req: Omit<VerificationRequest, 'id' | 'status' | 'timestamp'>): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const requestId = 'REQ-' + Date.now();
    
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

  async processRequest(requestId: string, approve: boolean, comments: string): Promise<void> {
    const reviewer = this.currentUser();
    if (!reviewer) return;
    
    const status = approve ? 'Approved' : 'Rejected';
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
      await this.databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        foundCollId,
        requestId,
        { status, comments }
      );
      
      const assetId = reqData['assetId'];
      const changeType = reqData['changeType'];
      const newValue = reqData['newValue'];
      
      if (approve) {
        
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
      } else if (changeType === 'Add Asset') {
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
        action: `${status} Verification Request`,
        details: `Request ID: ${requestId}. School Admin: ${reqData.schoolAdminName}. Comment: ${comments}`,
        reason: approve ? 'Approval criteria met' : 'Disapproved by Super Admin'
      });
    }
  }

  // Audit Logs Operations
  async getAuditLogs(): Promise<AuditLog[]> {
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
}
