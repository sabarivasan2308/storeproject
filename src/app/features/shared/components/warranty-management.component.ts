import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarrantyRecord, Asset } from '../../../core/models/types';

@Component({
  selector: 'app-warranty-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="warranty-container glass-panel">
      <div class="panel-header">
        <div>
          <h2>🛡️ Warranty & AMC Contract Management</h2>
          <p class="subtitle">Monitor equipment warranties, Annual Maintenance Contracts (AMC), providers, costs, and renewal alerts.</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          ➕ Add Warranty / AMC
        </button>
      </div>

      <!-- Summary Metrics -->
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-label">Total Contracts</span>
          <span class="stat-val">{{ records.length }}</span>
        </div>
        <div class="stat-box success">
          <span class="stat-label">Active Warranties</span>
          <span class="stat-val">{{ activeCount() }}</span>
        </div>
        <div class="stat-box warning">
          <span class="stat-label">Expiring Soon (30 Days)</span>
          <span class="stat-val">{{ expiringCount() }}</span>
        </div>
        <div class="stat-box danger">
          <span class="stat-label">Expired</span>
          <span class="stat-val">{{ expiredCount() }}</span>
        </div>
        <div class="stat-box primary">
          <span class="stat-label">Total AMC Value</span>
          <span class="stat-val">₹{{ totalAmcValue() | number }}</span>
        </div>
      </div>

      <!-- Filters & Controls -->
      <div class="filter-bar">
        <div class="search-input-wrap">
          <input 
            type="text" 
            placeholder="Search by asset, provider, terms, or contact person..." 
            [(ngModel)]="searchQuery" 
            class="form-control"
          />
        </div>
        <select [(ngModel)]="statusFilter" class="form-control filter-select">
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      <!-- Warranty Table -->
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Asset Name</th>
              <th>Provider / Vendor</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
              <th>AMC Cost (₹)</th>
              <th>Status</th>
              <th>Contact Person</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rec of filteredRecords()">
              <td><code>{{ rec.id }}</code></td>
              <td><strong>{{ rec.assetName }}</strong></td>
              <td>{{ rec.provider }}</td>
              <td>{{ rec.startDate | date:'mediumDate' }}</td>
              <td>{{ rec.expiryDate | date:'mediumDate' }}</td>
              <td>₹{{ rec.amcCost | number }}</td>
              <td>
                <span class="badge" 
                  [class.badge-green]="getRecordStatus(rec) === 'Active'"
                  [class.badge-yellow]="getRecordStatus(rec) === 'Expiring Soon'"
                  [class.badge-red]="getRecordStatus(rec) === 'Expired'"
                >
                  {{ getRecordStatus(rec) }}
                </span>
              </td>
              <td>
                <div>{{ rec.contactPerson || '-' }}</div>
                <small class="text-muted">{{ rec.phone || rec.email }}</small>
              </td>
              <td class="action-cell">
                <button class="btn btn-secondary btn-sm" (click)="openEditModal(rec)">Edit</button>
                <button class="btn btn-danger btn-sm" (click)="deleteRecord.emit(rec.id)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="filteredRecords().length === 0">
              <td colspan="9" class="empty-state">
                No warranty or AMC records found matching your filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Warranty Modal -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-card glass-panel">
          <div class="modal-header">
            <h3>{{ editingRecord().id ? 'Edit Warranty / AMC Contract' : 'Add Warranty / AMC Contract' }}</h3>
            <button class="btn-close" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Target Asset *</label>
                <select [(ngModel)]="formAssetId" (change)="onAssetSelect()" class="form-control">
                  <option value="">Select Asset</option>
                  <option *ngFor="let a of assets" [value]="a.id">{{ a.name }} (ID: {{ a.id }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Warranty Provider / Vendor *</label>
                <input type="text" [(ngModel)]="formRecord.provider" placeholder="e.g. Dell Warranty Services" class="form-control" />
              </div>

              <div class="form-group">
                <label>Start Date *</label>
                <input type="date" [(ngModel)]="formRecord.startDate" class="form-control" />
              </div>

              <div class="form-group">
                <label>Expiry Date *</label>
                <input type="date" [(ngModel)]="formRecord.expiryDate" class="form-control" />
              </div>

              <div class="form-group">
                <label>AMC Annual Cost (₹)</label>
                <input type="number" [(ngModel)]="formRecord.amcCost" class="form-control" />
              </div>

              <div class="form-group">
                <label>Contact Person</label>
                <input type="text" [(ngModel)]="formRecord.contactPerson" placeholder="Service Engineer Name" class="form-control" />
              </div>

              <div class="form-group">
                <label>Contact Phone</label>
                <input type="text" [(ngModel)]="formRecord.phone" placeholder="+91 9876543210" class="form-control" />
              </div>

              <div class="form-group">
                <label>Contact Email</label>
                <input type="email" [(ngModel)]="formRecord.email" placeholder="support@provider.com" class="form-control" />
              </div>

              <div class="form-group full-width">
                <label>Coverage Terms & SLA Details</label>
                <textarea [(ngModel)]="formRecord.terms" rows="3" class="form-control" placeholder="Describe warranty scope, parts covered, SLA response times..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitForm()">Save Warranty Record</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .warranty-container { padding: 1.5rem; border-radius: 12px; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .panel-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; }
    .subtitle { margin-top: 0.25rem; color: #64748b; font-size: 0.9rem; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-box { background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
    .stat-label { display: block; font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-val { font-size: 1.5rem; font-weight: 700; color: #f8fafc; margin-top: 0.25rem; display: block; }
    .stat-box.success .stat-val { color: #10b981; }
    .stat-box.warning .stat-val { color: #f59e0b; }
    .stat-box.danger .stat-val { color: #ef4444; }
    .stat-box.primary .stat-val { color: #8b5cf6; }

    .filter-bar { display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .search-input-wrap { flex: 1; min-width: 250px; }
    .filter-select { width: 180px; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th, .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.9rem; }
    .data-table th { background: rgba(255,255,255,0.03); color: #94a3b8; font-weight: 600; }
    .empty-state { text-align: center; color: #64748b; padding: 2rem; }

    .badge { padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
    .badge-green { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-yellow { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-red { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 1100; backdrop-filter: blur(4px); }
    .modal-card { width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 1.5rem; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.75rem; margin-bottom: 1rem; }
    .modal-header h3 { margin: 0; font-size: 1.25rem; }
    .btn-close { background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .full-width { grid-column: 1 / -1; }
    .form-group label { display: block; font-size: 0.825rem; color: #94a3b8; margin-bottom: 0.35rem; }
    .form-control { width: 100%; padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #f8fafc; font-size: 0.9rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; }
    .action-cell { display: flex; gap: 0.5rem; }
  `]
})
export class WarrantyManagementComponent {
  @Input() records: WarrantyRecord[] = [];
  @Input() assets: Asset[] = [];
  @Input() isSuperAdmin = false;

  @Output() saveRecord = new EventEmitter<Partial<WarrantyRecord>>();
  @Output() deleteRecord = new EventEmitter<string>();

  searchQuery = '';
  statusFilter = 'All';

  showModal = signal(false);
  editingRecord = signal<Partial<WarrantyRecord>>({});
  formAssetId = '';
  formRecord: Partial<WarrantyRecord> = {};

  getRecordStatus(rec: WarrantyRecord): 'Active' | 'Expiring Soon' | 'Expired' {
    if (!rec.expiryDate) return 'Active';
    const exp = new Date(rec.expiryDate);
    if (isNaN(exp.getTime())) return 'Active';
    const diffDays = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays <= 30) return 'Expiring Soon';
    return 'Active';
  }

  activeCount = computed(() => this.records.filter(r => this.getRecordStatus(r) === 'Active').length);
  expiringCount = computed(() => this.records.filter(r => this.getRecordStatus(r) === 'Expiring Soon').length);
  expiredCount = computed(() => this.records.filter(r => this.getRecordStatus(r) === 'Expired').length);
  totalAmcValue = computed(() => this.records.reduce((acc, r) => acc + (r.amcCost || 0), 0));

  filteredRecords = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    return this.records.filter(r => {
      const st = this.getRecordStatus(r);
      const matchSearch = !q || 
        r.assetName.toLowerCase().includes(q) || 
        r.provider.toLowerCase().includes(q) || 
        (r.terms && r.terms.toLowerCase().includes(q)) ||
        r.id.toLowerCase().includes(q);
      const matchStatus = this.statusFilter === 'All' || st === this.statusFilter;
      return matchSearch && matchStatus;
    });
  });

  openAddModal() {
    this.editingRecord.set({});
    this.formAssetId = '';
    const now = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(now.getFullYear() + 1);

    this.formRecord = {
      startDate: now.toISOString().substring(0, 10),
      expiryDate: nextYear.toISOString().substring(0, 10),
      provider: '',
      contactPerson: '',
      phone: '',
      email: '',
      amcCost: 0,
      terms: ''
    };
    this.showModal.set(true);
  }

  openEditModal(rec: WarrantyRecord) {
    this.editingRecord.set(rec);
    this.formAssetId = rec.assetId;
    this.formRecord = { ...rec };
    this.showModal.set(true);
  }

  onAssetSelect() {
    const matched = this.assets.find(a => a.id === this.formAssetId);
    if (matched) {
      this.formRecord.assetId = matched.id;
      this.formRecord.assetName = matched.name;
    }
  }

  closeModal() {
    this.showModal.set(false);
  }

  submitForm() {
    if (!this.formRecord.assetId || !this.formRecord.provider || !this.formRecord.expiryDate) {
      alert('Please fill in required fields: Target Asset, Provider, and Expiry Date.');
      return;
    }
    this.saveRecord.emit(this.formRecord);
    this.closeModal();
  }
}
