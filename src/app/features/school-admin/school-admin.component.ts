import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppwriteService } from '../../core/services/appwrite.service';
import { ExportService } from '../../core/services/export.service';
import { DepreciationService } from '../../core/services/depreciation.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { Asset, Location, VerificationRequest, MasterOption, Vendor, AssetTransfer, MaintenanceRecord, WarrantyRecord, AuditLog } from '../../core/models/types';
import { QRScannerSimComponent } from '../shared/components/qr-scanner-sim.component';
import { NotificationCenterComponent } from '../shared/components/notification-center.component';
import { PaginationComponent } from '../shared/components/pagination.component';
import { StatCardComponent } from '../shared/components/stat-card.component';
import { AssetDrawerComponent } from '../shared/components/asset-drawer.component';
import { AssetFormComponent } from '../shared/components/asset-form.component';
import { MaintenanceManagementComponent } from '../shared/components/maintenance-management.component';
import { WarrantyManagementComponent } from '../shared/components/warranty-management.component';
import { ReportsPanelComponent } from '../shared/components/reports-panel.component';

@Component({
  selector: 'app-school-admin',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    QRScannerSimComponent,
    NotificationCenterComponent,
    PaginationComponent,
    AssetDrawerComponent,
    AssetFormComponent,
    MaintenanceManagementComponent,
    WarrantyManagementComponent,
    ReportsPanelComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar Navigation -->
      <aside class="sidebar glass-panel">
        <div class="sidebar-header">
          <div>
            <h2 class="display-header sidebar-title">{{ institutionName() }}</h2>
            <span class="badge badge-cyan">School Admin</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <button class="nav-link" [class.active]="activeTab() === 'overview'" (click)="setTab('overview')">
            Dashboard Overview
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'assets'" (click)="setTab('assets')">
            Assets Inventory
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'maintenance'" (click)="setTab('maintenance')">
            Maintenance & Service
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'warranty'" (click)="setTab('warranty')">
            Warranty & AMC
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'verification'" (click)="setTab('verification')">
            Stock Verification
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'requests'" (click)="setTab('requests')">
            Submitted Requests
            @if (pendingRequestsCount() > 0) {
              <span class="badge badge-orange badge-pill">{{ pendingRequestsCount() }}</span>
            }
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'reports'" (click)="setTab('reports')">
            Institution Reports
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <p class="user-name">{{ userName() }}</p>
            <p class="user-email">{{ userEmail() }}</p>
          </div>
          <button class="btn btn-secondary btn-logout" (click)="onLogout()">
            Logout
          </button>
        </div>
      </aside>

      <!-- Main Panel Area -->
      <main class="main-content">
        <!-- Top Header Bar -->
        <header class="top-header-bar flex items-center justify-between p-4 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div class="flex items-center gap-3">
            <h1 class="text-lg font-bold text-slate-800 dark:text-slate-100">{{ institutionName() }} Portal</h1>
            <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">
              School Admin
            </span>
          </div>

          <div class="flex items-center gap-3">
            <button 
              type="button" 
              (click)="themeService.toggleTheme()" 
              class="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              @if (themeService.isDarkMode()) {
                <span class="text-lg">☀️</span>
              } @else {
                <span class="text-lg">🌙</span>
              }
            </button>

            <app-notification-center></app-notification-center>
          </div>
        </header>


        <!-- 1. OVERVIEW DASHBOARD -->
        @if (activeTab() === 'overview') {
          <div class="tab-content fade-in">
            <h1 class="display-header page-heading">{{ institutionName() }} Dashboard</h1>
            
            <div class="dashboard-grid">
              <div class="glass-panel kpi-card">
                <div class="kpi-data">
                  <span class="kpi-label">Total Assets</span>
                  <span class="kpi-value">{{ totalAssetsCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-data">
                  <span class="kpi-label">Total Value</span>
                  <span class="kpi-value">₹{{ totalAssetValue() | number }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-data">
                  <span class="kpi-label">Under Service</span>
                  <span class="kpi-value text-cyan">{{ underServiceCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-data">
                  <span class="kpi-label">Missing Assets</span>
                  <span class="kpi-value text-orange">{{ missingAssetsCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-data">
                  <span class="kpi-label">Damaged Assets</span>
                  <span class="kpi-value text-orange">{{ damagedAssetsCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-data">
                  <span class="kpi-label">Idle Assets</span>
                  <span class="kpi-value text-blue">{{ idleAssetsCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-data">
                  <span class="kpi-label">Condemned</span>
                  <span class="kpi-value text-red">{{ condemnedAssetsCount() }}</span>
                </div>
              </div>
            </div>

            <!-- Categories Breakdown -->
            <div class="glass-panel breakdown-panel">
              <h2 class="display-header section-title">Category-wise Asset Summary</h2>
              <div class="table-container">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Total Items</th>
                      <th>Total Value</th>
                      <th>Active Items</th>
                      <th>Damaged / Missing</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (cat of categorySummaries(); track cat.name) {
                      <tr>
                        <td><strong>{{ cat.name }}</strong></td>
                        <td>{{ cat.count }}</td>
                        <td>₹{{ cat.value | number }}</td>
                        <td>{{ cat.active }}</td>
                        <td>
                          <span class="badge" [class.badge-red]="cat.damagedMissing > 0" [class.badge-green]="cat.damagedMissing === 0">
                            {{ cat.damagedMissing }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- 2. ASSET INVENTORY -->
        @if (activeTab() === 'assets') {
          <div class="tab-content fade-in">
            <div class="action-header">
              <h1 class="display-header page-heading">Assets Directory</h1>
              <div class="action-buttons-group" style="display: flex; gap: 12px;">
                <button class="btn btn-secondary" (click)="exportService.exportAssetsToCsv(filteredAssets())">
                  Export CSV 📥
                </button>
                <button class="btn btn-secondary" (click)="showScannerModal.set(true)">
                  Scan Asset QR 📷
                </button>
                <button class="btn btn-primary" (click)="openAddAssetModal()">
                  Add New Asset
                </button>
              </div>
            </div>

            <!-- Category Filter Bar -->
            <div class="glass-panel filter-bar" style="flex-wrap: wrap;">
              <div class="filter-group" style="min-width: 180px;">
                <label class="form-label">Search Name / ID</label>
                <input type="text" class="form-input" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Search name, ID..." />
              </div>
              <div class="filter-group" style="min-width: 180px;">
                <label class="form-label">Category</label>
                <select class="form-input" [ngModel]="filterCategory()" (ngModelChange)="filterCategory.set($event)">
                  <option value="All">All Categories</option>
                  @for (cat of categoryList(); track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>
              <div class="filter-group" style="min-width: 180px;">
                <label class="form-label">Status</label>
                <select class="form-input" [ngModel]="filterStatus()" (ngModelChange)="filterStatus.set($event)">
                  <option value="All">All Statuses</option>
                  <option value="Idle">Idle</option>
                  <option value="Active">Active</option>
                  <option value="Under Service">Under Service</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Missing">Missing</option>
                  <option value="Condemned">Condemned</option>
                </select>
              </div>
              <div class="filter-group" style="min-width: 150px;">
                <label class="form-label">Purchase Order</label>
                <input type="text" class="form-input" [ngModel]="filterPO()" (ngModelChange)="filterPO.set($event)" placeholder="PO number..." />
              </div>
              <div class="filter-group" style="min-width: 150px;">
                <label class="form-label">Bill Number</label>
                <input type="text" class="form-input" [ngModel]="filterBillNumber()" (ngModelChange)="filterBillNumber.set($event)" placeholder="Bill number..." />
              </div>
            </div>

            <!-- Assets List -->
            <div class="glass-panel">
              <div class="table-container">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th (click)="toggleSort('id')" class="sortable-header">Asset ID <span class="sort-indicator">{{ getSortIcon('id') }}</span></th>
                      <th (click)="toggleSort('name')" class="sortable-header">Asset Name <span class="sort-indicator">{{ getSortIcon('name') }}</span></th>
                      <th (click)="toggleSort('category')" class="sortable-header">Category <span class="sort-indicator">{{ getSortIcon('category') }}</span></th>
                      <th (click)="toggleSort('quantity')" class="sortable-header">Quantity <span class="sort-indicator">{{ getSortIcon('quantity') }}</span></th>
                      <th (click)="toggleSort('totalPrice')" class="sortable-header">Total Value <span class="sort-indicator">{{ getSortIcon('totalPrice') }}</span></th>
                      <th>Net Book Value</th>
                      <th>Warranty</th>
                      <th (click)="toggleSort('vendor')" class="sortable-header">Vendor <span class="sort-indicator">{{ getSortIcon('vendor') }}</span></th>
                      <th (click)="toggleSort('status')" class="sortable-header">Status <span class="sort-indicator">{{ getSortIcon('status') }}</span></th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (asset of paginatedAssets(); track asset.id) {
                      <tr>
                        <td><code>{{ asset.id }}</code></td>
                        <td>
                          <strong>{{ asset.name }}</strong>
                          @if (asset.containerId) {
                            <div class="container-badge">
                              Stored in: <code>{{ asset.containerId }}</code>
                            </div>
                          }
                          @if (asset.isContainer) {
                            <div class="container-badge is-container-tag">
                              💼 Acts as Container
                            </div>
                          }
                        </td>
                        <td>{{ asset.category }}</td>
                        <td>{{ asset.quantity }}</td>
                        <td>₹{{ asset.totalPrice | number }}</td>
                        <td>₹{{ depreciationService.calculateDepreciation(asset).currentValue | number }}</td>
                        <td>
                          @switch (depreciationService.calculateDepreciation(asset).warrantyStatus) {
                            @case ('Active') { <span class="badge badge-green">Active</span> }
                            @case ('Expiring Soon') { <span class="badge badge-orange animate-pulse">Expiring Soon</span> }
                            @case ('Expired') { <span class="badge badge-red">Expired</span> }
                            @default { <span class="badge badge-gray">N/A</span> }
                          }
                        </td>
                        <td>{{ asset.vendor || '-' }}</td>
                        <td>
                          <span class="badge" 
                            [class.badge-green]="asset.status === 'Active'" 
                            [class.badge-red]="asset.status === 'Condemned'"
                            [class.badge-orange]="asset.status === 'Missing' || asset.status === 'Damaged'"
                            [class.badge-blue]="asset.status === 'Under Service' || asset.status === 'Transferred'"
                            [class.badge-gray]="asset.status === 'Idle'"
                          >
                            {{ asset.status }}
                          </span>
                        </td>
                        <td>
                          <div class="action-buttons">
                            <button class="btn btn-secondary btn-icon" (click)="viewAssetDetails(asset)" title="View Details">View</button>
                            <button class="btn btn-secondary btn-icon" (click)="openRequestModal(asset, 'Quantity Update')" title="Update Stock">🔢</button>
                            <button class="btn btn-secondary btn-icon" (click)="openRequestModal(asset, 'Status Update')" title="Update Status">⚙️</button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="8" class="text-center">No assets found matching filters.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <app-pagination
                [currentPage]="assetPage()"
                [pageSize]="assetPageSize()"
                [totalItems]="filteredAssets().length"
                (pageChange)="assetPage.set($event)"
                (pageSizeChange)="assetPageSize.set($event); assetPage.set(1)">
              </app-pagination>
            </div>
          </div>
        }

        <!-- 3. STOCK VERIFICATION WORKFLOW -->
        @if (activeTab() === 'verification') {
          <div class="tab-content fade-in">
            <h1 class="display-header page-heading">Stock Verification Panel</h1>

            <!-- Selector Box -->
            <div class="glass-panel filter-bar">
              <div class="filter-group">
                <label class="form-label">Select Department / Room Room for Audit</label>
                <select class="form-input" [(ngModel)]="selectedAuditLocationId" (change)="loadAuditAssets()">
                  <option value="">-- Choose Location --</option>
                  @for (loc of institutionLocations(); track loc.id) {
                    <option [value]="loc.id">
                      {{ loc.building }} -> {{ loc.department }} -> Room: {{ loc.room }}
                    </option>
                  }
                </select>
              </div>
            </div>

            @if (selectedAuditLocationId) {
              <!-- Active Audit Grid -->
              <div class="glass-panel">
                <h3 class="form-label verify-title">Verifying location: {{ selectedAuditLocationText() }}</h3>
                <div class="table-container">
                  <table class="glass-table">
                    <thead>
                      <tr>
                        <th>Asset ID</th>
                        <th>Asset Name</th>
                        <th>Purchase Order</th>
                        <th>Billing Date</th>
                        <th>System Count</th>
                        <th>Physical Count</th>
                        <th>Status</th>
                        <th>Remarks / Discrepancy Reason</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of auditItems; track item.asset.id) {
                        <tr>
                          <td><code>{{ item.asset.id }}</code></td>
                          <td>
                            <strong>{{ item.asset.name }}</strong>
                            @if (item.asset.isContainer) {
                              <span class="badge badge-purple is-container-tag">Container</span>
                            }
                          </td>
                          <td><code>{{ item.asset.purchaseOrder || '-' }}</code></td>
                          <td>
                            {{ item.asset.billDate || '-' }}
                            @if (item.asset.billNumber) {
                              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                                No: <code>{{ item.asset.billNumber }}</code>
                              </div>
                            }
                          </td>
                          <td><strong>{{ item.asset.quantity }}</strong></td>
                          <td>
                            <input type="number" class="form-input input-qty" [(ngModel)]="item.physicalCount" min="0" />
                          </td>
                          <td>
                            <select class="form-input select-status" [(ngModel)]="item.status">
                              @for (status of statusList(); track status) {
                                <option [value]="status">{{ status }}</option>
                              }
                            </select>
                          </td>
                          <td>
                            <input 
                              type="text" 
                              class="form-input input-reason" 
                              [(ngModel)]="item.reason" 
                              placeholder="Required if counts mismatch or damaged" 
                              [required]="item.physicalCount !== item.asset.quantity || item.status !== item.asset.status"
                            />
                          </td>
                          <td>
                            <button 
                              class="btn btn-primary btn-sm" 
                              (click)="submitVerificationItem(item)"
                              [disabled]="item.physicalCount === item.asset.quantity && item.status === item.asset.status"
                            >
                              Submit Change
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="7" class="text-center">No assets found in this room.</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }

        <!-- 4. SUBMITTED REQUESTS -->
        @if (activeTab() === 'requests') {
          <div class="tab-content fade-in">
            <h1 class="display-header page-heading">Submitted Approval History</h1>

            <div class="glass-panel">
              <div class="table-container">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th>Date Submitted</th>
                      <th>Asset ID / Name</th>
                      <th>Change Details</th>
                      <th>Reason Provided</th>
                      <th>Status</th>
                      <th>Super Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (req of institutionRequests(); track req.id) {
                      <tr>
                        <td>{{ req.timestamp }}</td>
                        <td>
                          <strong>{{ req.assetName }}</strong>
                          <div class="asset-id-text"><code>{{ req.assetId }}</code></div>
                        </td>
                        <td>
                          <div class="diff-view">
                            <span class="diff-prev">{{ req.previousValue }}</span>
                            <span>➔</span>
                            <span class="diff-new">{{ req.newValue }}</span>
                          </div>
                        </td>
                        <td class="reason-cell"><em>"{{ req.reason }}"</em></td>
                        <td>
                          <span class="badge"
                            [class.badge-orange]="req.status === 'Pending'"
                            [class.badge-green]="req.status === 'Approved'"
                            [class.badge-red]="req.status === 'Rejected'"
                          >
                            {{ req.status }}
                          </span>
                        </td>
                        <td>{{ req.comments || '-' }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="text-center">No verification requests found.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- MAINTENANCE MANAGEMENT -->
        @if (activeTab() === 'maintenance') {
          <div class="tab-content fade-in">
            <app-maintenance-management
              [records]="maintenanceRecords()"
              [assets]="assets()"
              [isSuperAdmin]="false"
              (saveRecord)="onSaveMaintenanceRecord($event)"
              (deleteRecord)="onDeleteMaintenanceRecord($event)"
            ></app-maintenance-management>
          </div>
        }

        <!-- WARRANTY & AMC MANAGEMENT -->
        @if (activeTab() === 'warranty') {
          <div class="tab-content fade-in">
            <app-warranty-management
              [records]="warrantyRecords()"
              [assets]="assets()"
              [isSuperAdmin]="false"
              (saveRecord)="onSaveWarrantyRecord($event)"
              (deleteRecord)="onDeleteWarrantyRecord($event)"
            ></app-warranty-management>
          </div>
        }

        <!-- 5. REPORTS GENERATOR -->
        @if (activeTab() === 'reports') {
          <div class="tab-content fade-in">
            <app-reports-panel
              [assets]="assets()"
              [maintenanceRecords]="maintenanceRecords()"
              [warrantyRecords]="warrantyRecords()"
              [auditLogs]="auditLogs()"
            ></app-reports-panel>
          </div>
        }
      </main>
    </div>

    <!-- MODAL: ADD ASSET REQUEST -->
    <app-asset-form
      [active]="showAddAssetModal()"
      [title]="'Propose Add Asset'"
      [submitButtonText]="'Propose Asset addition'"
      [isEditMode]="false"
      [asset]="proposeAsset"
      [categoryList]="categoryList()"
      [statusList]="statusList()"
      [locations]="locations()"
      [containerAssets]="containerAssets()"
      [vendorList]="vendorList()"
      [showProposeReasonField]="true"
      (save)="onProposeAsset($event)"
      (cancel)="closeAddAssetModal()"
    ></app-asset-form>


    <!-- MODAL: SUBMIT CHANGE REQUEST -->
    @if (showRequestModal()) {
      <div class="modal-backdrop">
        <div class="glass-panel modal-card review-modal">
          <h2 class="display-header modal-title">Submit Verification Request</h2>
          <p class="review-meta">Proposing: <strong>{{ requestChangeType }}</strong> for {{ selectedAsset()?.name }}</p>
          
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Recorded Value (System)</label>
              <input type="text" class="form-input" [value]="requestPreviousValue" disabled />
            </div>

            <div class="form-group">
              <label class="form-label">Proposed New Value</label>
              @if (requestChangeType === 'Quantity Update') {
                <input type="number" class="form-input" [(ngModel)]="requestNewValue" required />
              } @else if (requestChangeType === 'Status Update') {
                <select class="form-input" [(ngModel)]="requestNewValue" required>
                  <option value="Idle">Idle</option>
                  <option value="Active">Active</option>
                  <option value="Under Service">Under Service</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Missing">Missing</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Condemned">Condemned</option>
                </select>
              } @else {
                <input type="text" class="form-input" [value]="requestNewValue" disabled />
              }
            </div>

            <div class="form-group">
              <label class="form-label">Reason for discrepancy / change</label>
              <textarea class="form-input text-area-input" [(ngModel)]="requestReason" rows="3" placeholder="Provide details e.g., 5 bottles damaged during biotech labs" required></textarea>
            </div>
          </div>

          <div class="modal-buttons">
            <button class="btn btn-secondary" (click)="closeRequestModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitInventoryRequest()" [disabled]="!requestReason">Submit Request</button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL: QR CODE PREVIEW -->
    @if (showQR()) {
      <div class="modal-backdrop" (click)="closeQRModal()">
        <div class="glass-panel modal-card qr-modal" (click)="$event.stopPropagation()">
          <h2 class="display-header modal-title">{{ qrModalTitle() }}</h2>
          <div class="qr-code-body">
            <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + qrModalData()" alt="QR code" />
            <code class="qr-asset-id">{{ qrModalData() }}</code>
          </div>
          <button class="btn btn-secondary" (click)="closeQRModal()">Close</button>
        </div>
      </div>
    }

    <!-- Side Details Drawer -->
    <app-asset-drawer
      [asset]="selectedDrawerAsset()"
      [isOpen]="selectedDrawerAsset() !== null"
      [transfers]="assetTransfers()"
      [showAdminActions]="false"
      (close)="selectedDrawerAsset.set(null)"
      (printQR)="printAssetQR($event)"
    ></app-asset-drawer>

    <app-qr-scanner-sim 
      [active]="showScannerModal()" 
      (close)="showScannerModal.set(false)" 
      (assetUpdated)="loadData()"
    ></app-qr-scanner-sim>
  `,
  styles: [`
    /* Reused layout styles similar to super-admin */
    .dashboard-container {
      display: flex;
      min-height: 100vh;
      background: var(--bg-primary);
    }
    .sidebar {
      width: 280px;
      flex-shrink: 0;
      border-radius: 0;
      border-top: none;
      border-bottom: none;
      border-left: none;
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--glass-border);
    }
    .sidebar-logo {
      font-size: 2.2rem;
    }
    .sidebar-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sidebar-nav {
      margin-top: 30px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-grow: 1;
      overflow-y: auto;
    }
    .nav-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-family: var(--font-body);
      font-size: 0.95rem;
      font-weight: 550;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all var(--transition-fast);
    }
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-primary);
    }
    .nav-link.active {
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: var(--text-primary);
    }
    .badge-pill {
      border-radius: 999px;
      padding: 2px 6px;
      font-size: 0.7rem;
    }
    .sidebar-footer {
      padding-top: 24px;
      border-top: 1px solid var(--glass-border);
    }
    .user-info {
      margin-bottom: 12px;
    }
    .user-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .user-email {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .btn-logout {
      width: 100%;
      height: 40px;
    }
    .main-content {
      flex-grow: 1;
      padding: 40px;
      margin-left: 280px;
      overflow-y: auto;
    }
    .mock-alert-bar {
      background: rgba(6, 182, 212, 0.1);
      border: 1px solid rgba(6, 182, 212, 0.3);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 0.85rem;
      color: #a5f3fc;
      margin-bottom: 24px;
    }
    .page-heading {
      font-size: 2.2rem;
      margin-bottom: 30px;
      background: linear-gradient(135deg, #fff 0%, #22d3ee 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .action-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .action-header .page-heading {
      margin-bottom: 0;
    }
    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px 24px;
    }
    .filter-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .text-red { color: #f87171 !important; }
    .text-orange { color: #fb923c !important; }
    .text-center { text-align: center; }
    .breakdown-panel {
      margin-top: 30px;
    }
    .section-title {
      font-size: 1.4rem;
      margin-bottom: 20px;
      color: var(--text-primary);
    }
    .container-badge {
      display: inline-block;
      margin-top: 6px;
      font-size: 0.75rem;
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: #22d3ee;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .is-container-tag {
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #c084fc;
      margin-left: 6px;
    }
    .qr-thumbnail {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      border: 1px solid var(--glass-border);
      cursor: pointer;
      background: #fff;
      padding: 2px;
      transition: transform var(--transition-fast);
    }
    .qr-thumbnail:hover {
      transform: scale(1.1);
    }
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
    }
    .asset-id-text {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .diff-view {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
    }
    .diff-prev {
      color: #fca5a5;
      text-decoration: line-through;
    }
    .diff-new {
      color: #86efac;
      font-weight: 600;
    }
    .reason-cell {
      max-width: 250px;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    /* Verification Form Styling */
    .verify-title {
      font-size: 0.9rem;
      margin-bottom: 20px;
      color: var(--accent-cyan);
    }
    .input-qty {
      width: 80px;
      padding: 6px 10px;
      text-align: center;
    }
    .select-status {
      padding: 6px 12px;
      font-size: 0.85rem;
    }
    .input-reason {
      width: 100%;
      padding: 6px 12px;
      font-size: 0.85rem;
    }

    /* Report Print styles */
    .print-preview-area {
      margin-top: 20px;
      background: #0f172a;
      border-radius: 12px;
    }
    .report-print-header {
      padding-bottom: 24px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--glass-border);
      text-align: center;
    }
    .report-print-header h2 {
      font-family: var(--font-display);
      font-size: 1.5rem;
      margin-bottom: 6px;
    }
    .report-print-header h3 {
      font-family: var(--font-display);
      font-size: 1.2rem;
      color: var(--accent-cyan);
      margin-bottom: 6px;
    }
    .report-print-header p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      overflow: hidden;
    }
    .modal-card {
      width: 100%;
      max-width: 600px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      animation: modalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }
    .modal-card form {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      overflow: hidden;
    }
    .modal-body {
      flex-grow: 1;
      overflow-y: auto;
      padding-right: 8px;
      margin-bottom: 8px;
    }
    .modal-card.qr-modal {
      max-width: 380px;
      text-align: center;
    }
    .modal-card.review-modal {
      max-width: 460px;
    }
    .modal-title {
      font-size: 1.6rem;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #fff 0%, #22d3ee 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .form-row-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .flex-row {
      flex-direction: row !important;
      align-items: center;
      gap: 12px;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    .pointer-label {
      cursor: pointer;
      text-transform: none;
      font-size: 0.9rem;
    }
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    .qr-code-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .qr-code-body img {
      padding: 12px;
      background: #fff;
      border-radius: 12px;
      box-shadow: var(--shadow-md);
    }
    .qr-asset-id {
      font-family: monospace;
      font-size: 0.95rem;
      color: var(--accent-cyan);
    }
    .review-meta {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 20px;
    }
    .text-area-input {
      resize: none;
    }

    @keyframes modalSlide {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    th.sortable-header {
      cursor: pointer;
      user-select: none;
    }
    th.sortable-header:hover {
      background: rgba(255, 255, 255, 0.05) !important;
    }
    .sort-indicator {
      margin-left: 4px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
  `]
})
export class SchoolAdminComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  public exportService = inject(ExportService);
  public depreciationService = inject(DepreciationService);
  public notificationService = inject(NotificationService);

  // Pagination Signals
  assetPage = signal<number>(1);
  assetPageSize = signal<number>(10);
  paginatedAssets = computed(() => {
    const page = this.assetPage();
    const size = this.assetPageSize();
    return this.filteredAssets().slice((page - 1) * size, page * size);
  });

  // Navigation State
  activeTab = signal<string>('overview');
  userName = signal<string>('Prof. Ramesh Patel');
  userEmail = signal<string>('akcp@kare.edu');
  institutionName = signal<string>('AKCP');
  realtimeSubscription: (() => void) | null = null;
  
  // Sorting & Drawer State
  sortColumn = signal<string>('id');
  sortAscending = signal<boolean>(true);
  selectedDrawerAsset = signal<Asset | null>(null);
  assetTransfers = signal<AssetTransfer[]>([]);
  showScannerModal = signal<boolean>(false);

  // Data Signals
  assets = signal<Asset[]>([]);
  locations = signal<Location[]>([]);
  requests = signal<VerificationRequest[]>([]);
  maintenanceRecords = signal<MaintenanceRecord[]>([]);
  warrantyRecords = signal<WarrantyRecord[]>([]);
  auditLogs = signal<AuditLog[]>([]);
  masterCategories = signal<MasterOption[]>([]);
  masterStatuses = signal<MasterOption[]>([]);
  vendors = signal<Vendor[]>([]);
  isMockActive = signal<boolean>(true);

  // Filters State
  filterCategory = signal<string>('All');
  filterStatus = signal<string>('All');
  searchQuery = signal<string>('');
  filterPO = signal<string>('');
  filterBillNumber = signal<string>('');

  // Audit State
  selectedAuditLocationId = '';
  auditItems: Array<{
    asset: Asset;
    physicalCount: number;
    status: Asset['status'];
    reason: string;
  }> = [];

  // Modals & Temp states
  showAddAssetModal = signal<boolean>(false);
  proposeAsset!: Asset;
  proposeReason = '';

  showRequestModal = signal<boolean>(false);
  selectedAsset = signal<Asset | null>(null);
  requestChangeType = 'Quantity Update';
  requestPreviousValue = '';
  requestNewValue = '';
  requestReason = '';

  showQR = signal<boolean>(false);
  qrModalData = signal<string>('');
  qrModalTitle = signal<string>('');

  // Reports
  reportType = 'summary';
  reportTitle = computed(() => {
    switch (this.reportType) {
      case 'summary': return 'Comprehensive Campus Inventory Audit';
      case 'damaged': return 'Service & Condemned Assets List';
      default: return 'Missing Assets List';
    }
  });

  currentDateTime = () => new Date().toLocaleString();

  constructor(
    private appwriteService: AppwriteService,
    private router: Router
  ) {
    // Prevent body scroll when any modal is open
    effect(() => {
      const isModalOpen = this.showAddAssetModal() || this.showRequestModal() || this.showQR() || this.selectedDrawerAsset() !== null;
      if (isModalOpen) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    });
  }

  async ngOnInit() {
    this.isMockActive.set(this.appwriteService.isUsingMock());
    const user = this.appwriteService.currentUser();
    if (user) {
      this.userName.set(user.name);
      this.userEmail.set(user.email);
      this.institutionName.set(user.institution);
    }
    
    await this.loadData();

    const channels = this.appwriteService.getRealtimeChannels(user);
    this.realtimeSubscription = this.appwriteService.subscribeToRealtime(channels, (event) => {
      this.handleRealtimeEvent(event);
    });
  }

  ngOnDestroy() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription();
      this.realtimeSubscription = null;
    }
  }

  private handleRealtimeEvent(event: any) {
    if (!event || !event.events || event.events.length === 0) return;
    
    const eventStr = event.events[0];
    const parts = eventStr.split('.');
    if (parts.length < 7) return;
    const collectionId = parts[3];
    const eventType = parts[6];
    const docPayload = event.payload;

    const baseColls = ['assets', 'consumables', 'furniture', 'requests', 'locations'];
    let collectionBaseName = '';
    for (const base of baseColls) {
      if (collectionId.endsWith(`_${base}`)) {
        collectionBaseName = base;
        break;
      }
    }
    
    if (!collectionBaseName) return;

    const instName = this.institutionName();
    
    switch (collectionBaseName) {
      case 'assets':
      case 'furniture':
      case 'consumables': {
        const mapped = this.appwriteService.mapAssetDocument(docPayload, this.locations());
        if (mapped.locationText?.startsWith(instName) || mapped.schoolId === this.appwriteService.getPrefixForInstitution(instName)) {
          this.updateLocalList(this.assets, mapped, eventType);
        }
        break;
      }
      case 'requests': {
        const mapped = this.appwriteService.mapRequestDocument(docPayload);
        if (mapped.institution === instName) {
          this.updateLocalList(this.requests, mapped, eventType);
        }
        break;
      }
      case 'locations': {
        if (docPayload.institution === instName) {
          const mapped: Location = {
            id: docPayload.id || docPayload.$id,
            institution: docPayload.institution,
            department: docPayload.department,
            building: docPayload.building,
            room: docPayload.room,
            floor: docPayload.floor || ''
          };
          this.updateLocalList(this.locations, mapped, eventType);
        }
        break;
      }
    }
  }

  private updateLocalList<T extends { id: string }>(signalRef: any, item: T, eventType: string) {
    const list = [...signalRef()];
    if (eventType === 'create') {
      if (!list.some(x => x.id === item.id)) {
        signalRef.set([item, ...list]);
      }
    } else if (eventType === 'update') {
      const idx = list.findIndex(x => x.id === item.id);
      if (idx !== -1) {
        list[idx] = item;
        signalRef.set(list);
      } else {
        signalRef.set([item, ...list]);
      }
    } else if (eventType === 'delete') {
      signalRef.set(list.filter(x => x.id !== item.id));
    }
  }

  async loadData() {
    try {
      const [categoryData, statusData, vendorData, assetsData, locationsData, requestsData, maintenanceData, warrantyData, logsData] = await Promise.all([
        this.appwriteService.getCategories(),
        this.appwriteService.getStatuses(),
        this.appwriteService.getVendors(),
        this.appwriteService.getAssets(),
        this.appwriteService.getLocations(),
        this.appwriteService.getRequests(),
        this.appwriteService.getMaintenanceRecords(),
        this.appwriteService.getWarrantyRecords(),
        this.appwriteService.getAuditLogs()
      ]);
      this.masterCategories.set(categoryData);
      this.masterStatuses.set(statusData);
      this.vendors.set(vendorData);
      
      // ISOLATION: filter records belonging to their assigned institution
      const instName = this.institutionName();
      const schoolAssets = assetsData.filter(a => a.locationText?.startsWith(instName));
      const assetIds = new Set(schoolAssets.map(a => a.id));

      this.assets.set(schoolAssets);
      this.locations.set(locationsData.filter(l => l.institution === instName));
      this.requests.set(requestsData.filter(r => r.institution === instName));
      this.maintenanceRecords.set(maintenanceData.filter(m => assetIds.has(m.assetId)));
      this.warrantyRecords.set(warrantyData.filter(w => assetIds.has(w.assetId)));
      this.auditLogs.set(logsData);
    } catch (e) {
      console.error('Error fetching school admin data:', e);
    }
  }

  async onSaveMaintenanceRecord(rec: Partial<MaintenanceRecord>) {
    try {
      if (rec.id) {
        await this.appwriteService.updateMaintenanceRecord(rec.id, rec);
        this.notificationService.success('Maintenance record updated successfully');
      } else {
        await this.appwriteService.addMaintenanceRecord(rec as any);
        this.notificationService.success('Maintenance record scheduled successfully');
      }
      await this.loadData();
    } catch (e) {
      console.error('Error saving maintenance record:', e);
      this.notificationService.error('Failed to save maintenance record');
    }
  }

  async onDeleteMaintenanceRecord(id: string) {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      await this.appwriteService.deleteMaintenanceRecord(id);
      this.notificationService.success('Maintenance record deleted');
      await this.loadData();
    } catch (e) {
      console.error('Error deleting maintenance record:', e);
      this.notificationService.error('Failed to delete maintenance record');
    }
  }

  async onSaveWarrantyRecord(rec: Partial<WarrantyRecord>) {
    try {
      if (rec.id) {
        await this.appwriteService.updateWarrantyRecord(rec.id, rec);
        this.notificationService.success('Warranty record updated successfully');
      } else {
        await this.appwriteService.addWarrantyRecord(rec as any);
        this.notificationService.success('Warranty record added successfully');
      }
      await this.loadData();
    } catch (e) {
      console.error('Error saving warranty record:', e);
      this.notificationService.error('Failed to save warranty record');
    }
  }

  async onDeleteWarrantyRecord(id: string) {
    if (!confirm('Are you sure you want to delete this warranty record?')) return;
    try {
      await this.appwriteService.deleteWarrantyRecord(id);
      this.notificationService.success('Warranty record deleted');
      await this.loadData();
    } catch (e) {
      console.error('Error deleting warranty record:', e);
      this.notificationService.error('Failed to delete warranty record');
    }
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
    this.loadData();
  }

  // Dashboard Stats (Institution Specific)
  totalAssetsCount = computed(() => this.assets().reduce((acc, a) => acc + a.quantity, 0));
  totalAssetValue = computed(() => this.assets().reduce((acc, a) => acc + a.totalPrice, 0));
  idleAssetsCount = computed(() => this.assets().filter(a => a.status === 'Idle').reduce((acc, a) => acc + a.quantity, 0));
  underServiceCount = computed(() => this.assets().filter(a => a.status === 'Under Service').reduce((acc, a) => acc + a.quantity, 0));
  missingAssetsCount = computed(() => this.assets().filter(a => a.status === 'Missing').reduce((acc, a) => acc + a.quantity, 0));
  condemnedAssetsCount = computed(() => this.assets().filter(a => a.status === 'Condemned').reduce((acc, a) => acc + a.quantity, 0));
  damagedAssetsCount = computed(() => this.assets().filter(a => a.status === 'Damaged').reduce((acc, a) => acc + a.quantity, 0));
  pendingRequestsCount = computed(() => this.institutionRequests().filter(r => r.status === 'Pending').length);

  institutionLocations = () => this.locations();
  institutionRequests = () => this.requests().slice().reverse(); // Newest first

  categoryList = computed(() => {
    const cats = [...this.masterCategories().map(c => c.name), ...this.assets().map(a => a.category)];
    return Array.from(new Set(cats));
  });

  statusList = computed(() => Array.from(new Set([
    ...this.masterStatuses().map(s => s.name),
    ...this.assets().map(a => a.status)
  ])));
  vendorList = computed(() => Array.from(new Set([
    ...this.vendors().map(v => v.name),
    ...this.assets().map(a => a.vendor).filter(Boolean)
  ])));

  containerAssets = computed(() => this.assets().filter(a => a.isContainer));

  categorySummaries = computed(() => {
    const categories = Array.from(new Set(this.assets().map(a => a.category)));
    return categories.map(cat => {
      const catAssets = this.assets().filter(a => a.category === cat);
      return {
        name: cat,
        count: catAssets.reduce((acc, a) => acc + a.quantity, 0),
        value: catAssets.reduce((acc, a) => acc + a.totalPrice, 0),
        active: catAssets.filter(a => a.status === 'Active' || a.status === 'Idle').reduce((acc, a) => acc + a.quantity, 0),
        damagedMissing: catAssets.filter(a => a.status === 'Under Service' || a.status === 'Missing' || a.status === 'Condemned' || a.status === 'Damaged').reduce((acc, a) => acc + a.quantity, 0)
      };
    });
  });

  filteredAssets = computed(() => {
    const list = this.assets().filter(a => {
      const matchSearch = this.searchQuery() === '' || 
        a.name.toLowerCase().includes(this.searchQuery().toLowerCase()) || 
        a.id.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        (a.vendor || '').toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchCat = this.filterCategory() === 'All' || a.category === this.filterCategory();
      const matchStatus = this.filterStatus() === 'All' || a.status === this.filterStatus();
      const matchPO = this.filterPO() === '' || (a.purchaseOrder || '').toLowerCase().includes(this.filterPO().toLowerCase());
      const matchBill = this.filterBillNumber() === '' || (a.billNumber || '').toLowerCase().includes(this.filterBillNumber().toLowerCase());
      return matchSearch && matchCat && matchStatus && matchPO && matchBill;
    });

    const col = this.sortColumn();
    const asc = this.sortAscending() ? 1 : -1;

    return list.sort((a, b) => {
      let valA = (a as any)[col];
      let valB = (b as any)[col];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
      }
      if (typeof valB === 'string') {
        valB = valB.toLowerCase();
      }

      if (valA < valB) return -1 * asc;
      if (valA > valB) return 1 * asc;
      return 0;
    });
  });

  selectedAuditLocationText = () => {
    const loc = this.locations().find(l => l.id === this.selectedAuditLocationId);
    return loc ? `${loc.building} -> ${loc.department} -> ${loc.room}` : '';
  };

  loadAuditAssets() {
    if (!this.selectedAuditLocationId) {
      this.auditItems = [];
      return;
    }
    const locAssets = this.assets().filter(a => a.locationId === this.selectedAuditLocationId);
    this.auditItems = locAssets.map(a => ({
      asset: a,
      physicalCount: a.quantity,
      status: a.status,
      reason: ''
    }));
  }

  // Submit Verification Item
  async submitVerificationItem(item: any) {
    if (item.physicalCount !== item.asset.quantity) {
      if (!item.reason) {
        alert('Discrepancy reason is required when actual quantity differs from system count.');
        return;
      }
      await this.appwriteService.submitRequest({
        schoolAdminEmail: this.userEmail(),
        schoolAdminName: this.userName(),
        institution: this.institutionName(),
        assetId: item.asset.id,
        assetName: item.asset.name,
        changeType: 'Quantity Update',
        previousValue: `${item.asset.quantity} Units`,
        newValue: `${item.physicalCount} Units`,
        reason: item.reason
      });
    }

    if (item.status !== item.asset.status) {
      if (!item.reason) {
        alert('Reason is required when changing the asset status.');
        return;
      }
      await this.appwriteService.submitRequest({
        schoolAdminEmail: this.userEmail(),
        schoolAdminName: this.userName(),
        institution: this.institutionName(),
        assetId: item.asset.id,
        assetName: item.asset.name,
        changeType: `Mark ${item.status}` as any,
        previousValue: item.asset.status,
        newValue: item.status,
        reason: item.reason
      });
    }

    alert('Verification change request submitted to Super Admin successfully.');
    item.reason = ''; // clear
    await this.loadData();
    this.loadAuditAssets();
  }

  async viewAssetDetails(asset: Asset) {
    this.selectedDrawerAsset.set(asset);
    this.assetTransfers.set([]);
    try {
      const transfers = await this.appwriteService.getAssetTransfers(asset.id);
      this.assetTransfers.set(transfers);
    } catch (e) {
      console.error('Error fetching asset transfers:', e);
    }
  }

  // Propose New Asset Modal
  openAddAssetModal() {
    this.proposeReason = '';
    this.proposeAsset = {
      id: '',
      name: '',
      category: this.categoryList()[0] || '',
      barcode: '',
      qrCode: '',
      brand: '',
      model: '',
      serialNumber: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      purchaseDate: new Date().toISOString().substring(0, 10),
      purchaseOrder: '',
      billNumber: '',
      billDate: '',
      vendor: '',
      warrantyDetails: '',
      status: this.statusList().includes('Active') ? 'Active' : (this.statusList()[0] as Asset['status']) || 'Active',
      remarks: '',
      locationId: this.locations()[0]?.id || '',
      isContainer: false
    };
    this.showAddAssetModal.set(true);
  }

  closeAddAssetModal() {
    this.showAddAssetModal.set(false);
  }

  async onProposeAsset(event: { asset: Partial<Asset>; proposeReason?: string }) {
    this.proposeAsset = event.asset as Asset;
    this.proposeReason = event.proposeReason || '';

    this.proposeAsset.totalPrice = this.proposeAsset.quantity * this.proposeAsset.unitPrice;
    this.proposeAsset.qrCode = this.proposeAsset.id;
    this.proposeAsset.barcode = 'BAR-' + this.proposeAsset.id;
    this.proposeAsset.status = 'Missing'; // Set inactive or missing until approved
    this.proposeAsset.remarks = `Proposed by ${this.userName()}. Approval Pending. ` + this.proposeReason;

    await this.appwriteService.addProposedAsset(this.proposeAsset);

    // Submit to approval requests queue
    await this.appwriteService.submitRequest({
      schoolAdminEmail: this.userEmail(),
      schoolAdminName: this.userName(),
      institution: this.institutionName(),
      assetId: this.proposeAsset.id,
      assetName: this.proposeAsset.name,
      changeType: 'Add Asset',
      previousValue: 'None (New Propose)',
      newValue: `ID: ${this.proposeAsset.id}, Qty: ${this.proposeAsset.quantity}, Value: ₹${this.proposeAsset.totalPrice}`,
      reason: this.proposeReason
    });

    alert('Asset addition proposal submitted to Super Admin successfully.');
    this.showAddAssetModal.set(false);
    await this.loadData();
  }

  // Request Edit Modal (for quick grid buttons)
  openRequestModal(asset: Asset, type: 'Quantity Update' | 'Status Update') {
    this.selectedAsset.set(asset);
    this.requestChangeType = type;
    this.requestReason = '';
    
    if (type === 'Quantity Update') {
      this.requestPreviousValue = `${asset.quantity} Units`;
      this.requestNewValue = asset.quantity.toString();
    } else {
      this.requestPreviousValue = asset.status;
      this.requestNewValue = asset.status;
    }
    this.showRequestModal.set(true);
  }

  closeRequestModal() {
    this.showRequestModal.set(false);
    this.selectedAsset.set(null);
  }

  async submitInventoryRequest() {
    const asset = this.selectedAsset();
    if (!asset) return;

    let finalChangeType = this.requestChangeType;
    if (this.requestChangeType === 'Status Update') {
      finalChangeType = `Mark ${this.requestNewValue}`;
    }

    await this.appwriteService.submitRequest({
      schoolAdminEmail: this.userEmail(),
      schoolAdminName: this.userName(),
      institution: this.institutionName(),
      assetId: asset.id,
      assetName: asset.name,
      changeType: finalChangeType as any,
      previousValue: this.requestPreviousValue,
      newValue: this.requestChangeType === 'Quantity Update' ? `${this.requestNewValue} Units` : this.requestNewValue,
      reason: this.requestReason
    });

    alert('Change request submitted to Super Admin successfully.');
    this.showRequestModal.set(false);
    await this.loadData();
  }

  // QR Modal
  showQRModal(id: string, name: string) {
    this.qrModalTitle.set(name);
    this.qrModalData.set(id);
    this.showQR.set(true);
  }

  closeQRModal() {
    this.showQR.set(false);
  }

  // Reporting
  reportAssets = computed(() => {
    if (this.reportType === 'damaged') {
      return this.assets().filter(a => a.status === 'Under Service' || a.status === 'Condemned' || a.status === 'Damaged');
    }
    if (this.reportType === 'missing') {
      return this.assets().filter(a => a.status === 'Missing');
    }
    return this.assets();
  });

  printReport() {
    window.print();
  }

  async onLogout() {
    await this.appwriteService.logout();
    this.router.navigate(['/login']);
  }

  toggleSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortAscending.set(!this.sortAscending());
    } else {
      this.sortColumn.set(column);
      this.sortAscending.set(true);
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return '↕️';
    return this.sortAscending() ? '🔼' : '🔽';
  }

  printAssetQR(asset: Asset) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${asset.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .qr-card {
              border: 2px solid #ccc;
              padding: 24px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            img {
              width: 200px;
              height: 200px;
              margin-bottom: 16px;
            }
            .asset-name {
              font-size: 1.25rem;
              font-weight: bold;
              margin: 8px 0;
            }
            .asset-id {
              font-family: monospace;
              color: #666;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="qr-card">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${asset.id}" alt="QR" />
            <div class="asset-name">${asset.name}</div>
            <div class="asset-id">${asset.id}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
