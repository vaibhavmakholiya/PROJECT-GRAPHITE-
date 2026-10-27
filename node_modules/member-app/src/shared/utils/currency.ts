/**
 * Formats integer paise into standard Indian Rupee string representation (e.g. ₹1,25,000).
 * Rule 1: Money values are strictly represented as integer paise in the data layer.
 */
export function formatRupees(paise: number, includeDecimals = false): string {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0';

  const rupees = paise / 100;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Converts integer paise to numerical rupee amount for calculators / sliders.
 */
export function paiseToRupees(paise: number): number {
  return Math.floor(paise / 100);
}

/**
 * Converts whole rupee amount from user input to integer paise.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
