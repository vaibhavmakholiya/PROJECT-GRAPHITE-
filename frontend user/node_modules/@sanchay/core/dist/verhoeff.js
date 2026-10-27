1; /**
 * Verhoeff Algorithm for Aadhaar Checksum Validation
 * Reference: Dihedral group D5 multiplication table & permutation matrix.
 * Enforces Rule 5: Never store or log full Aadhaar. Only validate and drop.
 */
// Multiplication table (d)
const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
// Permutation table (p)
const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
// Inverse table (inv)
const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
/**
 * Validates whether an input Aadhaar number has a valid Verhoeff checksum.
 * Standard Aadhaar is exactly 12 digits, cannot start with 0 or 1.
 */
export function verhoeffValid(aadhaar) {
    if (typeof aadhaar !== 'string')
        return false;
    // Aadhaar must be 12 digits, no leading 0 or 1
    if (!/^[2-9]\d{11}$/.test(aadhaar))
        return false;
    let c = 0;
    const digits = aadhaar.split('').map(Number);
    const reversedDigits = digits.reverse();
    for (let i = 0; i < reversedDigits.length; i++) {
        const digit = reversedDigits[i];
        const perm = p[i % 8][digit];
        c = d[c][perm];
    }
    return c === 0;
}
/**
 * Generates a Verhoeff checksum digit for an 11-digit prefix.
 * Useful for test fixtures / seed data generation.
 */
export function generateVerhoeffCheckDigit(numStr) {
    let c = 0;
    const digits = numStr.split('').map(Number).reverse();
    for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        const perm = p[(i + 1) % 8][digit];
        c = d[c][perm];
    }
    return inv[c];
}
//# sourceMappingURL=verhoeff.js.map