export const BASIC_CLASSES: string[] = Array.from({ length: 9 }, (_, i) => `Basic ${i + 1}`);

/**
 * Normalize any incoming class-like label to the canonical "Basic N" (1-9) form.
 * Examples that map to "Basic 1": "Class 1", "class1", "1", " BASIC 1 ".
 */
export function normalizeClassName(input: string): string {
  if (!input) return '';
  const trimmed = String(input).trim();

  // Extract a trailing number if present
  const match = trimmed.match(/(basic|class)?\s*0*([1-9])\b/i);
  if (match) {
    const num = parseInt(match[2], 10);
    if (num >= 1 && num <= 9) {
      return `Basic ${num}`;
    }
  }

  // If it's exactly a digit 1-9
  if (/^[1-9]$/.test(trimmed)) {
    return `Basic ${trimmed}`;
  }

  // Already normalized? Ensure spacing/case
  const basicMatch = trimmed.match(/^basic\s*([1-9])$/i);
  if (basicMatch) {
    return `Basic ${basicMatch[1]}`;
  }

  // Fallback to original string if it can't be normalized
  return trimmed;
}
