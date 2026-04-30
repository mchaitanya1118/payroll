/**
 * Centralized formatting utilities for the Neqtra Rider Payroll System.
 * Ensures consistent display of currency, dates, and other pilot data.
 */

/**
 * Formats a number as Saudi Riyal (SAR) with 2 decimal places.
 * Example: 123.45 -> SAR 123.45
 */
export const formatCurrency = (
  amount: number | string, 
  currencyCode: string = 'SAR',
  symbol: string = 'SAR'
): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return `${symbol} 0.00`;
  
  try {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (e) {
    // Fallback if currency code is invalid for Intl
    return `${symbol} ${numericAmount.toFixed(2)}`;
  }
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
