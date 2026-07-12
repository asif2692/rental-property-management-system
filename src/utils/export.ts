/**
 * CSV & Excel Client-Side Exporter
 */

export function exportToCSV(headers: string[], rows: any[][], fileName: string) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => 
      row.map(cell => {
        const val = cell === null || cell === undefined ? '' : String(cell);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(title: string, headers: string[], rows: any[][], fileName: string) {
  // Creates an XML Spreadsheet or HTML table that opens beautifully in Microsoft Excel
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${title.substring(0, 30)}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        .title-cell { font-size: 16px; font-weight: bold; color: #0f172a; height: 40px; }
        .header-cell { background-color: #334155; color: white; font-weight: bold; height: 30px; border: 0.5px solid #cbd5e1; }
        .data-cell { height: 25px; border: 0.5px solid #e2e8f0; }
        .text { mso-number-format:"\\@"; }
        .number { mso-number-format:"#,##0"; }
        .decimal { mso-number-format:"#,##0.00"; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="${headers.length}" class="title-cell">${title}</td></tr>
        <tr><td colspan="${headers.length}">Exported on: ${new Date().toLocaleDateString()}</td></tr>
        <tr></tr>
        <tr>
          ${headers.map(h => `<td class="header-cell">${h}</td>`).join('')}
        </tr>
        ${rows.map(row => `
          <tr>
            ${row.map(cell => {
              const isNum = typeof cell === 'number';
              const val = cell === null || cell === undefined ? '' : String(cell);
              const cellClass = isNum ? 'number' : 'text';
              return `<td class="data-cell ${cellClass}">${val}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers a beautiful styled browser print window representing the PDF Report.
 * Uses print-only classes from index.css to render a perfectly padded, grid-aligned report!
 */
export function triggerPDFPrint(title: string, headers: string[], rows: any[][], stats?: { label: string; value: string }[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups to print PDF reports.');
    return;
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const statsHTML = stats && stats.length > 0 
    ? `<div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
        ${stats.map(s => `
          <div style="flex: 1; min-width: 150px;">
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">${s.label}</div>
            <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">${s.value}</div>
          </div>
        `).join('')}
       </div>`
    : '';

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            padding: 40px;
            margin: 0;
            background-color: white;
          }
          .header-container {
            border-bottom: 2px solid #334155;
            padding-bottom: 15px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 5px 0;
          }
          .subtitle {
            font-size: 14px;
            color: #64748b;
            margin: 0;
          }
          .meta-date {
            font-size: 12px;
            color: #64748b;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
            text-align: left;
            padding: 10px 12px;
            font-size: 12px;
            border-bottom: 1.5px solid #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          td {
            padding: 10px 12px;
            font-size: 13px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
          }
          .mono {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
          }
          .text-right {
            text-align: right;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 500;
          }
          .badge-occupied { background-color: #dcfce7; color: #15803d; }
          .badge-vacant { background-color: #fee2e2; color: #b91c1c; }
          .badge-maintenance { background-color: #fef9c3; color: #a16207; }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            body { padding: 20px; }
            button { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div style="max-width: 1000px; margin: 0 auto;">
          <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;" class="no-print">
            <button onclick="window.print();" style="background-color: #0f172a; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: 500; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
              Print / Save as PDF
            </button>
          </div>
          
          <div class="header-container">
            <div>
              <h1 class="title">${title}</h1>
              <p class="subtitle">Rental Property Management System - Official Report</p>
            </div>
            <div class="meta-date">
              <div>Date Generated</div>
              <div style="font-weight: 600; color: #334155; margin-top: 2px;">${dateStr}</div>
            </div>
          </div>

          ${statsHTML}

          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(cell => {
                    const cellStr = String(cell);
                    let displayCell = cellStr;
                    
                    // Style badges or numeric columns if detected
                    if (cellStr === 'Occupied') {
                      displayCell = `<span class="badge badge-occupied">Occupied</span>`;
                    } else if (cellStr === 'Vacant') {
                      displayCell = `<span class="badge badge-vacant">Vacant</span>`;
                    } else if (cellStr === 'Maintenance') {
                      displayCell = `<span class="badge badge-maintenance">Maintenance</span>`;
                    } else if (cellStr.startsWith('PKR') || /^\d{2,3}-\d{2}-\d{4}$/.test(cellStr) || cellStr.includes('%')) {
                      displayCell = `<span class="mono">${cellStr}</span>`;
                    } else if (/^\d{5}-\d{7}-\d$/.test(cellStr)) { // CNIC
                      displayCell = `<span class="mono">${cellStr}</span>`;
                    }
                    
                    return `<td>${displayCell}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Generated by Rental Property Management System. All rights reserved &copy; ${new Date().getFullYear()}.
          </div>
        </div>
        <script>
          // Auto trigger printing after rendering is complete
          window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
              window.print();
            }, 500);
          });
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
