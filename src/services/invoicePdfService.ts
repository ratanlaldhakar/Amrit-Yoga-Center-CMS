// Reusable Invoice / Receipt PDF Generation & Sharing Service
// Features: Vector PDF generation via jsPDF, Web Share API Level 2 file sharing,
// dynamic filesystem-safe naming, reliable downloads, and pre-filled WhatsApp link generation.

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Receipt, CenterSettings, Student } from '../types';
import { formatDate, numberToWordsINR, formatPeriodGraceful } from '../lib/formatters';
import { resolveReceiptFinancials, resolveReceiptPlanName } from '../components/receipts/PrintableReceipt';
import { AMRIT_LOGO_BASE64 } from '../assets/logoBase64';
import { storageService } from './storageService';


/**
 * Format currency specifically for standard PDF fonts (avoids unicode ₹ mojibake in Type 1 fonts)
 */
export function formatCurrencyForPdf(amount: number): string {
  const formatted = Math.round(amount || 0).toLocaleString('en-IN');
  return `Rs. ${formatted}`;
}

/**
 * Strips special characters and spaces to create a clean filesystem-safe token
 */
export function sanitizeFilenameToken(text: string): string {
  return (text || '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/_+/g, '');
}

/**
 * Generates dynamic, meaningful, and filesystem-safe filename.
 * Example: AmritYoga_AYC-REC-1042_RameshKulkarni_Quarterly.pdf
 */
export function generateInvoiceFilename(receipt: Receipt, settings: CenterSettings): string {
  const { planName } = resolveReceiptFinancials(receipt);
  const centerToken = sanitizeFilenameToken(settings.centerName || 'AmritYoga');
  
  // Clean receipt number e.g. "AYC-REC-1042" -> "AYC-REC-1042" (preserve hyphen)
  const recNoToken = (receipt.receiptNo || 'REC')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .trim();

  const studentToken = sanitizeFilenameToken(receipt.studentName || 'Student');
  const planToken = sanitizeFilenameToken(planName).slice(0, 10);

  return `${centerToken}_${recNoToken}_${studentToken}_${planToken}.pdf`;
}

/**
 * Captures an on-screen HTML receipt container into a pristine, high-resolution A4 PDF Blob.
 * Guarantees 100% visual parity between the on-screen preview and the downloaded/shared file.
 */
export async function captureReceiptElementToPdfBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1024,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const maxContentWidth = pageWidth - margin * 2; // 186mm
  const maxContentHeight = pageHeight - margin * 2; // 273mm

  const imgWidth = maxContentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let renderHeight = imgHeight;
  let renderWidth = imgWidth;
  let posX = margin;
  let posY = margin;

  if (renderHeight > maxContentHeight) {
    renderHeight = maxContentHeight;
    renderWidth = (canvas.width * renderHeight) / canvas.height;
    posX = (pageWidth - renderWidth) / 2;
  } else {
    // Vertically center with comfortable top margin
    posY = Math.max(margin, (pageHeight - renderHeight) / 5);
  }

  pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
  return pdf.output('blob');
}

/**
 * Generates an official, high-resolution vector PDF receipt using jsPDF.
 */
export async function generateInvoicePDF(receipt: Receipt, settings: CenterSettings): Promise<Blob> {
  const { baseAmount, discountAmount, finalAmount, planName } = resolveReceiptFinancials(receipt);

  // Dynamically resolve student details from storage to avoid data holes
  const student: Student | undefined = (() => {
    try {
      const byId = storageService.getStudentById(receipt.studentId);
      if (byId) return byId;
      return storageService
        .getStudents()
        .find(
          s =>
            s.id === receipt.studentId ||
            (s.studentId && s.studentId === receipt.studentCode) ||
            s.fullName.toLowerCase() === (receipt.studentName || '').toLowerCase()
        );
    } catch {
      return undefined;
    }
  })();

  const resolvedStudentCode =
    receipt.studentCode ||
    student?.studentId ||
    `AYC-${receipt.studentId ? receipt.studentId.slice(-4).toUpperCase() : '2026-001'}`;

  const resolvedPhone =
    student?.whatsappNumber ||
    student?.mobileNumber ||
    '+91 77377 73384';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Brand Palette
  const colorDark = [15, 23, 42]; // Slate 900
  const colorPrimary = [180, 83, 9]; // Amber 700
  const colorSlate = [51, 65, 85]; // Slate 700
  const colorMuted = [100, 116, 139]; // Slate 500
  const colorLightBg = [248, 250, 252]; // Slate 50
  const colorBorder = [226, 232, 240]; // Slate 200
  const colorEmerald = [4, 120, 87]; // Emerald 700
  const colorEmeraldBg = [236, 253, 245]; // Emerald 50
  const colorEmeraldBorder = [167, 243, 208]; // Emerald 200

  // Top Accent Gradient Bar
  doc.setFillColor(colorEmerald[0], colorEmerald[1], colorEmerald[2]);
  doc.rect(margin, margin - 2, contentWidth, 1.5, 'F');

  // 1. Header Area
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2]);
  doc.roundedRect(margin, margin, contentWidth, 42, 2, 2, 'F');

  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, margin, contentWidth, 42, 2, 2, 'S');

  // Center Details (Left Header with Logo)
  const textX = margin + 30;
  try {
    doc.addImage(AMRIT_LOGO_BASE64, 'PNG', margin + 4, margin + 4, 22, 22);
  } catch (err) {
    console.warn('Could not render logo in PDF:', err);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text((settings.centerName || 'AMRIT YOGA CENTER').toUpperCase(), textX, margin + 9);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.text(settings.tagline || 'An Ultimate Health, Mind & Soul Resolution', textX, margin + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(settings.address || '3-M-7, 2nd Floor, Near Vinay Stationers, Govt. Hospital Road, Bapunagar, Bhilwara, Rajasthan 311001', textX, margin + 19);

  doc.text(`Phone: ${settings.phone || '+91 77377 73384'}   |   Email: ${settings.email || 'contact@amrityogacenter.in'}`, textX, margin + 24);

  if (settings.registrationNo) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Center Reg No: ${settings.registrationNo}`, textX, margin + 29);
  }

  // Right Header: Receipt Badge & Details
  const rightX = pageWidth - margin - 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('OFFICIAL FEE RECEIPT', rightX, margin + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(`#${receipt.receiptNo}`, rightX, margin + 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(`Issued: ${formatDate(receipt.issuedDate)}`, rightX, margin + 21, { align: 'right' });

  // Paid In Full Emerald Pill Badge
  doc.setFillColor(colorEmeraldBg[0], colorEmeraldBg[1], colorEmeraldBg[2]);
  doc.setDrawColor(colorEmeraldBorder[0], colorEmeraldBorder[1], colorEmeraldBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightX - 32, margin + 26, 32, 6.5, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colorEmerald[0], colorEmerald[1], colorEmerald[2]);
  doc.text('PAID IN FULL', rightX - 16, margin + 30.5, { align: 'center' });

  // 2. Metadata Grid (Billed To & Membership Cycle)
  const metaY = margin + 46;
  const colWidth = (contentWidth - 4) / 2;

  // Left Column: Student Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.roundedRect(margin, metaY, colWidth, 34, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('BILLED TO (STUDENT):', margin + 4, metaY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(receipt.studentName, margin + 4, metaY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text(`ID: ${resolvedStudentCode}   •   Batch: ${receipt.batchName || 'General Hatha'}`, margin + 4, metaY + 19);
  doc.text(`Plan: ${planName}`, margin + 4, metaY + 24);
  doc.text(`Mobile: ${resolvedPhone}`, margin + 4, metaY + 29);

  // Right Column: Membership Cycle Details
  const rightColX = margin + colWidth + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.roundedRect(rightColX, metaY, colWidth, 34, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('CYCLE & PAYMENT DETAILS:', rightColX + 4, metaY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);

  const periodLabel = formatPeriodGraceful(receipt.billingPeriod || receipt.feeMonth || 'Monthly Cycle');
  doc.text('Coverage Period:', rightColX + 4, metaY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(periodLabel, rightColX + colWidth - 4, metaY + 13, { align: 'right' });

  if (receipt.nextDueDate) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
    doc.text('Next Renewal Due:', rightColX + 4, metaY + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.text(formatDate(receipt.nextDueDate), rightColX + colWidth - 4, metaY + 19, { align: 'right' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text('Payment Mode:', rightColX + 4, metaY + 24);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.paymentMethod || 'UPI', rightColX + colWidth - 4, metaY + 24, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Receipt Status:', rightColX + 4, metaY + 29);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorEmerald[0], colorEmerald[1], colorEmerald[2]);
  doc.text('PAID & ACKNOWLEDGED', rightColX + colWidth - 4, metaY + 29, { align: 'right' });

  // 3. Line Items Table
  const tableY = metaY + 39;

  // Table Header
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2]);
  doc.rect(margin, tableY, contentWidth, 8, 'F');
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.line(margin, tableY + 8, margin + contentWidth, tableY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text('SR.', margin + 4, tableY + 5.5);
  doc.text('DESCRIPTION / PARTICULARS', margin + 18, tableY + 5.5);
  doc.text('CYCLE PERIOD', margin + 110, tableY + 5.5);
  doc.text('AMOUNT (INR)', pageWidth - margin - 4, tableY + 5.5, { align: 'right' });

  // Row 1: Membership Item
  const rowY = tableY + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text('1', margin + 4, rowY);
  doc.text('Yoga Center Membership, Tuition & Guided Instruction', margin + 18, rowY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text(`Batch: ${receipt.batchName || 'General'}  •  Plan: ${planName}`, margin + 18, rowY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(periodLabel, margin + 110, rowY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(formatCurrencyForPdf(baseAmount), pageWidth - margin - 4, rowY, { align: 'right' });

  // Separator Line
  let currentY = rowY + 12;
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.line(margin, currentY, margin + contentWidth, currentY);

  // Financial Breakdown Rows
  const hasDiscount = Boolean(discountAmount && discountAmount > 0);
  const summaryX = margin + 105;
  const summaryValX = pageWidth - margin - 4;

  if (hasDiscount) {
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
    doc.text('Base Plan Tuition Fee:', summaryX, currentY);
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    doc.text(formatCurrencyForPdf(baseAmount), summaryValX, currentY, { align: 'right' });

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorEmerald[0], colorEmerald[1], colorEmerald[2]);
    doc.text('Concession / Authorized Discount:', summaryX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`- ${formatCurrencyForPdf(discountAmount)}`, summaryValX, currentY, { align: 'right' });
  }

  // Total Paid Box (Emerald Card)
  currentY += 7;
  doc.setFillColor(colorEmeraldBg[0], colorEmeraldBg[1], colorEmeraldBg[2]);
  doc.roundedRect(summaryX - 5, currentY - 4, contentWidth - 100, 11, 1.5, 1.5, 'F');
  doc.setDrawColor(colorEmeraldBorder[0], colorEmeraldBorder[1], colorEmeraldBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(summaryX - 5, currentY - 4, contentWidth - 100, 11, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('TOTAL AMOUNT PAID:', summaryX, currentY + 3);
  doc.setFontSize(11);
  doc.setTextColor(colorEmerald[0], colorEmerald[1], colorEmerald[2]);
  doc.text(`Rs. ${finalAmount.toLocaleString('en-IN')}`, summaryValX, currentY + 3, { align: 'right' });

  // 4. Amount in Words Box
  currentY += 13;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('AMOUNT IN WORDS (INR):', margin + 4, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  const wordsText = numberToWordsINR(finalAmount);
  doc.text(wordsText, margin + 4, currentY + 9);

  // 5. Terms & Signatures
  const footerY = currentY + 20;

  // Terms (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
  doc.text('TERMS & CONDITIONS:', margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('1. Membership fees paid in advance are non-refundable and non-transferable.', margin, footerY + 4.5);
  doc.text('2. Please maintain regular attendance in your allotted batch time slot.', margin, footerY + 8.5);
  doc.text('3. Renewal payments are due on or before the scheduled next due date.', margin, footerY + 12.5);
  doc.text('4. This official computer-generated receipt serves as proof of payment.', margin, footerY + 16.5);

  // Signatory & Stamp (Right)
  const sigX = pageWidth - margin - 45;

  // Stamp: ONLY if uploaded and showStamp is enabled
  if (settings.showStamp !== false && settings.stampUrl && settings.stampUrl.startsWith('data:image')) {
    try {
      const format = settings.stampUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(settings.stampUrl, format, sigX - 22, footerY - 3, 18, 18);
    } catch (e) {
      console.warn('Could not add stamp to PDF:', e);
    }
  }

  // Signature: ONLY if showSignature is enabled
  if (settings.showSignature !== false && settings.signatureUrl && settings.signatureUrl.startsWith('data:image')) {
    try {
      const format = settings.signatureUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(settings.signatureUrl, format, sigX + 5, footerY - 1, 35, 14);
    } catch (e) {
      console.warn('Could not add signature to PDF:', e);
    }
  }

  doc.setDrawColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.setLineWidth(0.3);
  doc.line(sigX, footerY + 14, sigX + 45, footerY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(settings.signatoryName || 'Authorized Signatory', sigX + 22.5, footerY + 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text(settings.centerName || 'Amrit Yoga Center', sigX + 22.5, footerY + 22, { align: 'center' });

  // Bottom Center Footer Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text('Thank you for choosing Amrit Yoga Center. May your yoga journey bring health, peace, and vitality.', pageWidth / 2, pageHeight - 8, { align: 'center' });

  return doc.output('blob');
}

/**
 * Prepares the PDF as a JavaScript File object directly for the specific receipt.
 * Prioritizes 100% visual capture of the active rendered DOM element if available.
 */
export async function createInvoiceFile(
  receipt: Receipt,
  settings: CenterSettings,
  element?: HTMLElement | null
): Promise<File> {
  let blob: Blob;

  // 1. Try capturing the live on-screen element if available (guarantees 100% visual parity!)
  const targetElement =
    element ||
    (typeof document !== 'undefined'
      ? document.getElementById('official-receipt-print-target')
      : null);

  if (targetElement) {
    try {
      blob = await captureReceiptElementToPdfBlob(targetElement);
    } catch (captureErr) {
      console.warn('DOM capture to PDF failed, falling back to vector generator:', captureErr);
      blob = await generateInvoicePDF(receipt, settings);
    }
  } else {
    blob = await generateInvoicePDF(receipt, settings);
  }

  const fileName = generateInvoiceFilename(receipt, settings);
  return new File([blob], fileName, { type: 'application/pdf' });
}

/**
 * Downloads the PDF directly with the exact meaningful filename.
 * Safe for both desktop and mobile browsers.
 */
export async function downloadInvoicePDF(
  receipt: Receipt,
  settings: CenterSettings,
  element?: HTMLElement | null
): Promise<string> {
  const file = await createInvoiceFile(receipt, settings, element);
  const blobUrl = URL.createObjectURL(file);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL after short delay
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  return file.name;
}

/**
 * Shares the PDF using Web Share API Level 2 file sharing.
 * If unsupported or cancelled, falls back cleanly to download.
 */
export async function shareInvoicePDF(
  receipt: Receipt,
  settings: CenterSettings,
  element?: HTMLElement | null
): Promise<{ shared: boolean; fallbackDownloaded: boolean; error?: string }> {
  try {
    const file = await createInvoiceFile(receipt, settings, element);
    const invoiceTitle = `${settings.centerName || 'Amrit Yoga Center'} Invoice - ${receipt.receiptNo}`;

    // Verify Web Share API Level 2 support with file sharing
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: invoiceTitle,
        text: `Receipt ${receipt.receiptNo} for ${receipt.studentName} (${formatCurrencyForPdf(receipt.amount)}) from ${settings.centerName}`,
      });
      return { shared: true, fallbackDownloaded: false };
    }

    // Fallback: If browser does not support file sharing, download the file
    await downloadInvoicePDF(receipt, settings, element);
    return { shared: false, fallbackDownloaded: true };
  } catch (err: any) {
    // If user cancelled the native share sheet, do not consider it a failure
    if (err.name === 'AbortError') {
      return { shared: false, fallbackDownloaded: false };
    }

    console.warn('Share failed, initiating fallback download:', err);
    try {
      await downloadInvoicePDF(receipt, settings, element);
      return { shared: false, fallbackDownloaded: true };
    } catch (downloadErr: any) {
      return { shared: false, fallbackDownloaded: false, error: downloadErr.message };
    }
  }
}

/**
 * Opens WhatsApp chat for the student's phone number with a pre-filled receipt message.
 * DOES NOT auto-send. The admin reviews and manually taps send, then attaches the PDF.
 * Works seamlessly with unsaved phone numbers via https://wa.me/<number>.
 */
export function openWhatsAppForInvoice(
  receipt: Receipt,
  studentPhone: string,
  settings: CenterSettings
): { success: boolean; message: string; internationalNumber?: string } {
  const cleanPhone = (studentPhone || '').replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, message: 'No valid 10-digit phone number found for this student.' };
  }

  // Ensure standard international format for India (91 + 10 digits)
  const internationalNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const studentName = receipt.studentName || 'Student';
  const centerName = settings.centerName || 'Amrit Yoga Center';
  const amountStr = formatCurrencyForPdf(receipt.amount);
  const periodStr = receipt.billingPeriod || receipt.feeMonth || 'Monthly Cycle';
  const nextDueStr = receipt.nextDueDate ? formatDate(receipt.nextDueDate) : '';

  let message = `Namaste ${studentName} ji 🙏\n\n` +
    `Please find your *${centerName}* invoice / receipt for *${periodStr}*.\n\n` +
    `📄 *Receipt No:* ${receipt.receiptNo}\n` +
    `💳 *Amount Paid:* ${amountStr}\n` +
    `📅 *Payment Date:* ${formatDate(receipt.issuedDate)}\n` +
    `📆 *Coverage Period:* ${periodStr}\n`;

  if (nextDueStr) {
    message += `📌 *Next Renewal Due:* ${nextDueStr}\n`;
  }

  message += `\nThank you,\n${centerName}\n📞 ${settings.phone || '+91 98230 45678'}`;

  const waUrl = `https://wa.me/${internationalNumber}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  return { success: true, message: `WhatsApp opened for +${internationalNumber}`, internationalNumber };
}

/**
 * Prints the official vector invoice PDF directly using an isolated iframe
 * to guarantee 100% layout and content fidelity with the downloaded PDF.
 */
export async function printInvoicePDF(
  receipt: Receipt,
  settings: CenterSettings,
  element?: HTMLElement | null
): Promise<void> {
  const targetElement =
    element ||
    (typeof document !== 'undefined'
      ? document.getElementById('official-receipt-print-target')
      : null);

  let blob: Blob;
  if (targetElement) {
    try {
      blob = await captureReceiptElementToPdfBlob(targetElement);
    } catch {
      blob = await generateInvoicePDF(receipt, settings);
    }
  } else {
    blob = await generateInvoicePDF(receipt, settings);
  }

  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.src = blobUrl;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      URL.revokeObjectURL(blobUrl);
    }, 3000);
  };
}
