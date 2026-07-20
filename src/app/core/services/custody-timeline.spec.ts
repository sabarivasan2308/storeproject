// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { MockDatabase } from './mock-db';
import { Asset } from '../models/types';

describe('Asset Custody & Location Transfers', () => {
  it('should seed default transfers successfully', () => {
    const transfers = MockDatabase.getTransfers();
    expect(transfers).toBeDefined();
    expect(transfers.length).toBeGreaterThan(0);

    // Verify properties
    const sample = transfers[0];
    expect(sample.id).toBeDefined();
    expect(sample.assetId).toBeDefined();
    expect(sample.fromDepartmentId).toBeDefined();
    expect(sample.toDepartmentId).toBeDefined();
    expect(sample.transferDate).toBeDefined();
    expect(sample.transferReason).toBeDefined();
    expect(sample.transferredBy).toBeDefined();
  });

  it('should add transfer log when moving an asset', () => {
    const mockAsset: Asset = {
      id: 'AST-TEST-99',
      name: 'Test Projector',
      category: 'Electronics',
      barcode: 'BAR-PROJ-99',
      qrCode: 'QR-PROJ-99',
      brand: 'Epson',
      model: 'EX-99',
      serialNumber: 'SN-999',
      quantity: 1,
      unitPrice: 500,
      totalPrice: 500,
      purchaseDate: '2026-01-01',
      purchaseOrder: 'PO-99',
      billNumber: 'B-99',
      billDate: '2026-01-01',
      vendor: 'Epson Inc',
      warrantyDetails: '1 year',
      status: 'Active',
      remarks: 'Seeded for test',
      locationId: 'LOC-001',
      isContainer: false
    };

    const initialTransfersCount = MockDatabase.getTransfers().length;

    // Add asset first to MockDatabase
    const assets = MockDatabase.getAssets();
    MockDatabase.saveAssets([...assets, mockAsset]);

    // Record a transfer
    const transferDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    MockDatabase.addTransfer({
      id: 'TRF-TEST-99',
      assetId: mockAsset.id,
      fromDepartmentId: mockAsset.locationId,
      fromDepartmentName: 'Biotechnology',
      toDepartmentId: 'LOC-002',
      toDepartmentName: 'Pharmaceutics',
      transferDate,
      transferReason: 'Moving to Pharma Lab',
      transferredBy: 'admin@school.edu',
      approvedBy: 'super@kare.edu'
    });

    const updatedTransfers = MockDatabase.getTransfers();
    expect(updatedTransfers.length).toBe(initialTransfersCount + 1);

    const checkTrf = updatedTransfers.find(t => t.id === 'TRF-TEST-99');
    expect(checkTrf).toBeDefined();
    expect(checkTrf?.transferReason).toBe('Moving to Pharma Lab');
    expect(checkTrf?.toDepartmentId).toBe('LOC-002');

    // Clean up
    const cleanTransfers = MockDatabase.getTransfers().filter(t => t.id !== 'TRF-TEST-99');
    localStorage.setItem('kare_transfers', JSON.stringify(cleanTransfers));
    
    const cleanAssets = MockDatabase.getAssets().filter(a => a.id !== mockAsset.id);
    MockDatabase.saveAssets(cleanAssets);
  });

  it('should add physical verification audit logs correctly', () => {
    const initialLogsCount = MockDatabase.getAuditLogs().length;

    MockDatabase.addAuditLog({
      id: 'AUD-TEST-VERIFY',
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userEmail: 'scanner@school.edu',
      userName: 'QR Scanner',
      action: 'QR Scan Check-In',
      details: 'Verified presence of Asset AST-11',
      reason: 'Physical presence verification'
    });

    const logs = MockDatabase.getAuditLogs();
    expect(logs.length).toBe(initialLogsCount + 1);

    const log = logs.find(l => l.id === 'AUD-TEST-VERIFY');
    expect(log).toBeDefined();
    expect(log?.action).toBe('QR Scan Check-In');

    // Clean up
    const cleanLogs = MockDatabase.getAuditLogs().filter(l => l.id !== 'AUD-TEST-VERIFY');
    localStorage.setItem('kare_audit_logs', JSON.stringify(cleanLogs));
  });
});
