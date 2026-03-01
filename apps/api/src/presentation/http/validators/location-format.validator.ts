import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Location } from '../../../domain/reports/value-objects/location.value-object';

@ValidatorConstraint({ name: 'LocationFormat', async: false })
export class LocationFormatConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    try {
      Location.create(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a structured address object with street, neighborhood, city, state and postcode (number is optional)`;
  }
}
