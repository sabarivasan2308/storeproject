import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppUser, School } from '../../../core/models/types';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 px-4 lg:px-6 py-3 transition-colors duration-200">
      <div class="flex items-center justify-between gap-4">
        <!-- Left: Branding & Title -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
            K
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {{ title }}
              </h1>
              @if (user?.role === 'Super Admin') {
                <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 rounded-md">
                  Super Admin
                </span>
              } @else {
                <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 rounded-md">
                  School Admin
                </span>
              }
            </div>
            @if (subtitle) {
              <p class="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {{ subtitle }}
              </p>
            }
          </div>
        </div>

        <!-- Right Controls -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Super Admin School Filter Dropdown -->
          @if (user?.role === 'Super Admin' && schools.length > 0) {
            <div class="relative hidden sm:block">
              <select
                [ngModel]="selectedSchoolId"
                (ngModelChange)="onSchoolSelect($event)"
                class="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">🏢 All Institutions</option>
                @for (s of schools; track s.id) {
                  <option [value]="s.id">📍 {{ s.name }}</option>
                }
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          }

          <!-- Theme Toggle Button -->
          <button
            (click)="themeService.toggleTheme()"
            [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            class="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            @if (themeService.isDarkMode()) {
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            } @else {
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            }
          </button>

          <!-- Notification Bell Toggle -->
          <button
            (click)="toggleNotifications.emit()"
            class="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            @if (unreadNotificationsCount > 0) {
              <span class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {{ unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount }}
              </span>
            }
          </button>

          <!-- User Profile & Logout -->
          @if (user) {
            <div class="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                {{ user.name.substring(0, 2).toUpperCase() }}
              </div>
              <div class="hidden md:block text-left">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {{ user.name }}
                </p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {{ user.email }}
                </p>
              </div>

              <button
                (click)="logout.emit()"
                class="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                title="Logout Session"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class DashboardHeaderComponent {
  themeService = inject(ThemeService);

  @Input() user: AppUser | null = null;
  @Input() title: string = 'KARE Enterprise Asset Management';
  @Input() subtitle?: string = 'Institutional Asset & Procurement System';
  @Input() selectedSchoolId: string = 'All';
  @Input() schools: School[] = [];
  @Input() unreadNotificationsCount: number = 0;

  @Output() schoolChange = new EventEmitter<string>();
  @Output() toggleNotifications = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onSchoolSelect(id: string): void {
    this.schoolChange.emit(id);
  }
}
