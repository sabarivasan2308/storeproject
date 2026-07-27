import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppwriteService } from '../../core/services/appwrite.service';
import { ExportService } from '../../core/services/export.service';
import { DepreciationService } from '../../core/services/depreciation.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { QRScannerSimComponent } from '../shared/components/qr-scanner-sim.component';
import { NotificationCenterComponent } from '../shared/components/notification-center.component';
import { PaginationComponent } from '../shared/components/pagination.component';
import { StatCardComponent } from '../shared/components/stat-card.component';
import { AssetDrawerComponent } from '../shared/components/asset-drawer.component';
import { AssetFormComponent } from '../shared/components/asset-form.component';
import { MaintenanceManagementComponent } from '../shared/components/maintenance-management.component';
import { WarrantyManagementComponent } from '../shared/components/warranty-management.component';
import { ReportsPanelComponent } from '../shared/components/reports-panel.component';
import {
  Asset,
  Location,
  VerificationRequest,
  AuditLog,
  MasterOption,
  School,
  Vendor,
  ProcurementBill,
  ProcurementDraftItem,
  ProcurementBillItem,
  ProductMaster,
  AssetTransfer,
  MaintenanceRecord,
  WarrantyRecord
} from '../../core/models/types';

@Component({
  selector: 'app-super-admin',
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
            <h2 class="display-header sidebar-title">KARE System</h2>
            <span class="badge badge-purple">Super Admin</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <button class="nav-link" [class.active]="activeTab() === 'overview'" (click)="setTab('overview')">
            Overview Dashboard
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'assets'" (click)="setTab('assets')">
            Asset Inventory
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'maintenance'" (click)="setTab('maintenance')">
            Maintenance & Service
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'warranty'" (click)="setTab('warranty')">
            Warranty & AMC
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'procurement'" (click)="setTab('procurement')">
            Procurement Entry
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'bills'" (click)="setTab('bills')">
            Bills
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'products'" (click)="setTab('products')">
            Product Master
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'approvals'" (click)="setTab('approvals')">
            Pending Approvals
            @if (pendingRequestsCount() > 0) {
              <span class="badge badge-red badge-pill">{{ pendingRequestsCount() }}</span>
            }
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'logs'" (click)="setTab('logs')">
            System Audit Logs
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'reports'" (click)="setTab('reports')">
            Inventory Reports
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

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Header Bar -->
        <header class="top-header-bar flex items-center justify-between p-4 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div class="flex items-center gap-3">
            <h1 class="text-lg font-bold text-slate-800 dark:text-slate-100">KARE Enterprise Asset Management</h1>
            <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
              Super Admin
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
            <h1 class="display-header page-heading">System Overview</h1>
            
            <div class="dashboard-grid">
              <div class="glass-panel kpi-card">
                <div class="kpi-data">
                  <span class="kpi-label">Institutions</span>
                  <span class="kpi-value">{{ uniqueInstitutionsCount() }}</span>
                </div>
              </div>
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

            <!-- Institution Summary Breakdown -->
            <div class="glass-panel breakdown-panel">
              <h2 class="display-header section-title">Institution-wise Inventory summary</h2>
              <div class="table-container">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th>Institution Name</th>
                      <th>Assets Count</th>
                      <th>Total Value</th>
                      <th>Under Service</th>
                      <th>Damaged Items</th>
                      <th>Missing Items</th>
                      <th>Condemned</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (inst of institutionSummaries(); track inst.name) {
                      <tr>
                        <td><strong>{{ inst.name }}</strong></td>
                        <td>{{ inst.count }}</td>
                        <td>₹{{ inst.value | number }}</td>
                        <td>
                          <span class="badge" [class.badge-blue]="inst.underService > 0" [class.badge-green]="inst.underService === 0">
                            {{ inst.underService }}
                          </span>
                        </td>
                        <td>
                          <span class="badge" [class.badge-orange]="inst.damaged > 0" [class.badge-green]="inst.damaged === 0">
                            {{ inst.damaged }}
                          </span>
                        </td>
                        <td>
                          <span class="badge" [class.badge-orange]="inst.missing > 0" [class.badge-green]="inst.missing === 0">
                            {{ inst.missing }}
                          </span>
                        </td>
                        <td>
                          <span class="badge" [class.badge-red]="inst.condemned > 0" [class.badge-green]="inst.condemned === 0">
                            {{ inst.condemned }}
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
              <h1 class="display-header page-heading">Assets Inventory Directory</h1>
              <div class="action-buttons-group" style="display: flex; gap: 12px;">
                <button class="btn btn-secondary" (click)="exportService.exportAssetsToCsv(sortedAssets())">
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

            <!-- Filter Bar -->
            <div class="glass-panel filter-bar" style="flex-wrap: wrap;">
              <div class="filter-group" style="min-width: 180px;">
                <label class="form-label">Search Name / ID</label>
                <input type="text" class="form-input" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Search name, ID..." />
              </div>
              <div class="filter-group" style="min-width: 180px;">
                <label class="form-label">Institution</label>
                <select class="form-input" [ngModel]="filterInstitution()" (ngModelChange)="filterInstitution.set($event)">
                  <option value="All">All Institutions</option>
                  @for (inst of institutionList(); track inst) {
                    <option [value]="inst">{{ inst }}</option>
                  }
                </select>
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
                  <option value="Damaged">Damaged</option>
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
                      <th (click)="toggleSort('id')" style="cursor: pointer;">
                        Asset ID
                        @if (sortColumn() === 'id') {
                          <span>{{ sortDirection() === 'asc' ? ' ▲' : ' ▼' }}</span>
                        }
                      </th>
                      <th (click)="toggleSort('name')" style="cursor: pointer;">
                        Asset Name
                        @if (sortColumn() === 'name') {
                          <span>{{ sortDirection() === 'asc' ? ' ▲' : ' ▼' }}</span>
                        }
                      </th>
                      <th (click)="toggleSort('category')" style="cursor: pointer;">
                        Category
                        @if (sortColumn() === 'category') {
                          <span>{{ sortDirection() === 'asc' ? ' ▲' : ' ▼' }}</span>
                        }
                      </th>
                      <th>Quantity</th>
                      <th (click)="toggleSort('totalPrice')" style="cursor: pointer;">
                        Total Value
                        @if (sortColumn() === 'totalPrice') {
                          <span>{{ sortDirection() === 'asc' ? ' ▲' : ' ▼' }}</span>
                        }
                      </th>
                      <th>Net Book Value</th>
                      <th>Warranty</th>
                      <th (click)="toggleSort('vendor')" style="cursor: pointer;">
                        Vendor
                        @if (sortColumn() === 'vendor') {
                          <span>{{ sortDirection() === 'asc' ? ' ▲' : ' ▼' }}</span>
                        }
                      </th>
                      <th (click)="toggleSort('status')" style="cursor: pointer;">
                        Status
                        @if (sortColumn() === 'status') {
                          <span>{{ sortDirection() === 'asc' ? ' ▲' : ' ▼' }}</span>
                        }
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (asset of paginatedAssets(); track asset.id) {
                      <tr (click)="openDetailDrawer(asset)" style="cursor: pointer;">
                        <td><code>{{ asset.id }}</code></td>
                        <td>
                          <strong>{{ asset.name }}</strong>
                          @if (asset.containerId) {
                            <div class="container-badge" (click)="viewContainer(asset.containerId); $event.stopPropagation()">
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
                          <div class="action-buttons" (click)="$event.stopPropagation()">
                            <button class="btn btn-secondary btn-icon" (click)="openEditAssetModal(asset)" title="Edit">✏️</button>
                            <button class="btn btn-danger btn-icon" (click)="deleteAsset(asset.id)" title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="10" class="text-center">No assets found matching filters.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Asset Pagination -->
              <app-pagination
                [currentPage]="assetPage()"
                [pageSize]="assetPageSize()"
                [totalItems]="sortedAssets().length"
                (pageChange)="assetPage.set($event)"
                (pageSizeChange)="assetPageSize.set($event); assetPage.set(1)">
              </app-pagination>
            </div>
          </div>
        }

        <!-- 3. PROCUREMENT ENTRY -->
        @if (activeTab() === 'procurement') {
          <div class="tab-content fade-in">
            <div class="action-header">
              <h1 class="display-header page-heading">Procurement Entry</h1>
              <button class="btn btn-secondary" (click)="resetProcurementForm()">Reset</button>
            </div>

            <div class="workflow-strip glass-panel">
              <span>Select School</span>
              <span>Select Vendor</span>
              <span>Invoice Details</span>
              <span>Add Products</span>
              <span>Review Summary</span>
              <span>Generate Assets</span>
            </div>

            <div class="glass-panel procurement-panel">
              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">School</label>
                  <select class="form-input" [(ngModel)]="procurement.schoolId" name="procSchool" (change)="syncProcurementSchool()">
                    <option value="">Select School</option>
                    @for (school of schools(); track school.id) {
                      <option [value]="school.id">{{ school.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Vendor</label>
                  <select class="form-input" [(ngModel)]="procurement.vendorId" name="procVendor" (change)="syncProcurementVendor()">
                    <option value="">Select Vendor</option>
                    @for (vendor of vendors(); track vendor.id) {
                      <option [value]="vendor.id">{{ vendor.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Purchase Order Number</label>
                  <input class="form-input" [(ngModel)]="procurement.purchaseOrderNumber" name="procPo" placeholder="PO number" />
                </div>
                <div class="form-group">
                  <label class="form-label">Invoice Number</label>
                  <input class="form-input" [(ngModel)]="procurement.invoiceNumber" name="procInvoice" placeholder="Invoice number" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Purchase Date</label>
                  <input type="date" class="form-input" [(ngModel)]="procurement.purchaseDate" name="procPurchaseDate" />
                </div>
                <div class="form-group">
                  <label class="form-label">Billing Date</label>
                  <input type="date" class="form-input" [(ngModel)]="procurement.billingDate" name="procBillingDate" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Department</label>
                  <select class="form-input" [(ngModel)]="procurement.departmentId" name="procDepartment" (change)="syncProcurementDepartment()">
                    <option value="">Select Department</option>
                    @for (dept of procurementDepartments(); track dept.id) {
                      <option [value]="dept.id">{{ dept.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Payment Status</label>
                  <select class="form-input" [(ngModel)]="procurement.paymentStatus" name="procPaymentStatus">
                    <option value="Pending">Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div class="charges-grid">
                <div class="form-group">
                  <label class="form-label">GST %</label>
                  <input type="number" class="form-input" [(ngModel)]="procurement.gstPercent" name="procGst" />
                </div>
                <div class="form-group">
                  <label class="form-label">Transport</label>
                  <input type="number" class="form-input" [(ngModel)]="procurement.transportCharges" name="procTransport" />
                </div>
                <div class="form-group">
                  <label class="form-label">Packing</label>
                  <input type="number" class="form-input" [(ngModel)]="procurement.packingCharges" name="procPacking" />
                </div>
                <div class="form-group">
                  <label class="form-label">Insurance</label>
                  <input type="number" class="form-input" [(ngModel)]="procurement.insuranceCharges" name="procInsurance" />
                </div>
                <div class="form-group">
                  <label class="form-label">Other</label>
                  <input type="number" class="form-input" [(ngModel)]="procurement.otherCharges" name="procOther" />
                </div>
                <div class="form-group">
                  <label class="form-label">Discount</label>
                  <input type="number" class="form-input" [(ngModel)]="procurement.discount" name="procDiscount" />
                </div>
              </div>

              <div class="section-heading-row">
                <h2 class="display-header section-title">Products Purchased</h2>
                <button class="btn btn-secondary btn-sm" (click)="addProcurementItem()">Add Product</button>
              </div>

              <div class="table-container">
                <table class="glass-table procurement-table">
                  <thead>
                    <tr>
                      <th>Barcode</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>GST %</th>
                      <th>Location</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of procurement.items; track $index; let i = $index) {
                      <tr>
                        <td>
                          <input class="form-input table-input" [(ngModel)]="item.barcode" [name]="'procBarcode' + i" placeholder="Scan / type barcode" (change)="lookupProcurementBarcode(i)" />
                          <button class="btn btn-secondary btn-sm" (click)="startCameraScanner(i)">Camera</button>
                        </td>
                        <td>
                          <input class="form-input table-input" [(ngModel)]="item.productName" [name]="'procProduct' + i" placeholder="Product name" />
                          <input class="form-input table-input subtle-input" [(ngModel)]="item.brand" [name]="'procBrand' + i" placeholder="Brand" />
                          <input class="form-input table-input subtle-input" [(ngModel)]="item.model" [name]="'procModel' + i" placeholder="Model" />
                        </td>
                        <td>
                          <select class="form-input table-input" [(ngModel)]="item.category" [name]="'procCategory' + i">
                            @for (cat of categoryList(); track cat) {
                              <option [value]="cat">{{ cat }}</option>
                            }
                          </select>
                        </td>
                        <td><input type="number" class="form-input table-input input-small" [(ngModel)]="item.quantity" [name]="'procQty' + i" min="1" /></td>
                        <td><input type="number" class="form-input table-input" [(ngModel)]="item.unitPrice" [name]="'procUnit' + i" min="0" /></td>
                        <td><input type="number" class="form-input table-input input-small" [(ngModel)]="item.gstPercent" [name]="'procItemGst' + i" min="0" /></td>
                        <td>
                          <select class="form-input table-input" [(ngModel)]="item.locationId" [name]="'procLocation' + i">
                            @for (loc of procurementLocations(); track loc.id) {
                              <option [value]="loc.id">{{ loc.building }} / {{ loc.room }}</option>
                            }
                          </select>
                        </td>
                        <td>₹{{ itemLineTotal(item) | number }}</td>
                        <td><button class="btn btn-danger btn-sm" (click)="removeProcurementItem(i)" [disabled]="procurement.items.length === 1">Remove</button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="form-group">
                <label class="form-label">Remarks</label>
                <textarea class="form-input text-area-input" [(ngModel)]="procurement.remarks" name="procRemarks" rows="3"></textarea>
              </div>

              <div class="summary-grid">
                <div class="summary-cell"><span>Subtotal</span><strong>₹{{ procurementSubtotal() | number }}</strong></div>
                <div class="summary-cell"><span>GST Amount</span><strong>₹{{ procurementGstAmount() | number }}</strong></div>
                <div class="summary-cell"><span>Charges</span><strong>₹{{ procurementCharges() | number }}</strong></div>
                <div class="summary-cell"><span>Discount</span><strong>₹{{ (procurement.discount || 0) | number }}</strong></div>
                <div class="summary-cell grand"><span>Grand Total</span><strong>₹{{ procurementGrandTotal() | number }}</strong></div>
              </div>

              <div class="modal-buttons">
                <button class="btn btn-primary" (click)="saveProcurement()" [disabled]="isSavingProcurement()">
                  {{ isSavingProcurement() ? 'Saving...' : 'Save Bill & Generate Assets' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- 4. BILLS -->
        @if (activeTab() === 'bills') {
          <div class="tab-content fade-in">
            <div class="action-header">
              <h1 class="display-header page-heading">Bills</h1>
              <button class="btn btn-primary" (click)="setTab('procurement')">New Procurement</button>
            </div>

            <div class="dashboard-grid bill-dashboard-grid">
              <div class="glass-panel kpi-card">
                <div class="kpi-data"><span class="kpi-label">Total Bills</span><span class="kpi-value">{{ bills().length }}</span></div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-data"><span class="kpi-label">Purchase Value</span><span class="kpi-value">₹{{ totalBillValue() | number }}</span></div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-data"><span class="kpi-label">Pending Payments</span><span class="kpi-value text-orange">{{ pendingBillPayments() }}</span></div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-data"><span class="kpi-label">GST Paid</span><span class="kpi-value">₹{{ totalBillGst() | number }}</span></div>
              </div>
            </div>

            <div class="glass-panel filter-bar report-filter-grid">
              <div class="filter-group">
                <label class="form-label">Search Bills</label>
                <input class="form-input" [ngModel]="billSearchQuery()" (ngModelChange)="billSearchQuery.set($event)" placeholder="Invoice, bill, vendor, school" />
              </div>
              <div class="filter-group">
                <label class="form-label">Report Period</label>
                <select class="form-input" [ngModel]="billReportMode()" (ngModelChange)="billReportMode.set($event)">
                  <option value="all">All Bills</option>
                  <option value="monthly">Monthly Bills</option>
                  <option value="annual">Annual Bills</option>
                  <option value="financialYear">Financial Year</option>
                  <option value="range">Custom Date Range</option>
                </select>
              </div>
              @if (billReportMode() === 'monthly') {
                <div class="filter-group">
                  <label class="form-label">Month</label>
                  <input type="month" class="form-input" [ngModel]="billReportMonth()" (ngModelChange)="billReportMonth.set($event)" />
                </div>
              }
              @if (billReportMode() === 'annual' || billReportMode() === 'financialYear') {
                <div class="filter-group">
                  <label class="form-label">Year</label>
                  <input type="number" class="form-input" [ngModel]="billReportYear()" (ngModelChange)="billReportYear.set(+$event)" />
                </div>
              }
              @if (billReportMode() === 'range') {
                <div class="filter-group">
                  <label class="form-label">From</label>
                  <input type="date" class="form-input" [ngModel]="billReportFrom()" (ngModelChange)="billReportFrom.set($event)" />
                </div>
                <div class="filter-group">
                  <label class="form-label">To</label>
                  <input type="date" class="form-input" [ngModel]="billReportTo()" (ngModelChange)="billReportTo.set($event)" />
                </div>
              }
              <div class="filter-group">
                <label class="form-label">Vendor</label>
                <select class="form-input" [ngModel]="billVendorFilter()" (ngModelChange)="billVendorFilter.set($event)">
                  <option value="All">All Vendors</option>
                  @for (vendor of billVendorList(); track vendor) {
                    <option [value]="vendor">{{ vendor }}</option>
                  }
                </select>
              </div>
              <div class="filter-group">
                <label class="form-label">School</label>
                <select class="form-input" [ngModel]="billSchoolFilter()" (ngModelChange)="billSchoolFilter.set($event)">
                  <option value="All">All Schools</option>
                  @for (school of billSchoolList(); track school) {
                    <option [value]="school">{{ school }}</option>
                  }
                </select>
              </div>
              <div class="filter-group">
                <label class="form-label">Department</label>
                <select class="form-input" [ngModel]="billDepartmentFilter()" (ngModelChange)="billDepartmentFilter.set($event)">
                  <option value="All">All Departments</option>
                  @for (dept of billDepartmentList(); track dept) {
                    <option [value]="dept">{{ dept }}</option>
                  }
                </select>
              </div>
              <div class="filter-group">
                <label class="form-label">Payment</label>
                <select class="form-input" [ngModel]="billPaymentFilter()" (ngModelChange)="billPaymentFilter.set($event)">
                  <option value="All">All Payments</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div class="export-actions">
                <button class="btn btn-secondary" (click)="printBills()">Print / PDF</button>
                <button class="btn btn-secondary" (click)="downloadBillsCsv()">CSV</button>
                <button class="btn btn-secondary" (click)="downloadBillsExcel()">Excel</button>
              </div>
            </div>

            <div class="glass-panel">
              <div class="table-container">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th>Bill</th>
                      <th>Invoice</th>
                      <th>Vendor</th>
                      <th>School</th>
                      <th>Department</th>
                      <th>Billing Date</th>
                      <th>Grand Total</th>
                      <th>Payment</th>
                      <th>Assets</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (bill of filteredBills(); track bill.id) {
                      <tr (click)="selectBill(bill)" style="cursor: pointer;">
                        <td><code>{{ bill.billNumber }}</code></td>
                        <td>{{ bill.invoiceNumber }}</td>
                        <td>{{ bill.vendorName }}</td>
                        <td>{{ bill.schoolName }}</td>
                        <td>{{ bill.departmentName || '-' }}</td>
                        <td>{{ bill.billingDate }}</td>
                        <td>₹{{ bill.grandTotal | number }}</td>
                        <td><span class="badge" [class.badge-green]="bill.paymentStatus === 'Paid'" [class.badge-orange]="bill.paymentStatus !== 'Paid'">{{ bill.paymentStatus }}</span></td>
                        <td>{{ bill.associatedAssetIds.length }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="9" class="text-center">No bills found.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            @if (selectedBill(); as bill) {
              <div class="glass-panel breakdown-panel">
                <div class="section-heading-row">
                  <h2 class="display-header section-title">Bill Details: {{ bill.invoiceNumber }}</h2>
                  <button class="btn btn-secondary btn-sm" (click)="selectedBill.set(null)">Close</button>
                </div>
                <div class="detail-grid bill-detail-grid">
                  <div class="detail-label">Bill Number</div><div class="detail-value"><code>{{ bill.billNumber }}</code></div>
                  <div class="detail-label">PO Number</div><div class="detail-value"><code>{{ bill.purchaseOrderNumber }}</code></div>
                  <div class="detail-label">Subtotal</div><div class="detail-value">₹{{ bill.subtotal | number }}</div>
                  <div class="detail-label">GST</div><div class="detail-value">₹{{ bill.gstAmount | number }}</div>
                  <div class="detail-label">Charges</div><div class="detail-value">₹{{ bill.transportCharges + bill.packingCharges + bill.insuranceCharges + bill.otherCharges | number }}</div>
                  <div class="detail-label">Grand Total</div><div class="detail-value"><strong>₹{{ bill.grandTotal | number }}</strong></div>
                </div>
                <div class="detail-grid bill-detail-grid bill-extra-grid">
                  <div class="detail-label">Invoice Number</div><div class="detail-value">{{ bill.invoiceNumber }}</div>
                  <div class="detail-label">Vendor</div><div class="detail-value">{{ bill.vendorName }}</div>
                  <div class="detail-label">Purchase Date</div><div class="detail-value">{{ bill.purchaseDate }}</div>
                  <div class="detail-label">Billing Date</div><div class="detail-value">{{ bill.billingDate }}</div>
                  <div class="detail-label">Transport</div><div class="detail-value">Rs. {{ bill.transportCharges | number }}</div>
                  <div class="detail-label">Packing</div><div class="detail-value">Rs. {{ bill.packingCharges | number }}</div>
                  <div class="detail-label">Insurance</div><div class="detail-value">Rs. {{ bill.insuranceCharges | number }}</div>
                  <div class="detail-label">Other Charges</div><div class="detail-value">Rs. {{ bill.otherCharges | number }}</div>
                  <div class="detail-label">Discount</div><div class="detail-value">Rs. {{ bill.discount | number }}</div>
                  <div class="detail-label">Payment</div>
                  <div class="detail-value">
                    <select class="form-input compact-select" [ngModel]="bill.paymentStatus" (ngModelChange)="updateBillPayment(bill, $event, bill.paymentMethod)">
                      <option value="Pending">Pending</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Paid">Paid</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div class="detail-label">Payment Method</div>
                  <div class="detail-value">
                    <input class="form-input compact-select" [ngModel]="bill.paymentMethod" (change)="updateBillPayment(bill, bill.paymentStatus, $any($event.target).value)" placeholder="Cash / UPI / NEFT" />
                  </div>
                </div>
                <div class="attachment-row">
                  <label class="btn btn-secondary btn-sm">
                    Upload Invoice
                    <input type="file" hidden accept=".pdf,image/*" (change)="uploadInvoiceFile(bill, $event)" />
                  </label>
                  <span class="user-email-text">{{ bill.invoiceAttachmentIds.length }} attachment(s)</span>
                </div>
                <h3 class="form-label associated-title">Bill Item Calculations</h3>
                <div class="table-container">
                  <table class="glass-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Item Total</th>
                        <th>GST %</th>
                        <th>GST Amount</th>
                        <th>Generated Assets</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of selectedBillItems(); track item.id) {
                        <tr>
                          <td>{{ item.productName }}<div class="user-email-text">{{ item.brand }} {{ item.model }}</div></td>
                          <td>{{ item.quantity }}</td>
                          <td>Rs. {{ item.unitPrice | number }}</td>
                          <td>Rs. {{ item.itemTotal | number }}</td>
                          <td>{{ item.gstPercent }}%</td>
                          <td>Rs. {{ item.gstAmount | number }}</td>
                          <td>{{ item.generatedAssetIds.length }}</td>
                        </tr>
                      } @empty {
                        <tr><td colspan="7" class="text-center">No bill item rows found.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
                <h3 class="form-label associated-title">Associated Assets</h3>
                <div class="asset-chip-list">
                  @for (assetId of bill.associatedAssetIds; track assetId) {
                    <button class="asset-chip" (click)="openAssetFromBill(assetId)">{{ assetId }}</button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- PRODUCT MASTER -->
        @if (activeTab() === 'products') {
          <div class="tab-content fade-in">
            <div class="action-header">
              <h1 class="display-header page-heading">Product Master</h1>
              <button class="btn btn-primary" (click)="startNewProduct()">Add Product</button>
            </div>

            <div class="glass-panel filter-bar">
              <div class="filter-group">
                <label class="form-label">Search Products</label>
                <input class="form-input" [ngModel]="productSearchQuery()" (ngModelChange)="productSearchQuery.set($event)" placeholder="Barcode, name, category, brand" />
              </div>
            </div>

            @if (editingProduct(); as product) {
              <div class="glass-panel procurement-panel">
                <div class="section-heading-row">
                  <h2 class="display-header section-title">{{ product.id ? 'Edit Product' : 'New Product' }}</h2>
                  <button class="btn btn-secondary btn-sm" (click)="editingProduct.set(null)">Close</button>
                </div>
                <div class="form-row-grid">
                  <div class="form-group">
                    <label class="form-label">Barcode</label>
                    <input class="form-input" [(ngModel)]="product.barcode" name="productBarcode" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Product Name</label>
                    <input class="form-input" [(ngModel)]="product.name" name="productName" required />
                  </div>
                </div>
                <div class="form-row-grid">
                  <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" [(ngModel)]="product.category" name="productCategory">
                      @for (cat of categoryList(); track cat) {
                        <option [value]="cat">{{ cat }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Brand</label>
                    <input class="form-input" [(ngModel)]="product.brand" name="productBrand" />
                  </div>
                </div>
                <div class="form-row-grid">
                  <div class="form-group">
                    <label class="form-label">Model</label>
                    <input class="form-input" [(ngModel)]="product.model" name="productModel" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Manufacturer</label>
                    <input class="form-input" [(ngModel)]="product.manufacturer" name="productManufacturer" />
                  </div>
                </div>
                <div class="form-row-grid">
                  <div class="form-group">
                    <label class="form-label">Suggested Warranty</label>
                    <input class="form-input" [(ngModel)]="product.suggestedWarranty" name="productWarranty" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Image URL</label>
                    <input class="form-input" [(ngModel)]="product.imageUrl" name="productImageUrl" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Specifications</label>
                  <textarea class="form-input text-area-input" [(ngModel)]="product.specifications" name="productSpecifications" rows="3"></textarea>
                </div>
                <div class="modal-buttons">
                  <button class="btn btn-primary" (click)="saveProductMaster(product)">Save Product</button>
                </div>
              </div>
            }

            <div class="glass-panel">
              <div class="table-container">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th>Barcode</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Warranty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (product of filteredProducts(); track product.id) {
                      <tr>
                        <td><code>{{ product.barcode || '-' }}</code></td>
                        <td>{{ product.name }}</td>
                        <td>{{ product.category }}</td>
                        <td>{{ product.brand || '-' }}</td>
                        <td>{{ product.model || '-' }}</td>
                        <td>{{ product.suggestedWarranty || '-' }}</td>
                        <td><button class="btn btn-secondary btn-sm" (click)="editProductMaster(product)">Edit</button></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="7" class="text-center">No products found.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- 5. PENDING APPROVALS -->
        @if (activeTab() === 'approvals') {
          <div class="tab-content fade-in">
            <h1 class="display-header page-heading">Pending Stock Approvals</h1>

            <div class="glass-panel">
              <div class="table-container">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Submitted By</th>
                      <th>Institution</th>
                      <th>Asset</th>
                      <th>Request Type</th>
                      <th>Value Change</th>
                      <th>Admin Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (req of verificationRequests(); track req.id) {
                      <tr>
                        <td>{{ req.timestamp }}</td>
                        <td>
                          <strong>{{ req.schoolAdminName }}</strong>
                          <div class="user-email-text">{{ req.schoolAdminEmail }}</div>
                        </td>
                        <td>{{ req.institution }}</td>
                        <td>
                          <strong>{{ req.assetName }}</strong>
                          <div class="asset-id-text"><code>{{ req.assetId }}</code></div>
                        </td>
                        <td>
                          <span class="badge"
                            [class.badge-purple]="req.changeType === 'Quantity Update'"
                            [class.badge-red]="req.changeType.startsWith('Mark Condemned')"
                            [class.badge-orange]="req.changeType.startsWith('Mark Missing') || req.changeType.startsWith('Mark Damaged')"
                            [class.badge-cyan]="req.changeType === 'Add Asset'"
                            [class.badge-green]="req.changeType.startsWith('Mark Active')"
                            [class.badge-blue]="req.changeType.startsWith('Mark Under Service') || req.changeType.startsWith('Mark Transferred') || req.changeType.startsWith('Mark Idle')"
                          >
                            {{ req.changeType }}
                          </span>
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
                            [class.badge-orange]="req.status === 'Pending' || req.status === 'Pending Department'"
                            [class.badge-purple]="req.status === 'Pending Super Admin'"
                            [class.badge-green]="req.status === 'Approved'"
                            [class.badge-red]="req.status === 'Rejected'"
                            [class.badge-gray]="req.status === 'Draft'"
                          >
                            {{ req.status }}
                          </span>
                        </td>
                        <td>
                          <div class="action-buttons" style="display: flex; gap: 8px; align-items: center;">
                            @if (req.status === 'Pending' || req.status === 'Pending Department' || req.status === 'Pending Super Admin') {
                              <button class="btn btn-primary btn-sm" (click)="openReviewModal(req, true)">
                                {{ req.status === 'Pending Department' ? 'Forward' : 'Approve' }}
                              </button>
                              <button class="btn btn-danger btn-sm" (click)="openReviewModal(req, false)">Reject</button>
                            }
                            <button class="btn btn-secondary btn-sm" (click)="openHistoryModal(req)">History 📋</button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="9" class="text-center">No pending approvals found. All clean!</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- 4. SYSTEM AUDIT LOGS -->
        @if (activeTab() === 'logs') {
          <div class="tab-content fade-in">
            <h1 class="display-header page-heading">System Audit Trail</h1>

            <div class="glass-panel">
              <div class="table-container">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action performed</th>
                      <th>Details</th>
                      <th>Reason / Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (log of auditLogs(); track log.id) {
                      <tr>
                        <td>{{ log.date }}</td>
                        <td>
                          <strong>{{ log.userName }}</strong>
                          <div class="user-email-text">{{ log.userEmail }}</div>
                        </td>
                        <td><strong>{{ log.action }}</strong></td>
                        <td><code>{{ log.details }}</code></td>
                        <td>{{ log.reason || '-' }}</td>
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
              [isSuperAdmin]="true"
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
              [isSuperAdmin]="true"
              (saveRecord)="onSaveWarrantyRecord($event)"
              (deleteRecord)="onDeleteWarrantyRecord($event)"
            ></app-warranty-management>
          </div>
        }

        <!-- EXECUTIVE REPORTS CENTER -->
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

    <!-- MODAL: ADD / EDIT ASSET -->
    <app-asset-form
      [active]="showAssetModal()"
      [title]="isEditingAsset() ? 'Edit Asset' : 'Add New Asset'"
      [isEditMode]="isEditingAsset()"
      [asset]="editingAsset"
      [categoryList]="categoryList()"
      [statusList]="statusList()"
      [locations]="locations()"
      [containerAssets]="containerAssets()"
      [vendorList]="vendorList()"
      (save)="onSaveAsset($event)"
      (cancel)="closeAssetModal()"
    ></app-asset-form>

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

    <!-- MODAL: APPROVAL COMMENTS -->
    @if (showReviewModal()) {
      <div class="modal-backdrop">
        <div class="glass-panel modal-card review-modal">
          <h2 class="display-header modal-title">{{ isApproving() ? 'Approve' : 'Reject' }} Request</h2>
          <p class="review-meta">Asset: {{ selectedRequest()?.assetName }} ({{ selectedRequest()?.assetId }})</p>
          
          <div class="form-group">
            <label class="form-label">Comments / Remarks</label>
            <textarea class="form-input text-area-input" [(ngModel)]="reviewComments" rows="3" placeholder="Enter comments here..."></textarea>
          </div>

          <div class="modal-buttons">
            <button class="btn btn-secondary" (click)="closeReviewModal()">Cancel</button>
            <button class="btn" [class.btn-primary]="isApproving()" [class.btn-danger]="!isApproving()" (click)="submitReview()">
              Confirm {{ isApproving() ? 'Approval' : 'Rejection' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL: REQUEST HISTORY TIMELINE -->
    @if (showHistoryModal()) {
      <div class="modal-backdrop" (click)="closeHistoryModal()">
        <div class="glass-panel modal-card history-modal" (click)="$event.stopPropagation()">
          <h2 class="display-header modal-title">Verification Request History</h2>
          
          <div class="request-summary-card">
            <div class="summary-item">
              <span class="label">Asset:</span>
              <span class="value"><strong>{{ selectedHistoryRequest()?.assetName }}</strong> (<code>{{ selectedHistoryRequest()?.assetId }}</code>)</span>
            </div>
            <div class="summary-item">
              <span class="label">Action Type:</span>
              <span class="value">{{ selectedHistoryRequest()?.changeType }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Diff:</span>
              <span class="value"><code>{{ selectedHistoryRequest()?.previousValue }}</code> ➔ <code>{{ selectedHistoryRequest()?.newValue }}</code></span>
            </div>
            @if (selectedHistoryRequest()?.rejectionReason) {
              <div class="summary-item rejection-alert">
                <span class="label">Rejection Reason:</span>
                <span class="value"><strong>{{ selectedHistoryRequest()?.rejectionReason }}</strong></span>
              </div>
            }
          </div>

          <div class="timeline-container">
            @for (step of parsedHistory(); track $index; let last = $last) {
              <div class="timeline-step">
                <div class="timeline-marker">
                  <div class="timeline-dot" [class.dot-active]="last"></div>
                  @if (!last) {
                    <div class="timeline-line"></div>
                  }
                </div>
                <div class="timeline-content glass-panel">
                  <div class="step-header">
                    <span class="badge"
                      [class.badge-orange]="step.status === 'Pending' || step.status === 'Pending Department'"
                      [class.badge-purple]="step.status === 'Pending Super Admin'"
                      [class.badge-green]="step.status === 'Approved'"
                      [class.badge-red]="step.status === 'Rejected'"
                      [class.badge-gray]="step.status === 'Draft'"
                    >
                      {{ step.status }}
                    </span>
                    <span class="step-time">{{ step.timestamp }}</span>
                  </div>
                  <div class="step-user">
                    <strong>{{ step.updaterName }}</strong> ({{ step.updatedBy }})
                  </div>
                  @if (step.comments) {
                    <p class="step-comment">Remarks: "{{ step.comments }}"</p>
                  }
                </div>
              </div>
            } @empty {
              <div class="text-center p-4">No transition history logged.</div>
            }
          </div>

          <div class="modal-buttons">
            <button class="btn btn-secondary" (click)="closeHistoryModal()">Close</button>
          </div>
        </div>
      </div>
    }

    <!-- Side Details Drawer -->
    <app-asset-drawer
      [asset]="selectedDetailAsset()"
      [isOpen]="showDetailDrawer()"
      [transfers]="assetTransfers()"
      [showAdminActions]="true"
      (close)="closeDetailDrawer()"
      (printQR)="printAssetQR($event)"
      (downloadJson)="downloadAssetJson($event)"
      (downloadExcel)="downloadAssetExcel($event)"
      (downloadPdf)="downloadAssetPdf($event)"
      (printLabel)="printAssetLabel($event)"
      (printSheet)="printProfessionalAssetSheet($event)"
      (transfer)="openTransferModal($event)"
    ></app-asset-drawer>

    <app-qr-scanner-sim 
      [active]="showScannerModal()" 
      (close)="showScannerModal.set(false)" 
      (assetUpdated)="loadData()"
    ></app-qr-scanner-sim>

    @if (showTransferModal()) {
      <div class="modal-backdrop">
        <div class="glass-panel modal-card review-modal">
          <h2 class="display-header modal-title">Transfer Asset</h2>
          <p class="review-meta">{{ transferAssetTarget()?.name }} ({{ transferAssetTarget()?.id }})</p>
          <div class="form-group">
            <label class="form-label">New Department / Location</label>
            <select class="form-input" [(ngModel)]="transferLocationId" name="transferLocationId">
              @for (loc of locations(); track loc.id) {
                <option [value]="loc.id">{{ loc.institution }} - {{ loc.department }} - {{ loc.building }} / {{ loc.room }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Transfer Reason</label>
            <textarea class="form-input text-area-input" [(ngModel)]="transferReason" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Approved By</label>
            <input class="form-input" [(ngModel)]="transferApprovedBy" placeholder="Approver name or email" />
          </div>
          <div class="modal-buttons">
            <button class="btn btn-secondary" (click)="closeTransferModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitAssetTransfer()">Save Transfer</button>
          </div>
        </div>
      </div>
    }

    @if (cameraScannerActive()) {
      <div class="modal-backdrop">
        <div class="glass-panel modal-card qr-modal">
          <h2 class="display-header modal-title">Camera Barcode Scanner</h2>
          <video id="barcode-camera-preview" class="camera-preview" autoplay muted playsinline></video>
          <p class="review-meta">{{ cameraScannerMessage() }}</p>
          <button class="btn btn-secondary" (click)="stopCameraScanner()">Stop Scanner</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      min-height: 100vh;
      background: var(--bg-primary);
    }

    /* Sidebar Styling */
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
      font-size: 1.4rem;
      background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sidebar-nav {
      margin-top: 30px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-grow: 1;
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
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
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

    /* Main Area Styling */
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
      background: linear-gradient(135deg, #fff 0%, #c084fc 100%);
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

    /* Filters Dashboard */
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

    /* Utility Text Colors */
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

    /* Container badges */
    .container-badge {
      display: inline-block;
      margin-top: 6px;
      font-size: 0.75rem;
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: #22d3ee;
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
    }
    .is-container-tag {
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #c084fc;
      margin-left: 6px;
      cursor: default;
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

    /* Requests Styling */
    .user-email-text, .asset-id-text {
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
    .processed-text {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    /* Reports Panel & Printing */
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
      color: var(--accent-purple);
      margin-bottom: 6px;
    }
    .report-print-header p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* Modals CSS */
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
      background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
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

    /* Side Details Drawer Styles */
    .drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: 999;
    }
    .side-drawer {
      position: fixed;
      top: 0;
      right: -450px;
      width: 420px;
      height: 100vh;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      border-left: 1px solid var(--glass-border);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
      transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .side-drawer.open {
      right: 0;
    }
    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--glass-border);
    }
    .drawer-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #fff 0%, var(--accent-purple) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 4px;
      transition: color 0.2s;
    }
    .btn-close:hover {
      color: #fff;
    }
    .drawer-body {
      flex-grow: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .qr-print-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      border: 1px solid var(--glass-border);
    }
    .drawer-qr {
      width: 150px;
      height: 150px;
      background: #fff;
      padding: 8px;
      border-radius: 8px;
    }
    .detail-section {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 16px;
    }
    .detail-section:last-child {
      border-bottom: none;
    }
    .detail-section h3 {
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent-purple);
      margin-bottom: 12px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 8px 16px;
      font-size: 0.9rem;
    }
    .detail-label {
      color: var(--text-secondary);
    }
    .detail-value {
      color: var(--text-primary);
      word-break: break-all;
    }
    .remarks-text {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      background: rgba(255, 255, 255, 0.02);
      padding: 10px;
      border-radius: 6px;
      border: 1px solid var(--glass-border);
    }
    .workflow-strip {
      display: grid;
      grid-template-columns: repeat(6, minmax(120px, 1fr));
      gap: 8px;
      margin-bottom: 24px;
      padding: 14px;
    }
    .workflow-strip span {
      text-align: center;
      font-size: 0.78rem;
      color: var(--text-secondary);
      padding: 8px;
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.03);
    }
    .procurement-panel {
      padding: 24px;
    }
    .charges-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(100px, 1fr));
      gap: 12px;
      margin: 18px 0 24px;
    }
    .section-heading-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin: 12px 0 16px;
    }
    .procurement-table th,
    .procurement-table td {
      vertical-align: top;
    }
    .table-input {
      min-width: 110px;
      margin-bottom: 6px;
    }
    .subtle-input {
      font-size: 0.8rem;
      opacity: 0.9;
    }
    .input-small {
      min-width: 74px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(130px, 1fr));
      gap: 12px;
      margin-top: 24px;
    }
    .summary-cell {
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .summary-cell span {
      color: var(--text-secondary);
      font-size: 0.8rem;
    }
    .summary-cell strong {
      color: var(--text-primary);
      font-size: 1.05rem;
    }
    .summary-cell.grand {
      border-color: rgba(139, 92, 246, 0.45);
      background: rgba(139, 92, 246, 0.12);
    }
    .bill-dashboard-grid {
      margin-bottom: 24px;
    }
    .bill-detail-grid {
      grid-template-columns: 160px 1fr 160px 1fr;
      margin-bottom: 18px;
    }
    .associated-title {
      margin-top: 12px;
      margin-bottom: 10px;
    }
    .asset-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .asset-chip {
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: #22d3ee;
      background: rgba(6, 182, 212, 0.12);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      font-family: monospace;
      font-size: 0.82rem;
    }
    .report-filter-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(170px, 1fr));
      align-items: end;
    }
    .export-actions {
      display: flex;
      gap: 8px;
      align-items: end;
      flex-wrap: wrap;
    }
    .compact-select {
      min-height: 34px;
      padding: 6px 8px;
    }
    .attachment-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 0 18px;
    }
    .bill-extra-grid {
      margin-top: 8px;
    }
    .asset-export-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.02);
    }
    .camera-preview {
      width: 100%;
      max-height: 280px;
      background: #020617;
      border-radius: 8px;
      border: 1px solid var(--glass-border);
      object-fit: cover;
      margin-bottom: 14px;
    }
    @media (max-width: 1100px) {
      .workflow-strip,
      .charges-grid,
      .summary-grid,
      .report-filter-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .bill-detail-grid {
        grid-template-columns: 130px 1fr;
      }
    }

    @keyframes modalSlide {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* History Modal & Timeline Styling */
    .history-modal {
      max-width: 650px !important;
      animation: modalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .request-summary-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }
    .summary-item .label {
      color: var(--text-secondary);
    }
    .summary-item .value {
      color: var(--text-primary);
    }
    .rejection-alert {
      background: rgba(239, 68, 68, 0.1);
      border: 1px dashed rgba(239, 68, 68, 0.4);
      padding: 10px;
      border-radius: 8px;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .rejection-alert .label {
      color: #f87171;
    }
    .timeline-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 350px;
      overflow-y: auto;
      padding-right: 8px;
      margin-bottom: 24px;
    }
    .timeline-step {
      display: flex;
      gap: 16px;
    }
    .timeline-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 16px;
    }
    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--text-secondary);
      border: 2px solid var(--bg-primary);
      z-index: 2;
    }
    .timeline-dot.dot-active {
      background: var(--primary-color, #8b5cf6);
      box-shadow: 0 0 8px var(--primary-color, #8b5cf6);
    }
    .timeline-line {
      width: 2px;
      flex-grow: 1;
      background: var(--glass-border);
      margin-top: 4px;
      margin-bottom: -16px;
    }
    .timeline-content {
      flex-grow: 1;
      padding: 12px 16px !important;
      border-radius: 8px !important;
      background: rgba(255, 255, 255, 0.02) !important;
    }
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .step-time {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .step-user {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
    .step-comment {
      font-size: 0.9rem;
      color: var(--text-primary);
      margin: 4px 0 0 0;
      background: rgba(0,0,0,0.2);
      padding: 6px 10px;
      border-radius: 4px;
      border-left: 3px solid var(--primary-color, #8b5cf6);
    }

    /* Badge Extensions */
    .badge-purple {
      background: rgba(139, 92, 246, 0.15) !important;
      color: #a78bfa !important;
      border: 1px solid rgba(139, 92, 246, 0.3) !important;
    }
    .badge-orange {
      background: rgba(249, 115, 22, 0.15) !important;
      color: #fb923c !important;
      border: 1px solid rgba(249, 115, 22, 0.3) !important;
    }
    .badge-green {
      background: rgba(16, 185, 129, 0.15) !important;
      color: #34d399 !important;
      border: 1px solid rgba(16, 185, 129, 0.3) !important;
    }
    .badge-red {
      background: rgba(239, 68, 68, 0.15) !important;
      color: #f87171 !important;
      border: 1px solid rgba(239, 68, 68, 0.3) !important;
    }
    .badge-gray {
      background: rgba(156, 163, 175, 0.15) !important;
      color: #d1d5db !important;
      border: 1px solid rgba(156, 163, 175, 0.3) !important;
    }
    .badge-cyan {
      background: rgba(6, 182, 212, 0.15) !important;
      color: #22d3ee !important;
      border: 1px solid rgba(6, 182, 212, 0.3) !important;
    }
    .badge-blue {
      background: rgba(59, 130, 246, 0.15) !important;
      color: #60a5fa !important;
      border: 1px solid rgba(59, 130, 246, 0.3) !important;
    }

  `]
})
export class SuperAdminComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  public notificationService = inject(NotificationService);
  public exportService = inject(ExportService);
  public depreciationService = inject(DepreciationService);

  // Pagination Signals
  assetPage = signal<number>(1);
  assetPageSize = signal<number>(10);
  paginatedAssets = computed(() => {
    const page = this.assetPage();
    const size = this.assetPageSize();
    return this.sortedAssets().slice((page - 1) * size, page * size);
  });

  // Navigation State
  activeTab = signal<string>('overview');
  userName = signal<string>('Dr. Suresh Kumar');
  userEmail = signal<string>('super@kare.edu');
  realtimeSubscription: (() => void) | null = null;
  
  // Data Signals
  assets = signal<Asset[]>([]);
  locations = signal<Location[]>([]);
  requests = signal<VerificationRequest[]>([]);
  verificationRequests = computed(() => {
    return [...this.requests()].sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  });
  auditLogs = signal<AuditLog[]>([]);
  maintenanceRecords = signal<MaintenanceRecord[]>([]);
  warrantyRecords = signal<WarrantyRecord[]>([]);
  schools = signal<School[]>([]);
  masterCategories = signal<MasterOption[]>([]);
  masterStatuses = signal<MasterOption[]>([]);
  vendors = signal<Vendor[]>([]);
  bills = signal<ProcurementBill[]>([]);
  selectedBillItems = signal<ProcurementBillItem[]>([]);
  products = signal<ProductMaster[]>([]);
  assetTransfers = signal<AssetTransfer[]>([]);
  isMockActive = signal<boolean>(true);

  // Sorting State
  sortColumn = signal<string>('id');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // View Details Drawer State
  selectedDetailAsset = signal<Asset | null>(null);
  showDetailDrawer = signal<boolean>(false);

  // Filters State
  filterInstitution = signal<string>('All');
  filterCategory = signal<string>('All');
  filterStatus = signal<string>('All');
  searchQuery = signal<string>('');
  filterPO = signal<string>('');
  filterBillNumber = signal<string>('');
  billSearchQuery = signal<string>('');
  billReportMode = signal<string>('all');
  billReportMonth = signal<string>(new Date().toISOString().substring(0, 7));
  billReportYear = signal<number>(new Date().getFullYear());
  billReportFrom = signal<string>('');
  billReportTo = signal<string>('');
  billVendorFilter = signal<string>('All');
  billSchoolFilter = signal<string>('All');
  billDepartmentFilter = signal<string>('All');
  billPaymentFilter = signal<string>('All');
  selectedBill = signal<ProcurementBill | null>(null);
  isSavingProcurement = signal<boolean>(false);
  productSearchQuery = signal<string>('');
  editingProduct = signal<ProductMaster | null>(null);
  showTransferModal = signal<boolean>(false);
  transferAssetTarget = signal<Asset | null>(null);
  transferLocationId = '';
  transferReason = '';
  transferApprovedBy = '';
  cameraScannerActive = signal<boolean>(false);
  cameraScannerMessage = signal<string>('');
  activeBarcodeItemIndex = signal<number | null>(null);

  procurement: {
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
  } = this.createEmptyProcurement();

  institutionList = computed(() => this.schools().map(s => s.name));
  statusList = computed(() => Array.from(new Set([
    ...this.masterStatuses().map(s => s.name),
    ...this.assets().map(a => a.status)
  ])));
  vendorList = computed(() => Array.from(new Set([
    ...this.vendors().map(v => v.name),
    ...this.assets().map(a => a.vendor).filter(Boolean)
  ])));

  // Modals & Temp States
  showScannerModal = signal<boolean>(false);
  showAssetModal = signal<boolean>(false);
  isEditingAsset = signal<boolean>(false);
  editingAsset!: Asset;
  
  showQR = signal<boolean>(false);
  qrModalData = signal<string>('');
  qrModalTitle = signal<string>('');

  showReviewModal = signal<boolean>(false);
  selectedRequest = signal<VerificationRequest | null>(null);
  isApproving = signal<boolean>(true);
  reviewComments = '';

  showHistoryModal = signal<boolean>(false);
  selectedHistoryRequest = signal<VerificationRequest | null>(null);
  parsedHistory = computed(() => {
    const r = this.selectedHistoryRequest();
    if (!r || !r.approverHistory) return [];
    try {
      return JSON.parse(r.approverHistory);
    } catch (e) {
      return [];
    }
  });

  // Reporting Filters
  reportType = 'summary';
  reportTitle = computed(() => {
    switch (this.reportType) {
      case 'summary': return 'Institution-wise Inventory Summary Report';
      case 'damaged': return 'Service & Condemned Assets Integrity Audit';
      case 'missing': return 'Missing Assets Investigation Report';
      default: return 'Full Inventory Audit Details Report';
    }
  });

  currentDateTime = () => new Date().toLocaleString();

  constructor(
    private appwriteService: AppwriteService,
    private router: Router
  ) {
    // Prevent body scroll when any modal or drawer is open
    effect(() => {
      const isModalOpen = this.showAssetModal() || this.showQR() || this.showReviewModal() || this.showDetailDrawer() || this.showTransferModal() || this.showHistoryModal();
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
    }
    
    await this.loadData();

    const channels = this.appwriteService.getRealtimeChannels(user, this.schools());
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

    const baseColls = ['assets', 'consumables', 'furniture', 'requests', 'audit_logs', 'locations', 'bills', 'bill_items', 'asset_transfers', 'products'];
    let collectionBaseName = '';
    for (const base of baseColls) {
      if (collectionId.endsWith(`_${base}`)) {
        collectionBaseName = base;
        break;
      }
    }
    
    if (!collectionBaseName) return;
    
    switch (collectionBaseName) {
      case 'assets':
      case 'furniture':
      case 'consumables': {
        const mapped = this.appwriteService.mapAssetDocument(docPayload, this.locations());
        this.updateLocalList(this.assets, mapped, eventType);
        break;
      }
      case 'requests': {
        const mapped = this.appwriteService.mapRequestDocument(docPayload);
        this.updateLocalList(this.requests, mapped, eventType);
        break;
      }
      case 'audit_logs': {
        const mapped = this.appwriteService.mapAuditLogDocument(docPayload);
        this.updateLocalList(this.auditLogs, mapped, eventType);
        break;
      }
      case 'locations': {
        const mapped: Location = {
          id: docPayload.id || docPayload.$id,
          institution: docPayload.institution,
          department: docPayload.department,
          building: docPayload.building,
          room: docPayload.room,
          floor: docPayload.floor || ''
        };
        this.updateLocalList(this.locations, mapped, eventType);
        break;
      }
      case 'bills': {
        const mapped: ProcurementBill = {
          id: docPayload.id || docPayload.$id,
          billNumber: docPayload.billNumber || '',
          schoolId: docPayload.schoolId || '',
          schoolName: docPayload.schoolName || '',
          vendorId: docPayload.vendorId || '',
          vendorName: docPayload.vendorName || '',
          purchaseOrderNumber: docPayload.purchaseOrderNumber || '',
          invoiceNumber: docPayload.invoiceNumber || '',
          purchaseDate: docPayload.purchaseDate || '',
          billingDate: docPayload.billingDate || '',
          departmentId: docPayload.departmentId || '',
          departmentName: docPayload.departmentName || '',
          gstPercent: docPayload.gstPercent || 0,
          subtotal: docPayload.subtotal || 0,
          gstAmount: docPayload.gstAmount || 0,
          transportCharges: docPayload.transportCharges || 0,
          packingCharges: docPayload.packingCharges || 0,
          insuranceCharges: docPayload.insuranceCharges || 0,
          otherCharges: docPayload.otherCharges || 0,
          discount: docPayload.discount || 0,
          grandTotal: docPayload.grandTotal || 0,
          paymentStatus: docPayload.paymentStatus || 'Pending',
          paymentMethod: docPayload.paymentMethod || '',
          invoiceAttachmentIds: docPayload.invoiceAttachmentIds || [],
          remarks: docPayload.remarks || '',
          createdBy: docPayload.createdBy || '',
          approvedBy: docPayload.approvedBy || '',
          approvalDate: docPayload.approvalDate || '',
          associatedAssetIds: docPayload.associatedAssetIds || [],
          createdAt: docPayload.createdAt || ''
        };
        this.updateLocalList(this.bills, mapped, eventType);
        break;
      }
      case 'products': {
        const mapped: ProductMaster = {
          id: docPayload.id || docPayload.$id,
          name: docPayload.name || '',
          category: docPayload.category || '',
          brand: docPayload.brand || '',
          model: docPayload.model || '',
          manufacturer: docPayload.manufacturer || '',
          specifications: docPayload.specifications || '',
          suggestedWarranty: docPayload.suggestedWarranty || '',
          barcode: docPayload.barcode || '',
          active: docPayload.active !== false
        };
        this.updateLocalList(this.products, mapped, eventType);
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
      const [schoolsData, categoryData, statusData, vendorData, assetsData, locationsData, requestsData, logsData, billsData, productsData, maintenanceData, warrantyData] = await Promise.all([
        this.appwriteService.getSchools(),
        this.appwriteService.getCategories(),
        this.appwriteService.getStatuses(),
        this.appwriteService.getVendors(),
        this.appwriteService.getAssets(),
        this.appwriteService.getLocations(),
        this.appwriteService.getRequests(),
        this.appwriteService.getAuditLogs(),
        this.appwriteService.getBills(),
        this.appwriteService.getProducts(),
        this.appwriteService.getMaintenanceRecords(),
        this.appwriteService.getWarrantyRecords()
      ]);
      this.schools.set(schoolsData);
      this.masterCategories.set(categoryData);
      this.masterStatuses.set(statusData);
      this.vendors.set(vendorData);
      this.assets.set(assetsData);
      this.locations.set(locationsData);
      this.requests.set(requestsData);
      this.auditLogs.set(logsData);
      this.bills.set(billsData);
      this.products.set(productsData);
      this.maintenanceRecords.set(maintenanceData);
      this.warrantyRecords.set(warrantyData);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
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

  // Dashboard Stats Computed States
  uniqueInstitutionsCount = () => this.institutionList().length;
  totalAssetsCount = computed(() => this.assets().reduce((acc, a) => acc + a.quantity, 0));
  totalAssetValue = computed(() => this.assets().reduce((acc, a) => acc + a.totalPrice, 0));
  idleAssetsCount = computed(() => this.assets().filter(a => a.status === 'Idle').reduce((acc, a) => acc + a.quantity, 0));
  underServiceCount = computed(() => this.assets().filter(a => a.status === 'Under Service').reduce((acc, a) => acc + a.quantity, 0));
  missingAssetsCount = computed(() => this.assets().filter(a => a.status === 'Missing').reduce((acc, a) => acc + a.quantity, 0));
  condemnedAssetsCount = computed(() => this.assets().filter(a => a.status === 'Condemned').reduce((acc, a) => acc + a.quantity, 0));
  damagedAssetsCount = computed(() => this.assets().filter(a => a.status === 'Damaged').reduce((acc, a) => acc + a.quantity, 0));
  pendingRequestsCount = computed(() => this.requests().filter(r => r.status === 'Pending').length);

  institutionSummaries = computed(() => {
    return this.institutionList().map(instName => {
      const instAssets = this.assets().filter(a => a.locationText?.startsWith(instName));
      return {
        name: instName,
        count: instAssets.reduce((acc, a) => acc + a.quantity, 0),
        value: instAssets.reduce((acc, a) => acc + a.totalPrice, 0),
        underService: instAssets.filter(a => a.status === 'Under Service').reduce((acc, a) => acc + a.quantity, 0),
        damaged: instAssets.filter(a => a.status === 'Damaged').reduce((acc, a) => acc + a.quantity, 0),
        missing: instAssets.filter(a => a.status === 'Missing').reduce((acc, a) => acc + a.quantity, 0),
        condemned: instAssets.filter(a => a.status === 'Condemned').reduce((acc, a) => acc + a.quantity, 0)
      };
    });
  });

  categoryList = computed(() => {
    const cats = [...this.masterCategories().map(c => c.name), ...this.assets().map(a => a.category)];
    return Array.from(new Set(cats));
  });

  containerAssets = computed(() => this.assets().filter(a => a.isContainer));

  private createEmptyProcurement() {
    const today = new Date().toISOString().substring(0, 10);
    return {
      schoolId: '',
      schoolName: '',
      vendorId: '',
      vendorName: '',
      purchaseOrderNumber: '',
      invoiceNumber: '',
      purchaseDate: today,
      billingDate: today,
      departmentId: '',
      departmentName: '',
      gstPercent: 18,
      transportCharges: 0,
      packingCharges: 0,
      insuranceCharges: 0,
      otherCharges: 0,
      discount: 0,
      paymentStatus: 'Pending' as ProcurementBill['paymentStatus'],
      paymentMethod: '',
      remarks: '',
      items: [this.createEmptyProcurementItem()]
    };
  }

  private createEmptyProcurementItem(): ProcurementDraftItem {
    const categories = (this as any).categoryList?.() || [];
    const defaultLocationId = this.procurement ? (this.procurementLocations()[0]?.id || '') : (this.locations()[0]?.id || '');
    return {
      productName: '',
      category: categories[0] || 'Computers',
      brand: '',
      model: '',
      manufacturer: '',
      specifications: '',
      barcode: '',
      quantity: 1,
      unitPrice: 0,
      gstPercent: 18,
      warrantyDetails: '',
      locationId: defaultLocationId
    };
  }

  procurementDepartments() {
    const selectedSchool = this.schools().find(s => s.id === this.procurement.schoolId)?.name || this.procurement.schoolName;
    const seen = new Set<string>();
    return this.locations()
      .filter(loc => !selectedSchool || loc.institution === selectedSchool)
      .filter(loc => {
        const key = `${loc.institution}:${loc.department}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(loc => ({
        id: `${loc.institution}:${loc.department}`,
        name: loc.department,
        schoolName: loc.institution
      }));
  }

  procurementLocations() {
    const selectedSchool = this.schools().find(s => s.id === this.procurement.schoolId)?.name || this.procurement.schoolName;
    return this.locations().filter(loc => {
      const matchSchool = !selectedSchool || loc.institution === selectedSchool;
      const matchDepartment = !this.procurement.departmentName || loc.department === this.procurement.departmentName;
      return matchSchool && matchDepartment;
    });
  }

  syncProcurementSchool() {
    const school = this.schools().find(s => s.id === this.procurement.schoolId);
    this.procurement.schoolName = school?.name || '';
    this.procurement.departmentId = '';
    this.procurement.departmentName = '';
    this.procurement.items.forEach(item => item.locationId = this.procurementLocations()[0]?.id || '');
  }

  syncProcurementVendor() {
    const vendor = this.vendors().find(v => v.id === this.procurement.vendorId);
    this.procurement.vendorName = vendor?.name || '';
  }

  syncProcurementDepartment() {
    const dept = this.procurementDepartments().find(d => d.id === this.procurement.departmentId);
    this.procurement.departmentName = dept?.name || '';
    this.procurement.items.forEach(item => item.locationId = this.procurementLocations()[0]?.id || item.locationId);
  }

  addProcurementItem() {
    this.procurement.items.push(this.createEmptyProcurementItem());
  }

  removeProcurementItem(index: number) {
    if (this.procurement.items.length === 1) return;
    this.procurement.items.splice(index, 1);
  }

  itemLineTotal(item: ProcurementDraftItem) {
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }

  procurementSubtotal() {
    return this.procurement.items.reduce((sum, item) => sum + this.itemLineTotal(item), 0);
  }

  procurementGstAmount() {
    return this.procurement.items.reduce((sum, item) => {
      const gst = Number(item.gstPercent || this.procurement.gstPercent || 0);
      return sum + this.itemLineTotal(item) * gst / 100;
    }, 0);
  }

  procurementCharges() {
    return Number(this.procurement.transportCharges || 0)
      + Number(this.procurement.packingCharges || 0)
      + Number(this.procurement.insuranceCharges || 0)
      + Number(this.procurement.otherCharges || 0);
  }

  procurementGrandTotal() {
    return this.procurementSubtotal()
      + this.procurementGstAmount()
      + this.procurementCharges()
      - Number(this.procurement.discount || 0);
  }

  async lookupProcurementBarcode(index: number) {
    const item = this.procurement.items[index];
    if (!item?.barcode) return;
    const product = await this.appwriteService.lookupProductByBarcode(item.barcode);
    if (!product) return;
    item.productName = product.name || item.productName;
    item.category = product.category || item.category;
    item.brand = product.brand || item.brand;
    item.model = product.model || item.model;
    item.manufacturer = product.manufacturer || item.manufacturer;
    item.specifications = product.specifications || item.specifications;
    item.warrantyDetails = product.suggestedWarranty || item.warrantyDetails;
  }

  resetProcurementForm() {
    this.procurement = this.createEmptyProcurement();
  }

  async saveProcurement() {
    if (!this.procurement.schoolId || !this.procurement.vendorName || !this.procurement.purchaseOrderNumber || !this.procurement.invoiceNumber) {
      alert('School, vendor, purchase order, and invoice number are required.');
      return;
    }
    if (!this.procurement.departmentName) {
      alert('Please select the department for this purchase.');
      return;
    }
    const invalidItem = this.procurement.items.find(item => !item.productName || !item.category || !item.locationId || item.quantity < 1);
    if (invalidItem) {
      alert('Each product must have a name, category, quantity, and location.');
      return;
    }

    this.isSavingProcurement.set(true);
    try {
      await this.appwriteService.createProcurementBill({
        ...this.procurement,
        gstPercent: Number(this.procurement.gstPercent || 0),
        transportCharges: Number(this.procurement.transportCharges || 0),
        packingCharges: Number(this.procurement.packingCharges || 0),
        insuranceCharges: Number(this.procurement.insuranceCharges || 0),
        otherCharges: Number(this.procurement.otherCharges || 0),
        discount: Number(this.procurement.discount || 0),
        items: this.procurement.items.map(item => ({
          ...item,
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          gstPercent: Number(item.gstPercent || this.procurement.gstPercent || 0)
        }))
      });
      alert('Procurement saved successfully. Assets were generated and linked to the bill.');
      this.resetProcurementForm();
      this.activeTab.set('bills');
      await this.loadData();
    } catch (e: any) {
      alert(e?.message || 'Unable to save procurement. Please check Appwrite schema and try again.');
    } finally {
      this.isSavingProcurement.set(false);
    }
  }

  filteredBills = computed(() => {
    const query = this.billSearchQuery().trim().toLowerCase();
    return this.bills().filter(bill => {
      const billDate = bill.billingDate || bill.purchaseDate;
      const matchSearch = !query ||
        bill.billNumber.toLowerCase().includes(query) ||
        bill.invoiceNumber.toLowerCase().includes(query) ||
        bill.vendorName.toLowerCase().includes(query) ||
        bill.schoolName.toLowerCase().includes(query) ||
        bill.departmentName.toLowerCase().includes(query) ||
        bill.purchaseOrderNumber.toLowerCase().includes(query);
      const matchVendor = this.billVendorFilter() === 'All' || bill.vendorName === this.billVendorFilter();
      const matchSchool = this.billSchoolFilter() === 'All' || bill.schoolName === this.billSchoolFilter();
      const matchDepartment = this.billDepartmentFilter() === 'All' || bill.departmentName === this.billDepartmentFilter();
      const matchPayment = this.billPaymentFilter() === 'All' || bill.paymentStatus === this.billPaymentFilter();
      const matchDate = this.billMatchesReportPeriod(billDate);
      return matchSearch && matchVendor && matchSchool && matchDepartment && matchPayment && matchDate;
    });
  });

  billVendorList = computed(() => Array.from(new Set(this.bills().map(b => b.vendorName).filter(Boolean))).sort());
  billSchoolList = computed(() => Array.from(new Set(this.bills().map(b => b.schoolName).filter(Boolean))).sort());
  billDepartmentList = computed(() => Array.from(new Set(this.bills().map(b => b.departmentName).filter(Boolean))).sort());
  totalBillValue = computed(() => this.filteredBills().reduce((sum, bill) => sum + bill.grandTotal, 0));
  totalBillGst = computed(() => this.filteredBills().reduce((sum, bill) => sum + bill.gstAmount, 0));
  pendingBillPayments = computed(() => this.filteredBills().filter(bill => bill.paymentStatus !== 'Paid').length);

  private billMatchesReportPeriod(dateText: string): boolean {
    if (!dateText) return this.billReportMode() === 'all';
    const mode = this.billReportMode();
    if (mode === 'all') return true;
    if (mode === 'monthly') return dateText.startsWith(this.billReportMonth());
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return false;
    if (mode === 'annual') return date.getFullYear() === Number(this.billReportYear());
    if (mode === 'financialYear') {
      const start = new Date(Number(this.billReportYear()), 3, 1);
      const end = new Date(Number(this.billReportYear()) + 1, 2, 31, 23, 59, 59);
      return date >= start && date <= end;
    }
    if (mode === 'range') {
      const from = this.billReportFrom() ? new Date(this.billReportFrom()) : null;
      const to = this.billReportTo() ? new Date(this.billReportTo()) : null;
      if (to) to.setHours(23, 59, 59, 999);
      return (!from || date >= from) && (!to || date <= to);
    }
    return true;
  }

  async selectBill(bill: ProcurementBill) {
    this.selectedBill.set(bill);
    this.selectedBillItems.set(await this.appwriteService.getBillItems(bill.id));
  }

  openAssetFromBill(assetId: string) {
    const asset = this.assets().find(a => a.id === assetId);
    if (!asset) return;
    this.activeTab.set('assets');
    this.openDetailDrawer(asset);
  }

  printBills() {
    window.print();
  }

  downloadBillsCsv() {
    const headers = ['Bill Number', 'PO Number', 'Invoice Number', 'Vendor', 'School', 'Department', 'Purchase Date', 'Billing Date', 'Subtotal', 'GST', 'Transport', 'Packing', 'Insurance', 'Other', 'Discount', 'Grand Total', 'Payment Status', 'Payment Method'];
    const rows = this.filteredBills().map(bill => [
      bill.billNumber,
      bill.purchaseOrderNumber,
      bill.invoiceNumber,
      bill.vendorName,
      bill.schoolName,
      bill.departmentName,
      bill.purchaseDate,
      bill.billingDate,
      bill.subtotal,
      bill.gstAmount,
      bill.transportCharges,
      bill.packingCharges,
      bill.insuranceCharges,
      bill.otherCharges,
      bill.discount,
      bill.grandTotal,
      bill.paymentStatus,
      bill.paymentMethod
    ]);
    this.downloadTextFile(this.toCsv([headers, ...rows]), `kare-bills-${new Date().toISOString().substring(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  }

  downloadBillsExcel() {
    const rows = this.filteredBills().map(bill => ({
      billNumber: bill.billNumber,
      purchaseOrderNumber: bill.purchaseOrderNumber,
      invoiceNumber: bill.invoiceNumber,
      vendorName: bill.vendorName,
      schoolName: bill.schoolName,
      departmentName: bill.departmentName,
      purchaseDate: bill.purchaseDate,
      billingDate: bill.billingDate,
      subtotal: bill.subtotal,
      gstAmount: bill.gstAmount,
      transportCharges: bill.transportCharges,
      packingCharges: bill.packingCharges,
      insuranceCharges: bill.insuranceCharges,
      otherCharges: bill.otherCharges,
      discount: bill.discount,
      grandTotal: bill.grandTotal,
      paymentStatus: bill.paymentStatus,
      paymentMethod: bill.paymentMethod
    }));
    this.downloadHtmlExcel(rows, `kare-bills-${new Date().toISOString().substring(0, 10)}.xls`, 'Bills');
  }

  private toCsv(rows: any[][]): string {
    return rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  private downloadTextFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private downloadHtmlExcel(rows: Record<string, any>[], filename: string, title: string) {
    const keys = Object.keys(rows[0] || {});
    const table = `
      <table>
        <thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(row => `<tr>${keys.map(k => `<td>${row[k] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    `;
    this.downloadTextFile(`<html><head><meta charset="utf-8"></head><body><h1>${title}</h1>${table}</body></html>`, filename, 'application/vnd.ms-excel');
  }

  async updateBillPayment(bill: ProcurementBill, status: ProcurementBill['paymentStatus'], method: string) {
    await this.appwriteService.updateBillPayment(bill, status, method || '');
    this.bills.update(list => list.map(item => item.id === bill.id ? { ...item, paymentStatus: status, paymentMethod: method || '' } : item));
    if (this.selectedBill()?.id === bill.id) {
      this.selectedBill.set({ ...bill, paymentStatus: status, paymentMethod: method || '' });
    }
  }

  async uploadInvoiceFile(bill: ProcurementBill, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const fileId = await this.appwriteService.uploadInvoiceAttachment(bill, file);
    const updated = { ...bill, invoiceAttachmentIds: Array.from(new Set([...(bill.invoiceAttachmentIds || []), fileId])) };
    this.bills.update(list => list.map(item => item.id === bill.id ? updated : item));
    this.selectedBill.set(updated);
    input.value = '';
  }

  filteredProducts = computed(() => {
    const query = this.productSearchQuery().trim().toLowerCase();
    if (!query) return this.products();
    return this.products().filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.model.toLowerCase().includes(query) ||
      product.barcode.toLowerCase().includes(query)
    );
  });

  startNewProduct() {
    this.editingProduct.set({
      id: '',
      barcode: '',
      name: '',
      category: this.categoryList()[0] || 'Computers',
      brand: '',
      model: '',
      manufacturer: '',
      specifications: '',
      suggestedWarranty: '',
      imageUrl: '',
      active: true
    });
  }

  editProductMaster(product: ProductMaster) {
    this.editingProduct.set({ ...product });
  }

  async saveProductMaster(product: ProductMaster) {
    if (!product.name || !product.category) {
      alert('Product name and category are required.');
      return;
    }
    const saved = await this.appwriteService.saveProduct(product);
    this.products.update(list => {
      const exists = list.some(item => item.id === saved.id);
      return exists ? list.map(item => item.id === saved.id ? saved : item) : [...list, saved];
    });
    this.editingProduct.set(null);
  }

  async startCameraScanner(index: number) {
    this.activeBarcodeItemIndex.set(index);
    if (!('BarcodeDetector' in window)) {
      this.cameraScannerMessage.set('Camera barcode detection is not supported in this browser. Use a USB scanner or type the barcode.');
      this.cameraScannerActive.set(true);
      return;
    }
    this.cameraScannerActive.set(true);
    this.cameraScannerMessage.set('Point the camera at a barcode.');
    setTimeout(async () => {
      const video = document.getElementById('barcode-camera-preview') as HTMLVideoElement | null;
      if (!video) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        await video.play();
        const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'] });
        const scan = async () => {
          if (!this.cameraScannerActive()) return;
          const codes = await detector.detect(video);
          if (codes.length) {
            const value = codes[0].rawValue || '';
            const targetIndex = this.activeBarcodeItemIndex();
            if (targetIndex !== null && this.procurement.items[targetIndex]) {
              this.procurement.items[targetIndex].barcode = value;
              await this.lookupProcurementBarcode(targetIndex);
            }
            this.stopCameraScanner();
            return;
          }
          requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      } catch {
        this.cameraScannerMessage.set('Unable to access camera. Use a USB scanner or type the barcode.');
      }
    }, 100);
  }

  stopCameraScanner() {
    const video = document.getElementById('barcode-camera-preview') as HTMLVideoElement | null;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(track => track.stop());
    if (video) video.srcObject = null;
    this.cameraScannerActive.set(false);
    this.activeBarcodeItemIndex.set(null);
  }

  downloadAssetJson(asset: Asset) {
    this.downloadTextFile(JSON.stringify(asset, null, 2), `${asset.id}.json`, 'application/json;charset=utf-8;');
  }

  downloadAssetExcel(asset: Asset) {
    this.downloadHtmlExcel([asset as any], `${asset.id}.xls`, `Asset ${asset.id}`);
  }

  downloadAssetPdf(asset: Asset) {
    this.printAssetDocument(asset, 'Asset PDF');
  }

  printAssetLabel(asset: Asset) {
    this.printAssetDocument(asset, 'Asset Label', true);
  }

  printProfessionalAssetSheet(asset: Asset) {
    this.printAssetDocument(asset, 'Professional Asset Sheet');
  }

  private printAssetDocument(asset: Asset, title: string, compact = false) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = Object.entries(asset)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `<tr><th>${key}</th><td>${value}</td></tr>`)
      .join('');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ${asset.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: ${compact ? '12px' : '32px'}; color: #111827; }
            h1 { font-size: ${compact ? '18px' : '26px'}; margin-bottom: 8px; }
            .meta { color: #4b5563; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { width: 220px; background: #f3f4f6; }
            .qr { width: ${compact ? '96px' : '150px'}; height: ${compact ? '96px' : '150px'}; }
          </style>
        </head>
        <body onload="window.print();">
          <h1>${title}</h1>
          <div class="meta">${asset.name} | ${asset.id}</div>
          <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${asset.id}" />
          <table>${rows}</table>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  openTransferModal(asset: Asset) {
    this.transferAssetTarget.set(asset);
    this.transferLocationId = asset.locationId;
    this.transferReason = '';
    this.transferApprovedBy = this.userEmail();
    this.showTransferModal.set(true);
  }

  closeTransferModal() {
    this.showTransferModal.set(false);
    this.transferAssetTarget.set(null);
  }

  async submitAssetTransfer() {
    const asset = this.transferAssetTarget();
    if (!asset || !this.transferLocationId || !this.transferReason) {
      alert('Target location and transfer reason are required.');
      return;
    }
    await this.appwriteService.transferAsset({
      asset,
      toLocationId: this.transferLocationId,
      reason: this.transferReason,
      approvedBy: this.transferApprovedBy
    });
    this.closeTransferModal();
    await this.loadData();
    const refreshed = this.assets().find(a => a.id === asset.id);
    if (refreshed) await this.openDetailDrawer(refreshed);
  }

  // Filtering Logic
  filteredAssets = computed(() => {
    return this.assets().filter(a => {
      const matchSearch = this.searchQuery() === '' || 
        a.name.toLowerCase().includes(this.searchQuery().toLowerCase()) || 
        a.id.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        (a.vendor || '').toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchInst = this.filterInstitution() === 'All' || a.locationText?.startsWith(this.filterInstitution());
      const matchCat = this.filterCategory() === 'All' || a.category === this.filterCategory();
      const matchStatus = this.filterStatus() === 'All' || a.status === this.filterStatus();
      const matchPO = this.filterPO() === '' || (a.purchaseOrder || '').toLowerCase().includes(this.filterPO().toLowerCase());
      const matchBill = this.filterBillNumber() === '' || (a.billNumber || '').toLowerCase().includes(this.filterBillNumber().toLowerCase());
      return matchSearch && matchInst && matchCat && matchStatus && matchPO && matchBill;
    });
  });

  sortedAssets = computed(() => {
    const assets = this.filteredAssets();
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return [...assets].sort((a, b) => {
      let valA: any = a[col as keyof Asset] || '';
      let valB: any = b[col as keyof Asset] || '';

      if (typeof valA === 'string') {
        return valA.toLowerCase().localeCompare(valB.toLowerCase()) * dir;
      }
      return (valA > valB ? 1 : valA < valB ? -1 : 0) * dir;
    });
  });

  reportAssets = computed(() => {
    if (this.reportType === 'damaged') {
      return this.assets().filter(a => a.status === 'Under Service' || a.status === 'Condemned' || a.status === 'Damaged');
    }
    if (this.reportType === 'missing') {
      return this.assets().filter(a => a.status === 'Missing');
    }
    return this.assets();
  });

  // Action Operations
  async deleteAsset(id: string) {
    if (confirm(`Are you sure you want to delete asset: ${id}?`)) {
      await this.appwriteService.deleteAsset(id);
      await this.loadData();
    }
  }

  // Add / Edit Asset Modal
  openAddAssetModal() {
    this.isEditingAsset.set(false);
    this.editingAsset = {
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
    this.showAssetModal.set(true);
  }

  openEditAssetModal(asset: Asset) {
    this.isEditingAsset.set(true);
    this.editingAsset = { 
      ...asset,
      purchaseOrder: asset.purchaseOrder || '',
      billNumber: asset.billNumber || '',
      billDate: asset.billDate || ''
    };
    this.showAssetModal.set(true);
  }

  closeAssetModal() {
    this.showAssetModal.set(false);
  }

  toggleSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  async openDetailDrawer(asset: Asset) {
    this.selectedDetailAsset.set(asset);
    this.assetTransfers.set(await this.appwriteService.getAssetTransfers(asset.id));
    this.showDetailDrawer.set(true);
  }

  closeDetailDrawer() {
    this.showDetailDrawer.set(false);
    setTimeout(() => {
      this.selectedDetailAsset.set(null);
      this.assetTransfers.set([]);
    }, 300);
  }

  async onSaveAsset(event: { asset: Partial<Asset> }) {
    this.editingAsset = event.asset as Asset;
    if (this.isEditingAsset()) {
      await this.appwriteService.updateAsset(this.editingAsset);
    } else {
      await this.appwriteService.addAsset(this.editingAsset);
    }
    this.showAssetModal.set(false);
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

  // Review Approvals Modal
  openReviewModal(req: VerificationRequest, approve: boolean) {
    this.selectedRequest.set(req);
    this.isApproving.set(approve);
    this.reviewComments = '';
    this.showReviewModal.set(true);
  }

  closeReviewModal() {
    this.showReviewModal.set(false);
    this.selectedRequest.set(null);
  }

  async submitReview() {
    const req = this.selectedRequest();
    if (!req) return;

    await this.appwriteService.processRequest(req.id, this.isApproving(), this.reviewComments);
    this.showReviewModal.set(false);
    await this.loadData();
  }

  openHistoryModal(req: VerificationRequest) {
    this.selectedHistoryRequest.set(req);
    this.showHistoryModal.set(true);
  }

  closeHistoryModal() {
    this.showHistoryModal.set(false);
    this.selectedHistoryRequest.set(null);
  }

  viewContainer(containerId: string) {
    this.filterInstitution.set('All');
    this.filterCategory.set('All');
    this.filterStatus.set('All');
    this.activeTab.set('assets');
    
    // Quick search trick, filter by container
    setTimeout(() => {
      this.assets.set(this.assets().filter(a => a.id === containerId || a.containerId === containerId));
    }, 100);
  }

  generateReport() {
    window.print();
  }

  async onLogout() {
    await this.appwriteService.logout();
    this.router.navigate(['/login']);
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
