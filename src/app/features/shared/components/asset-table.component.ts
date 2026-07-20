import { Component, Input, Output, EventEmitter, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset } from '../../../core/models/types';
import { DepreciationService } from '../../../core/services/depreciation.service';
import { PaginationComponent } from './pagination.component';

@Component({
  selector: 'app-asset-table',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <!-- Table Filter Toolbar -->
      <div class="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div class="flex flex-wrap items-center gap-2 flex-1">
          <!-- Search Input -->
          <div class="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Search assets by name, code, serial number..."
              class="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Status Filter Dropdown -->
          <select
            [ngModel]="selectedStatus()"
            (ngModelChange)="selectedStatus.set($event)"
            class="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="In Repair">In Repair</option>
            <option value="Disposed">Disposed</option>
            <option value="In Transit">In Transit</option>
            <option value="Approval Pending">Approval Pending</option>
          </select>

          <!-- Category Filter Dropdown -->
          <select
            [ngModel]="selectedCategory()"
            (ngModelChange)="selectedCategory.set($event)"
            class="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            @for (cat of categories(); track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
        </div>

        <!-- Export CSV Button -->
        <button
          (click)="exportCSV.emit()"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <!-- Assets Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th class="py-3 px-4">Asset Info</th>
              @if (showSchoolColumn) {
                <th class="py-3 px-4">Institution</th>
              }
              <th class="py-3 px-4">Category</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Orig. Cost</th>
              <th class="py-3 px-4 text-right">Net Book Value</th>
              <th class="py-3 px-4">Warranty</th>
              <th class="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            @if (loading) {
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <tr class="animate-pulse">
                  <td class="py-4 px-4"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div></td>
                  @if (showSchoolColumn) {
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                  }
                  <td class="py-4 px-4"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                  <td class="py-4 px-4"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                  <td class="py-4 px-4 text-right"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto"></div></td>
                  <td class="py-4 px-4 text-right"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto"></div></td>
                  <td class="py-4 px-4"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                  <td class="py-4 px-4"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 mx-auto"></div></td>
                </tr>
              }
            } @else if (paginatedAssets().length === 0) {
              <tr>
                <td [attr.colspan]="showSchoolColumn ? 8 : 7" class="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div class="text-3xl mb-2">📦</div>
                  <p class="font-semibold text-sm">No assets match your search or filter criteria.</p>
                </td>
              </tr>
            } @else {
              @for (asset of paginatedAssets(); track asset.id) {
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                  <!-- Asset Info -->
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {{ asset.name }}
                      @if (asset.qrCode) {
                        <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                          {{ asset.qrCode }}
                        </span>
                      }
                    </div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>SN: {{ asset.serialNumber || 'N/A' }}</span>
                      <span>•</span>
                      <span>Qty: {{ asset.quantity }}</span>
                    </div>
                  </td>

                  <!-- School Column -->
                  @if (showSchoolColumn) {
                    <td class="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {{ asset.schoolId || asset.department || 'KARE' }}
                    </td>
                  }

                  <!-- Category -->
                  <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {{ asset.category || 'General' }}
                  </td>

                  <!-- Status Badge -->
                  <td class="py-3 px-4">
                    <span [class]="getStatusBadgeClasses(asset.status)">
                      {{ asset.status }}
                    </span>
                  </td>

                  <!-- Original Cost -->
                  <td class="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                    ₹{{ asset.totalPrice | number:'1.0-0' }}
                  </td>

                  <!-- Net Book Value -->
                  <td class="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{{ getNetBookValue(asset) | number:'1.0-0' }}
                  </td>

                  <!-- Warranty Badge -->
                  <td class="py-3 px-4">
                    <span [class]="getWarrantyBadgeClasses(asset)">
                      {{ getWarrantyStatus(asset) }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="py-3 px-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <!-- QR Preview -->
                      <button
                        (click)="scanQR.emit(asset)"
                        class="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View QR Code"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </button>

                      <!-- Timeline -->
                      <button
                        (click)="viewTimeline.emit(asset)"
                        class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Custody & Location Timeline"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      @if (canEdit) {
                        <!-- Edit -->
                        <button
                          (click)="editAsset.emit(asset)"
                          class="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Asset"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <!-- Delete -->
                        <button
                          (click)="deleteAsset.emit(asset)"
                          class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Asset"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      } @else {
                        <!-- Request Change -->
                        <button
                          (click)="requestChange.emit(asset)"
                          class="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Request Modification / Quantity Change"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                          </svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <app-pagination
        [totalItems]="filteredAssets().length"
        [currentPage]="currentPage()"
        [pageSize]="pageSize()"
        (pageChange)="currentPage.set($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      />
    </div>
  `
})
export class AssetTableComponent {
  depreciationService = inject(DepreciationService);

  @Input() set assets(val: Asset[]) {
    this.allAssets.set(val || []);
  }
  @Input() loading: boolean = false;
  @Input() canEdit: boolean = true;
  @Input() showSchoolColumn: boolean = false;

  @Output() editAsset = new EventEmitter<Asset>();
  @Output() deleteAsset = new EventEmitter<Asset>();
  @Output() viewTimeline = new EventEmitter<Asset>();
  @Output() scanQR = new EventEmitter<Asset>();
  @Output() requestChange = new EventEmitter<Asset>();
  @Output() exportCSV = new EventEmitter<void>();

  allAssets = signal<Asset[]>([]);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('All');
  selectedCategory = signal<string>('All');

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  categories = computed(() => {
    const set = new Set<string>();
    this.allAssets().forEach(a => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  });

  filteredAssets = computed(() => {
    let list = this.allAssets();
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.selectedStatus();
    const category = this.selectedCategory();

    if (term) {
      list = list.filter(a =>
        a.name.toLowerCase().includes(term) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(term)) ||
        (a.qrCode && a.qrCode.toLowerCase().includes(term))
      );
    }

    if (status !== 'All') {
      list = list.filter(a => a.status === status);
    }

    if (category !== 'All') {
      list = list.filter(a => a.category === category);
    }

    return list;
  });

  paginatedAssets = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAssets().slice(start, start + this.pageSize());
  });

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.currentPage.set(1);
  }

  getNetBookValue(asset: Asset): number {
    return this.depreciationService.calculateDepreciation(asset).currentValue;
  }

  getWarrantyStatus(asset: Asset): string {
    return this.depreciationService.calculateDepreciation(asset).warrantyStatus;
  }

  getStatusBadgeClasses(status: string): string {
    const base = 'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ';
    switch (status) {
      case 'Active':
        return base + 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'In Repair':
        return base + 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      case 'Disposed':
        return base + 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      case 'In Transit':
        return base + 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
      case 'Approval Pending':
        return base + 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
      default:
        return base + 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  getWarrantyBadgeClasses(asset: Asset): string {
    const status = this.getWarrantyStatus(asset);
    const base = 'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ';
    switch (status) {
      case 'Active':
        return base + 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'Expiring Soon':
        return base + 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      case 'Expired':
        return base + 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      default:
        return base + 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  }
}
