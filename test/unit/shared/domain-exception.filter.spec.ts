import { describe, it, expect, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../src/shared/filters/domain-exception.filter';
import { DomainException } from '../../../src/domain/shared/exceptions/domain.exception';
import { HttpStatus } from '@nestjs/common';
import { createMockLogger } from '../../helpers';

class TestDomainException extends DomainException {
  constructor() {
    super('Test domain error');
  }
}

function createMockHost(response: {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
}) {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
    }),
  } as any;
}

describe('DomainExceptionFilter', () => {
  it('responds with 422 Unprocessable Entity and the exception message', () => {
    // Arrange
    const logger = createMockLogger();
    const filter = new DomainExceptionFilter(logger);
    const jsonFn = vi.fn();
    const statusFn = vi.fn().mockReturnValue({ json: jsonFn });
    const host = createMockHost({ status: statusFn, json: jsonFn });
    const exception = new TestDomainException();

    // Act
    filter.catch(exception, host);

    // Assert
    expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(jsonFn).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: 'Unprocessable Entity',
      message: 'Test domain error',
    });
  });

  it('logs the exception message as a warning', () => {
    // Arrange
    const logger = createMockLogger();
    const filter = new DomainExceptionFilter(logger);
    const jsonFn = vi.fn();
    const statusFn = vi.fn().mockReturnValue({ json: jsonFn });
    const host = createMockHost({ status: statusFn, json: jsonFn });
    const exception = new TestDomainException();

    // Act
    filter.catch(exception, host);

    // Assert
    expect(logger.warn).toHaveBeenCalledWith('Domain exception: Test domain error');
  });
});
