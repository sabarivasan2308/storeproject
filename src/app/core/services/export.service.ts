import { Injectable } from '@angular/core';
import { Asset, ProcurementBill, Vendor, AuditLog } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const csvContent = [
      headers.map(h => `"${(h || '').replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => 
        row.map(cell => `"${(cell !== null && cell !== undefined ? String(cell) : '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename.replace(/[^a-z0-9_-]/gi, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportAssetsToCsv(assets: Asset[], filename = 'Assets_Export'): void {
    const headers = [
      'Asset ID', 'School ID', 'Name', 'Category', 'Brand', 'Model', 
      'Quantity', 'Unit Price', 'Total Price', 'Status', 'Location', 
      'Purchase Date', 'Warranty Expiry', 'Remarks'
    ];
    const rows = assets.map(a => [
      a.id,
      a.schoolId || '',
      a.name,
      a.category,
      a.brand,
      a.model,
      a.quantity,
      a.unitPrice,
      a.totalPrice,
      a.status,
      a.locationText || '',
      a.purchaseDate || '',
      a.warrantyExpiry || '',
      a.remarks || ''
    ]);
    this.exportToCsv(filename, headers, rows);
  }

  exportAssetsCSV(assets: Asset[], filename = 'Assets_Export'): void {
    this.exportAssetsToCsv(assets, filename);
  }

  exportBillsToCsv(bills: ProcurementBill[], filename = 'Bills_Export'): void {
    const headers = [
      'Bill Number', 'PO Number', 'Invoice Number', 'School', 'Vendor',
      'Department', 'Billing Date', 'Subtotal', 'GST', 'Grand Total', 
      'Payment Status', 'Payment Method'
    ];
    const rows = bills.map(b => [
      b.billNumber,
      b.purchaseOrderNumber || '',
      b.invoiceNumber || '',
      b.schoolName,
      b.vendorName,
      b.departmentName || '',
      b.billingDate || '',
      b.subtotal,
      b.gstAmount,
      b.grandTotal,
      b.paymentStatus,
      b.paymentMethod || ''
    ]);
    this.exportToCsv(filename, headers, rows);
  }

  exportVendorsToCsv(vendors: Vendor[], filename = 'Vendors_Export'): void {
    const headers = ['Vendor Name', 'GST', 'Phone', 'Email', 'Website', 'Payment Terms', 'Status'];
    const rows = vendors.map(v => [
      v.name,
      v.gst || '',
      v.phone || '',
      v.email || '',
      v.website || '',
      v.paymentTerms || '',
      v.active ? 'Active' : 'Inactive'
    ]);
    this.exportToCsv(filename, headers, rows);
  }

  exportAuditLogsToCsv(logs: AuditLog[], filename = 'Audit_Logs_Export'): void {
    const headers = ['ID', 'Date', 'User Name', 'User Email', 'Action', 'Details', 'Reason'];
    const rows = logs.map(l => [
      l.id,
      l.date,
      l.userName,
      l.userEmail,
      l.action,
      l.details,
      l.reason || ''
    ]);
    this.exportToCsv(filename, headers, rows);
  }

  exportAuditLogsCSV(logs: AuditLog[], filename = 'Audit_Logs_Export'): void {
    this.exportAuditLogsToCsv(logs, filename);
  }

  exportGenericCSV(items: any[], filename = 'Report_Export'): void {
    if (!items || items.length === 0) return;
    const headers = Object.keys(items[0]);
    const rows = items.map(item => headers.map(h => item[h]));
    this.exportToCsv(filename, headers, rows);
  }

  printReport(title: string, printableHtml: string): void {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-size: 20px; color: #0f172a; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; font-weight: 600; }
            .header-info { margin-bottom: 16px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="header-info">Generated on ${new Date().toLocaleString()}</div>
          ${printableHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}
