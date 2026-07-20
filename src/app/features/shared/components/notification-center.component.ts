import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-left">
      <!-- Bell Trigger Button -->
      <button 
        type="button" 
        (click)="toggleOpen()" 
        class="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        title="Notification Center">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        @if (notificationService.unreadCount() > 0) {
          <span class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
            {{ notificationService.unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown Feed Panel -->
      @if (isOpen()) {
        <div class="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          
          <!-- Header -->
          <div class="p-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">Notifications</h3>
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {{ notificationService.unreadCount() }} unread
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <button (click)="notificationService.markAllAsRead()" class="text-blue-600 hover:underline dark:text-blue-400 font-medium">
                Mark all read
              </button>
              <span class="text-slate-300 dark:text-slate-700">•</span>
              <button (click)="notificationService.clearAll()" class="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400">
                Clear
              </button>
            </div>
          </div>

          <!-- Category Filter Tabs -->
          <div class="flex border-b border-slate-200 dark:border-slate-800 text-xs font-medium px-3 bg-white dark:bg-slate-900 overflow-x-auto">
            <button 
              (click)="filterCategory.set('all')"
              [class]="filterCategory() === 'all' ? 'border-blue-600 text-blue-600 dark:text-blue-400 border-b-2 py-2 px-2' : 'text-slate-500 hover:text-slate-700 py-2 px-2'">
              All
            </button>
            <button 
              (click)="filterCategory.set('request')"
              [class]="filterCategory() === 'request' ? 'border-blue-600 text-blue-600 dark:text-blue-400 border-b-2 py-2 px-2' : 'text-slate-500 hover:text-slate-700 py-2 px-2'">
              Requests
            </button>
            <button 
              (click)="filterCategory.set('warranty')"
              [class]="filterCategory() === 'warranty' ? 'border-blue-600 text-blue-600 dark:text-blue-400 border-b-2 py-2 px-2' : 'text-slate-500 hover:text-slate-700 py-2 px-2'">
              Warranty
            </button>
            <button 
              (click)="filterCategory.set('system')"
              [class]="filterCategory() === 'system' ? 'border-blue-600 text-blue-600 dark:text-blue-400 border-b-2 py-2 px-2' : 'text-slate-500 hover:text-slate-700 py-2 px-2'">
              System
            </button>
          </div>

          <!-- Notifications List Feed -->
          <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            @for (notif of filteredNotifications(); track notif.id) {
              <div 
                [class]="'p-3 transition-colors flex gap-3 items-start ' + (notif.read ? 'bg-white dark:bg-slate-900 opacity-75' : 'bg-blue-50/40 dark:bg-blue-950/20')">
                
                <!-- Category Icon -->
                <div class="mt-0.5 shrink-0">
                  @switch (notif.type) {
                    @case ('warning') {
                      <div class="w-7 h-7 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 flex items-center justify-center text-xs">⚠️</div>
                    }
                    @case ('danger') {
                      <div class="w-7 h-7 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 flex items-center justify-center text-xs">🚨</div>
                    }
                    @case ('success') {
                      <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center text-xs">✓</div>
                    }
                    @default {
                      <div class="w-7 h-7 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center text-xs">ℹ</div>
                    }
                  }
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <p class="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{{ notif.title }}</p>
                    <span class="text-[10px] text-slate-400 shrink-0">{{ formatTime(notif.timestamp) }}</span>
                  </div>
                  <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{{ notif.message }}</p>
                </div>

                <!-- Action Button -->
                <button 
                  (click)="notificationService.removeNotification(notif.id)"
                  class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1">
                  ✕
                </button>
              </div>
            } @empty {
              <div class="p-6 text-center text-slate-400 text-xs">
                No notifications found.
              </div>
            }
          </div>

        </div>
      }
    </div>
  `
})
export class NotificationCenterComponent {
  notificationService = inject(NotificationService);
  isOpen = signal<boolean>(false);
  filterCategory = signal<'all' | 'request' | 'warranty' | 'system'>('all');

  toggleOpen(): void {
    this.isOpen.update(v => !v);
  }

  filteredNotifications(): AppNotification[] {
    const cat = this.filterCategory();
    const all = this.notificationService.notifications();
    if (cat === 'all') return all;
    return all.filter(n => n.category === cat);
  }

  formatTime(isoStr: string): string {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
