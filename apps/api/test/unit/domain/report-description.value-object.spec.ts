import { describe, it, expect } from 'vitest';
import { ReportDescription } from '../../../src/domain/reports/value-objects/report-description.value-object';
import { InvalidReportDescriptionException } from '../../../src/domain/reports/exceptions/invalid-report-description.exception';

describe('ReportDescription Value Object', () => {
  it('creates from a valid non-empty string', () => {
    const desc = ReportDescription.create('Deep pothole near the bus stop');
    expect(desc.getValue()).toBe('Deep pothole near the bus stop');
  });

  it('trims whitespace', () => {
    const desc = ReportDescription.create('  Some description  ');
    expect(desc.getValue()).toBe('Some description');
  });

  it('throws InvalidReportDescriptionException for empty string', () => {
    expect(() => ReportDescription.create('')).toThrow(InvalidReportDescriptionException);
  });

  it('throws InvalidReportDescriptionException for whitespace-only string', () => {
    expect(() => ReportDescription.create('   ')).toThrow(InvalidReportDescriptionException);
  });

  it('equals() returns true for same value', () => {
    const a = ReportDescription.create('Same text');
    const b = ReportDescription.create('Same text');
    expect(a.equals(b)).toBe(true);
  });

  it('equals() returns false for different values', () => {
    const a = ReportDescription.create('First');
    const b = ReportDescription.create('Second');
    expect(a.equals(b)).toBe(false);
  });
});
