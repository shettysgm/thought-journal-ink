// Simple privacy-first redaction utility
export function simpleRedact(s: string): string {
  // VERY simple: mask emails, phones, @names; you can expand this.
  return s
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\-\s()]{7,}\d/g, "[phone]")
    .replace(/@\w+/g, "[@user]")
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, "[card]") // Credit card patterns
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[ssn]"); // SSN patterns
}