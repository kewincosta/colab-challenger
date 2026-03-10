/**
 * NestJS pipe that validates incoming data with a Zod schema.
 *
 * Replaces the built-in ValidationPipe + class-validator decorators
 * with a single schema-based approach. Throws BadRequestException
 * with structured error messages on validation failure.
 */

import { type PipeTransform, BadRequestException } from '@nestjs/common';
import type { z } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    const messages = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });

    throw new BadRequestException(messages);
  }
}
