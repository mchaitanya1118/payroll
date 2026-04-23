/**
 * Centralized formatting utilities for the Neqtra Rider Payroll System.
 * Ensures consistent display of currency, dates, and other pilot data.
 */

/**
 * Formats a number as Kuwaiti Dinar (KWD) with 3 decimal places.
 * Example: 123.456 -> KWD 123.456
 */
export const formatCurrency = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return 'KWD 0.000';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(numericAmount);
};

/**
 * Formats a date into a human-readable string.
 * Example: 2024-05-15 -> 15 May 2024
 */
export const formatDate = (date: string | Date | null): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

/**
 * Normalizes text to Title Case (e.g. "active" -> "Active").
 */
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
