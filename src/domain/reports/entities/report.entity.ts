import { Location } from '../value-objects/location.value-object';

export interface ReportProps {
  title: string;
  description: string;
  location: Location;
  createdAt?: Date;
}

export class Report {
  private id?: string;
  private readonly title: string;
  private description: string;
  private location: Location;
  private readonly createdAt: Date;

  private constructor(props: ReportProps, id?: string) {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Report title must not be empty');
    }

    if (!props.description || props.description.trim().length === 0) {
      throw new Error('Report description must not be empty');
    }

    this.id = id;
    this.title = props.title.trim();
    this.description = props.description.trim();
    this.location = props.location;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: ReportProps): Report {
    return new Report(props);
  }

  static restore(props: ReportProps, id: string): Report {
    return new Report(props, id);
  }

  updateDescription(newDescription: string): void {
    if (!newDescription || newDescription.trim().length === 0) {
      throw new Error('Report description must not be empty');
    }
    this.description = newDescription.trim();
  }

  moveTo(newLocation: Location): void {
    this.location = newLocation;
  }

  getId(): string | undefined {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getLocation(): Location {
    return this.location;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
