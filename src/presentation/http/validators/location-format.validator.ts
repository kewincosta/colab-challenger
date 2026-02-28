import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Location, LocationRaw } from '../../../domain/reports/value-objects/location.value-object';

@ValidatorConstraint({ name: 'LocationFormat', async: false })
export class LocationFormatConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' && (typeof value !== 'object' || value === null)) {
      return false;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- narrowed by typeof guards above
      Location.create(value as LocationRaw);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a non-empty string or a non-empty object`;
  }
}
