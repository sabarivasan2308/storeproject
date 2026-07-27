import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceRecord, Asset } from '../../../core/models/types';

@Component({
  selector: 'app-maintenance-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="maintenance-container glass-panel">
      <div class="panel-header">
        <div>
          <h2>🛠️ Maintenance & Service Management</h2>
          <p class="subtitle">Track preventive maintenance schedules, repair history, service costs, and technician assignments.</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          ➕ Schedule Maintenance
        </button>
      </div>

      <!-- Stats Summary Row -->
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-label">Total Records</span>
          <span class="stat-val">{{ records.length }}</span>
        </div>
        <div class="stat-box warning">
          <span class="stat-label">Scheduled / Pending</span>
          <span class="stat-val">{{ pendingCount() }}</span>
        </div>
        <div class="stat-box info">
          <span class="stat-label">In Progress</span>
          <span class="stat-val">{{ inProgressCount() }}</span>
        </div>
        <div class="stat-box success">
          <span class="stat-label">Completed</span>
          <span class="stat-val">{{ completedCount() }}</span>
        </div>
        <div class="stat-box primary">
          <span class="stat-label">Total Cost Spend</span>
          <span class="stat-val">₹{{ totalCost() | number }}</span>
        </div>
      </div>

      <!-- Controls & Search -->
      <div class="filter-bar">
        <div class="search-input-wrap">
          <input 
            type="text" 
            placeholder="Search by asset, technician, type, or description..." 
            [(ngModel)]="searchQuery" 
            class="form-control"
          />
        </div>
        <select [(ngModel)]="statusFilter" class="form-control filter-select">
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select [(ngModel)]="typeFilter" class="form-control filter-select">
          <option value="All">All Types</option>
          <option value="Preventive">Preventive</option>
          <option value="Corrective">Corrective</option>
          <option value="Calibration">Calibration</option>
          <option value="Inspection">Inspection</option>
        </select>
      </div>

      <!-- Maintenance Table -->
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Asset Name</th>
              <th>Service Date</th>
              <th>Type</th>
              <th>Technician</th>
              <th>Status</th>
              <th>Cost (₹)</th>
              <th>Next Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rec of filteredRecords()">
              <td><code>{{ rec.id }}</code></td>
              <td><strong>{{ rec.assetName }}</strong></td>
              <td>{{ rec.serviceDate | date:'mediumDate' }}</td>
              <td>
                <span class="badge" [class.badge-blue]="rec.serviceType === 'Preventive'" [class.badge-orange]="rec.serviceType === 'Corrective'">
                  {{ rec.serviceType }}
                </span>
              </td>
              <td>
                <div>{{ rec.technicianName }}</div>
                <small class="text-muted">{{ rec.technicianContact }}</small>
              </td>
              <td>
                <span class="badge" 
                  [class.badge-yellow]="rec.status === 'Scheduled'"
                  [class.badge-blue]="rec.status === 'In Progress'"
                  [class.badge-green]="rec.status === 'Completed'"
                  [class.badge-red]="rec.status === 'Cancelled'"
                >
                  {{ rec.status }}
                </span>
              </td>
              <td>₹{{ rec.cost | number }}</td>
              <td>{{ rec.nextDueDate ? (rec.nextDueDate | date:'mediumDate') : '-' }}</td>
              <td class="action-cell">
                <button class="btn btn-secondary btn-sm" (click)="openEditModal(rec)">Edit</button>
                <button class="btn btn-danger btn-sm" (click)="deleteRecord.emit(rec.id)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="filteredRecords().length === 0">
              <td colspan="9" class="empty-state">
                No maintenance records found matching the current criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Maintenance Add/Edit Modal -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-card glass-panel">
          <div class="modal-header">
            <h3>{{ editingRecord().id ? 'Edit Maintenance Record' : 'Schedule Maintenance' }}</h3>
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
                <label>Service Date *</label>
                <input type="date" [(ngModel)]="formRecord.serviceDate" class="form-control" />
              </div>

              <div class="form-group">
                <label>Service Type *</label>
                <select [(ngModel)]="formRecord.serviceType" class="form-control">
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                  <option value="Calibration">Calibration</option>
                  <option value="Inspection">Inspection</option>
                </select>
              </div>

              <div class="form-group">
                <label>Status *</label>
                <select [(ngModel)]="formRecord.status" class="form-control">
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div class="form-group">
                <label>Technician / Agency Name</label>
                <input type="text" [(ngModel)]="formRecord.technicianName" placeholder="e.g. CareTech Services" class="form-control" />
              </div>

              <div class="form-group">
                <label>Technician Contact Info</label>
                <input type="text" [(ngModel)]="formRecord.technicianContact" placeholder="+91 9876543210" class="form-control" />
              </div>

              <div class="form-group">
                <label>Cost (₹)</label>
                <input type="number" [(ngModel)]="formRecord.cost" class="form-control" />
              </div>

              <div class="form-group">
                <label>Next Due Date</label>
                <input type="date" [(ngModel)]="formRecord.nextDueDate" class="form-control" />
              </div>

              <div class="form-group full-width">
                <label>Parts Replaced / Upgraded</label>
                <input type="text" [(ngModel)]="formRecord.partsReplaced" placeholder="e.g. RAM, Battery, Power Supply" class="form-control" />
              </div>

              <div class="form-group full-width">
                <label>Service Description & Notes</label>
                <textarea [(ngModel)]="formRecord.description" rows="3" class="form-control" placeholder="Detailed service notes..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitForm()">Save Maintenance Record</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .maintenance-container { padding: 1.5rem; border-radius: 12px; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .panel-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; }
    .subtitle { margin-top: 0.25rem; color: #64748b; font-size: 0.9rem; }
    
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-box { background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
    .stat-label { display: block; font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-val { font-size: 1.5rem; font-weight: 700; color: #f8fafc; margin-top: 0.25rem; display: block; }
    .stat-box.warning .stat-val { color: #f59e0b; }
    .stat-box.info .stat-val { color: #3b82f6; }
    .stat-box.success .stat-val { color: #10b981; }
    .stat-box.primary .stat-val { color: #8b5cf6; }

    .filter-bar { display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .search-input-wrap { flex: 1; min-width: 250px; }
    .filter-select { width: 180px; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th, .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.9rem; }
    .data-table th { background: rgba(255,255,255,0.03); color: #94a3b8; font-weight: 600; }
    .empty-state { text-align: center; color: #64748b; padding: 2rem; }

    .badge { padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
    .badge-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-orange { background: rgba(249, 115, 22, 0.15); color: #fb923c; }
    .badge-yellow { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-green { background: rgba(16, 185, 129, 0.15); color: #34d399; }
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
export class MaintenanceManagementComponent {
  @Input() records: MaintenanceRecord[] = [];
  @Input() assets: Asset[] = [];
  @Input() isSuperAdmin = false;

  @Output() saveRecord = new EventEmitter<Partial<MaintenanceRecord>>();
  @Output() deleteRecord = new EventEmitter<string>();

  searchQuery = '';
  statusFilter = 'All';
  typeFilter = 'All';

  showModal = signal(false);
  editingRecord = signal<Partial<MaintenanceRecord>>({});
  formAssetId = '';
  formRecord: Partial<MaintenanceRecord> = {};

  pendingCount = computed(() => this.records.filter(r => r.status === 'Scheduled').length);
  inProgressCount = computed(() => this.records.filter(r => r.status === 'In Progress').length);
  completedCount = computed(() => this.records.filter(r => r.status === 'Completed').length);
  totalCost = computed(() => this.records.reduce((acc, r) => acc + (r.cost || 0), 0));

  filteredRecords = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    return this.records.filter(r => {
      const matchSearch = !q || 
        r.assetName.toLowerCase().includes(q) || 
        r.technicianName.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      const matchStatus = this.statusFilter === 'All' || r.status === this.statusFilter;
      const matchType = this.typeFilter === 'All' || r.serviceType === this.typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  });

  openAddModal() {
    this.editingRecord.set({});
    this.formAssetId = '';
    this.formRecord = {
      serviceDate: new Date().toISOString().substring(0, 10),
      serviceType: 'Preventive',
      status: 'Scheduled',
      technicianName: '',
      technicianContact: '',
      cost: 0,
      description: '',
      partsReplaced: ''
    };
    this.showModal.set(true);
  }

  openEditModal(rec: MaintenanceRecord) {
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
    if (!this.formRecord.assetId || !this.formRecord.serviceDate) {
      alert('Please select an asset and specify the service date.');
      return;
    }
    this.saveRecord.emit(this.formRecord);
    this.closeModal();
  }
}
