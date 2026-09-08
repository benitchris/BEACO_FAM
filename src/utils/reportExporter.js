import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Loads an image from URL and returns a base64 Data URL for jsPDF embedding
 */
const getBase64ImageFromUrl = async (imageUrl) => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to load logo image:', e);
    return null;
  }
};

/**
 * Generates and downloads a branded PDF report for BEACON FAM
 */
export async function exportToPdf({ title, subtitle, headers, rows, summaryCards = [], filename = 'beacon_fam_report', generatedBy = 'System User' }) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Try to load local logo image
  const logoDataUrl = await getBase64ImageFromUrl('./logo.png');

  // Header Banner
  doc.setFillColor(15, 23, 42); // #0f172a dark slate background
  doc.rect(0, 0, pageWidth, 35, 'F');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 12, 5, 25, 25);
    } catch (e) {
      console.error(e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BEACON FAM', logoDataUrl ? 42 : 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('Poultry & Egg Production Management System', logoDataUrl ? 42 : 14, 22);

  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | By: ${generatedBy}`, logoDataUrl ? 42 : 14, 28);

  let currentY = 43;

  // Report Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 14, currentY);
  currentY += 6;

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, currentY);
    currentY += 8;
  }

  // Summary KPI Cards (If provided)
  if (summaryCards && summaryCards.length > 0) {
    const cardWidth = (pageWidth - 28 - (summaryCards.length - 1) * 4) / summaryCards.length;
    summaryCards.forEach((card, idx) => {
      const x = 14 + idx * (cardWidth + 4);
      doc.setFillColor(248, 250, 252); // light background
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, currentY, cardWidth, 18, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label.toUpperCase(), x + 4, currentY + 6);

      doc.setFontSize(11);
      doc.setTextColor( card.color === 'emerald' ? 16 : card.color === 'rose' ? 225 : 15, card.color === 'emerald' ? 185 : card.color === 'rose' ? 29 : 23, card.color === 'emerald' ? 129 : card.color === 'rose' ? 72 : 42 );
      doc.text(String(card.value), x + 4, currentY + 14);
    });
    currentY += 24;
  }

  // Table rendering
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129], // Emerald primary
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 35, left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${data.pageNumber} of ${totalPages} — BEACON FAM Official Report`, pageWidth - 70, doc.internal.pageSize.getHeight() - 10);
    }
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generates and downloads an Excel spreadsheet (.xlsx) for BEACON FAM
 */
export function exportToExcel({ title, headers, rows, filename = 'beacon_fam_report' }) {
  const wb = XLSX.utils.book_new();

  // Create worksheet data array
  const wsData = [
    ['BEACON FAM — Poultry Management System'],
    [title],
    [`Report Generated: ${new Date().toLocaleString()}`],
    [],
    headers,
    ...rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths dynamically
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = String(h).length;
    rows.forEach(r => {
      const cellVal = String(r[colIdx] || '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
