/**
 * Date formatting helpers for Sanchay member app.
 */

export function formatDate(dateInput: string | number | Date): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(dateInput: string | number | Date): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatMonthYear(yyyymmOrDate: string | Date): string {
  if (typeof yyyymmOrDate === 'string' && /^\d{6}$/.test(yyyymmOrDate)) {
    const year = yyyymmOrDate.slice(0, 4);
    const month = parseInt(yyyymmOrDate.slice(4, 6), 10) - 1;
    const d = new Date(parseInt(year, 10), month, 1);
    return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(d);
  }

  const d = typeof yyyymmOrDate === 'string' ? new Date(yyyymmOrDate) : yyyymmOrDate;
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(d);
}
