import { describe, it, expect } from 'vitest';
import {
  buildSystemInstruction,
  buildUserMessage,
  buildRepairMessage,
} from '../../../src/infrastructure/ai/prompt-builder';
import { REPORT_CATEGORIES } from '../../../src/application/ai/types';

// ---------------------------------------------------------------------------
// buildSystemInstruction
// ---------------------------------------------------------------------------

describe('buildSystemInstruction', () => {
  it('returns a non-empty string', () => {
    const result = buildSystemInstruction();
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains all report categories', () => {
    const result = buildSystemInstruction();
    for (const category of REPORT_CATEGORIES) {
      expect(result).toContain(category);
    }
  });

  it('contains anti-hallucination rules', () => {
    const result = buildSystemInstruction();
    expect(result).toContain('ANTI-HALLUCINATION');
    expect(result).toContain('MUST NOT');
  });

  it('contains determinism instructions', () => {
    const result = buildSystemInstruction();
    expect(result).toContain('deterministically');
  });
});

// ---------------------------------------------------------------------------
// buildUserMessage
// ---------------------------------------------------------------------------

describe('buildUserMessage', () => {
  it('includes title, description, and string location', () => {
    const result = buildUserMessage({
      title: 'Broken light',
      description: 'Light is out',
      location: '01310-100',
    });

    expect(result).toContain('Broken light');
    expect(result).toContain('Light is out');
    expect(result).toContain('01310-100');
  });

  it('serializes object location as JSON', () => {
    const result = buildUserMessage({
      title: 'Pothole',
      description: 'Big pothole',
      location: { lat: -23.55, lng: -46.63 },
    });

    expect(result).toContain('-23.55');
    expect(result).toContain('-46.63');
  });
});

// ---------------------------------------------------------------------------
// buildRepairMessage
// ---------------------------------------------------------------------------

describe('buildRepairMessage', () => {
  it('includes the previous raw response and error', () => {
    const result = buildRepairMessage('bad{json', 'JSON parse error: ...');

    expect(result).toContain('bad{json');
    expect(result).toContain('JSON parse error');
  });

  it('instructs strict JSON output', () => {
    const result = buildRepairMessage('any', 'any error');
    expect(result).toContain('STRICT JSON');
  });
});
