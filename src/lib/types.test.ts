import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from './types';

describe('DEFAULT_SETTINGS', () => {
  it('has memories enabled by default', () => {
    expect(DEFAULT_SETTINGS.memoriesEnabled).toBe(true);
  });
  
  it('defaults to gemini 2.5 flash', () => {
    expect(DEFAULT_SETTINGS.model).toBe('models/gemini-2.5-flash');
  });
});
