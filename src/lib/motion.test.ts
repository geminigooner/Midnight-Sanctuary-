import { describe, it, expect } from 'vitest';
import { getMotion } from './motion';

describe('getMotion', () => {
  it('returns reduced motion when true', () => {
    const result = getMotion('standard', true);
    expect(result.type).toBe('tween');
  });

  it('returns snappy motion', () => {
    const result = getMotion('snappy', false);
    expect(result.mass).toBe(0.8);
  });
});
