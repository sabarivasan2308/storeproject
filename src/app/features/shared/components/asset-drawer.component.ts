import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Asset, AssetTransfer } from '../../../core/models/types';
import { MovementTimelineComponent } from './movement-timeline.component';

@Component({
  selector: 'app-asset-drawer',
  standalone: true,
  imports: [CommonModule, MovementTimelineComponent],
  template: `
    @if (asset) {
      <div class="drawer-backdrop" (click)="close.emit()"></div>
      <aside class="side-drawer glass-panel" [class.open]="isOpen">
        <div class="drawer-header">
          <h2 class="drawer-title">Asset Details</h2>
          <button class="btn-close" (click)="close.emit()">✕</button>
        </div>
        
        <div class="drawer-body">
          <div class="qr-print-section">
            <img 
              [src]="'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + asset.id" 
              alt="QR Code" 
              class="drawer-qr"
            />
            <button class="btn btn-secondary btn-sm" (click)="printQR.emit(asset)">
              🖨️ Print QR Code
            </button>
          </div>

          @if (showAdminActions) {
            <div class="asset-export-actions">
              <button class="btn btn-secondary btn-sm" (click)="downloadJson.emit(asset)">JSON</button>
              <button class="btn btn-secondary btn-sm" (click)="downloadExcel.emit(asset)">Excel</button>
              <button class="btn btn-secondary btn-sm" (click)="downloadPdf.emit(asset)">PDF</button>
              <button class="btn btn-secondary btn-sm" (click)="printLabel.emit(asset)">Asset Label</button>
              <button class="btn btn-secondary btn-sm" (click)="printSheet.emit(asset)">Asset Sheet</button>
              <button class="btn btn-primary btn-sm" (click)="transfer.emit(asset)">Transfer</button>
            </div>
          }

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

              <div class="detail-label">Bill Reference</div>
              <div class="detail-value"><code>{{ asset.billId || '-' }}</code></div>

              <div class="detail-label">Department</div>
              <div class="detail-value">{{ asset.department || '-' }}</div>
              
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

          <div class="detail-section">
            <h3>Transfer History & Custody Timeline</h3>
            <app-movement-timeline [transfers]="transfers"></app-movement-timeline>
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
      border-left: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
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
      border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    }
    .drawer-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #fff 0%, var(--accent-purple, #8b5cf6) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-muted, #94a3b8);
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
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
    }
    .drawer-qr {
      width: 150px;
      height: 150px;
      background: #fff;
      padding: 8px;
      border-radius: 8px;
    }
    .asset-export-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.02);
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
      color: var(--accent-purple, #8b5cf6);
      margin-top: 0;
      margin-bottom: 12px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 8px 16px;
      font-size: 0.9rem;
    }
    .detail-label {
      color: var(--text-secondary, #94a3b8);
    }
    .detail-value {
      color: var(--text-primary, #f8fafc);
      word-break: break-all;
    }
    .remarks-text {
      font-size: 0.9rem;
      color: var(--text-secondary, #94a3b8);
      line-height: 1.5;
      background: rgba(255, 255, 255, 0.02);
      padding: 10px;
      border-radius: 6px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      margin: 0;
    }
    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
      line-height: 1;
    }
    .badge-green {
      background: rgba(34, 197, 94, 0.1);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .badge-red {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .badge-orange {
      background: rgba(249, 115, 22, 0.1);
      color: #fb923c;
      border: 1px solid rgba(249, 115, 22, 0.2);
    }
    .badge-blue {
      background: rgba(59, 130, 246, 0.1);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .badge-gray {
      background: rgba(148, 163, 184, 0.1);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-sm {
      padding: 4px 8px;
      font-size: 0.75rem;
      border-radius: 6px;
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
export class AssetDrawerComponent {
  @Input() asset: Asset | null = null;
  @Input() isOpen = false;
  @Input() transfers: AssetTransfer[] = [];
  @Input() showAdminActions = false;

  @Output() close = new EventEmitter<void>();
  @Output() printQR = new EventEmitter<Asset>();
  @Output() downloadJson = new EventEmitter<Asset>();
  @Output() downloadExcel = new EventEmitter<Asset>();
  @Output() downloadPdf = new EventEmitter<Asset>();
  @Output() printLabel = new EventEmitter<Asset>();
  @Output() printSheet = new EventEmitter<Asset>();
  @Output() transfer = new EventEmitter<Asset>();
}
