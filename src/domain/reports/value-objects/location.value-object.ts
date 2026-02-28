import { InvalidLocationException } from '../exceptions/invalid-location.exception';

export type LocationRaw = string | Record<string, unknown>;

export class Location {
  private constructor(private readonly value: LocationRaw) {}

  static create(raw: LocationRaw): Location {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) {
        throw new InvalidLocationException('location string must not be empty');
      }
      return new Location(trimmed);
    }

    if (Object.keys(raw).length === 0) {
      throw new InvalidLocationException('location object must not be empty');
    }
    return new Location({ ...raw });
  }

  getValue(): LocationRaw {
    if (typeof this.value === 'object') {
      return { ...this.value };
    }
    return this.value;
  }
}
