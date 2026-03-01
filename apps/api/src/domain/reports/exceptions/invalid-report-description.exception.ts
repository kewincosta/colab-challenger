import { DomainException } from './domain.exception';

export class InvalidReportDescriptionException extends DomainException {
  constructor() {
    super('Report description must not be empty');
  }
}
