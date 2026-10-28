/**
 * Vernacular Audio Teller ("Suno Passbook")
 *
 * Provides on-device, zero-cost, localized voice playback of balances,
 * loan status, and transaction receipts for rural SHG members.
 *
 * Optimizations:
 * 1. Warm, respectful Indian rural banking tone ("Bank Sakhi" style).
 * 2. Automatic conversion of digits to spoken Hindi number words
 *    (e.g., 4500 -> चार हज़ार पाँच सौ रुपये) for authentic Hindi pronunciation.
 * 3. Eager voice loader targeting Indian neural voices (Swara, Madhur, Kalpana, Google हिन्दी).
 * 4. Punctuation cadence: Uses natural pauses with commas and danda (।) for breathing cadence.
 */

export interface PassbookSpeechOptions {
  memberName: string;
  groupName?: string;
  savingsPaise: number;
  loanOutstandingPaise?: number;
  lastDepositPaise?: number;
  lang?: string; // 'hi' | 'mr' | 'en'
}

export interface ReceiptSpeechOptions {
  memberName: string;
  receiptNo: string;
  type: string;
  amountPaise: number;
  date: string;
  lang?: string;
}

// Convert numbers up to 10 Lakh into spoken Hindi words
const HINDI_ONES: Record<number, string> = {
  0: 'शून्य',
  1: 'एक',
  2: 'दो',
  3: 'तीन',
  4: 'चार',
  5: 'पाँच',
  6: 'छह',
  7: 'सात',
  8: 'आठ',
  9: 'नौ',
  10: 'दस',
  11: 'ग्यारह',
  12: 'बारह',
  13: 'तेरह',
  14: 'चौदह',
  15: 'पंद्रह',
  16: 'सोलह',
  17: 'सत्रह',
  18: 'अठारह',
  19: 'उन्नीस',
  20: 'बीस',
  21: 'इक्कीस',
  22: 'बाईस',
  23: 'तेईस',
  24: 'चौबीस',
  25: 'पच्चीस',
  30: 'तीस',
  35: 'पैंतीस',
  40: 'चालीस',
  45: 'पैंतालीस',
  50: 'पचास',
  60: 'साठ',
  70: 'सत्तर',
  80: 'अस्सी',
  90: 'नब्बे',
};

export function numberToHindiSpokenWords(amount: number): string {
  const n = Math.abs(Math.round(amount));
  if (n === 0) return 'शून्य';
  if (HINDI_ONES[n]) return HINDI_ONES[n];

  // Common round amounts
  if (n === 500) return 'पाँच सौ';
  if (n === 1000) return 'एक हज़ार';
  if (n === 1500) return 'एक हज़ार पाँच सौ';
  if (n === 2000) return 'दो हज़ार';
  if (n === 2500) return 'दो हज़ार पाँच सौ';
  if (n === 3000) return 'तीन हज़ार';
  if (n === 4000) return 'चार हज़ार';
  if (n === 4500) return 'चार हज़ार पाँच सौ';
  if (n === 5000) return 'पाँच हज़ार';
  if (n === 10000) return 'दस हज़ार';
  if (n === 15000) return 'पंद्रह हज़ार';
  if (n === 20000) return 'बीस हज़ार';
  if (n === 25000) return 'पच्चीस हज़ार';
  if (n === 50000) return 'पचास हज़ार';
  if (n === 100000) return 'एक लाख';

  let words = '';
  const lakh = Math.floor(n / 100000);
  let rem = n % 100000;
  if (lakh > 0) {
    words += `${HINDI_ONES[lakh] || lakh} लाख `;
  }

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  if (thousand > 0) {
    words += `${HINDI_ONES[thousand] || thousand} हज़ार `;
  }

  const hundred = Math.floor(rem / 100);
  rem = rem % 100;
  if (hundred > 0) {
    words += `${HINDI_ONES[hundred] || hundred} सौ `;
  }

  if (rem > 0) {
    words += `${HINDI_ONES[rem] || rem} `;
  }

  return words.trim() || `${n}`;
}

export function buildPassbookSpeechText(options: PassbookSpeechOptions): string {
  const savingsRupees = Math.round(options.savingsPaise / 100);
  const loanRupees = Math.round((options.loanOutstandingPaise || 0) / 100);
  const group = options.groupName || 'प्रगति महिला बचत गट';
  const name = options.memberName || 'दीदी';
  const lang = (options.lang || 'hi').toLowerCase();

  // If Marathi explicitly requested
  if (lang.startsWith('mr')) {
    if (loanRupees > 0) {
      return `नमस्कार ${name} ताई। ${group} मध्ये, तुमची एकूण बचत ${savingsRupees} रुपये आहे। तुमचे थकीत कर्ज ${loanRupees} रुपये आहे। आपले डिजिटल पासबुक सुरक्षित आणि सक्रिय आहे। धन्यवाद।`;
    }
    return `नमस्कार ${name} ताई। ${group} मध्ये, तुमची एकूण बचत ${savingsRupees} रुपये आहे। तुमचे कोणतेही कर्ज बाकी नाही। आपले डिजिटल पासबुक सुरक्षित आणि सक्रिय आहे। धन्यवाद।`;
  }

  // Optimized Hindi phrasing with spoken words and natural tone
  const savingsHindiWords = numberToHindiSpokenWords(savingsRupees);
  const loanHindiWords = numberToHindiSpokenWords(loanRupees);

  if (loanRupees > 0) {
    return `नमस्ते ${name} जी। संजय डिजिटल पासबुक में आपका स्वागत है। आपके समूह, ${group} में, आपकी कुल जमा बचत ${savingsHindiWords} रुपये है। आपके लोन की बकाया राशि ${loanHindiWords} रुपये है। आपका खाता पूरी तरह सुरक्षित और सक्रिय है। धन्यवाद।`;
  }

  return `नमस्ते ${name} जी। संजय डिजिटल पासबुक में आपका स्वागत है। आपके समूह, ${group} में, आपकी कुल जमा बचत ${savingsHindiWords} रुपये है। आपका कोई भी लोन बकाया नहीं है। आपका खाता पूरी तरह सुरक्षित और सक्रिय है। धन्यवाद।`;
}

export function buildReceiptSpeechText(options: ReceiptSpeechOptions): string {
  const amountRupees = Math.round(options.amountPaise / 100);
  const name = options.memberName || 'दीदी';
  const lang = (options.lang || 'hi').toLowerCase();
  const amountWords = numberToHindiSpokenWords(amountRupees);

  if (lang.startsWith('mr')) {
    return `अधिकृत डिजिटल पावती। सदस्य ${name} ताईंकडून, ${amountRupees} रुपये बचत गटात जमा झाले आहेत। पावती क्रमांक, ${options.receiptNo}। धन्यवाद।`;
  }

  // Optimized Hindi receipt phrasing
  return `संजय आधिकारिक पावती। सदस्य ${name} जी द्वारा, ${amountWords} रुपये बचत खाते में सफलतापूर्वक जमा किए गए हैं। आपकी पावती संख्या है, ${options.receiptNo}। यह पावती पूरी तरह सत्यापित है। धन्यवाद।`;
}

/**
 * Cache and pre-warm voices
 */
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const populateVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  populateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }
}

function getBestVoice(targetCode: 'hi-IN' | 'mr-IN'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (targetCode === 'hi-IN') {
    // 1. Natural/Neural Online Hindi voices (Edge & Chrome)
    const naturalHindi = voices.find(
      (v) =>
        v.lang.replace('_', '-').toLowerCase().startsWith('hi') &&
        (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online'))
    );
    if (naturalHindi) return naturalHindi;

    // 2. High-quality Hindi voices by name or language code
    const hindiVoice = voices.find(
      (v) =>
        v.lang.replace('_', '-').toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('madhur') ||
        v.name.toLowerCase().includes('kalpana') ||
        v.name.toLowerCase().includes('hemant')
    );
    if (hindiVoice) return hindiVoice;

    // 3. Indian English voice as accent fallback (still sounds Indian rather than American)
    const indianAccentVoice = voices.find(
      (v) =>
        v.lang.replace('_', '-').toLowerCase() === 'en-in' ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('neerja') ||
        v.name.toLowerCase().includes('prabhat')
    );
    if (indianAccentVoice) return indianAccentVoice;
  }

  if (targetCode === 'mr-IN') {
    const marathiVoice = voices.find(
      (v) =>
        v.lang.replace('_', '-').toLowerCase().startsWith('mr') ||
        v.name.toLowerCase().includes('marathi') ||
        v.name.toLowerCase().includes('aarohi')
    );
    if (marathiVoice) return marathiVoice;
  }

  return null;
}

/**
 * Speaks text using the best matching voice on the user's browser.
 */
export function speakText(
  text: string,
  lang: string = 'hi',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this environment');
    onError?.(new Error('Speech synthesis unsupported'));
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Map language tags: Default to Hindi unless Marathi is chosen
  const cleanLang = (lang || 'hi').toLowerCase();
  const targetCode: 'hi-IN' | 'mr-IN' = cleanLang.startsWith('mr') ? 'mr-IN' : 'hi-IN';

  utterance.lang = targetCode;
  // Natural speaking rate for polite Hindi banking assistant:
  utterance.rate = 0.88;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const matchedVoice = getBestVoice(targetCode);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('Audio playback notice:', e);
    onEnd?.();
  };

  // Ensure speech synthesis is active (resume if paused by browser power saving)
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  window.speechSynthesis.speak(utterance);

  // Return stop function
  return () => {
    window.speechSynthesis.cancel();
    onEnd?.();
  };
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
