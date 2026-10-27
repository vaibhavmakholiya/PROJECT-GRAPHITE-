/**
 * Loan Schedule Generation Engine
 * Enforces Rule 1: Money is an integer in paise. Never use floats or decimals.
 * Supports:
 *   - 'flat': Fixed interest over tenure, distributed evenly with penny-exact remainder in last installment.
 *   - 'reducing': Monthly reducing balance EMI with full principal amortization and penny-exact remainder.
 */
import { assertSafePaise } from './balance.js';
/**
 * Calculates a future due date by adding N calendar months to the start date.
 * Handles end-of-month clamping (e.g., Jan 31 + 1 month -> Feb 28).
 */
export function addMonthsToDate(startDate, monthsToAdd) {
    const d = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate.getTime());
    const startDay = d.getUTCDate();
    // Set to 1st of month to avoid overflow during month change
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + monthsToAdd);
    // Determine last day of the target month
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    // Clamp to the original day or the max day of the target month
    d.setUTCDate(Math.min(startDay, lastDayOfTargetMonth));
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
/**
 * Generates an exact installment schedule in paise.
 * The last installment absorbs all fractional rounding so the total principal
 * amortized and total interest payable are 100% exact.
 */
export function generateSchedule(principal, ratePercent, method, installments, startDate) {
    assertSafePaise(principal, 'principal');
    if (installments <= 0 || !Number.isInteger(installments)) {
        throw new Error(`installments must be a positive integer, received: ${installments}`);
    }
    if (ratePercent < 0) {
        throw new Error(`ratePercent must be non-negative, received: ${ratePercent}`);
    }
    const schedule = [];
    if (method === 'flat') {
        // Total flat interest in paise = round(Principal * Rate * TenureYears)
        // Rate is percent, tenure is installments / 12
        const totalInterestPaise = Math.round((principal * ratePercent * installments) / 1200);
        const totalPayablePaise = principal + totalInterestPaise;
        const basePrincipal = Math.floor(principal / installments);
        const baseInterest = Math.floor(totalInterestPaise / installments);
        let accruedPrincipal = 0;
        let accruedInterest = 0;
        for (let i = 1; i <= installments; i++) {
            const isLast = i === installments;
            const principalPaise = isLast ? principal - accruedPrincipal : basePrincipal;
            const interestPaise = isLast ? totalInterestPaise - accruedInterest : baseInterest;
            const amountPaise = principalPaise + interestPaise;
            accruedPrincipal += principalPaise;
            accruedInterest += interestPaise;
            schedule.push({
                installmentNumber: i,
                dueDate: addMonthsToDate(startDate, i),
                amountPaise,
                principalPaise,
                interestPaise
            });
        }
    }
    else if (method === 'reducing') {
        // Monthly reducing balance
        const monthlyRate = ratePercent / 1200;
        let rawEmi;
        if (monthlyRate === 0) {
            rawEmi = Math.floor(principal / installments);
        }
        else {
            const factor = Math.pow(1 + monthlyRate, installments);
            rawEmi = Math.round((principal * monthlyRate * factor) / (factor - 1));
        }
        let remainingPrincipal = principal;
        for (let i = 1; i <= installments; i++) {
            const isLast = i === installments;
            const interestPaise = Math.round(remainingPrincipal * monthlyRate);
            let principalPaise;
            if (isLast) {
                principalPaise = remainingPrincipal; // Last installment absorbs remaining principal
            }
            else {
                principalPaise = Math.min(remainingPrincipal, Math.max(0, rawEmi - interestPaise));
            }
            const amountPaise = principalPaise + interestPaise;
            remainingPrincipal -= principalPaise;
            schedule.push({
                installmentNumber: i,
                dueDate: addMonthsToDate(startDate, i),
                amountPaise,
                principalPaise,
                interestPaise
            });
        }
    }
    else {
        throw new Error(`Unsupported interest method: ${method}`);
    }
    return schedule;
}
//# sourceMappingURL=schedule.js.map