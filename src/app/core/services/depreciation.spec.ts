import { describe, it, expect, beforeEach } from 'vitest';
import { DepreciationService } from './depreciation.service';
import { Asset } from '../models/types';

describe('DepreciationService', () => {
  let service: DepreciationService;

  beforeEach(() => {
    service = new DepreciationService();
  });

  it('should map category useful life accurately', () => {
    expect(service.getUsefulLifeYears('Computers')).toBe(3);
    expect(service.getUsefulLifeYears('Servers')).toBe(4);
    expect(service.getUsefulLifeYears('Furniture')).toBe(7);
    expect(service.getUsefulLifeYears('Unknown')).toBe(5);
  });

  it('should calculate straight-line depreciation correctly for a 1-year-old asset', () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    const asset: Asset = {
      id: 'AST-TEST-1',
      name: 'Test Laptop',
      category: 'Computers',
      barcode: 'BAR-1',
      qrCode: 'QR-1',
      brand: 'Dell',
      model: 'XPS',
      serialNumber: 'SN123',
      quantity: 1,
      unitPrice: 100000,
      totalPrice: 100000,
      purchaseDate: pastDate.toISOString().substring(0, 10),
      vendor: 'Dell Stores',
      warrantyDetails: '1 Year Warranty',
      status: 'Active',
      remarks: '',
      locationId: 'LOC-1',
      isContainer: false
    };

    const result = service.calculateDepreciation(asset, 'Straight-Line');

    expect(result.assetId).toBe('AST-TEST-1');
    expect(result.originalPrice).toBe(100000);
    expect(result.usefulLifeYears).toBe(3);
    expect(result.currentValue).toBeLessThan(75000);
    expect(result.currentValue).toBeGreaterThan(65000);
    expect(result.totalDepreciation).toBeGreaterThan(25000);
  });

  it('should calculate declining-balance depreciation correctly', () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    const asset: Asset = {
      id: 'AST-TEST-2',
      name: 'Test Server',
      category: 'Servers',
      barcode: 'BAR-2',
      qrCode: 'QR-2',
      brand: 'HP',
      model: 'ProLiant',
      serialNumber: 'SN456',
      quantity: 1,
      unitPrice: 200000,
      totalPrice: 200000,
      purchaseDate: pastDate.toISOString().substring(0, 10),
      vendor: 'HP Direct',
      warrantyDetails: '3 Years Warranty',
      status: 'Active',
      remarks: '',
      locationId: 'LOC-1',
      isContainer: false
    };

    const result = service.calculateDepreciation(asset, 'Declining-Balance');

    expect(result.method).toBe('Declining-Balance');
    expect(result.originalPrice).toBe(200000);
    expect(result.currentValue).toBeLessThan(200000);
    expect(result.totalDepreciation).toBeGreaterThan(0);
  });

  it('should evaluate warranty status correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15); // 15 days in future

    const asset: Asset = {
      id: 'AST-TEST-3',
      name: 'Test Monitor',
      category: 'Computers',
      barcode: 'BAR-3',
      qrCode: 'QR-3',
      brand: 'LG',
      model: '27-inch',
      serialNumber: 'SN789',
      quantity: 1,
      unitPrice: 15000,
      totalPrice: 15000,
      purchaseDate: '2024-01-01',
      warrantyExpiry: futureDate.toISOString().substring(0, 10),
      vendor: 'LG Electronics',
      warrantyDetails: '1 Year Warranty',
      status: 'Active',
      remarks: '',
      locationId: 'LOC-1',
      isContainer: false
    };

    const result = service.calculateDepreciation(asset);
    expect(result.warrantyStatus).toBe('Expiring Soon');
    expect(result.daysToWarrantyExpiry).toBeLessThanOrEqual(15);
  });
});
