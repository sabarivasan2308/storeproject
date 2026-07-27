import { Injectable } from '@angular/core';
import { Asset } from '../models/types';

export interface AssetDepreciationInfo {
  assetId: string;
  originalPrice: number;
  currentValue: number;
  totalDepreciation: number;
  depreciationPercentage: number;
  usefulLifeYears: number;
  method: 'Straight-Line' | 'Declining-Balance';
  warrantyStatus: 'Active' | 'Expiring Soon' | 'Expired' | 'No Warranty';
  daysToWarrantyExpiry: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DepreciationService {

  private categoryUsefulLifeMap: Record<string, number> = {
    'Computers': 3,
    'Laptops': 3,
    'Servers': 4,
    'Furniture': 7,
    'Lab Equipment': 5,
    'Refrigerators': 6,
    'Consumables': 1
  };

  getUsefulLifeYears(category: string): number {
    return this.categoryUsefulLifeMap[category] || 5;
  }

  calculateDepreciation(asset: Asset, method: 'Straight-Line' | 'Declining-Balance' = 'Straight-Line', customRate?: number): AssetDepreciationInfo {
    const unitPrice = asset.unitPrice || 0;
    const totalPrice = asset.totalPrice || (unitPrice * (asset.quantity || 1));
    const usefulLife = this.getUsefulLifeYears(asset.category);
    
    let ageYears = 0;
    if (asset.purchaseDate) {
      const pDate = new Date(asset.purchaseDate);
      if (!isNaN(pDate.getTime())) {
        const diffMs = Date.now() - pDate.getTime();
        ageYears = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 365.25));
      }
    }

    const salvageValue = totalPrice * 0.1; // 10% residual value
    let accumulatedDepreciation = 0;
    let currentValue = totalPrice;

    if (method === 'Declining-Balance') {
      const rate = customRate || (2 / usefulLife); // Double declining balance by default
      currentValue = Math.max(salvageValue, totalPrice * Math.pow(1 - rate, ageYears));
      accumulatedDepreciation = totalPrice - currentValue;
    } else {
      const depreciableAmount = totalPrice - salvageValue;
      const annualDepreciation = depreciableAmount / usefulLife;
      accumulatedDepreciation = Math.min(depreciableAmount, annualDepreciation * ageYears);
      currentValue = Math.max(salvageValue, totalPrice - accumulatedDepreciation);
    }

    const depreciationPercentage = totalPrice > 0 ? (accumulatedDepreciation / totalPrice) * 100 : 0;

    // Warranty status calculation
    let warrantyStatus: 'Active' | 'Expiring Soon' | 'Expired' | 'No Warranty' = 'No Warranty';
    let daysToWarrantyExpiry: number | null = null;

    const expiryStr = asset.warrantyExpiry || (asset.warrantyDetails && !isNaN(new Date(asset.warrantyDetails).getTime()) ? asset.warrantyDetails : '');
    if (expiryStr) {
      const wDate = new Date(expiryStr);
      if (!isNaN(wDate.getTime())) {
        const now = new Date();
        const diffDays = Math.ceil((wDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        daysToWarrantyExpiry = diffDays;

        if (diffDays < 0) {
          warrantyStatus = 'Expired';
        } else if (diffDays <= 30) {
          warrantyStatus = 'Expiring Soon';
        } else {
          warrantyStatus = 'Active';
        }
      }
    }

    return {
      assetId: asset.id,
      originalPrice: totalPrice,
      currentValue: Math.round(currentValue * 100) / 100,
      totalDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
      depreciationPercentage: Math.round(depreciationPercentage * 10) / 10,
      usefulLifeYears: usefulLife,
      method,
      warrantyStatus,
      daysToWarrantyExpiry
    };
  }

  calculatePortfolioDepreciation(assets: Asset[], method: 'Straight-Line' | 'Declining-Balance' = 'Straight-Line'): {
    totalOriginalValue: number;
    totalCurrentValue: number;
    totalDepreciation: number;
    expiringWarrantyCount: number;
    expiredWarrantyCount: number;
  } {
    let totalOriginalValue = 0;
    let totalCurrentValue = 0;
    let expiringWarrantyCount = 0;
    let expiredWarrantyCount = 0;

    for (const asset of assets) {
      const info = this.calculateDepreciation(asset, method);
      totalOriginalValue += info.originalPrice;
      totalCurrentValue += info.currentValue;
      if (info.warrantyStatus === 'Expiring Soon') expiringWarrantyCount++;
      if (info.warrantyStatus === 'Expired') expiredWarrantyCount++;
    }

    return {
      totalOriginalValue: Math.round(totalOriginalValue * 100) / 100,
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalDepreciation: Math.round((totalOriginalValue - totalCurrentValue) * 100) / 100,
      expiringWarrantyCount,
      expiredWarrantyCount
    };
  }
}
