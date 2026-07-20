import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppwriteService } from '../../../core/services/appwrite.service';
import { Asset, Location } from '../../../core/models/types';

@Component({
  selector: 'app-qr-scanner-sim',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (active) {
      <div class="scanner-backdrop">
        <div class="scanner-container glass-panel animate-zoom-in">
          <div class="scanner-header">
            <h2 class="display-header scanner-title">📷 Asset QR/Barcode Scanner Simulator</h2>
            <button class="btn-close" (click)="onClose()">✕</button>
          </div>

          <div class="scanner-body">
            <!-- Simulated Camera Stream Viewport -->
            <div class="camera-viewport" [class.scanning]="isScanning()" [class.success]="scanSuccess()">
              <div class="viewport-overlay">
                <div class="reticle">
                  <div class="reticle-corner top-left"></div>
                  <div class="reticle-corner top-right"></div>
                  <div class="reticle-corner bottom-left"></div>
                  <div class="reticle-corner bottom-right"></div>
                </div>
                <div class="scan-laser"></div>
                <span class="scanning-indicator">
                  {{ scanSuccess() ? 'SUCCESS ✅' : (isScanning() ? 'SCANNING...' : 'CAMERA STANDBY 📷') }}
                </span>
              </div>
            </div>

            <!-- Scan Controls -->
            <div class="scan-controls">
              <div class="form-group">
                <label class="form-label">Simulate Scan from List</label>
                <select class="form-input" [(ngModel)]="selectedAssetId" (change)="onAssetSelect()">
                  <option value="">-- Choose Asset to Scan --</option>
                  @for (a of assets(); track a.id) {
                    <option [value]="a.id">{{ a.name }} ({{ a.id }}) [{{ a.barcode || 'No Barcode' }}]</option>
                  }
                </select>
              </div>

              <div class="form-group-row">
                <div class="form-group flex-grow">
                  <label class="form-label">Or Type Barcode / Asset ID Manually</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    [(ngModel)]="manualBarcode" 
                    placeholder="e.g. BAR-AKCP-CH-002 or FR-AKCP-BT-F1-001"
                    (keyup.enter)="simulateScan()"
                  />
                </div>
                <button class="btn btn-primary btn-scan-action" (click)="simulateScan()" [disabled]="isScanning()">
                  Simulate Scan
                </button>
              </div>
            </div>

            <!-- Scan Result Display -->
            @if (scannedAsset(); as asset) {
              <div class="scan-result-panel animate-slide-in">
                <div class="result-header">
                  <h3>Scanned Asset Details</h3>
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

                <div class="result-detail-grid">
                  <div class="r-label">Name:</div>
                  <div class="r-value"><strong>{{ asset.name }}</strong></div>
                  
                  <div class="r-label">Asset ID:</div>
                  <div class="r-value"><code>{{ asset.id }}</code></div>

                  <div class="r-label">Barcode / QR:</div>
                  <div class="r-value"><code>{{ asset.barcode || asset.qrCode || '-' }}</code></div>

                  <div class="r-label">Model/Brand:</div>
                  <div class="r-value">{{ asset.brand }} / {{ asset.model }}</div>

                  <div class="r-label">Current Location:</div>
                  <div class="r-value">{{ asset.locationText || 'No Location' }}</div>
                </div>

                <!-- Action Panel -->
                <div class="result-action-panel">
                  <h4 class="action-section-title">Quick Actions</h4>
                  
                  <div class="quick-action-buttons">
                    <button class="btn btn-secondary btn-icon-action" (click)="verifyPresence(asset)" [disabled]="isActionLoading()">
                      📌 Physical Presence Check-In
                    </button>
                  </div>

                  <!-- Quick Transfer Inside Scanner -->
                  <div class="quick-transfer-box">
                    <h5>Move/Transfer Asset</h5>
                    <div class="form-group">
                      <label class="form-label">New Location/Department</label>
                      <select class="form-input" [(ngModel)]="transferLocationId">
                        <option value="">-- Choose New Location --</option>
                        @for (loc of locations(); track loc.id) {
                          <option [value]="loc.id">
                            {{ loc.institution }} - {{ loc.department }} ({{ loc.building }} / {{ loc.room }})
                          </option>
                        }
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Transfer Reason</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        [(ngModel)]="transferReason" 
                        placeholder="Reason for transferring the asset..."
                      />
                    </div>

                    <button class="btn btn-primary btn-sm" (click)="executeTransfer(asset)" [disabled]="isActionLoading() || !transferLocationId || !transferReason">
                      Confirm & Execute Transfer ➔
                    </button>
                  </div>
                </div>
              </div>
            } @else if (hasScanned && !isScanning()) {
              <div class="no-result-panel glass-panel animate-slide-in">
                <span class="warning-icon">⚠️</span>
                <p>No asset found with barcode/ID: "{{ lastScannedCode }}"</p>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .scanner-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .scanner-container {
      width: 100%;
      max-width: 650px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }

    .scanner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid var(--glass-border);
    }

    .scanner-title {
      font-size: 1.2rem;
      margin: 0;
    }

    .scanner-body {
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Camera Viewport Simulation */
    .camera-viewport {
      position: relative;
      height: 180px;
      background: #000;
      border-radius: 12px;
      border: 2px solid var(--glass-border);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color var(--transition-normal);
    }

    .camera-viewport.scanning {
      border-color: var(--accent-cyan);
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
    }

    .camera-viewport.success {
      border-color: var(--accent-green);
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
    }

    .viewport-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .reticle {
      position: relative;
      width: 100px;
      height: 100px;
      z-index: 10;
    }

    .reticle-corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 3px solid rgba(255, 255, 255, 0.35);
      transition: border-color var(--transition-fast);
    }

    .scanning .reticle-corner {
      border-color: var(--accent-cyan);
    }

    .success .reticle-corner {
      border-color: var(--accent-green);
    }

    .top-left { top: 0; left: 0; border-right: none; border-bottom: none; }
    .top-right { top: 0; right: 0; border-left: none; border-bottom: none; }
    .bottom-left { bottom: 0; left: 0; border-right: none; border-top: none; }
    .bottom-right { bottom: 0; right: 0; border-left: none; border-top: none; }

    .scan-laser {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--accent-red);
      box-shadow: 0 0 8px var(--accent-red);
      opacity: 0;
      z-index: 5;
    }

    .scanning .scan-laser {
      opacity: 1;
      animation: scanSweep 2s infinite ease-in-out;
    }

    .success .scan-laser {
      background: var(--accent-green);
      box-shadow: 0 0 8px var(--accent-green);
      opacity: 1;
      animation: none;
      top: 50%;
    }

    .scanning-indicator {
      position: absolute;
      bottom: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.6);
      background: rgba(0, 0, 0, 0.6);
      padding: 4px 10px;
      border-radius: 4px;
    }

    .scanning .scanning-indicator {
      color: var(--accent-cyan);
      animation: blink 1s infinite alternate;
    }

    .success .scanning-indicator {
      color: var(--accent-green);
      background: rgba(16, 185, 129, 0.15);
    }

    /* Controls styling */
    .scan-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(255, 255, 255, 0.02);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--glass-border);
    }

    .form-group-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .btn-scan-action {
      height: 42px;
      padding: 0 20px;
    }

    /* Result Panel */
    .scan-result-panel {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 10px;
    }

    .result-header h3 {
      font-size: 1rem;
      margin: 0;
      color: var(--text-primary);
    }

    .result-detail-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      row-gap: 8px;
      font-size: 0.85rem;
    }

    .r-label {
      color: var(--text-muted);
    }

    .r-value {
      color: var(--text-secondary);
    }

    /* Quick Action Panel */
    .result-action-panel {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-section-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin: 0 0 4px 0;
    }

    .quick-action-buttons {
      display: flex;
      gap: 10px;
    }

    .btn-icon-action {
      flex: 1;
      justify-content: center;
      gap: 8px;
      height: 38px;
      font-size: 0.85rem;
    }

    .quick-transfer-box {
      margin-top: 10px;
      padding: 14px;
      background: rgba(139, 92, 246, 0.03);
      border: 1px solid rgba(139, 92, 246, 0.15);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .quick-transfer-box h5 {
      margin: 0;
      font-size: 0.85rem;
      color: var(--accent-purple);
    }

    .no-result-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      text-align: center;
      border-radius: 12px;
    }

    .warning-icon {
      font-size: 1.8rem;
      margin-bottom: 8px;
    }

    .no-result-panel p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin: 0;
    }

    @keyframes scanSweep {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }

    @keyframes blink {
      0% { opacity: 0.4; }
      100% { opacity: 1; }
    }

    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .animate-zoom-in {
      animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class QRScannerSimComponent implements OnInit {
  @Input() active = false;
  @Output() close = new EventEmitter<void>();
  @Output() assetUpdated = new EventEmitter<void>();

  assets = signal<Asset[]>([]);
  locations = signal<Location[]>([]);

  selectedAssetId = '';
  manualBarcode = '';
  
  isScanning = signal<boolean>(false);
  scanSuccess = signal<boolean>(false);
  hasScanned = false;
  lastScannedCode = '';

  scannedAsset = signal<Asset | null>(null);
  
  // Transfer state
  transferLocationId = '';
  transferReason = '';
  isActionLoading = signal<boolean>(false);

  constructor(private appwriteService: AppwriteService) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const allAssets = await this.appwriteService.getAssets();
      this.assets.set(allAssets);

      const allLocations = await this.appwriteService.getLocations();
      this.locations.set(allLocations);
    } catch (e) {
      console.error('Error loading data for QR scanner:', e);
    }
  }

  onAssetSelect() {
    if (this.selectedAssetId) {
      const asset = this.assets().find(a => a.id === this.selectedAssetId);
      if (asset) {
        this.manualBarcode = asset.barcode || asset.id;
      }
    }
  }

  simulateScan() {
    const code = this.manualBarcode.trim();
    if (!code) return;

    this.isScanning.set(true);
    this.scanSuccess.set(false);
    this.scannedAsset.set(null);
    this.hasScanned = false;
    this.lastScannedCode = code;

    // Simulate 1.2 second camera autofocus and scanning process
    setTimeout(() => {
      this.isScanning.set(false);
      
      const foundAsset = this.assets().find(
        a => a.id.toLowerCase() === code.toLowerCase() || 
             (a.barcode && a.barcode.toLowerCase() === code.toLowerCase())
      );

      this.hasScanned = true;
      if (foundAsset) {
        this.scanSuccess.set(true);
        this.scannedAsset.set(foundAsset);
        // Clear transfer states
        this.transferLocationId = '';
        this.transferReason = '';
        // Play scan beep indicator flash
        setTimeout(() => this.scanSuccess.set(false), 800);
      } else {
        this.scanSuccess.set(false);
      }
    }, 1200);
  }

  async verifyPresence(asset: Asset) {
    this.isActionLoading.set(true);
    const currentUser = this.appwriteService.currentUser();
    try {
      // 1. Add audit log
      await this.appwriteService.addAuditLog({
        id: 'AUD-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userEmail: currentUser?.email || 'unknown',
        userName: currentUser?.name || 'Unknown',
        action: 'QR Scan Check-In',
        details: `Verified presence of Asset ID: ${asset.id} (${asset.name}) at Location: ${asset.locationText}`,
        reason: 'Physical presence verification'
      }, asset);

      alert(`Check-in successful! Asset "${asset.name}" physical presence verified.`);
      this.assetUpdated.emit();
    } catch (e) {
      console.error(e);
      alert('Error verifying presence. Please try again.');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  async executeTransfer(asset: Asset) {
    if (!this.transferLocationId || !this.transferReason) return;
    this.isActionLoading.set(true);

    const targetLoc = this.locations().find(l => l.id === this.transferLocationId);
    if (!targetLoc) {
      alert('Selected location not found.');
      this.isActionLoading.set(false);
      return;
    }

    try {
      const currentUser = this.appwriteService.currentUser();
      await this.appwriteService.transferAsset({
        asset: asset,
        toLocationId: this.transferLocationId,
        reason: this.transferReason,
        approvedBy: currentUser?.email || 'system'
      });

      alert(`Asset transferred successfully to ${targetLoc.department} (${targetLoc.room})!`);
      
      // Reload assets to reflect new location immediately in search
      await this.loadData();
      
      // Update scanned asset local copy to show new location
      const updated = this.assets().find(a => a.id === asset.id);
      if (updated) {
        this.scannedAsset.set(updated);
      }

      this.transferLocationId = '';
      this.transferReason = '';
      this.assetUpdated.emit();
    } catch (e) {
      console.error(e);
      alert('Error transferring asset. Please try again.');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  onClose() {
    this.active = false;
    this.scannedAsset.set(null);
    this.selectedAssetId = '';
    this.manualBarcode = '';
    this.hasScanned = false;
    this.close.emit();
  }
}
