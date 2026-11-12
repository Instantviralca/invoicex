const HTML_TAG_PATTERN = /<[^>]*>/g;
const CONTROL_CHARS_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Strip HTML and control characters from user-edited email content. */
export function sanitizeUserText(value: string, maxLength = 5000): string {
  return value
    .replace(HTML_TAG_PATTERN, "")
    .replace(CONTROL_CHARS_PATTERN, "")
    .trim()
    .slice(0, maxLength);
}

/** Escape plain text for safe HTML insertion when needed. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convert sanitised plain text to line-broken paragraphs for React Email Text. */
export function plainTextToLines(value: string): string[] {
  return sanitizeUserText(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
