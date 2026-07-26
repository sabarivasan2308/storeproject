import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Asset } from '../../../core/models/types';
import { DepreciationService } from '../../../core/services/depreciation.service';

@Component({
  selector: 'app-asset-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (active && asset) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col transition-colors">
          
          <!-- Modal Header -->
          <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xl shadow-sm">
                📦
              </div>
              <div>
                <h3 class="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {{ asset.name }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  ID: {{ asset.id }} • Barcode: {{ asset.barcode || 'N/A' }}
                </p>
              </div>
            </div>

            <button
              (click)="close.emit()"
              class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-6 flex-1 text-xs">
            
            <!-- Quick Summary Badges -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Status</span>
                <span [class]="getStatusBadgeClasses(asset.status)" class="inline-block mt-1">
                  {{ asset.status }}
                </span>
              </div>

              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Warranty</span>
                <span [class]="getWarrantyBadgeClasses(asset)" class="inline-block mt-1">
                  {{ getWarrantyStatus(asset) }}
                </span>
              </div>

              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Original Cost</span>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                  ₹{{ asset.totalPrice | number:'1.0-0' }}
                </p>
              </div>

              <div class="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <span class="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">Net Book Value</span>
                <p class="text-sm font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">
                  ₹{{ getNetBookValue(asset) | number:'1.0-0' }}
                </p>
              </div>
            </div>

            <!-- General Specification & Procurement Info -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                Asset Specifications & Procurement
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span class="text-slate-400 block text-[10px]">Category</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.category || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Brand / Make</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.brand || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Model</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.model || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Serial Number</span>
                  <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ asset.serialNumber || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Quantity</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.quantity }} units</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Unit Price</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">₹{{ asset.unitPrice | number:'1.0-0' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Purchase Date</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.purchaseDate || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Bill Number</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.billNumber || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Vendor</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.vendor || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Location & Custody Information -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                Location & Placement Hierarchy
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span class="text-slate-400 block text-[10px]">Institution ID</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.schoolId || 'KARE' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Department</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.department || 'General Store' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Building / Block</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.building || 'Main Block' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Room Number</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.room || 'Store Room 1' }}</span>
                </div>
                <div class="sm:col-span-2">
                  <span class="text-slate-400 block text-[10px]">Formatted Location</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ asset.locationText || asset.locationLabel || 'Main Store' }}</span>
                </div>
              </div>
            </div>

            <!-- Remarks & Notes -->
            @if (asset.remarks) {
              <div class="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
                <span class="text-[10px] font-bold uppercase tracking-wider block opacity-75">Remarks & Audit Notes</span>
                <p class="mt-1 font-medium">{{ asset.remarks }}</p>
              </div>
            }

          </div>

          <!-- Modal Footer -->
          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <button
              (click)="viewTimeline.emit(asset)"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Custody History
            </button>

            <div class="flex items-center gap-2">
              <button
                (click)="close.emit()"
                class="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    }
  `
})
export class AssetDetailsModalComponent {
  depreciationService = inject(DepreciationService);

  @Input() active: boolean = false;
  @Input() asset: Asset | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() viewTimeline = new EventEmitter<Asset>();

  getNetBookValue(asset: Asset): number {
    return this.depreciationService.calculateDepreciation(asset).currentValue;
  }

  getWarrantyStatus(asset: Asset): string {
    return this.depreciationService.calculateDepreciation(asset).warrantyStatus;
  }

  getStatusBadgeClasses(status: string): string {
    const base = 'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ';
    switch (status) {
      case 'Active': return base + 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'In Repair': return base + 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      case 'Disposed': return base + 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      default: return base + 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  getWarrantyBadgeClasses(asset: Asset): string {
    const status = this.getWarrantyStatus(asset);
    const base = 'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ';
    switch (status) {
      case 'Active': return base + 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'Expiring Soon': return base + 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      case 'Expired': return base + 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      default: return base + 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  }
}
