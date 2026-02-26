import { InvalidReportDescriptionException } from '../exceptions/invalid-report-description.exception';

export class ReportDescription {
  private constructor(private readonly value: string) {}

  static create(raw: string): ReportDescription {
    if (!raw || raw.trim().length === 0) {
      throw new InvalidReportDescriptionException();
    }
    return new ReportDescription(raw.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ReportDescription): boolean {
    return this.value === other.value;
  }
}
