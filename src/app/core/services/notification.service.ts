import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  category: 'request' | 'warranty' | 'maintenance' | 'system';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'System Initialized',
      message: 'KARE Enterprise EAMP Realtime engine active.',
      type: 'info',
      category: 'system',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);

  toasts = signal<ToastMessage[]>([]);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  showToast(title: string, message: string, type: 'info' | 'warning' | 'success' | 'danger' = 'info', duration: number = 4000): void {
    const id = 'toast-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const toast: ToastMessage = { id, title, message, type, duration };
    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismissToast(id);
      }, duration);
    }
  }

  dismissToast(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      read: false
    };
    this.notifications.update(current => [newNotif, ...current]);
  }

  markAsRead(id: string): void {
    this.notifications.update(current =>
      current.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllAsRead(): void {
    this.notifications.update(current =>
      current.map(n => ({ ...n, read: true }))
    );
  }

  removeNotification(id: string): void {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }

  clearAll(): void {
    this.notifications.set([]);
  }

  success(message: string, title = 'Success'): void {
    this.showToast(title, message, 'success');
  }

  error(message: string, title = 'Error'): void {
    this.showToast(title, message, 'danger');
  }

  warning(message: string, title = 'Warning'): void {
    this.showToast(title, message, 'warning');
  }

  info(message: string, title = 'Information'): void {
    this.showToast(title, message, 'info');
  }
}
