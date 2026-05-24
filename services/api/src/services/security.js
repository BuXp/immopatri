// Pure, dependency-free hardening helpers (DAT Sprint 9): bound untrusted
// inputs and mask personal data in logs. Unit-testable without a database.

const DEFAULT_CSV_LIMITS = { maxBytes: 1_000_000, maxLines: 5000 };

// Guards the bank-statement CSV against oversized payloads (DoS / memory).
export function csvLimitErrors(text, limits = {}) {
  const { maxBytes, maxLines } = { ...DEFAULT_CSV_LIMITS, ...limits };
  const value = String(text || '');
  const errors = [];
  if (Buffer.byteLength(value, 'utf8') > maxBytes) {
    errors.push(`csv exceeds ${maxBytes} bytes`);
  }
  const lineCount = value === '' ? 0 : value.split(/\r?\n/).length;
  if (lineCount > maxLines) {
    errors.push(`csv exceeds ${maxLines} lines`);
  }
  return errors;
}

// Masks an email for safe logging: "jane.doe@example.com" -> "j***@example.com".
export function maskEmail(email) {
  if (typeof email !== 'string' || email.indexOf('@') === -1) {
    return '';
  }
  const [local, domain] = email.split('@');
  const head = local.slice(0, 1) || '';
  return `${head}***@${domain}`;
}

// Masks an IBAN, keeping only the last 4 characters.
export function maskIban(iban) {
  const value = String(iban || '').replace(/\s/g, '');
  if (value.length < 4) {
    return '****';
  }
  return `****${value.slice(-4)}`;
}
