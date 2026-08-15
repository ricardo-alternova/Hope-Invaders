import { describe, expect, it } from 'vitest';
import { normalizeKey } from './input';

describe('normalizeKey', () => {
  it('maps Enter and NumpadEnter to Enter', () => {
    expect(normalizeKey({ code: 'Enter', key: 'Enter' })).toBe('Enter');
    expect(normalizeKey({ code: 'NumpadEnter', key: 'Enter' })).toBe('Enter');
    expect(normalizeKey({ code: '', key: 'Enter' })).toBe('Enter');
  });

  it('maps Space from code or key', () => {
    expect(normalizeKey({ code: 'Space', key: ' ' })).toBe('Space');
    expect(normalizeKey({ code: '', key: ' ' })).toBe('Space');
  });

  it('ignores unrelated keys', () => {
    expect(normalizeKey({ code: 'KeyQ', key: 'q' })).toBeNull();
  });
});
