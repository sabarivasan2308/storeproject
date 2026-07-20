import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastMessage } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div [class]="getToastClasses(toast.type)">
          <div class="flex items-start gap-3">
            <span class="text-lg leading-none mt-0.5">{{ getToastIcon(toast.type) }}</span>
            <div class="flex-1 min-w-0">
              <h5 class="text-xs font-bold leading-snug tracking-tight">{{ toast.title }}</h5>
              <p class="text-[11px] opacity-90 leading-tight mt-0.5">{{ toast.message }}</p>
            </div>
            <button
              (click)="notificationService.dismissToast(toast.id)"
              class="text-xs opacity-60 hover:opacity-100 p-0.5 rounded transition-opacity"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  notificationService = inject(NotificationService);

  getToastClasses(type: ToastMessage['type']): string {
    const base = 'pointer-events-auto p-3.5 rounded-2xl shadow-xl backdrop-blur-md border text-white transition-all transform animate-in slide-in-from-top-2 duration-200 ';
    switch (type) {
      case 'success':
        return base + 'bg-emerald-600/95 border-emerald-500 shadow-emerald-900/20';
      case 'warning':
        return base + 'bg-amber-600/95 border-amber-500 shadow-amber-900/20';
      case 'danger':
        return base + 'bg-rose-600/95 border-rose-500 shadow-rose-900/20';
      case 'info':
      default:
        return base + 'bg-indigo-600/95 border-indigo-500 shadow-indigo-900/20';
    }
  }

  getToastIcon(type: ToastMessage['type']): string {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'danger': return '🚨';
      case 'info': default: return 'ℹ️';
    }
  }
}
