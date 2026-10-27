import { verhoeffValid } from '@sanchay/core';

export interface OCRWord {
  text: string;
  confidence: number;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface AadhaarParseResult {
  rawText: string;
  aadhaarNumber: string | null;       // 12 digits, strictly memory-only
  maskedNumber: string | null;        // "XXXX-XXXX-1234"
  isChecksumValid: boolean;
  name: string | null;
  dob: string | null;                 // "DD/MM/YYYY" or "YYYY"
  isDobIncomplete: boolean;           // true if only year is found
  age: number | null;                 // calculated client-side
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  address: string | null;
  confidences: {
    aadhaarNumber: number;
    name: number;
    dob: number;
    gender: number;
    address: number;
  };
  warnings: string[];
}

// Common OCR character substitution mapping for numeric strings
const CHAR_TO_DIGIT_MAP: Record<string, string> = {
  O: '0', o: '0', Q: '0', D: '0',
  I: '1', l: '1', '|': '1', '!': '1', i: '1', ']': '1', '[': '1',
  Z: '2', z: '2',
  E: '3',
  A: '4',
  S: '5', s: '5', '$': '5',
  G: '6', b: '6',
  T: '7',
  B: '8', '&': '8',
  g: '9', q: '9',
};

/**
 * Normalizes potential digits in OCR misreads (e.g. '3456 789O 1234' -> '3456 7890 1234')
 */
export function normalizeDigitConfusion(str: string): string {
  return str
    .split('')
    .map((ch) => CHAR_TO_DIGIT_MAP[ch] || ch)
    .join('');
}

/**
 * Converts a string into title case (e.g. "SUNITA DEVI" -> "Sunita Devi")
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

/**
 * Calculates current age from a DOB string ("DD/MM/YYYY" or "YYYY")
 */
export function calculateAge(dobStr: string, referenceDate: Date = new Date()): number | null {
  if (!dobStr) return null;

  // Full DD/MM/YYYY or DD-MM-YYYY
  const fullMatch = dobStr.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (fullMatch) {
    const day = parseInt(fullMatch[1], 10);
    const month = parseInt(fullMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(fullMatch[3], 10);
    const birthDate = new Date(year, month, day);
    if (isNaN(birthDate.getTime())) return null;

    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }

  // Year only
  const yearMatch = dobStr.match(/^(\d{4})$/);
  if (yearMatch) {
    const birthYear = parseInt(yearMatch[1], 10);
    const currentYear = referenceDate.getFullYear();
    const age = currentYear - birthYear;
    return age >= 0 ? age : null;
  }

  return null;
}

/**
 * Formats a 12-digit string to masked display format: "XXXX-XXXX-1234"
 */
export function formatMaskedAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length !== 12) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${aadhaar.slice(8)}`;
}

/**
 * Finds and extracts the best 12-digit Aadhaar number from lines/text
 */
export function extractAadhaarNumber(
  rawText: string,
  words: OCRWord[] = []
): { number: string | null; isValid: boolean; confidence: number } {
  // Normalize candidate matches: 4-4-4 digit groups or 12 continuous digits with optional confusion characters
  const lines = rawText.split(/\r?\n/);
  const candidates: { num: string; conf: number; valid: boolean }[] = [];

  // Regex patterns:
  // 1. Grouped: 4 digits/confusion + space/dash + 4 digits/confusion + space/dash + 4 digits/confusion
  // 2. Continuous 12 characters
  const groupedRegex = /\b([0-9A-Za-z|]{4})[\s\-]+([0-9A-Za-z|]{4})[\s\-]+([0-9A-Za-z|]{4})\b/g;
  const continuousRegex = /\b([0-9A-Za-z|]{12})\b/g;

  function evaluateCandidate(rawMatch: string) {
    const cleaned = normalizeDigitConfusion(rawMatch.replace(/[\s\-]/g, ''));
    if (/^[2-9]\d{11}$/.test(cleaned)) {
      const isValid = verhoeffValid(cleaned);
      // Calculate token confidence from words matching
      let conf = 85;
      if (words.length > 0) {
        const matchingWords = words.filter((w) => cleaned.includes(normalizeDigitConfusion(w.text)));
        if (matchingWords.length > 0) {
          conf = matchingWords.reduce((acc, curr) => acc + curr.confidence, 0) / matchingWords.length;
        }
      }
      candidates.push({ num: cleaned, conf, valid: isValid });
    }
  }

  for (const line of lines) {
    let match: RegExpExecArray | null;
    while ((match = groupedRegex.exec(line)) !== null) {
      evaluateCandidate(`${match[1]}${match[2]}${match[3]}`);
    }
    while ((match = continuousRegex.exec(line)) !== null) {
      evaluateCandidate(match[1]);
    }
  }

  if (candidates.length === 0) {
    return { number: null, isValid: false, confidence: 0 };
  }

  // Prioritize valid checksum first, then highest confidence
  candidates.sort((a, b) => {
    if (a.valid && !b.valid) return -1;
    if (!a.valid && b.valid) return 1;
    return b.conf - a.conf;
  });

  const best = candidates[0];
  return { number: best.num, isValid: best.valid, confidence: Math.round(best.conf) };
}

/**
 * Extracts DOB or Year of Birth from text
 */
export function extractDob(
  rawText: string,
  words: OCRWord[] = []
): { dob: string | null; isDobIncomplete: boolean; confidence: number } {
  // Pattern 1: Explicit DOB: DD/MM/YYYY or DD-MM-YYYY
  const dobRegex = /(?:DOB|D\.O\.B|Date\s*of\s*Birth|जन्म\s*तारीख)[\s:\-\.]+([0-3]?[0-9][\/\.\-][0-1]?[0-9][\/\.\-][12][90]\d{2})/i;
  // Pattern 2: Year of Birth: YYYY
  const yobRegex = /(?:Year\s*of\s*Birth|YOB|जन्म\s*वर्ष)[\s:\-\.]+([12][90]\d{2})/i;
  // Pattern 3: Standalone date DD/MM/YYYY
  const standaloneDateRegex = /\b([0-3][0-9][\/\.\-][0-1][0-9][\/\.\-][12][90]\d{2})\b/;

  let match = rawText.match(dobRegex);
  if (match) {
    const normalized = match[1].replace(/[\.\-]/g, '/');
    return { dob: normalized, isDobIncomplete: false, confidence: 90 };
  }

  match = rawText.match(yobRegex);
  if (match) {
    return { dob: match[1], isDobIncomplete: true, confidence: 85 };
  }

  match = rawText.match(standaloneDateRegex);
  if (match) {
    const normalized = match[1].replace(/[\.\-]/g, '/');
    return { dob: normalized, isDobIncomplete: false, confidence: 75 };
  }

  return { dob: null, isDobIncomplete: false, confidence: 0 };
}

/**
 * Extracts Gender
 */
export function extractGender(
  rawText: string,
  words: OCRWord[] = []
): { gender: 'MALE' | 'FEMALE' | 'OTHER' | null; confidence: number } {
  if (/(?:\b(FEMALE|WOMAN)\b|महिला|स्त्री)/i.test(rawText)) {
    return { gender: 'FEMALE', confidence: 92 };
  }
  if (/(?:\b(MALE|MAN)\b|पुरुष)/i.test(rawText)) {
    return { gender: 'MALE', confidence: 92 };
  }
  if (/(?:\b(TRANSGENDER|OTHER)\b|तृतीयपंथी)/i.test(rawText)) {
    return { gender: 'OTHER', confidence: 90 };
  }
  return { gender: null, confidence: 0 };
}

/**
 * Cleans an extracted name candidate string, stripping labels, honorifics,
 * leading stray OCR artifacts (such as 'O', '0', '•', or circle logos), and punctuation.
 */
export function cleanNameCandidate(raw: string): string | null {
  if (!raw) return null;

  let cleaned = raw
    // Remove labels: "Name:", "Name", "To:", "To", "नाव:", "नाव", "नाम:", "नाम"
    .replace(/^(Name|To|नाव|नाम)[\s:\-\.]+/i, '')
    // Remove honorifics
    .replace(/^(Shri|Smt|Mr|Mrs|Ms|Dr|Kumari)\.?\s+/i, '')
    // Strip leading non-letters (e.g. •, -, ~, |, *, :, ;, #, 0-9)
    .replace(/^[^A-Za-z]+/, '')
    .trim();

  // Split into whitespace-separated tokens
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  // Check for stray single OCR character at start of name:
  // Tesseract OCR frequently detects the circular Aadhaar logo / emblem / bullet as 'O', 'o', '0', 'Q', 'C', etc.
  // Example: "O Sid Malhotra" -> "Sid Malhotra", "0 Sid Malhotra" -> "Sid Malhotra"
  if (words.length >= 2) {
    const firstClean = words[0].replace(/[\.\,\:\-]/g, '').trim();
    if (firstClean.length === 1) {
      const isOcrArtifact = /^[Oo0QqCc|~]$/.test(firstClean);
      const isPrecedingFullName = words[1].length >= 2 && words.length >= 3;
      if (isOcrArtifact || (isPrecedingFullName && !words[0].includes('.'))) {
        words.shift();
        cleaned = words.join(' ');
      }
    }
  }

  // Remove trailing non-letter punctuation
  cleaned = cleaned.replace(/[^A-Za-z]+$/, '').trim();

  // Verify resulting candidate is a valid name: 3 to 40 characters, contains only valid name chars
  if (/^[A-Za-z\s\.\'\-]{3,40}$/.test(cleaned) && /[A-Za-z]{2,}/.test(cleaned)) {
    return toTitleCase(cleaned);
  }

  return null;
}

/**
 * Extracts Name by locating the line immediately preceding the DOB or Gender
 */
export function extractName(
  rawText: string,
  words: OCRWord[] = []
): { name: string | null; confidence: number } {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Noise words to ignore
  const noisePatterns = [
    /government of india/i,
    /भारत सरकार/i,
    /unique identification/i,
    /uidai/i,
    /enrollment/i,
    /helpdesk/i,
    /1947/i,
    /aadhaar/i,
    /आधार/i,
    /mera aadhaar/i,
  ];

  // Find line index of DOB or Gender
  let pivotIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/(DOB|Date of Birth|जन्म तारीख|Year of Birth|MALE|FEMALE)/i.test(lines[i])) {
      pivotIndex = i;
      break;
    }
  }

  if (pivotIndex > 0) {
    // Scan backward from pivotIndex for the nearest line containing Latin alphabet name
    for (let i = pivotIndex - 1; i >= 0; i--) {
      const line = lines[i];
      if (noisePatterns.some((pattern) => pattern.test(line))) continue;

      const cleanedName = cleanNameCandidate(line);
      if (cleanedName) {
        return { name: cleanedName, confidence: 85 };
      }
    }
  }

  // Fallback: look for 2-4 word English phrase that looks like a person's name
  for (const line of lines) {
    if (noisePatterns.some((p) => p.test(line))) continue;
    if (/(DOB|Gender|Male|Female|India|Government)/i.test(line)) continue;
    const cleanedName = cleanNameCandidate(line);
    if (cleanedName && cleanedName.split(/\s+/).length >= 2) {
      return { name: cleanedName, confidence: 70 };
    }
  }

  return { name: null, confidence: 0 };
}

/**
 * Extracts Address from back of card
 */
export function extractAddress(
  rawText: string,
  words: OCRWord[] = []
): { address: string | null; confidence: number } {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim());
  const markerRegex = /(?:Address|C\/O|S\/O|W\/O|D\/O|पत्ता|आत्मज|पती|पत्नी|वडील)[\s:\-]+/i;

  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (markerRegex.test(lines[i])) {
      startIndex = i;
      break;
    }
  }

  if (startIndex !== -1) {
    const addressLines: string[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Stop if we hit footer noise or another Aadhaar number
      if (/^\d{4}\s*\d{4}\s*\d{4}$/.test(line) || /www\.uidai|1947|help@/i.test(line)) {
        break;
      }
      addressLines.push(line);
      // If we found a 6-digit PIN code, that's usually the end of the address block
      if (/\b\d{6}\b/.test(line)) {
        break;
      }
    }

    if (addressLines.length > 0) {
      const fullAddr = addressLines
        .join(' ')
        .replace(markerRegex, '')
        .replace(/\s+/g, ' ')
        .trim();
      return { address: fullAddr, confidence: 80 };
    }
  }

  return { address: null, confidence: 0 };
}

/**
 * Main pure parsing function: takes OCR text and returns parsed Aadhaar card details
 */
export function parseAadhaar(
  rawText: string,
  words: OCRWord[] = []
): AadhaarParseResult {
  const warnings: string[] = [];

  const { number, isValid, confidence: numConf } = extractAadhaarNumber(rawText, words);
  const { dob, isDobIncomplete, confidence: dobConf } = extractDob(rawText, words);
  const { gender, confidence: genderConf } = extractGender(rawText, words);
  const { name, confidence: nameConf } = extractName(rawText, words);
  const { address, confidence: addrConf } = extractAddress(rawText, words);

  const age = dob ? calculateAge(dob) : null;

  if (!number) {
    warnings.push('Aadhaar number not detected. Please ensure card is centered.');
  } else if (!isValid) {
    warnings.push('Aadhaar number checksum failed (Verhoeff validation error). Please check digits.');
  }

  if (!dob) {
    warnings.push('Date of birth could not be recognized clearly.');
  }

  if (!name) {
    warnings.push('Name could not be recognized clearly.');
  }

  if (numConf > 0 && numConf < 70) {
    warnings.push('Low confidence reading Aadhaar number. Please review carefully.');
  }

  return {
    rawText,
    aadhaarNumber: number,
    maskedNumber: number ? formatMaskedAadhaar(number) : null,
    isChecksumValid: isValid,
    name,
    dob,
    isDobIncomplete,
    age,
    gender,
    address,
    confidences: {
      aadhaarNumber: numConf,
      name: nameConf,
      dob: dobConf,
      gender: genderConf,
      address: addrConf,
    },
    warnings,
  };
}
