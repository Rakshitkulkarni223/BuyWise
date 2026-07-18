import type { Product } from '../types';

/**
 * Export comparison results as CSV.
 */
export function exportToCSV(products: Product[], query: string): void {
  try {
    const headers = [
      'Supplier',
      'Product',
      'Brand',
      'Price (₹)',
      'Original Price (₹)',
      'Discount (%)',
      'Rating',
      'Reviews',
      'Delivery (days)',
      'In Stock',
      'URL',
    ];

    const rows = products.map((p) => [
      p.provider,
      `"${p.title.replace(/"/g, '""')}"`,
      p.brand,
      p.price,
      p.originalPrice,
      p.discount,
      p.rating,
      p.reviews,
      p.deliveryDays,
      p.availability ? 'Yes' : 'No',
      p.productUrl,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `BuyWise_${sanitize(query)}_comparison.csv`, 'text/csv');
  } catch {
    // silent
  }
}

/**
 * Export comparison results as a styled HTML report that opens in a new tab for printing/PDF.
 */
export function exportToPDF(
  products: Product[],
  query: string,
  category: string,
  recommendation?: { supplier: string; estimatedSavings: number; confidence: number } | null,
): void {
  try {
    const now = new Date().toLocaleString();

    const tableRows = products
      .map(
        (p, i) => `
      <tr style="${i % 2 ? 'background:#f8fafc;' : ''}">
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
          <strong>${p.provider}</strong>
          ${p.provider === recommendation?.supplier ? '<span style="background:#10b981;color:white;padding:1px 6px;border-radius:4px;font-size:10px;margin-left:4px;">BEST</span>' : ''}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${p.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${p.brand}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">₹${p.price.toLocaleString('en-IN')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${p.discount > 0 ? p.discount + '%' : '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">⭐ ${p.rating}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${p.deliveryDays === 0 ? 'Same day' : p.deliveryDays + ' days'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
          <span style="color:${p.availability ? '#10b981' : '#ef4444'}">${p.availability ? '● In Stock' : '● Out'}</span>
        </td>
      </tr>`,
      )
      .join('');

    const recSection = recommendation
      ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <h3 style="margin:0 0 8px;color:#166534;font-size:14px;">🏆 AI Recommendation: ${recommendation.supplier}</h3>
        <p style="margin:0;font-size:13px;color:#15803d;">
          Estimated savings: <strong>₹${recommendation.estimatedSavings.toLocaleString('en-IN')}</strong>
          &nbsp;·&nbsp; Confidence: <strong>${recommendation.confidence}%</strong>
        </p>
      </div>`
      : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>BuyWise Report — ${query}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 960px; margin: 0 auto; padding: 40px 20px; color: #1e293b; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #0f172a; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
    <div>
      <h1 style="margin:0;font-size:22px;">BuyWise</h1>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Supplier Comparison Report</p>
    </div>
    <button class="no-print" onclick="window.print()" style="background:#0f172a;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div style="display:flex;gap:24px;margin-bottom:20px;font-size:13px;color:#64748b;">
    <span><strong>Query:</strong> ${query}</span>
    <span><strong>Category:</strong> ${category}</span>
    <span><strong>Suppliers:</strong> ${products.length}</span>
    <span><strong>Generated:</strong> ${now}</span>
  </div>

  ${recSection}

  <table>
    <thead>
      <tr>
        <th>Supplier</th>
        <th>Product</th>
        <th>Brand</th>
        <th style="text-align:right">Price</th>
        <th style="text-align:center">Discount</th>
        <th style="text-align:center">Rating</th>
        <th style="text-align:center">Delivery</th>
        <th style="text-align:center">Stock</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <p style="margin-top:32px;font-size:11px;color:#94a3b8;text-align:center;">
    Generated by BuyWise · AI-Powered Procurement Intelligence · ${now}
  </p>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  } catch {
    // silent
  }
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // silent
  }
}

function sanitize(str: string): string {
  try {
    return str.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  } catch {
    return 'report';
  }
}
