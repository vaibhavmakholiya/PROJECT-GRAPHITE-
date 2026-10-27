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
 */
export function generatePdfReceipt(data: ReceiptPdfData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

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
  doc.setFillColor(243, 249, 255); // #F3F9FF
  doc.roundedRect(16, 48, pageWidth - 32, 38, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(74, 101, 128); // Label color
  doc.text('Date of Payment', 22, 56);
  doc.text('Member Name', 22, 64);
  doc.text('Aadhaar Reference', 22, 72);
  doc.text('Payment Mode', 22, 80);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 37, 64); // Value color
  doc.text(formatDate(data.date), pageWidth - 22, 56, { align: 'right' });
  doc.text(data.memberName, pageWidth - 22, 64, { align: 'right' });
  doc.text(data.maskedId, pageWidth - 22, 72, { align: 'right' });
  doc.text(data.mode ? data.mode.toUpperCase() : 'CASH', pageWidth - 22, 80, { align: 'right' });

  // Amount Highlight Box
  doc.setFillColor(29, 109, 181); // #1D6DB5
  doc.roundedRect(16, 92, pageWidth - 32, 28, 3, 3, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(227, 241, 253); // #E3F1FD
  doc.text('AMOUNT RECEIVED', pageWidth / 2, 101, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(formatRupees(data.amountPaise), pageWidth / 2, 112, { align: 'center' });

  // Additional Details Table
  let currentY = 130;
  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(74, 101, 128);
    doc.text(label, 16, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 37, 64);
    doc.text(value, pageWidth - 16, currentY, { align: 'right' });

    doc.setDrawColor(243, 249, 255);
    doc.line(16, currentY + 2.5, pageWidth - 16, currentY + 2.5);
    currentY += 8;
  };

  addRow('Transaction Hash (TxID)', data.txId);
  addRow('Official Receipt Record ID', data.receiptId);
  addRow('Group Tenant ID', data.groupId);
  addRow('Audit Method', 'Append-Only Ledger Double-Entry');

  // Trust & Security Notice Box
  currentY += 6;
  doc.setFillColor(254, 247, 237); // #FEF7ED (Amber subtle)
  doc.roundedRect(16, currentY, pageWidth - 32, 16, 2, 2, 'F');
  doc.setDrawColor(245, 216, 160);
  doc.setLineWidth(0.4);
  doc.roundedRect(16, currentY, pageWidth - 32, 16, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(183, 121, 31); // #B7791F
  doc.text('DIGITAL RECEIPT INTEGRITY GUARANTEE', 20, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    'Generated offline on device. Verified with cryptographically hashed Aadhaar. Full PII protected.',
    20,
    currentY + 11
  );

  // Footer Signatures
  currentY += 26;
  doc.setDrawColor(199, 227, 250);
  doc.line(20, currentY, 65, currentY);
  doc.line(pageWidth - 65, currentY, pageWidth - 20, currentY);

  doc.setFontSize(8);
  doc.setTextColor(74, 101, 128);
  doc.text('Depositor Signature', 42.5, currentY + 4, { align: 'center' });
  doc.text('Treasurer / President', pageWidth - 42.5, currentY + 4, { align: 'center' });

  // Timestamp
  doc.setFontSize(6.5);
  doc.setTextColor(140, 165, 185);
  doc.text(
    `Document generated on ${new Date().toLocaleString('en-IN')} via Sanchay Ledger`,
    pageWidth / 2,
    196,
    { align: 'center' }
  );

  // Download PDF
  const filename = `Receipt_${data.receiptNo || data.receiptId}.pdf`;
  doc.save(filename);
}
