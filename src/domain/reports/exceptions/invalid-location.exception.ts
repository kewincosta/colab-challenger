import { DomainException } from './domain.exception';

export class InvalidLocationException extends DomainException {
  constructor(reason: string) {
    super(`Invalid location: ${reason}`);
  }
}
