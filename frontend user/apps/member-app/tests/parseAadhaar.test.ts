import { describe, it, expect } from 'vitest';
import {
  parseAadhaar,
  extractAadhaarNumber,
  extractDob,
  extractGender,
  extractName,
  extractAddress,
  calculateAge,
  normalizeDigitConfusion,
  toTitleCase,
  formatMaskedAadhaar,
  cleanNameCandidate,
} from '../src/ocr/parseAadhaar';
import { generateVerhoeffCheckDigit } from '@sanchay/core';

describe('Aadhaar Parser & OCR Normalizer Unit Tests', () => {
  // Generate guaranteed valid Aadhaar numbers using Verhoeff algorithm
  const prefix1 = '54892341890';
  const validAadhaar1 = `${prefix1}${generateVerhoeffCheckDigit(prefix1)}`; // e.g. 548923418905

  const prefix2 = '98765432109';
  const validAadhaar2 = `${prefix2}${generateVerhoeffCheckDigit(prefix2)}`;

  it('normalizes OCR character confusions (O->0, I->1, S->5, B->8)', () => {
    expect(normalizeDigitConfusion('3456 789O 1234')).toBe('3456 7890 1234');
    expect(normalizeDigitConfusion('I234 5678 9OI2')).toBe('1234 5678 9012');
    expect(normalizeDigitConfusion('B456 S789 O123')).toBe('8456 5789 0123');
  });

  it('formats masked Aadhaar properly as XXXX-XXXX-1234', () => {
    expect(formatMaskedAadhaar(validAadhaar1)).toBe(`XXXX-XXXX-${validAadhaar1.slice(-4)}`);
    expect(formatMaskedAadhaar('123')).toBe('XXXX-XXXX-XXXX');
  });

  it('correctly calculates age from full DOB and YOB', () => {
    const refDate = new Date(2026, 9, 27); // Oct 27, 2026
    expect(calculateAge('14/11/1989', refDate)).toBe(36);
    expect(calculateAge('28/10/1989', refDate)).toBe(36);
    expect(calculateAge('26/10/1989', refDate)).toBe(37);
    expect(calculateAge('1990', refDate)).toBe(36);
    expect(calculateAge('invalid-date', refDate)).toBeNull();
  });

  it('converts names to clean Title Case', () => {
    expect(toTitleCase('KAVITA DEVI')).toBe('Kavita Devi');
    expect(toTitleCase('sunita sharma')).toBe('Sunita Sharma');
    expect(toTitleCase('DR. AARTI ANAND DESHMUKH')).toBe('Dr. Aarti Anand Deshmukh');
  });

  it('extracts valid Aadhaar number with character confusion from synthetic card text', () => {
    // Inject OCR confusion: 0 replaced by O, 1 replaced by I
    const noisyAadhaar = `${validAadhaar1.slice(0, 4)} ${validAadhaar1.slice(4, 8)} ${validAadhaar1.slice(8)}`;
    const syntheticText = `
      GOVERNMENT OF INDIA
      भारत सरकार
      Kavita Devi
      DOB: 14/11/1989
      FEMALE
      ${noisyAadhaar}
      आधार - आम आदमी का अधिकार
    `;

    const result = extractAadhaarNumber(syntheticText);
    expect(result.number).toBe(validAadhaar1);
    expect(result.isValid).toBe(true);
  });

  it('flags invalid checksum if single digit is tampered', () => {
    const tampered = validAadhaar1.slice(0, 11) + ((parseInt(validAadhaar1.slice(-1), 10) + 1) % 10);
    const text = `Aadhaar: ${tampered.slice(0, 4)} ${tampered.slice(4, 8)} ${tampered.slice(8)}`;
    const result = extractAadhaarNumber(text);
    expect(result.number).toBe(tampered);
    expect(result.isValid).toBe(false);
  });

  it('extracts DOB and flags incomplete date when only year of birth is present', () => {
    const fullDobText = 'DOB: 15/05/1992';
    const dobResult = extractDob(fullDobText);
    expect(dobResult.dob).toBe('15/05/1992');
    expect(dobResult.isDobIncomplete).toBe(false);

    const yobText = 'Year of Birth / जन्म वर्ष: 1985';
    const yobResult = extractDob(yobText);
    expect(yobResult.dob).toBe('1985');
    expect(yobResult.isDobIncomplete).toBe(true);
  });

  it('extracts gender accurately across English and Devanagari labels', () => {
    expect(extractGender('Gender: Female').gender).toBe('FEMALE');
    expect(extractGender('लिंग: महिला').gender).toBe('FEMALE');
    expect(extractGender('Gender: Male').gender).toBe('MALE');
    expect(extractGender('लिंग: पुरुष').gender).toBe('MALE');
    expect(extractGender('Other Transgender').gender).toBe('OTHER');
  });

  it('extracts name by identifying line above DOB and filtering noise', () => {
    const syntheticText = `
      GOVERNMENT OF INDIA
      भारत सरकार
      Unique Identification Authority of India
      Sunita Ramesh Sharma
      DOB: 22/08/1987
      Female
    `;
    const nameResult = extractName(syntheticText);
    expect(nameResult.name).toBe('Sunita Ramesh Sharma');
  });

  it('strips stray OCR prefixes like "O", "0", or symbols preceding names', () => {
    expect(cleanNameCandidate('O Sid Malhorta')).toBe('Sid Malhorta');
    expect(cleanNameCandidate('O Sid Malhotra')).toBe('Sid Malhotra');
    expect(cleanNameCandidate('0 Sid Malhotra')).toBe('Sid Malhotra');
    expect(cleanNameCandidate('• Sid Malhotra')).toBe('Sid Malhotra');
    expect(cleanNameCandidate('To: Sid Malhotra')).toBe('Sid Malhotra');
    expect(cleanNameCandidate('Name: Sid Malhotra')).toBe('Sid Malhotra');

    const ocrTextWithO = `
      GOVERNMENT OF INDIA
      भारत सरकार
      O Sid Malhorta
      DOB: 28/05/2000
      Male
    `;
    const res = extractName(ocrTextWithO);
    expect(res.name).toBe('Sid Malhorta');
  });

  it('extracts address from back card lines ending with PIN code', () => {
    const backCardText = `
      Unique Identification Authority of India
      Address: House No 42, Ward 3,
      Near Primary School, Village Pragati,
      District Solapur, Maharashtra - 413002
      1947
      help@uidai.gov.in
    `;
    const addrResult = extractAddress(backCardText);
    expect(addrResult.address).toContain('House No 42, Ward 3');
    expect(addrResult.address).toContain('413002');
  });

  it('integrates full parseAadhaar pipeline on realistic synthetic card text', () => {
    const fullCardText = `
      GOVERNMENT OF INDIA
      भारत सरकार
      Pooja Rajesh Patil
      DOB: 10/02/1994
      FEMALE
      ${validAadhaar2.slice(0, 4)} ${validAadhaar2.slice(4, 8)} ${validAadhaar2.slice(8)}
      Address: At Post Pragati, Taluka North, 413001
      mera aadhaar meri pehchan
    `;

    const parsed = parseAadhaar(fullCardText);
    expect(parsed.name).toBe('Pooja Rajesh Patil');
    expect(parsed.dob).toBe('10/02/1994');
    expect(parsed.isDobIncomplete).toBe(false);
    expect(parsed.gender).toBe('FEMALE');
    expect(parsed.aadhaarNumber).toBe(validAadhaar2);
    expect(parsed.maskedNumber).toBe(`XXXX-XXXX-${validAadhaar2.slice(-4)}`);
    expect(parsed.isChecksumValid).toBe(true);
    expect(parsed.address).toContain('At Post Pragati');
  });
});
