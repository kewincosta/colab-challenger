export type LocationRaw = string | Record<string, unknown>;

export class Location {
  private constructor(private readonly value: LocationRaw) {}

  static create(raw: LocationRaw): Location {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) {
        throw new Error('Location string must not be empty');
      }
      return new Location(trimmed);
    }

    if (typeof raw === 'object' && raw !== null) {
      if (Object.keys(raw).length === 0) {
        throw new Error('Location object must not be empty');
      }
      return new Location({ ...raw });
    }

    throw new Error('Invalid location value');
  }

  getValue(): LocationRaw {
    return this.value;
  }
}
