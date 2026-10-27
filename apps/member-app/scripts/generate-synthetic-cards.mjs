import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../public/synthetic-cards');

fs.mkdirSync(outputDir, { recursive: true });

import { generateVerhoeffCheckDigit } from '@sanchay/core';

const num1 = `54892341890${generateVerhoeffCheckDigit('54892341890')}`; // 548923418901
const num2 = `98765432109${generateVerhoeffCheckDigit('98765432109')}`; // 987654321096
const num3 = `36541289745${generateVerhoeffCheckDigit('36541289745')}`; // 365412897459
const num4 = `71234567890${generateVerhoeffCheckDigit('71234567890')}`; // 712345678908
// Deliberately tampered invalid number
const num5Tampered = `${num1.slice(0, 11)}${(parseInt(num1.slice(-1), 10) + 1) % 10}`;

function createCardSvg({
  title,
  name,
  hindiName,
  dobLabel,
  dobValue,
  gender,
  numberStr,
  address,
  isBack = false,
  bgColor = '#FFFFFF',
  textColor = '#111827',
  filter = '',
}) {
  const formattedNumber = `${numberStr.slice(0, 4)} ${numberStr.slice(4, 8)} ${numberStr.slice(8)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <defs>
    <style>
      .hdr { font-family: sans-serif; font-size: 20px; font-weight: bold; fill: #B5271F; }
      .subhdr { font-family: sans-serif; font-size: 15px; fill: #4B5563; }
      .body { font-family: sans-serif; font-size: 22px; font-weight: 600; fill: ${textColor}; }
      .lbl { font-family: sans-serif; font-size: 17px; fill: #6B7280; }
      .num { font-family: monospace; font-size: 34px; font-weight: bold; letter-spacing: 4px; fill: ${textColor}; }
      .footer { font-family: sans-serif; font-size: 14px; fill: #B5271F; text-anchor: middle; }
    </style>
    ${filter}
  </defs>

  <!-- Card Background -->
  <rect x="0" y="0" width="856" height="540" rx="24" fill="${bgColor}" stroke="#D1D5DB" stroke-width="3"/>
  <rect x="20" y="20" width="816" height="500" rx="16" fill="#FBFBFC" stroke="#E5E7EB" stroke-width="1.5"/>

  <!-- Top Header -->
  <text x="428" y="55" class="hdr" text-anchor="middle">GOVERNMENT OF INDIA / भारत सरकार</text>
  <text x="428" y="80" class="subhdr" text-anchor="middle">Unique Identification Authority of India / भारतीय विशिष्ट पहचान प्राधिकरण</text>
  <line x1="40" y1="95" x2="816" y2="95" stroke="#E5E7EB" stroke-width="2"/>

  ${!isBack ? `
    <!-- Photo Placeholder Box -->
    <rect x="60" y="125" width="160" height="200" rx="8" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="2"/>
    <circle cx="140" cy="200" r="40" fill="#94A3B8"/>
    <path d="M 90 290 Q 140 240 190 290" fill="#94A3B8"/>

    <!-- Personal Info Block -->
    <text x="250" y="155" class="subhdr">${hindiName}</text>
    <text x="250" y="190" class="body">${name}</text>
    <text x="250" y="235" class="lbl">${dobLabel}:</text>
    <text x="360" y="235" class="body">${dobValue}</text>
    <text x="250" y="280" class="lbl">Gender / लिंग:</text>
    <text x="380" y="280" class="body">${gender}</text>

    <!-- Aadhaar 12-Digit Number Box -->
    <rect x="180" y="370" width="496" height="65" rx="10" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
    <text x="428" y="415" class="num" text-anchor="middle">${formattedNumber}</text>

    <!-- Card Slogan Footer -->
    <text x="428" y="475" class="footer">आधार - आम आदमी का अधिकार / Mera Aadhaar, Meri Pehchan</text>
  ` : `
    <!-- Back Side Address Block -->
    <text x="60" y="145" class="lbl">Address / पत्ता:</text>
    <text x="60" y="185" class="body" font-size="20px">${address.line1}</text>
    <text x="60" y="225" class="body" font-size="20px">${address.line2}</text>
    <text x="60" y="265" class="body" font-size="20px">${address.line3}</text>

    <!-- Back Side Number -->
    <rect x="180" y="370" width="496" height="65" rx="10" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
    <text x="428" y="415" class="num" text-anchor="middle">${formattedNumber}</text>

    <text x="428" y="475" class="footer">UIDAI Toll Free Helpdesk: 1947 | help@uidai.gov.in | www.uidai.gov.in</text>
  `}
</svg>`;
}

const cards = [
  {
    filename: 'synthetic_card_01_clean.svg',
    title: 'Clean Frontal Card',
    data: {
      name: 'Kavita Devi',
      hindiName: 'कविता देवी',
      dobLabel: 'DOB / जन्म तारीख',
      dobValue: '14/11/1989',
      gender: 'Female / महिला',
      numberStr: num1,
    },
  },
  {
    filename: 'synthetic_card_02_confusion.svg',
    title: 'OCR Confusion Normalization Test',
    data: {
      name: 'Sunita Ramesh Sharma',
      hindiName: 'सुनीता रमेश शर्मा',
      dobLabel: 'DOB',
      dobValue: '22/08/1987',
      gender: 'Female',
      // Simulated OCR confusion: O instead of 0, I instead of 1
      numberStr: num2.replace(/0/g, 'O').replace(/1/g, 'I'),
    },
  },
  {
    filename: 'synthetic_card_03_yob_only.svg',
    title: 'Year of Birth Only Card',
    data: {
      name: 'Aarti Anand Deshmukh',
      hindiName: 'आरती आनंद देशमुख',
      dobLabel: 'Year of Birth / जन्म वर्ष',
      dobValue: '1985',
      gender: 'Female / महिला',
      numberStr: num3,
    },
  },
  {
    filename: 'synthetic_card_04_tampered_checksum.svg',
    title: 'Tampered Single-Digit Failure Card',
    data: {
      name: 'Meena Sanjay Shinde',
      hindiName: 'मीना संजय शिंदे',
      dobLabel: 'DOB',
      dobValue: '05/04/1993',
      gender: 'Female',
      numberStr: num5Tampered, // Invalid checksum
    },
  },
  {
    filename: 'synthetic_card_05_back_side.svg',
    title: 'Card Back Side (Address Extraction)',
    data: {
      numberStr: num4,
      isBack: true,
      address: {
        line1: 'C/O Sanjay Shinde, House No 42, Ward 3,',
        line2: 'Near Gram Panchayat Office, Village Pragati,',
        line3: 'Taluka North, District Solapur, Maharashtra - 413002',
      },
    },
  },
];

for (const card of cards) {
  const svg = createCardSvg(card.data);
  const filePath = path.join(outputDir, card.filename);
  fs.writeFileSync(filePath, svg, 'utf-8');
  console.log(`[generate-synthetic-cards] Generated ${card.filename}`);
}

console.log(`[generate-synthetic-cards] 5 synthetic test cards generated in ${outputDir}!`);
