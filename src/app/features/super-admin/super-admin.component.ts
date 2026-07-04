import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppwriteService } from '../../core/services/appwrite.service';
import { Asset, Location, VerificationRequest, AuditLog } from '../../core/services/mock-db';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar Navigation -->
      <aside class="sidebar glass-panel">
        <div class="sidebar-header">
          <span class="sidebar-logo">🛡️</span>
          <div>
            <h2 class="display-header sidebar-title">KARE System</h2>
            <span class="badge badge-purple">Super Admin</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <button class="nav-link" [class.active]="activeTab() === 'overview'" (click)="setTab('overview')">
            <span>📊</span> Overview Dashboard
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'assets'" (click)="setTab('assets')">
            <span>📦</span> Asset Inventory
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'approvals'" (click)="setTab('approvals')">
            <span>⏳</span> Pending Approvals
            @if (pendingRequestsCount() > 0) {
              <span class="badge badge-red badge-pill">{{ pendingRequestsCount() }}</span>
            }
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'logs'" (click)="setTab('logs')">
            <span>📜</span> System Audit Logs
          </button>
          <button class="nav-link" [class.active]="activeTab() === 'reports'" (click)="setTab('reports')">
            <span>📄</span> Inventory Reports
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
        <!-- TOP ALERT BAR FOR MOCK FALLBACK -->
        @if (isMockActive()) {
          <div class="mock-alert-bar">
            <span>💡</span> Currently running in <strong>Interactive Demo (LocalStorage) Mode</strong>. Setup Appwrite Project ID in config to connect to a live backend.
          </div>
        }

        <!-- 1. OVERVIEW DASHBOARD -->
        @if (activeTab() === 'overview') {
          <div class="tab-content fade-in">
            <h1 class="display-header page-heading">System Overview</h1>
            
            <div class="dashboard-grid">
              <div class="glass-panel kpi-card">
                <div class="kpi-icon-container">🏫</div>
                <div class="kpi-data">
                  <span class="kpi-label">Institutions</span>
                  <span class="kpi-value">{{ uniqueInstitutionsCount() }}</span>
                </div>
              </div>
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
                <div class="kpi-icon-container">🔧</div>
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
              <h1 class="display-header page-heading">Asset Inventory Manager</h1>
              <button class="btn btn-primary" (click)="openAddAssetModal()">
                <span>+</span> Add New Asset
              </button>
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
                  @for (inst of institutionList; track inst) {
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
                      <th>Asset ID</th>
                      <th>Asset Name</th>
                      <th>Category</th>
                      <th>Brand / Model</th>
                      <th>Quantity</th>
                      <th>Total Value</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>QR Code</th>
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
                            <div class="container-badge" (click)="viewContainer(asset.containerId)">
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
                        <td>{{ asset.brand }} - {{ asset.model }}</td>
                        <td>{{ asset.quantity }}</td>
                        <td>₹{{ asset.totalPrice | number }}</td>
                        <td class="location-cell">{{ asset.locationText }}</td>
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
                          @if (asset.purchaseOrder || asset.billNumber) {
                            <div class="purchase-meta-row" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                              @if (asset.purchaseOrder) {
                                <span>PO: <code>{{ asset.purchaseOrder }}</code></span>
                              }
                              @if (asset.billNumber) {
                                <span style="margin-left: 8px;">Bill: <code>{{ asset.billNumber }}</code></span>
                              }
                            </div>
                          }
                        </td>
                        <td>
                          <img 
                            [src]="'https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=' + asset.id" 
                            alt="QR"
                            class="qr-thumbnail"
                            (click)="showQRModal(asset.id, asset.name)"
                          />
                        </td>
                        <td>
                          <div class="action-buttons">
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
            </div>
          </div>
        }

        <!-- 3. PENDING APPROVALS -->
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
                          <span class="badge badge-orange">{{ req.status }}</span>
                        </td>
                        <td>
                          @if (req.status === 'Pending') {
                            <div class="action-buttons">
                              <button class="btn btn-primary btn-sm" (click)="openReviewModal(req, true)">Approve</button>
                              <button class="btn btn-danger btn-sm" (click)="openReviewModal(req, false)">Reject</button>
                            </div>
                          } @else {
                            <span class="processed-text">{{ req.status }}</span>
                          }
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

        <!-- 5. REPORTS GENERATOR -->
        @if (activeTab() === 'reports') {
          <div class="tab-content fade-in">
            <h1 class="display-header page-heading">Reports Center</h1>

            <div class="glass-panel filter-bar">
              <div class="filter-group">
                <label class="form-label">Report Type</label>
                <select class="form-input" [(ngModel)]="reportType">
                  <option value="summary">Institution-wise Inventory Summary</option>
                  <option value="damaged">Service & Condemned Assets Report</option>
                  <option value="missing">Missing Assets Report</option>
                  <option value="all">Full Inventory Audit Details</option>
                </select>
              </div>
              <button class="btn btn-primary" (click)="generateReport()">
                Print / Export Report 🖨️
              </button>
            </div>

            <!-- Report Preview -->
            <div class="glass-panel print-preview-area" id="print-area">
              <div class="report-print-header">
                <h2>Kalasalingam Academy of Research and Education (KARE)</h2>
                <h3>{{ reportTitle() }}</h3>
                <p>Generated on: {{ currentDateTime() }} | Scope: Global University Authority</p>
              </div>

              <div class="table-container">
                <table class="glass-table">
                  @if (reportType === 'summary') {
                    <thead>
                      <tr>
                        <th>Institution Name</th>
                        <th>Total Assets</th>
                        <th>Total Inventory Value</th>
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
                          <td>{{ inst.underService }}</td>
                          <td>{{ inst.damaged }}</td>
                          <td>{{ inst.missing }}</td>
                          <td>{{ inst.condemned }}</td>
                        </tr>
                      }
                    </tbody>
                  } @else if (reportType === 'damaged' || reportType === 'missing') {
                    <thead>
                      <tr>
                        <th>Asset ID</th>
                        <th>Asset Name</th>
                        <th>Institution</th>
                        <th>Category</th>
                        <th>Brand/Model</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Value</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (asset of reportAssets(); track asset.id) {
                        <tr>
                          <td><code>{{ asset.id }}</code></td>
                          <td>
                            {{ asset.name }}
                            @if (asset.purchaseOrder || asset.billNumber) {
                              <div style="font-size: 0.75rem; color: #64748b;">
                                PO: {{ asset.purchaseOrder || '-' }} | Bill: {{ asset.billNumber || '-' }} ({{ asset.billDate || '-' }})
                              </div>
                            }
                          </td>
                          <td>{{ asset.locationText?.split(' -> ')?.shift() }}</td>
                          <td>{{ asset.category }}</td>
                          <td>{{ asset.brand }}/{{ asset.model }}</td>
                          <td>{{ asset.quantity }}</td>
                          <td>₹{{ asset.unitPrice | number }}</td>
                          <td>₹{{ asset.totalPrice | number }}</td>
                          <td>{{ asset.remarks }}</td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="9" class="text-center">No assets matching report filters.</td>
                        </tr>
                      }
                    </tbody>
                  } @else {
                    <thead>
                      <tr>
                        <th>Asset ID</th>
                        <th>Asset Name</th>
                        <th>Institution</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Total Value</th>
                        <th>Status</th>
                        <th>Location Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (asset of assets(); track asset.id) {
                        <tr>
                          <td><code>{{ asset.id }}</code></td>
                          <td>
                            {{ asset.name }}
                            @if (asset.purchaseOrder || asset.billNumber) {
                              <div style="font-size: 0.75rem; color: #64748b;">
                                PO: {{ asset.purchaseOrder || '-' }} | Bill: {{ asset.billNumber || '-' }} ({{ asset.billDate || '-' }})
                              </div>
                            }
                          </td>
                          <td>{{ asset.locationText?.split(' -> ')?.shift() }}</td>
                          <td>{{ asset.category }}</td>
                          <td>{{ asset.quantity }}</td>
                          <td>₹{{ asset.totalPrice | number }}</td>
                          <td>{{ asset.status }}</td>
                          <td>{{ asset.locationText }}</td>
                        </tr>
                      }
                    </tbody>
                  }
                </table>
              </div>
            </div>
          </div>
        }
      </main>
    </div>

    <!-- MODAL: ADD / EDIT ASSET -->
    @if (showAssetModal()) {
      <div class="modal-backdrop">
        <div class="glass-panel modal-card">
          <h2 class="display-header modal-title">{{ isEditingAsset() ? 'Edit Asset' : 'Add New Asset' }}</h2>
          
          <form (ngSubmit)="saveAsset()">
            <div class="form-row-grid">
              <div class="form-group">
                <label class="form-label">Asset ID (e.g. FR-AKCP-BT-F1-001)</label>
                <input type="text" class="form-input" [(ngModel)]="editingAsset.id" name="id" required [disabled]="isEditingAsset()" />
              </div>
              <div class="form-group">
                <label class="form-label">Asset Name</label>
                <input type="text" class="form-input" [(ngModel)]="editingAsset.name" name="name" required />
              </div>
            </div>

            <div class="form-row-grid">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-input" [(ngModel)]="editingAsset.category" name="category" required>
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
                <label class="form-label">Status</label>
                <select class="form-input" [(ngModel)]="editingAsset.status" name="status" required>
                  <option value="Idle">Idle</option>
                  <option value="Active">Active</option>
                  <option value="Under Service">Under Service</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Missing">Missing</option>
                  <option value="Condemned">Condemned</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            </div>

            <div class="form-row-grid">
              <div class="form-group">
                <label class="form-label">Brand</label>
                <input type="text" class="form-input" [(ngModel)]="editingAsset.brand" name="brand" />
              </div>
              <div class="form-group">
                <label class="form-label">Model</label>
                <input type="text" class="form-input" [(ngModel)]="editingAsset.model" name="model" />
              </div>
            </div>

            <div class="form-row-grid">
              <div class="form-group">
                <label class="form-label">Quantity</label>
                <input type="number" class="form-input" [(ngModel)]="editingAsset.quantity" name="quantity" required />
              </div>
              <div class="form-group">
                <label class="form-label">Unit Price (₹)</label>
                <input type="number" class="form-input" [(ngModel)]="editingAsset.unitPrice" name="unitPrice" required />
              </div>
            </div>

            <div class="form-row-grid">
              <div class="form-group">
                <label class="form-label">Location Mapping</label>
                <select class="form-input" [(ngModel)]="editingAsset.locationId" name="locationId" required>
                  @for (loc of locations(); track loc.id) {
                    <option [value]="loc.id">
                      {{ loc.institution }} - {{ loc.building }} ({{ loc.room }})
                    </option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Stored inside Container ID (Optional)</label>
                <select class="form-input" [(ngModel)]="editingAsset.containerId" name="containerId">
                  <option [value]="undefined">None (Root Asset)</option>
                  @for (c of containerAssets(); track c.id) {
                    @if (c.id !== editingAsset.id) {
                      <option [value]="c.id">{{ c.name }} ({{ c.id }})</option>
                    }
                  }
                </select>
              </div>
            </div>

            <div class="form-group flex-row">
              <input type="checkbox" id="isContainer" [(ngModel)]="editingAsset.isContainer" name="isContainer" />
              <label for="isContainer" class="form-label pointer-label">Acts as a Container (Can hold other assets)</label>
            </div>

            <div class="form-row-grid">
              <div class="form-group">
                <label class="form-label">Purchase Date</label>
                <input type="date" class="form-input" [(ngModel)]="editingAsset.purchaseDate" name="purchaseDate" required />
              </div>
              <div class="form-group">
                <label class="form-label">Purchase Order (Alphanumeric)</label>
                <input type="text" class="form-input" [(ngModel)]="editingAsset.purchaseOrder" name="purchaseOrder" placeholder="PO-12345" />
              </div>
            </div>

            <div class="form-row-grid">
              <div class="form-group">
                <label class="form-label">Bill Number (Alphanumeric)</label>
                <input type="text" class="form-input" [(ngModel)]="editingAsset.billNumber" name="billNumber" placeholder="BILL-9876" />
              </div>
              <div class="form-group">
                <label class="form-label">Bill Date</label>
                <input type="date" class="form-input" [(ngModel)]="editingAsset.billDate" name="billDate" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Warranty / Vendor / Details</label>
              <input type="text" class="form-input" [(ngModel)]="editingAsset.warrantyDetails" name="warrantyDetails" placeholder="Warranty / Vendor details" />
            </div>

            <div class="modal-buttons">
              <button type="button" class="btn btn-secondary" (click)="closeAssetModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Asset</button>
            </div>
          </form>
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
    }
    .modal-card {
      width: 100%;
      max-width: 600px;
      animation: modalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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

    @keyframes modalSlide {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #print-area, #print-area * {
        visibility: visible;
      }
      #print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: #fff !important;
        color: #000 !important;
      }
      #print-area table th {
        background: #f1f5f9 !important;
        color: #000 !important;
        border-bottom: 1px solid #cbd5e1 !important;
      }
      #print-area table td {
        color: #000 !important;
        border-bottom: 1px solid #e2e8f0 !important;
      }
    }
  `]
})
export class SuperAdminComponent implements OnInit {
  // Navigation State
  activeTab = signal<string>('overview');
  userName = signal<string>('Dr. Suresh Kumar');
  userEmail = signal<string>('super@kare.edu');
  
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
  isMockActive = signal<boolean>(true);

  // Filters State
  filterInstitution = signal<string>('All');
  filterCategory = signal<string>('All');
  filterStatus = signal<string>('All');
  searchQuery = signal<string>('');
  filterPO = signal<string>('');
  filterBillNumber = signal<string>('');

  // Institution List constant
  institutionList = ['KARE', 'LINGA Global School', 'AK B.Ed College', 'AKCP', 'AKCAS', 'KMCH', 'CSHM'];

  // Modals & Temp States
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
  ) {}

  async ngOnInit() {
    this.isMockActive.set(this.appwriteService.isUsingMock());
    const user = this.appwriteService.currentUser();
    if (user) {
      this.userName.set(user.name);
      this.userEmail.set(user.email);
    }
    
    await this.loadData();
  }

  async loadData() {
    try {
      const [assetsData, locationsData, requestsData, logsData] = await Promise.all([
        this.appwriteService.getAssets(),
        this.appwriteService.getLocations(),
        this.appwriteService.getRequests(),
        this.appwriteService.getAuditLogs()
      ]);
      this.assets.set(assetsData);
      this.locations.set(locationsData);
      this.requests.set(requestsData);
      this.auditLogs.set(logsData);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
    this.loadData();
  }

  // Dashboard Stats Computed States
  uniqueInstitutionsCount = () => this.institutionList.length;
  totalAssetsCount = computed(() => this.assets().reduce((acc, a) => acc + a.quantity, 0));
  totalAssetValue = computed(() => this.assets().reduce((acc, a) => acc + a.totalPrice, 0));
  idleAssetsCount = computed(() => this.assets().filter(a => a.status === 'Idle').reduce((acc, a) => acc + a.quantity, 0));
  underServiceCount = computed(() => this.assets().filter(a => a.status === 'Under Service').reduce((acc, a) => acc + a.quantity, 0));
  missingAssetsCount = computed(() => this.assets().filter(a => a.status === 'Missing').reduce((acc, a) => acc + a.quantity, 0));
  condemnedAssetsCount = computed(() => this.assets().filter(a => a.status === 'Condemned').reduce((acc, a) => acc + a.quantity, 0));
  damagedAssetsCount = computed(() => this.assets().filter(a => a.status === 'Damaged').reduce((acc, a) => acc + a.quantity, 0));
  pendingRequestsCount = computed(() => this.requests().filter(r => r.status === 'Pending').length);

  institutionSummaries = computed(() => {
    return this.institutionList.map(instName => {
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
    const cats = this.assets().map(a => a.category);
    return Array.from(new Set(cats));
  });

  containerAssets = computed(() => this.assets().filter(a => a.isContainer));

  // Filtering Logic
  filteredAssets = computed(() => {
    return this.assets().filter(a => {
      const matchSearch = this.searchQuery() === '' || 
        a.name.toLowerCase().includes(this.searchQuery().toLowerCase()) || 
        a.id.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchInst = this.filterInstitution() === 'All' || a.locationText?.startsWith(this.filterInstitution());
      const matchCat = this.filterCategory() === 'All' || a.category === this.filterCategory();
      const matchStatus = this.filterStatus() === 'All' || a.status === this.filterStatus();
      const matchPO = this.filterPO() === '' || (a.purchaseOrder || '').toLowerCase().includes(this.filterPO().toLowerCase());
      const matchBill = this.filterBillNumber() === '' || (a.billNumber || '').toLowerCase().includes(this.filterBillNumber().toLowerCase());
      return matchSearch && matchInst && matchCat && matchStatus && matchPO && matchBill;
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

  async saveAsset() {
    // Alphanumeric validation
    const alphaNumRegex = /^[a-zA-Z0-9]*$/;
    if (this.editingAsset.purchaseOrder && !alphaNumRegex.test(this.editingAsset.purchaseOrder)) {
      alert('Purchase Order must be alphanumeric (only letters and numbers allowed).');
      return;
    }
    if (this.editingAsset.billNumber && !alphaNumRegex.test(this.editingAsset.billNumber)) {
      alert('Bill Number must be alphanumeric (only letters and numbers allowed).');
      return;
    }

    // Date validations
    const today = new Date().toISOString().substring(0, 10);
    if (this.editingAsset.purchaseDate && this.editingAsset.purchaseDate > today) {
      alert('Purchase Date cannot be in the future.');
      return;
    }
    if (this.editingAsset.billDate) {
      if (this.editingAsset.billDate > today) {
        alert('Bill Date cannot be in the future.');
        return;
      }
      if (this.editingAsset.purchaseDate && this.editingAsset.billDate < this.editingAsset.purchaseDate) {
        alert('Bill Date cannot be earlier than Purchase Date.');
        return;
      }
    }

    this.editingAsset.totalPrice = this.editingAsset.quantity * this.editingAsset.unitPrice;
    this.editingAsset.qrCode = this.editingAsset.id;
    if (!this.editingAsset.barcode) {
      this.editingAsset.barcode = 'BAR-' + this.editingAsset.id;
    }

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
}
