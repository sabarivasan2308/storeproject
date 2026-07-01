import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppwriteService } from '../../core/services/appwrite.service';
import { MockDatabase, Asset, Location, VerificationRequest } from '../../core/services/mock-db';

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
        <!-- TOP ALERT BAR -->
        @if (isMockActive()) {
          <div class="mock-alert-bar">
            <span>💡</span> Currently running in <strong>Interactive Demo (LocalStorage) Mode</strong>. Setup Appwrite Project ID in config to connect to a live backend.
          </div>
        }

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
                  <span class="kpi-label">Damaged Assets</span>
                  <span class="kpi-value text-red">{{ damagedAssetsCount() }}</span>
                </div>
              </div>
              <div class="glass-panel kpi-card">
                <div class="kpi-icon-container">🔍</div>
                <div class="kpi-data">
                  <span class="kpi-label">Missing Assets</span>
                  <span class="kpi-value text-orange">{{ missingAssetsCount() }}</span>
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
            <div class="glass-panel filter-bar">
              <div class="filter-group">
                <label class="form-label">Category</label>
                <select class="form-input" [(ngModel)]="filterCategory">
                  <option value="All">All Categories</option>
                  @for (cat of categoryList(); track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>
              <div class="filter-group">
                <label class="form-label">Status</label>
                <select class="form-input" [(ngModel)]="filterStatus">
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Missing">Missing</option>
                </select>
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
                      <th>Location Details</th>
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
                        <td>{{ asset.brand }} - {{ asset.model }}</td>
                        <td>{{ asset.quantity }}</td>
                        <td>₹{{ asset.totalPrice | number }}</td>
                        <td class="location-cell">{{ asset.locationText }}</td>
                        <td>
                          <span class="badge" 
                            [class.badge-green]="asset.status === 'Active'" 
                            [class.badge-red]="asset.status === 'Damaged'"
                            [class.badge-orange]="asset.status === 'Missing'"
                          >
                            {{ asset.status }}
                          </span>
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
                            <!-- Change requires request to Super Admin -->
                            <button class="btn btn-secondary btn-icon" (click)="openRequestModal(asset, 'Quantity Update')" title="Update Stock">🔢</button>
                            <button class="btn btn-danger btn-icon" (click)="openRequestModal(asset, 'Mark Damaged')" title="Report Damage">⚠️</button>
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
                          <td><strong>{{ item.asset.quantity }}</strong></td>
                          <td>
                            <input type="number" class="form-input input-qty" [(ngModel)]="item.physicalCount" min="0" />
                          </td>
                          <td>
                            <select class="form-input select-status" [(ngModel)]="item.status">
                              <option value="Active">Active</option>
                              <option value="Damaged">Damaged</option>
                              <option value="Missing">Missing</option>
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
                  <option value="damaged">Damaged Assets list</option>
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
                  <option value="Active">Active</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Missing">Missing</option>
                </select>
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

            <div class="form-group">
              <label class="form-label">Reason for Adding Asset</label>
              <input type="text" class="form-input" [(ngModel)]="proposeReason" name="proposeReason" required placeholder="Provide justification for Super Admin review" />
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
          
          <div class="form-group">
            <label class="form-label">Recorded Value (System)</label>
            <input type="text" class="form-input" [value]="requestPreviousValue" disabled />
          </div>

          <div class="form-group">
            <label class="form-label">Proposed New Value</label>
            @if (requestChangeType === 'Quantity Update') {
              <input type="number" class="form-input" [(ngModel)]="requestNewValue" required />
            } @else {
              <input type="text" class="form-input" [value]="requestNewValue" disabled />
            }
          </div>

          <div class="form-group">
            <label class="form-label">Reason for discrepancy / change</label>
            <textarea class="form-input text-area-input" [(ngModel)]="requestReason" rows="3" placeholder="Provide details e.g., 5 bottles damaged during biotech labs" required></textarea>
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
export class SchoolAdminComponent implements OnInit {
  // Navigation State
  activeTab = signal<string>('overview');
  userName = signal<string>('Prof. Ramesh Patel');
  userEmail = signal<string>('akcp@kare.edu');
  institutionName = signal<string>('AKCP');
  
  // Data Signals
  assets = signal<Asset[]>([]);
  locations = signal<Location[]>([]);
  requests = signal<VerificationRequest[]>([]);
  isMockActive = signal<boolean>(true);

  // Filters State
  filterCategory = 'All';
  filterStatus = 'All';

  // Audit State
  selectedAuditLocationId = '';
  auditItems: Array<{
    asset: Asset;
    physicalCount: number;
    status: 'Active' | 'Damaged' | 'Missing';
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
      case 'damaged': return 'Damaged Assets List';
      default: return 'Missing Assets List';
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
  damagedAssetsCount = computed(() => this.assets().filter(a => a.status === 'Damaged').reduce((acc, a) => acc + a.quantity, 0));
  missingAssetsCount = computed(() => this.assets().filter(a => a.status === 'Missing').reduce((acc, a) => acc + a.quantity, 0));
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
        active: catAssets.filter(a => a.status === 'Active').reduce((acc, a) => acc + a.quantity, 0),
        damagedMissing: catAssets.filter(a => a.status === 'Damaged' || a.status === 'Missing').reduce((acc, a) => acc + a.quantity, 0)
      };
    });
  });

  filteredAssets = computed(() => {
    return this.assets().filter(a => {
      const matchCat = this.filterCategory === 'All' || a.category === this.filterCategory;
      const matchStatus = this.filterStatus === 'All' || a.status === this.filterStatus;
      return matchCat && matchStatus;
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
      status: a.status as 'Active' | 'Damaged' | 'Missing',
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
      let type: 'Mark Damaged' | 'Mark Missing' | 'Mark Active';
      if (item.status === 'Active') {
        type = 'Mark Active';
      } else if (item.status === 'Damaged') {
        type = 'Mark Damaged';
      } else {
        type = 'Mark Missing';
      }
      await this.appwriteService.submitRequest({
        schoolAdminEmail: this.userEmail(),
        schoolAdminName: this.userName(),
        institution: this.institutionName(),
        assetId: item.asset.id,
        assetName: item.asset.name,
        changeType: type,
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
    const assets = MockDatabase.getAssets();
    this.proposeAsset.status = 'Missing'; // Set inactive or missing until approved
    this.proposeAsset.remarks = `Proposed by ${this.userName()}. Approval Pending. ` + this.proposeReason;
    MockDatabase.addAsset(this.proposeAsset);

    alert('Asset addition proposal submitted to Super Admin successfully.');
    this.showAddAssetModal.set(false);
    await this.loadData();
  }

  // Request Edit Modal (for quick grid buttons)
  openRequestModal(asset: Asset, type: 'Quantity Update' | 'Mark Damaged') {
    this.selectedAsset.set(asset);
    this.requestChangeType = type;
    this.requestReason = '';
    
    if (type === 'Quantity Update') {
      this.requestPreviousValue = `${asset.quantity} Units`;
      this.requestNewValue = asset.quantity.toString();
    } else {
      this.requestPreviousValue = asset.status;
      this.requestNewValue = 'Damaged';
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

    await this.appwriteService.submitRequest({
      schoolAdminEmail: this.userEmail(),
      schoolAdminName: this.userName(),
      institution: this.institutionName(),
      assetId: asset.id,
      assetName: asset.name,
      changeType: this.requestChangeType as any,
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
      return this.assets().filter(a => a.status === 'Damaged');
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
}
