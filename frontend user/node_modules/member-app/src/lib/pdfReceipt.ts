import { jsPDF } from 'jspdf';
import { formatRupees } from './currency';
import { formatDate } from './date';
import type { Receipt } from '@sanchay/core';

export interface ReceiptPdfData extends Receipt {
  groupName: string;
  memberName: string;
}

/**
 * Generates an offline PDF receipt using jsPDF.
 * Note: Uses standard Latin typography to ensure a lightweight client bundle (<100KB)
 * without embedding heavy multi-megabyte Devanagari font binaries on mobile.
 */
export function generatePdfReceipt(data: ReceiptPdfData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Outer border & frame
  // Outer border & frame
  doc.setDrawColor(199, 227, 250); // #C7E3FA
  doc.setLineWidth(0.8);
  doc.roundedRect(8, 8, pageWidth - 16, 194, 4, 4);

  // Top header accent line (Brand Blue)
  doc.setFillColor(29, 109, 181); // #1D6DB5
  doc.rect(8, 8, pageWidth - 16, 5, 'F');

  // Title & Group Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(11, 37, 64); // #0B2540
  doc.text('SANCHAY COMMUNITY LEDGER', pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(74, 101, 128); // #4A6580
  doc.text(data.groupName || 'Self-Help Group (Bachat Gat)', pageWidth / 2, 28, { align: 'center' });

  doc.setDrawColor(199, 227, 250);
  doc.line(16, 33, pageWidth - 16, 33);

  // Receipt Number & Stamp Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(29, 109, 181); // #1D6DB5
  doc.text(`RECEIPT NO: ${data.receiptNo}`, 16, 41);

  // Status Stamp: APPROVED in green
  doc.setDrawColor(30, 142, 90); // #1E8E5A
  doc.setLineWidth(0.5);
  doc.setFillColor(232, 246, 239); // #E8F6EF
  doc.roundedRect(pageWidth - 44, 36, 28, 8, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(30, 142, 90);
  doc.text('APPROVED', pageWidth - 30, 41.5, { align: 'center' });

  // Receipt Metadata Grid
  const startY = 52;
  const rowHeight = 9;

  const rows: [string, string][] = [
    ['Date of Payment', formatDate(data.date)],
    ['Member Name', data.memberName],
    ['Aadhaar ID (Masked)', data.maskedId],
    ['Payment Mode', data.mode.toUpperCase()],
    ['Ledger Tx ID', data.txId],
    ['Internal Receipt ID', data.receiptId],
  ];

  doc.setFontSize(10);
  rows.forEach(([label, value], index) => {
    const currentY = startY + index * rowHeight;
    if (index % 2 === 0) {
      doc.setFillColor(243, 249, 255); // #F3F9FF
      doc.rect(16, currentY - 6, pageWidth - 32, rowHeight, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 101, 128);
    doc.text(label, 20, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 37, 64);
    doc.text(value, pageWidth - 20, currentY, { align: 'right' });
  });

  // Highlight Box: Total Amount Paid
  const amountBoxY = startY + rows.length * rowHeight + 8;
  doc.setFillColor(243, 249, 255); // #F3F9FF
  doc.setDrawColor(29, 109, 181); // #1D6DB5
  doc.setLineWidth(0.5);
  doc.roundedRect(16, amountBoxY, pageWidth - 32, 22, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(74, 101, 128);
  doc.text('TOTAL AMOUNT RECEIVED', pageWidth / 2, amountBoxY + 7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(29, 109, 181); // #1D6DB5
  doc.text(formatRupees(data.amountPaise), pageWidth / 2, amountBoxY + 16, { align: 'center' });

  // Signatures & Verification Area
  const sigY = amountBoxY + 45;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(74, 101, 128);

  doc.setDrawColor(199, 227, 250);
  doc.line(22, sigY, 65, sigY);
  doc.text('Member Signature', 43.5, sigY + 4, { align: 'center' });

  doc.line(pageWidth - 65, sigY, pageWidth - 22, sigY);
  doc.text('SHG Officer / Authorized Stamp', pageWidth - 43.5, sigY + 4, { align: 'center' });

  // Footer Disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(74, 101, 128);
  doc.text(
    'This is a computer-generated offline receipt valid under Sanchay Community Bylaws.',
    pageWidth / 2,
    192,
    { align: 'center' }
  );

  const filename = `Receipt-${data.receiptNo || data.receiptId}.pdf`;
  doc.save(filename);
}
