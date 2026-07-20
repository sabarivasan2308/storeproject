import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getCardClasses()">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {{ title }}
          </p>
          <h4 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            @if (loading) {
              <span class="inline-block w-16 h-6 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></span>
            } @else {
              {{ value }}
            }
          </h4>
        </div>

        @if (icon) {
          <div [class]="getIconContainerClasses()">
            <span class="text-xl">{{ icon }}</span>
          </div>
        }
      </div>

      @if (subtitle || trend) {
        <div class="mt-3 flex items-center gap-2 text-xs">
          @if (trend) {
            <span [class]="trend.positive ? 'text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5' : 'text-red-600 dark:text-red-400 font-bold flex items-center gap-0.5'">
              {{ trend.positive ? '↑' : '↓' }} {{ trend.value }}%
            </span>
          }
          @if (subtitle) {
            <span class="text-slate-500 dark:text-slate-400">{{ subtitle }}</span>
          }
        </div>
      }
    </div>
  `
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = 0;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() color: 'blue' | 'emerald' | 'amber' | 'purple' | 'red' | 'indigo' | 'slate' = 'blue';
  @Input() trend?: { value: number; label: string; positive: boolean };
  @Input() loading: boolean = false;

  getCardClasses(): string {
    const base = 'p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden';
    return base;
  }

  getIconContainerClasses(): string {
    const base = 'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ';
    switch (this.color) {
      case 'emerald':
        return base + 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400';
      case 'amber':
        return base + 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400';
      case 'purple':
        return base + 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400';
      case 'red':
        return base + 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400';
      case 'indigo':
        return base + 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400';
      case 'slate':
        return base + 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
      case 'blue':
      default:
        return base + 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400';
    }
  }
}
