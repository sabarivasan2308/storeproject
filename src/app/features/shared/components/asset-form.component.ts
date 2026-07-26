import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset, Location } from '../../../core/models/types';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (active) {
      <div class="modal-backdrop">
        <div class="glass-panel modal-card">
          <h2 class="display-header modal-title">{{ title }}</h2>
          
          <form (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Asset ID (e.g. FR-AKCP-BT-F1-001)</label>
                  <input type="text" class="form-input" [(ngModel)]="model.id" name="id" required [disabled]="isEditMode" />
                </div>
                <div class="form-group">
                  <label class="form-label">Asset Name</label>
                  <input type="text" class="form-input" [(ngModel)]="model.name" name="name" required />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select class="form-input" [(ngModel)]="model.category" name="category" required>
                    @for (cat of categoryList; track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select class="form-input" [(ngModel)]="model.status" name="status" required>
                    @for (status of statusList; track status) {
                      <option [value]="status">{{ status }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Brand</label>
                  <input type="text" class="form-input" [(ngModel)]="model.brand" name="brand" />
                </div>
                <div class="form-group">
                  <label class="form-label">Model</label>
                  <input type="text" class="form-input" [(ngModel)]="model.model" name="model" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Quantity</label>
                  <input type="number" class="form-input" [(ngModel)]="model.quantity" name="quantity" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Unit Price (₹)</label>
                  <input type="number" class="form-input" [(ngModel)]="model.unitPrice" name="unitPrice" required />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Location Mapping</label>
                  <select class="form-input" [(ngModel)]="model.locationId" name="locationId" required>
                    @for (loc of locations; track loc.id) {
                      <option [value]="loc.id">
                        {{ loc.institution }} - {{ loc.building }} ({{ loc.room }})
                      </option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Stored inside Container ID (Optional)</label>
                  <select class="form-input" [(ngModel)]="model.containerId" name="containerId">
                    <option [value]="undefined">None (Root Asset)</option>
                    @for (c of containerAssets; track c.id) {
                      @if (c.id !== model.id) {
                        <option [value]="c.id">{{ c.name }} ({{ c.id }})</option>
                      }
                    }
                  </select>
                </div>
              </div>

              <div class="form-group flex-row">
                <input type="checkbox" id="isContainer" [(ngModel)]="model.isContainer" name="isContainer" />
                <label for="isContainer" class="form-label pointer-label">Acts as a Container (Can hold other assets)</label>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Purchase Date</label>
                  <input type="date" class="form-input" [(ngModel)]="model.purchaseDate" name="purchaseDate" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Purchase Order (Alphanumeric)</label>
                  <input type="text" class="form-input" [(ngModel)]="model.purchaseOrder" name="purchaseOrder" placeholder="PO-12345" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Bill Number (Alphanumeric)</label>
                  <input type="text" class="form-input" [(ngModel)]="model.billNumber" name="billNumber" placeholder="BILL-9876" />
                </div>
                <div class="form-group">
                  <label class="form-label">Bill Date</label>
                  <input type="date" class="form-input" [(ngModel)]="model.billDate" name="billDate" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Vendor</label>
                  <select class="form-input" [(ngModel)]="model.vendor" name="vendor">
                    <option value="">Select Vendor</option>
                    @for (vendor of vendorList; track vendor) {
                      <option [value]="vendor">{{ vendor }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Warranty Details</label>
                  <input type="text" class="form-input" [(ngModel)]="model.warrantyDetails" name="warrantyDetails" placeholder="e.g. 3 Years Onsite" />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label class="form-label">Serial Number</label>
                  <input type="text" class="form-input" [(ngModel)]="model.serialNumber" name="serialNumber" placeholder="e.g. SN123456789" />
                </div>
                <div class="form-group">
                  <label class="form-label">Remarks</label>
                  <input type="text" class="form-input" [(ngModel)]="model.remarks" name="remarks" placeholder="Any additional notes..." />
                </div>
              </div>

              @if (showProposeReasonField) {
                <div class="form-group">
                  <label class="form-label">Reason for Adding Asset</label>
                  <input type="text" class="form-input" [(ngModel)]="proposeReason" name="proposeReason" required placeholder="Provide justification for Super Admin review" />
                </div>
              }
            </div>

            <div class="modal-buttons">
              <button type="button" class="btn btn-secondary" (click)="cancel.emit()">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ submitButtonText }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      max-width: 650px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }
    .modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      padding: 20px 24px;
      margin: 0;
      border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    }
    .modal-body {
      padding: 24px;
      overflow-y: auto;
      max-height: calc(90vh - 150px);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-row-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 640px) {
      .form-row-grid {
        grid-template-columns: 1fr;
      }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group.flex-row {
      flex-direction: row;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
    }
    .form-label {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-secondary, #94a3b8);
    }
    .pointer-label {
      cursor: pointer;
      user-select: none;
    }
    .form-input {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      color: #fff;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--accent-purple, #8b5cf6);
      background: rgba(255, 255, 255, 0.06);
    }
    .form-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      background: rgba(0, 0, 0, 0.2);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 20px;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--accent-purple, #8b5cf6);
      color: #fff;
    }
    .btn-primary:hover {
      background: #7c3aed;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary, #f8fafc);
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class AssetFormComponent implements OnInit, OnChanges {
  @Input() active = false;
  @Input() title = 'Add New Asset';
  @Input() submitButtonText = 'Save Asset';
  @Input() isEditMode = false;
  @Input() showProposeReasonField = false;

  @Input() asset: Partial<Asset> | null = null;
  @Input() categoryList: string[] = [];
  @Input() statusList: string[] = [];
  @Input() locations: Location[] = [];
  @Input() containerAssets: Asset[] = [];
  @Input() vendorList: string[] = [];

  @Output() save = new EventEmitter<{ asset: Partial<Asset>, proposeReason?: string }>();
  @Output() cancel = new EventEmitter<void>();

  model: Partial<Asset> = {};
  proposeReason = '';

  ngOnInit() {
    this.resetForm();
  }

  ngOnChanges() {
    if (this.active) {
      this.resetForm();
    }
  }

  resetForm() {
    if (this.asset) {
      this.model = { ...this.asset };
    } else {
      this.model = {
        id: '',
        name: '',
        category: this.categoryList[0] || '',
        status: (this.statusList[0] || 'Active') as Asset['status'],
        brand: '',
        model: '',
        quantity: 1,
        unitPrice: 0,
        isContainer: false,
        locationId: this.locations[0]?.id || '',
        containerId: undefined,
        purchaseDate: new Date().toISOString().substring(0, 10),
        purchaseOrder: '',
        billNumber: '',
        billDate: undefined,
        vendor: '',
        warrantyDetails: '',
        serialNumber: '',
        remarks: ''
      };
    }
    this.proposeReason = '';
  }

  onSubmit() {
    // Alphanumeric validation
    const alphaNumRegex = /^[a-zA-Z0-9]*$/;
    if (this.model.purchaseOrder && !alphaNumRegex.test(this.model.purchaseOrder)) {
      alert('Purchase Order must be alphanumeric (only letters and numbers allowed).');
      return;
    }
    if (this.model.billNumber && !alphaNumRegex.test(this.model.billNumber)) {
      alert('Bill Number must be alphanumeric (only letters and numbers allowed).');
      return;
    }

    // Date validations
    const today = new Date().toISOString().substring(0, 10);
    if (this.model.purchaseDate && this.model.purchaseDate > today) {
      alert('Purchase Date cannot be in the future.');
      return;
    }
    if (this.model.billDate) {
      if (this.model.billDate > today) {
        alert('Bill Date cannot be in the future.');
        return;
      }
      if (this.model.purchaseDate && this.model.billDate < this.model.purchaseDate) {
        alert('Bill Date cannot be earlier than Purchase Date.');
        return;
      }
    }

    // Perform calculated fields calculations
    if (this.model.quantity != null && this.model.unitPrice != null) {
      this.model.totalPrice = this.model.quantity * this.model.unitPrice;
    }
    this.model.qrCode = this.model.id;
    if (!this.model.barcode && this.model.id) {
      this.model.barcode = 'BAR-' + this.model.id;
    }

    this.save.emit({
      asset: this.model,
      proposeReason: this.showProposeReasonField ? this.proposeReason : undefined
    });
  }
}
