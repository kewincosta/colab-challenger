import { InvalidLocationException } from '../exceptions/invalid-location.exception';

/**
 * Structured address — the canonical shape the system expects from clients.
 * Contains only address fields; no coordinates.
 */
export interface StructuredLocation {
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postcode: string;
}

const REQUIRED_KEYS: Array<keyof StructuredLocation> = [
  'street',
  'neighborhood',
  'city',
  'state',
  'postcode',
];

/**
 * Return trimmed string if truthy, undefined otherwise.
 */
function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export class Location {
  private constructor(private readonly value: StructuredLocation) {}

  static create(raw: unknown): Location {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new InvalidLocationException('location must be a structured address object');
    }

    const obj = raw as Record<string, unknown>;

    for (const key of REQUIRED_KEYS) {
      if (typeof obj[key] !== 'string' || obj[key].trim() === '') {
        throw new InvalidLocationException(`location.${key} must be a non-empty string`);
      }
    }

    return new Location({
      street: (obj.street as string).trim(),
      number: optionalString(obj.number),
      complement: optionalString(obj.complement),
      neighborhood: (obj.neighborhood as string).trim(),
      city: (obj.city as string).trim(),
      state: (obj.state as string).trim(),
      postcode: (obj.postcode as string).trim(),
    });
  }

  getValue(): StructuredLocation {
    return { ...this.value };
  }
}
