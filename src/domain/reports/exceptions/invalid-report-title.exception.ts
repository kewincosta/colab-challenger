import { DomainException } from './domain.exception';

export class InvalidReportTitleException extends DomainException {
  constructor() {
    super('Report title must not be empty');
  }
}
