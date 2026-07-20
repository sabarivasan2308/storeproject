import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
      
      <!-- Items Info & Page Size Picker -->
      <div class="flex items-center gap-3">
        <span>
          Showing <strong class="font-semibold text-slate-800 dark:text-slate-200">{{ startItem }}</strong> to 
          <strong class="font-semibold text-slate-800 dark:text-slate-200">{{ endItem }}</strong> of 
          <strong class="font-semibold text-slate-800 dark:text-slate-200">{{ totalItems }}</strong> entries
        </span>

        <div class="flex items-center gap-1.5 ml-2">
          <label for="pageSizeSelect" class="text-slate-500">Per page:</label>
          <select 
            id="pageSizeSelect"
            [value]="pageSize" 
            (change)="onPageSizeSelect($event)" 
            class="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200">
            @for (size of pageSizeOptions; track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Pagination Buttons -->
      <div class="flex items-center gap-1">
        <!-- Previous Page Button -->
        <button 
          type="button"
          (click)="goToPage(currentPage - 1)" 
          [disabled]="currentPage <= 1"
          class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium">
          ‹ Prev
        </button>

        <!-- Page Numbers -->
        @for (page of visiblePages(); track $index) {
          @if (page === -1) {
            <span class="px-2 py-1 text-slate-400">...</span>
          } @else {
            <button 
              type="button"
              (click)="goToPage(page)" 
              [class]="page === currentPage 
                ? 'px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold shadow-sm' 
                : 'px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium'">
              {{ page }}
            </button>
          }
        }

        <!-- Next Page Button -->
        <button 
          type="button"
          (click)="goToPage(currentPage + 1)" 
          [disabled]="currentPage >= totalPages"
          class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium">
          Next ›
        </button>
      </div>

    </div>
  `
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalItems: number = 0;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / (this.pageSize || 10)));
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    if (newSize && newSize !== this.pageSize) {
      this.pageSizeChange.emit(newSize);
    }
  }

  visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [1];

    if (current > 3) {
      pages.push(-1); // ellipsis
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push(-1); // ellipsis
    }

    pages.push(total);

    return pages;
  }
}
