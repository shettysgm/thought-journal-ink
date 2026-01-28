// Enhanced privacy-first redaction utility for AI processing

// Common first names to redact (partial list - extend as needed)
const COMMON_NAMES = new Set([
  'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'charles',
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen',
  'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
  'nancy', 'betty', 'margaret', 'sandra', 'ashley', 'dorothy', 'kimberly', 'emily', 'donna', 'michelle',
  'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob',
  'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'laura', 'sharon', 'cynthia', 'kathleen',
  'mom', 'dad', 'mother', 'father', 'brother', 'sister', 'grandma', 'grandpa', 'husband', 'wife',
  'boyfriend', 'girlfriend', 'boss', 'manager', 'doctor', 'therapist', 'counselor'
]);

// Medical/medication terms that might be sensitive
const MEDICAL_TERMS = [
  /\b(prozac|zoloft|lexapro|xanax|ativan|klonopin|valium|ambien|adderall|ritalin|wellbutrin|cymbalta|effexor|paxil|celexa|buspar|trazodone|seroquel|abilify|risperdal|lithium|lamictal|depakote)\b/gi,
  /\b(psychiatrist|psychologist|therapist|counselor|mental health|psychiatric|diagnosis|diagnosed|medication|prescription|treatment|therapy session|inpatient|outpatient|rehab|rehabilitation)\b/gi,
  /\b(bipolar|schizophren\w*|borderline|ptsd|ocd|adhd|anxiety disorder|panic disorder|depression|depressive|manic|psychosis|psychotic)\b/gi
];

// Location patterns
const LOCATION_PATTERNS = [
  /\b\d{1,5}\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|circle|cir)\b/gi, // Street addresses
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/g, // City, State ZIP
  /\b\d{5}(?:-\d{4})?\b/g, // ZIP codes
];

export function simpleRedact(s: string): string {
  let redacted = s
    // Email addresses
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    // Phone numbers (various formats)
    .replace(/\+?\d[\d\-\s()]{7,}\d/g, "[phone]")
    // Social media handles
    .replace(/@\w+/g, "[@user]")
    // Credit card patterns
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, "[card]")
    // SSN patterns
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[ssn]")
    // Dates of birth patterns
    .replace(/\b(?:born|birthday|dob|birth date)[:\s]+[\d\/\-]+/gi, "[birthdate]")
    .replace(/\b(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g, "[date]");

  // Redact medical terms
  for (const pattern of MEDICAL_TERMS) {
    redacted = redacted.replace(pattern, "[medical]");
  }

  // Redact location patterns
  for (const pattern of LOCATION_PATTERNS) {
    redacted = redacted.replace(pattern, "[location]");
  }

  // Redact common names (case-insensitive, whole words only)
  const words = redacted.split(/\b/);
  redacted = words.map(word => {
    if (COMMON_NAMES.has(word.toLowerCase()) && /^[A-Za-z]+$/.test(word)) {
      return "[name]";
    }
    return word;
  }).join('');

  // Redact capitalized words that look like proper names (2+ capitalized words in a row)
  redacted = redacted.replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g, "[name]");

  return redacted;
}

// Export for testing
export { COMMON_NAMES, MEDICAL_TERMS };