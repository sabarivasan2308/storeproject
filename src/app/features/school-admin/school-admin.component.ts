import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppwriteService } from '../../core/services/appwrite.service';
import { Asset, Location, VerificationRequest } from '../../core/models/types';

@Component({
  selector: 'app-school-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar Navigation -->
      <aside class="sidebar glass-panel">
        <div class="sidebar-header">
          <span class="sidebar-logo">🏫</span>
          <div>
            <h2 class="display-header sidebar-title">{{ institutionName() }}</h2>
            <span class="badge badge-cyan">School Admin</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <button class="nav-link" [class.active]="activeTab() === 'overview'" (click)="setTab('overview')">
            <span>📊</span> Dashboard Overview
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'assets'" (click)="setTab('assets')">
            <span>📦</span> Assets Inventory
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'verification'" (click)="setTab('verification')">
            <span>✅</span> Stock Verification
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'requests'" (click)="setTab('requests')">
            <span>⏳</span> Submitted Requests
            @if (pendingRequestsCount() > 0) {
              <span class="badge badge-orange badge-pill">{{ pendingRequestsCount() }}</span>
            }
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'reports'" (click)="setTab('reports')">
            <span>📄</span> Institution Reports
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <p class="user-name">{{ userName() }}</p>
            <p class="user-email">{{ userEmail() }}</p>
          </div>
          <button class="btn btn-secondary btn-logout" (click)="onLogout()">
            <span>Logout</span> 🔌
          </button>
        </div>
      </aside>

      <!-- Main Panel Area -->
      <main class="main-content">


        <!-- 1. OVERVIEW DASHBOARD -->
        @if (activeTab() === 'overview') {
          <div class="tab-content fade-in">
            <h1 class="display-header page-heading">{{ institutionName() }} Dashboard</h1>
            
            <div class="dashboard-grid">
              <div class="glass-panel kpi-card">
                <div class="kpi-icon-container">📦</div>
                <div class="kpi-data">
                  <span class="kpi-label">Total Assets</span>
                  <span class="kpi-value">{{ totalAssetsCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-icon-container">💰</div>
                <div class="kpi-data">
                  <span class="kpi-label">Total Value</span>
                  <span class="kpi-value">₹{{ totalAssetValue() | number }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-icon-container">⚠️</div>
                <div class="kpi-data">
                  <span class="kpi-label">Under Service</span>
                  <span class="kpi-value text-cyan">{{ underServiceCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-icon-container">🔍</div>
                <div class="kpi-data">
                  <span class="kpi-label">Missing Assets</span>
                  <span class="kpi-value text-orange">{{ missingAssetsCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-icon-container">💥</div>
                <div class="kpi-data">
                  <span class="kpi-label">Damaged Assets</span>
                  <span class="kpi-value text-orange">{{ damagedAssetsCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-icon-container">💤</div>
                <div class="kpi-data">
                  <span class="kpi-label">Idle Assets</span>
                  <span class="kpi-value text-blue">{{ idleAssetsCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-icon-container">❌</div>
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
              <button class="btn btn-primary" (click)="openAddAssetModal()">
                <span>+</span> Add New Asset
              </button>
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
                      <th (click)="toggleSort('vendor')" class="sortable-header">Vendor <span class="sort-indicator">{{ getSortIcon('vendor') }}</span></th>
                      <th (click)="toggleSort('status')" class="sortable-header">Status <span class="sort-indicator">{{ getSortIcon('status') }}</span></th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (asset of filteredAssets(); track asset.id) {
                      <tr>
                        <td><code>{{ asset.id }}</code></td>
                        <td>
                          <strong>{{ asset.name }}</strong>
                          @if (asset.containerId) {
                            <div class="container-badge">
                              📦 Stored in: <code>{{ asset.containerId }}</code>
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
                            <button class="btn btn-secondary btn-icon" (click)="selectedDrawerAsset.set(asset)" title="View Details">🔍</button>
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
                              <option value="Idle">Idle</option>
                              <option value="Active">Active</option>
                              <option value="Under Service">Under Service</option>
                              <option value="Transferred">Transferred</option>
                              <option value="Missing">Missing</option>
                              <option value="Damaged">Damaged</option>
                              <option value="Condemned">Condemned</option>
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

        <!-- 5. REPORTS GENERATOR -->
        @if (activeTab() === 'reports') {
          <div class="tab-content fade-in">
            <h1 class="display-header page-heading">{{ institutionName() }} Inventory Reports</h1>

            <div class="glass-panel filter-bar">
              <div class="filter-group">
                <label class="form-label">Report Type</label>
                <select class="form-input" [(ngModel)]="reportType">
                  <option value="summary">Full Inventory Details</option>
                  <option value="damaged">Service & Condemned list</option>
                  <option value="missing">Missing Assets list</option>
                </select>
              </div>
              <button class="btn btn-primary" (click)="printReport()">
                Print / Save PDF Report 🖨️
              </button>
            </div>

            <!-- Preview styled for paper print -->
            <div class="glass-panel print-preview-area" id="print-area">
              <div class="report-print-header">
                <h2>{{ institutionName() }} Inventory Audit</h2>
                <h3>{{ reportTitle() }}</h3>
                <p>Generated on: {{ currentDateTime() }} | Scope: Campus Administration Area</p>
              </div>

              <div class="table-container">
                <table class="glass-table">
                  <thead>
                    <tr>
                      <th>Asset ID</th>
                      <th>Asset Name</th>
                      <th>Category</th>
                      <th>Brand / Model</th>
                      <th>Quantity</th>
                      <th>Total Value</th>
                      <th>Purchase Order</th>
                      <th>Billing Date</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (asset of reportAssets(); track asset.id) {
                      <tr>
                        <td><code>{{ asset.id }}</code></td>
                        <td>{{ asset.name }}</td>
                        <td>{{ asset.category }}</td>
                        <td>{{ asset.brand }} / {{ asset.model }}</td>
                        <td>{{ asset.quantity }}</td>
                        <td>₹{{ asset.totalPrice | number }}</td>
                        <td><code>{{ asset.purchaseOrder || '-' }}</code></td>
                        <td>
                          {{ asset.billDate || '-' }}
                          @if (asset.billNumber) {
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                              No: <code>{{ asset.billNumber }}</code>
                            </div>
                          }
                        </td>
                        <td>{{ asset.locationText?.split(' -> ')?.slice(1)?.join(' -> ') }}</td>
                        <td>{{ asset.status }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </main>
    </div>

    <!-- MODAL: ADD ASSET REQUEST -->
    @if (showAddAssetModal()) {
      <div class="modal-backdrop">
        <div class="glass-panel modal-card">
          <h2 class="display-header modal-title">Propose Add Asset</h2>
          
          <form (ngSubmit)="submitAddAssetPropose()">
            <div class="modal-body">
              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Asset ID (e.g. FR-AKCP-BT-F1-001)</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.id" name="id" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Asset Name</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.name" name="name" required />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select class="form-input" [(ngModel)]="proposeAsset.category" name="category" required>
                    <option value="Refrigerators">Refrigerators</option>
                    <option value="Lab Reagents">Lab Reagents</option>
                    <option value="Sample Kits">Sample Kits</option>
                    <option value="Computers">Computers</option>
                    <option value="Projectors">Projectors</option>
                    <option value="Air Conditioners">Air Conditioners</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Initial Status</label>
                  <select class="form-input" [(ngModel)]="proposeAsset.status" name="status" required>
                    <option value="Idle">Idle</option>
                    <option value="Active">Active</option>
                    <option value="Under Service">Under Service</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Missing">Missing</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Condemned">Condemned</option>
                  </select>
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Purchase Date</label>
                  <input type="date" class="form-input" [(ngModel)]="proposeAsset.purchaseDate" name="purchaseDate" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Purchase Order (Alphanumeric)</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.purchaseOrder" name="purchaseOrder" placeholder="PO-12345" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Bill Number (Alphanumeric)</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.billNumber" name="billNumber" placeholder="BILL-9876" />
                </div>
                <div class="form-group">
                  <label class="form-label">Bill Date</label>
                  <input type="date" class="form-input" [(ngModel)]="proposeAsset.billDate" name="billDate" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Brand</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.brand" name="brand" />
                </div>
                <div class="form-group">
                  <label class="form-label">Model</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.model" name="model" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Quantity</label>
                  <input type="number" class="form-input" [(ngModel)]="proposeAsset.quantity" name="quantity" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Unit Price (₹)</label>
                  <input type="number" class="form-input" [(ngModel)]="proposeAsset.unitPrice" name="unitPrice" required />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Location Mapping</label>
                  <select class="form-input" [(ngModel)]="proposeAsset.locationId" name="locationId" required>
                    @for (loc of institutionLocations(); track loc.id) {
                      <option [value]="loc.id">
                        {{ loc.building }} ({{ loc.room }})
                      </option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Stored inside Container (Optional)</label>
                  <select class="form-input" [(ngModel)]="proposeAsset.containerId" name="containerId">
                    <option [value]="undefined">None (Root Asset)</option>
                    @for (c of containerAssets(); track c.id) {
                      <option [value]="c.id">{{ c.name }} ({{ c.id }})</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-group flex-row">
                <input type="checkbox" id="isContainer" [(ngModel)]="proposeAsset.isContainer" name="isContainer" />
                <label for="isContainer" class="form-label pointer-label">Acts as a Container (Can hold other assets)</label>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Vendor</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.vendor" name="vendor" placeholder="e.g. Acme Corp" />
                </div>
                <div class="form-group">
                  <label class="form-label">Warranty Details</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.warrantyDetails" name="warrantyDetails" placeholder="e.g. 3 Years Onsite" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Serial Number</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.serialNumber" name="serialNumber" placeholder="e.g. SN123456789" />
                </div>
                <div class="form-group">
                  <label class="form-label">Remarks</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeAsset.remarks" name="remarks" placeholder="Any additional notes..." />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Reason for Adding Asset</label>
                <input type="text" class="form-input" [(ngModel)]="proposeReason" name="proposeReason" required placeholder="Provide justification for Super Admin review" />
              </div>
            </div>

            <div class="modal-buttons">
              <button type="button" class="btn btn-secondary" (click)="closeAddAssetModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Propose Asset addition</button>
            </div>
          </form>
        </div>
      </div>
    }

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
    @if (selectedDrawerAsset(); as asset) {
      <div class="drawer-backdrop" (click)="selectedDrawerAsset.set(null)"></div>
      <aside class="side-drawer glass-panel" [class.open]="selectedDrawerAsset() !== null">
        <div class="drawer-header">
          <h2 class="drawer-title">Asset Details</h2>
          <button class="btn-close" (click)="selectedDrawerAsset.set(null)">✕</button>
        </div>
        
        <div class="drawer-body">
          <div class="qr-print-section">
            <img 
              [src]="'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + asset.id" 
              alt="QR Code" 
              class="drawer-qr"
            />
            <button class="btn btn-secondary btn-sm" (click)="printAssetQR(asset)">
              🖨️ Print QR Code
            </button>
          </div>

          <div class="detail-section">
            <h3>General Info</h3>
            <div class="detail-grid">
              <div class="detail-label">Asset ID</div>
              <div class="detail-value"><code>{{ asset.id }}</code></div>
              
              <div class="detail-label">Name</div>
              <div class="detail-value"><strong>{{ asset.name }}</strong></div>
              
              <div class="detail-label">Category</div>
              <div class="detail-value">{{ asset.category }}</div>
              
              <div class="detail-label">Status</div>
              <div class="detail-value">
                <span class="badge" 
                  [class.badge-green]="asset.status === 'Active'" 
                  [class.badge-red]="asset.status === 'Condemned'"
                  [class.badge-orange]="asset.status === 'Missing' || asset.status === 'Damaged'"
                  [class.badge-blue]="asset.status === 'Under Service' || asset.status === 'Transferred'"
                  [class.badge-gray]="asset.status === 'Idle'"
                >
                  {{ asset.status }}
                </span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Specification</h3>
            <div class="detail-grid">
              <div class="detail-label">Brand</div>
              <div class="detail-value">{{ asset.brand || '-' }}</div>
              
              <div class="detail-label">Model</div>
              <div class="detail-value">{{ asset.model || '-' }}</div>
              
              <div class="detail-label">Serial Number</div>
              <div class="detail-value"><code>{{ asset.serialNumber || '-' }}</code></div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Procurement & Billing</h3>
            <div class="detail-grid">
              <div class="detail-label">Quantity</div>
              <div class="detail-value">{{ asset.quantity }}</div>

              <div class="detail-label">Unit Price</div>
              <div class="detail-value">₹{{ asset.unitPrice | number }}</div>

              <div class="detail-label">Total Value</div>
              <div class="detail-value">₹{{ asset.totalPrice | number }}</div>

              <div class="detail-label">Purchase Date</div>
              <div class="detail-value">{{ asset.purchaseDate || '-' }}</div>

              <div class="detail-label">Purchase Order</div>
              <div class="detail-value"><code>{{ asset.purchaseOrder || '-' }}</code></div>

              <div class="detail-label">Bill Number</div>
              <div class="detail-value"><code>{{ asset.billNumber || '-' }}</code></div>

              <div class="detail-label">Bill Date</div>
              <div class="detail-value">{{ asset.billDate || '-' }}</div>
              
              <div class="detail-label">Vendor</div>
              <div class="detail-value">{{ asset.vendor || '-' }}</div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Location & Support</h3>
            <div class="detail-grid">
              <div class="detail-label">Location</div>
              <div class="detail-value">{{ asset.locationText || '-' }}</div>

              <div class="detail-label">Warranty</div>
              <div class="detail-value">{{ asset.warrantyDetails || '-' }}</div>
            </div>
          </div>

          <div class="detail-section" *ngIf="asset.remarks">
            <h3>Remarks</h3>
            <p class="remarks-text">{{ asset.remarks }}</p>
          </div>
        </div>
      </aside>
    }
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

    /* Side Drawer Styles */
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
      background: linear-gradient(135deg, #fff 0%, #22d3ee 100%);
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
      color: var(--accent-cyan);
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
export class SchoolAdminComponent implements OnInit {
  // Navigation State
  activeTab = signal<string>('overview');
  userName = signal<string>('Prof. Ramesh Patel');
  userEmail = signal<string>('akcp@kare.edu');
  institutionName = signal<string>('AKCP');
  
  // Sorting & Drawer State
  sortColumn = signal<string>('id');
  sortAscending = signal<boolean>(true);
  selectedDrawerAsset = signal<Asset | null>(null);

  // Data Signals
  assets = signal<Asset[]>([]);
  locations = signal<Location[]>([]);
  requests = signal<VerificationRequest[]>([]);
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
    status: 'Idle' | 'Active' | 'Under Service' | 'Transferred' | 'Missing' | 'Condemned' | 'Damaged';
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
  }

  async loadData() {
    try {
      const [assetsData, locationsData, requestsData] = await Promise.all([
        this.appwriteService.getAssets(),
        this.appwriteService.getLocations(),
        this.appwriteService.getRequests()
      ]);
      
      // ISOLATION: filter records belonging to their assigned institution
      const instName = this.institutionName();
      this.assets.set(assetsData.filter(a => a.locationText?.startsWith(instName)));
      this.locations.set(locationsData.filter(l => l.institution === instName));
      this.requests.set(requestsData.filter(r => r.institution === instName));
    } catch (e) {
      console.error('Error fetching school admin data:', e);
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
    const cats = this.assets().map(a => a.category);
    return Array.from(new Set(cats));
  });

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
      status: a.status as 'Idle' | 'Active' | 'Under Service' | 'Transferred' | 'Missing' | 'Condemned' | 'Damaged',
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

  // Propose New Asset Modal
  openAddAssetModal() {
    this.proposeReason = '';
    this.proposeAsset = {
      id: '',
      name: '',
      category: 'Lab Reagents',
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
      status: 'Active',
      remarks: '',
      locationId: this.locations()[0]?.id || '',
      isContainer: false
    };
    this.showAddAssetModal.set(true);
  }

  closeAddAssetModal() {
    this.showAddAssetModal.set(false);
  }

  async submitAddAssetPropose() {
    // Alphanumeric validation
    const alphaNumRegex = /^[a-zA-Z0-9]*$/;
    if (this.proposeAsset.purchaseOrder && !alphaNumRegex.test(this.proposeAsset.purchaseOrder)) {
      alert('Purchase Order must be alphanumeric (only letters and numbers allowed).');
      return;
    }
    if (this.proposeAsset.billNumber && !alphaNumRegex.test(this.proposeAsset.billNumber)) {
      alert('Bill Number must be alphanumeric (only letters and numbers allowed).');
      return;
    }

    // Date validations
    const today = new Date().toISOString().substring(0, 10);
    if (this.proposeAsset.purchaseDate && this.proposeAsset.purchaseDate > today) {
      alert('Purchase Date cannot be in the future.');
      return;
    }
    if (this.proposeAsset.billDate) {
      if (this.proposeAsset.billDate > today) {
        alert('Bill Date cannot be in the future.');
        return;
      }
      if (this.proposeAsset.purchaseDate && this.proposeAsset.billDate < this.proposeAsset.purchaseDate) {
        alert('Bill Date cannot be earlier than Purchase Date.');
        return;
      }
    }

    this.proposeAsset.totalPrice = this.proposeAsset.quantity * this.proposeAsset.unitPrice;
    this.proposeAsset.qrCode = this.proposeAsset.id;
    this.proposeAsset.barcode = 'BAR-' + this.proposeAsset.id;

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

    // In a mock environment we append directly but label as pending addition, 
    // or just let it create a request. To let Super Admin trigger addition:
    // We add the actual record as "Pending addition" status or just let Super Admin create the asset when approved.
    // The design is: Super Admin approves the request, and the asset is created.
    // So we just add it to the pending request queue!
    // But since Appwrite databases will need to save the draft proposed asset, we can store it in localStorage 
    // or Appwrite database directly with a flag, or have the Super Admin manually input the details.
    // To make it fully self-contained, we can save the asset directly with 'Missing' status or create a request.
    // Let's create the request, and inside MockDatabase we save it as a pending asset inside local storage so Super Admin can auto-approve.
    this.proposeAsset.status = 'Missing'; // Set inactive or missing until approved
    this.proposeAsset.remarks = `Proposed by ${this.userName()}. Approval Pending. ` + this.proposeReason;
    await this.appwriteService.addAsset(this.proposeAsset);

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
