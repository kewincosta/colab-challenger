import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'LocationFormat', async: false })
export class LocationFormatConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'object' && value !== null) {
      return Object.keys(value as Record<string, unknown>).length > 0;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a non-empty string or a non-empty object`;
  }
}
