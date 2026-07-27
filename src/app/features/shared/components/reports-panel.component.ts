import { Component, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset, MaintenanceRecord, WarrantyRecord, AuditLog } from '../../../core/models/types';
import { ExportService } from '../../../core/services/export.service';
import { DepreciationService } from '../../../core/services/depreciation.service';

@Component({
  selector: 'app-reports-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-container glass-panel">
      <div class="panel-header">
        <div>
          <h2>📊 Executive Reports & Analytics Center</h2>
          <p class="subtitle">Generate audit-ready institutional reports, export data in multiple formats, and monitor portfolio valuation.</p>
        </div>
      </div>

      <!-- Financial & Valuation Executive Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Total Portfolio Asset Value</span>
          <span class="metric-val">₹{{ portfolioStats().totalOriginalValue | number }}</span>
          <span class="metric-desc">Based on original purchase cost</span>
        </div>

        <div class="metric-card success">
          <span class="metric-label">Current Net Book Value</span>
          <span class="metric-val">₹{{ portfolioStats().totalCurrentValue | number }}</span>
          <span class="metric-desc">Depreciated valuation</span>
        </div>

        <div class="metric-card warning">
          <span class="metric-label">Accumulated Depreciation</span>
          <span class="metric-val">₹{{ portfolioStats().totalDepreciation | number }}</span>
          <span class="metric-desc">Total value write-down</span>
        </div>

        <div class="metric-card primary">
          <span class="metric-label">Maintenance Spend</span>
          <span class="metric-val">₹{{ totalMaintenanceCost() | number }}</span>
          <span class="metric-desc">Across all service records</span>
        </div>
      </div>

      <!-- Report Generation Selector -->
      <div class="report-controls glass-panel">
        <div class="control-row">
          <div class="form-group">
            <label>Report Type</label>
            <select [(ngModel)]="selectedReportType" class="form-control">
              <option value="ASSET_REGISTER">Asset Master Register</option>
              <option value="DEPRECIATION">Asset Valuation & Depreciation Schedule</option>
              <option value="MAINTENANCE">Maintenance & Service Log</option>
              <option value="WARRANTY">Warranty & AMC Expiry Schedule</option>
              <option value="AUDIT_LOG">System Audit & Compliance Log</option>
            </select>
          </div>

          <div class="form-group">
            <label>Category Filter</label>
            <select [(ngModel)]="categoryFilter" class="form-control">
              <option value="All">All Categories</option>
              <option value="Computers">Computers & IT</option>
              <option value="Laptops">Laptops</option>
              <option value="Servers">Servers</option>
              <option value="Furniture">Furniture</option>
              <option value="Lab Equipment">Lab Equipment</option>
              <option value="Refrigerators">Refrigerators / Cold Chain</option>
            </select>
          </div>

          <div class="form-group">
            <label>Status Filter</label>
            <select [(ngModel)]="statusFilter" class="form-control">
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Idle">Idle</option>
              <option value="Under Service">Under Service</option>
              <option value="Transferred">Transferred</option>
              <option value="Condemned">Condemned</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>

          <div class="form-group action-buttons">
            <label>&nbsp;</label>
            <div class="btn-group">
              <button class="btn btn-primary" (click)="exportCSV()">
                📥 Export CSV
              </button>
              <button class="btn btn-secondary" (click)="exportExcel()">
                📊 Export Excel
              </button>
              <button class="btn btn-outline" (click)="printReport()">
                🖨️ Print / PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Table Preview -->
      <div class="preview-section">
        <h3>Report Preview ({{ filteredAssets().length }} assets matching filters)</h3>
        
        <div class="table-responsive" *ngIf="selectedReportType === 'ASSET_REGISTER' || selectedReportType === 'DEPRECIATION'">
          <table class="data-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Purchase Cost (₹)</th>
                <th *ngIf="selectedReportType === 'DEPRECIATION'">Net Book Value (₹)</th>
                <th *ngIf="selectedReportType === 'DEPRECIATION'">Depreciation (%)</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of filteredAssets()">
                <td><code>{{ a.id }}</code></td>
                <td><strong>{{ a.name }}</strong></td>
                <td>{{ a.category }}</td>
                <td>{{ a.vendor }}</td>
                <td>₹{{ a.totalPrice || a.unitPrice | number }}</td>
                <td *ngIf="selectedReportType === 'DEPRECIATION'">
                  ₹{{ getDepreciationInfo(a).currentValue | number }}
                </td>
                <td *ngIf="selectedReportType === 'DEPRECIATION'">
                  {{ getDepreciationInfo(a).depreciationPercentage }}%
                </td>
                <td><span class="badge badge-info">{{ a.status }}</span></td>
                <td>{{ a.locationText || a.locationId || 'Unassigned' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-responsive" *ngIf="selectedReportType === 'MAINTENANCE'">
          <table class="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Asset Name</th>
                <th>Service Date</th>
                <th>Service Type</th>
                <th>Technician</th>
                <th>Cost (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of maintenanceRecords">
                <td><code>{{ m.id }}</code></td>
                <td><strong>{{ m.assetName }}</strong></td>
                <td>{{ m.serviceDate | date:'mediumDate' }}</td>
                <td>{{ m.serviceType }}</td>
                <td>{{ m.technicianName }}</td>
                <td>₹{{ m.cost | number }}</td>
                <td><span class="badge badge-success">{{ m.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-responsive" *ngIf="selectedReportType === 'WARRANTY'">
          <table class="data-table">
            <thead>
              <tr>
                <th>Contract ID</th>
                <th>Asset Name</th>
                <th>Provider</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>AMC Cost (₹)</th>
                <th>Contact Email</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of warrantyRecords">
                <td><code>{{ w.id }}</code></td>
                <td><strong>{{ w.assetName }}</strong></td>
                <td>{{ w.provider }}</td>
                <td>{{ w.startDate | date:'mediumDate' }}</td>
                <td>{{ w.expiryDate | date:'mediumDate' }}</td>
                <td>₹{{ w.amcCost | number }}</td>
                <td>{{ w.email || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container { padding: 1.5rem; border-radius: 12px; }
    .panel-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; }
    .subtitle { margin-top: 0.25rem; color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }

    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
    .metric-card { background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
    .metric-label { display: block; font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-val { font-size: 1.6rem; font-weight: 700; color: #f8fafc; margin-top: 0.35rem; display: block; }
    .metric-desc { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; display: block; }
    
    .metric-card.success .metric-val { color: #10b981; }
    .metric-card.warning .metric-val { color: #f59e0b; }
    .metric-card.primary .metric-val { color: #8b5cf6; }

    .report-controls { padding: 1.25rem; border-radius: 10px; margin-bottom: 1.5rem; background: rgba(15, 23, 42, 0.6); }
    .control-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: flex-end; }
    .form-group label { display: block; font-size: 0.825rem; color: #94a3b8; margin-bottom: 0.35rem; }
    .form-control { width: 100%; padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #f8fafc; font-size: 0.9rem; }
    
    .btn-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #f8fafc; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-outline:hover { background: rgba(255,255,255,0.1); }

    .preview-section { margin-top: 1rem; }
    .preview-section h3 { font-size: 1.1rem; font-weight: 600; color: #e2e8f0; margin-bottom: 1rem; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th, .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.9rem; }
    .data-table th { background: rgba(255,255,255,0.03); color: #94a3b8; font-weight: 600; }
    
    .badge-info { background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; }
  `]
})
export class ReportsPanelComponent {
  @Input() assets: Asset[] = [];
  @Input() maintenanceRecords: MaintenanceRecord[] = [];
  @Input() warrantyRecords: WarrantyRecord[] = [];
  @Input() auditLogs: AuditLog[] = [];

  private exportService = inject(ExportService);
  private depreciationService = inject(DepreciationService);

  selectedReportType = 'ASSET_REGISTER';
  categoryFilter = 'All';
  statusFilter = 'All';

  portfolioStats = computed(() => {
    return this.depreciationService.calculatePortfolioDepreciation(this.assets);
  });

  totalMaintenanceCost = computed(() => {
    return this.maintenanceRecords.reduce((acc, r) => acc + (r.cost || 0), 0);
  });

  filteredAssets = computed(() => {
    return this.assets.filter(a => {
      const matchCat = this.categoryFilter === 'All' || a.category === this.categoryFilter;
      const matchStat = this.statusFilter === 'All' || a.status === this.statusFilter;
      return matchCat && matchStat;
    });
  });

  getDepreciationInfo(asset: Asset) {
    return this.depreciationService.calculateDepreciation(asset);
  }

  exportCSV() {
    if (this.selectedReportType === 'ASSET_REGISTER' || this.selectedReportType === 'DEPRECIATION') {
      this.exportService.exportAssetsCSV(this.filteredAssets());
    } else if (this.selectedReportType === 'MAINTENANCE') {
      this.exportService.exportGenericCSV(this.maintenanceRecords, 'Maintenance_Service_Report');
    } else if (this.selectedReportType === 'WARRANTY') {
      this.exportService.exportGenericCSV(this.warrantyRecords, 'Warranty_AMC_Report');
    } else if (this.selectedReportType === 'AUDIT_LOG') {
      this.exportService.exportAuditLogsCSV(this.auditLogs);
    }
  }

  exportExcel() {
    this.exportCSV(); // Excel-compatible CSV export format
  }

  printReport() {
    window.print();
  }
}
