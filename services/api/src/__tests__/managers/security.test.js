import {
  csvLimitErrors,
  maskEmail,
  maskIban
} from '../../services/security.js';

describe('csvLimitErrors', () => {
  it('accepts a small CSV', () => {
    expect(csvLimitErrors('a;b;c\n1;2;3')).toEqual([]);
  });

  it('rejects too many lines', () => {
    const text = Array.from({ length: 11 }, () => 'x').join('\n');
    expect(csvLimitErrors(text, { maxLines: 10 })).toHaveLength(1);
  });

  it('rejects an oversized payload', () => {
    const text = 'x'.repeat(2000);
    const errors = csvLimitErrors(text, { maxBytes: 1000 });
    expect(errors[0]).toMatch(/bytes/);
  });
});

describe('maskEmail', () => {
  it('masks the local part', () => {
    expect(maskEmail('jane.doe@example.com')).toBe('j***@example.com');
  });

  it('returns empty for an invalid email', () => {
    expect(maskEmail('not-an-email')).toBe('');
    expect(maskEmail(undefined)).toBe('');
  });
});

describe('maskIban', () => {
  it('keeps only the last 4 characters', () => {
    expect(maskIban('FR7630006000011234567890189')).toBe('****0189');
  });

  it('masks short or missing values', () => {
    expect(maskIban('12')).toBe('****');
    expect(maskIban()).toBe('****');
  });
});
