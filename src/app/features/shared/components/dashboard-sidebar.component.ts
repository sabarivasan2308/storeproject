import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
}

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      <!-- Sidebar Header / Context -->
      <div class="p-4 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-inner">
            E
          </div>
          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</h2>
            <p class="text-[11px] font-medium text-slate-500 truncate max-w-[130px]">
              {{ role }} Portal
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        @for (item of getNavItems(); track item.id) {
          <button
            (click)="tabChange.emit(item.id)"
            [class]="getButtonClasses(item.id)"
          >
            <span class="text-lg opacity-80">{{ item.icon }}</span>
            <span class="flex-1 text-left">{{ item.label }}</span>

            @if (item.badge && item.badge > 0) {
              <span [class]="'px-2 py-0.5 text-[10px] font-bold rounded-full text-white shadow-sm ' + (item.badgeColor || 'bg-amber-500')">
                {{ item.badge }}
              </span>
            }
          </button>
        }
      </nav>

      <!-- Sidebar Footer Info -->
      <div class="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
        <span>KARE EAMP v2.0</span>
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online"></span>
      </div>
    </aside>
  `
})
export class DashboardSidebarComponent {
  @Input() activeTab: string = 'overview';
  @Input() role: 'Super Admin' | 'School Admin' = 'School Admin';
  @Input() pendingVerificationsCount: number = 0;

  @Output() tabChange = new EventEmitter<string>();

  getNavItems(): NavItem[] {
    if (this.role === 'Super Admin') {
      return [
        { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
        { id: 'assets', label: 'Master Asset Directory', icon: '📦' },
        { id: 'requests', label: 'Verifications & Approvals', icon: '⚡', badge: this.pendingVerificationsCount, badgeColor: 'bg-rose-500' },
        { id: 'bills', label: 'Procurement & Bills', icon: '📄' },
        { id: 'maintenance', label: 'Maintenance & Warranty', icon: '🛠️' },
        { id: 'audits', label: 'Audit Logs & History', icon: '🛡️' }
      ];
    }

    return [
      { id: 'overview', label: 'Institution Overview', icon: '📊' },
      { id: 'assets', label: 'Asset Inventory', icon: '📦' },
      { id: 'requests', label: 'Verification Requests', icon: '📝' },
      { id: 'maintenance', label: 'Maintenance Records', icon: '🛠️' },
      { id: 'warranty', label: 'Warranty & AMC', icon: '🛡️' }
    ];
  }

  getButtonClasses(tabId: string): string {
    const base = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ';
    if (this.activeTab === tabId) {
      return base + 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold';
    }
    return base + 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60';
  }
}
