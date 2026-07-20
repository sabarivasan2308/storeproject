import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetTransfer } from '../../../core/models/types';

@Component({
  selector: 'app-movement-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-container">
      @if (transfers && transfers.length > 0) {
        <div class="timeline-track"></div>
        <div class="timeline-list">
          @for (transfer of sortedTransfers(); track transfer.id; let first = $first; let last = $last) {
            <div class="timeline-item animate-slide-in">
              <div class="timeline-badge" [class.badge-latest]="first">
                <span class="badge-dot"></span>
              </div>
              <div class="timeline-card glass-panel">
                <div class="timeline-header">
                  <span class="timeline-date">{{ transfer.transferDate | date:'medium' }}</span>
                  @if (first) {
                    <span class="badge badge-purple">Latest Position</span>
                  }
                </div>
                <div class="timeline-body">
                  <div class="movement-path">
                    <div class="path-node">
                      <span class="node-label">From:</span>
                      <strong class="node-name">{{ transfer.fromDepartmentName || 'Initial Procurement' }}</strong>
                    </div>
                    <div class="path-arrow">➔</div>
                    <div class="path-node">
                      <span class="node-label">To:</span>
                      <strong class="node-name">{{ transfer.toDepartmentName }}</strong>
                    </div>
                  </div>
                  
                  @if (transfer.transferReason) {
                    <div class="timeline-reason">
                      <span class="section-label">Reason:</span>
                      <p class="reason-text">"{{ transfer.transferReason }}"</p>
                    </div>
                  }
                </div>
                
                <div class="timeline-footer">
                  <div class="actor-info">
                    <span class="actor-label">Initiated by:</span>
                    <span class="actor-value">{{ transfer.transferredBy }}</span>
                  </div>
                  @if (transfer.approvedBy) {
                    <div class="actor-info">
                      <span class="actor-label">Approved by:</span>
                      <span class="actor-value">{{ transfer.approvedBy }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="no-timeline glass-panel">
          <span class="info-icon">📍</span>
          <p>No asset movements or location transfers recorded yet.</p>
          <span class="subtext">This asset remains at its initial seeded/procured location.</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline-container {
      position: relative;
      padding: 10px 0 20px 20px;
      margin-top: 15px;
    }

    .timeline-track {
      position: absolute;
      left: 6px;
      top: 20px;
      bottom: 20px;
      width: 2px;
      background: linear-gradient(to bottom, var(--accent-purple) 0%, rgba(139, 92, 246, 0.1) 100%);
      z-index: 1;
    }

    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .timeline-item {
      position: relative;
      display: flex;
      gap: 20px;
      z-index: 2;
    }

    .timeline-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 2px solid var(--text-muted);
      margin-top: 20px;
      margin-left: -26px;
      z-index: 3;
      transition: all var(--transition-fast);
    }

    .timeline-badge.badge-latest {
      border-color: var(--accent-purple);
      box-shadow: 0 0 10px var(--accent-purple-glow);
    }

    .badge-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--text-muted);
    }

    .badge-latest .badge-dot {
      background: var(--accent-purple);
      width: 6px;
      height: 6px;
      animation: pulse 2s infinite;
    }

    .timeline-card {
      flex-grow: 1;
      padding: 16px;
      border-radius: 12px;
      transition: transform var(--transition-fast), border-color var(--transition-fast);
    }

    .timeline-card:hover {
      transform: translateX(4px);
      border-color: rgba(139, 92, 246, 0.3);
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .timeline-date {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .movement-path {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.02);
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.03);
      margin-bottom: 12px;
    }

    .path-node {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .node-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .node-name {
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .path-arrow {
      color: var(--accent-purple);
      font-size: 1rem;
      align-self: center;
    }

    .timeline-reason {
      margin-bottom: 12px;
      padding-left: 4px;
    }

    .section-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 4px;
    }

    .reason-text {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-style: italic;
      line-height: 1.4;
    }

    .timeline-footer {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 10px;
      margin-top: 10px;
    }

    .actor-info {
      display: flex;
      gap: 6px;
      font-size: 0.75rem;
    }

    .actor-label {
      color: var(--text-muted);
    }

    .actor-value {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .no-timeline {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 20px;
      text-align: center;
      border-radius: 12px;
    }

    .info-icon {
      font-size: 1.8rem;
      margin-bottom: 10px;
    }

    .no-timeline p {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin-bottom: 6px;
      font-weight: 500;
    }

    .subtext {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .animate-slide-in {
      animation: slideIn 0.3s ease-out forwards;
    }
  `]
})
export class MovementTimelineComponent {
  @Input() transfers: AssetTransfer[] = [];

  sortedTransfers(): AssetTransfer[] {
    if (!this.transfers) return [];
    return [...this.transfers].sort((a, b) => 
      new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime()
    );
  }
}
