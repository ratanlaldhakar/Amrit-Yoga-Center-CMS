// Indian Currency & Formatting Utilities for Amrit Yoga Center ERP

/**
 * Format number into Indian Rupee currency format (e.g. ₹1,25,000)
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  
  // Format using Indian locale
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);

  return `₹${formatted}`;
}

export const formatCurrency = formatINR;

/**
 * Format standard YYYY-MM-DD date to Indian display date "DD MMM YYYY" (e.g. "15 Sep 2026")
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format "YYYY-MM" to readable Month & Year (e.g. "September 2026")
 */
export function formatMonthYear(monthStr: string | null | undefined): string {
  if (!monthStr) return '—';
  try {
    // If it's in YYYY-MM format
    if (/^\d{4}-\d{2}$/.test(monthStr)) {
      const [year, month] = monthStr.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    return monthStr;
  } catch {
    return monthStr;
  }
}

/**
 * Calculates days overdue from a due date (returns > 0 if overdue, 0 if not yet overdue)
 */
export function calculateOverdueDays(dueDateStr: string, asOfDate: Date = new Date()): number {
  if (!dueDateStr) return 0;
  try {
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const today = new Date(asOfDate);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return 0;
  }
}

/**
 * Converts numbers into English words using the Indian numbering system for official receipts
 * e.g. 1500 -> "One Thousand Five Hundred Rupees Only"
 */
export function numberToWordsINR(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  if (!num || isNaN(num)) return '';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    if (n === 0) return '';
    if (n < 100) return convertTwoDigits(n);
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertTwoDigits(n % 100) : '');
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  let result = '';
  if (crore > 0) result += convertTwoDigits(crore) + ' Crore ';
  if (lakh > 0) result += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) result += convertTwoDigits(thousand) + ' Thousand ';
  if (remainder > 0) result += convertThreeDigits(remainder);

  return result.trim() + ' Rupees Only';
}

/**
 * Clean and format 10-digit Indian phone number
 */
export function cleanIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Generates direct WhatsApp click-to-chat URL
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = cleanIndianPhone(phone);
  const internationalPhone = `91${cleanPhone}`;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Gracefully formats period strings, transforming raw ISO date ranges
 * like "2026-10-15 to 2026-11-14" or "2026-10-15 - 2026-11-14" into
 * elegant human-readable strings like "15 Oct 2026 – 14 Nov 2026".
 */
export function formatPeriodGraceful(periodStr: string | null | undefined): string {
  if (!periodStr) return '—';
  const clean = periodStr.trim();

  // Pattern 1: YYYY-MM-DD to/–/- YYYY-MM-DD
  const rangeMatch = clean.match(/^(\d{4}-\d{2}-\d{2})\s*(?:to|–|-)\s*(\d{4}-\d{2}-\d{2})$/i);
  if (rangeMatch) {
    return `${formatDate(rangeMatch[1])} – ${formatDate(rangeMatch[2])}`;
  }

  // Pattern 2: Embedded in text e.g. "2026-10-15 to 2026-11-14"
  const embeddedMatch = clean.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|–|-)\s*(\d{4}-\d{2}-\d{2})/i);
  if (embeddedMatch) {
    return clean.replace(embeddedMatch[0], `${formatDate(embeddedMatch[1])} – ${formatDate(embeddedMatch[2])}`);
  }

  // Pattern 3: Single date YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return formatDate(clean);
  }

  // Pattern 4: YYYY-MM
  if (/^\d{4}-\d{2}$/.test(clean)) {
    return formatMonthYear(clean);
  }

  // Replace " to " with " – " if already has month names
  return clean.replace(/\s+to\s+/gi, ' – ');
}

