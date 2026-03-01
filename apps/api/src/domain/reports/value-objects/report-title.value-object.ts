import { InvalidReportTitleException } from '../exceptions/invalid-report-title.exception';

export class ReportTitle {
  private constructor(private readonly value: string) {}

  static create(raw: string): ReportTitle {
    if (!raw || raw.trim().length === 0) {
      throw new InvalidReportTitleException();
    }
    return new ReportTitle(raw.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ReportTitle): boolean {
    return this.value === other.value;
  }
}
