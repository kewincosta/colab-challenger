import { describe, it, expect } from 'vitest';
import { ReportTitle } from '../../../src/domain/reports/value-objects/report-title.value-object';
import { InvalidReportTitleException } from '../../../src/domain/reports/exceptions/invalid-report-title.exception';

describe('ReportTitle Value Object', () => {
  it('creates from a valid non-empty string', () => {
    const title = ReportTitle.create('Broken streetlight');
    expect(title.getValue()).toBe('Broken streetlight');
  });

  it('trims whitespace', () => {
    const title = ReportTitle.create('  Pothole  ');
    expect(title.getValue()).toBe('Pothole');
  });

  it('throws InvalidReportTitleException for empty string', () => {
    expect(() => ReportTitle.create('')).toThrow(InvalidReportTitleException);
  });

  it('throws InvalidReportTitleException for whitespace-only string', () => {
    expect(() => ReportTitle.create('   ')).toThrow(InvalidReportTitleException);
  });

  it('equals() returns true for same value', () => {
    const a = ReportTitle.create('Pothole');
    const b = ReportTitle.create('Pothole');
    expect(a.equals(b)).toBe(true);
  });

  it('equals() returns false for different values', () => {
    const a = ReportTitle.create('Pothole');
    const b = ReportTitle.create('Broken light');
    expect(a.equals(b)).toBe(false);
  });
});
