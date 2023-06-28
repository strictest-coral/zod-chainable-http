import { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';

export type RequestValidationErrorMetadata = {
  request?: unknown;
  requestOptions?: Partial<AxiosRequestConfig>;
};

export type ResponseValidationErrorMetadata = {
  response?: unknown;
  requestOptions?: Partial<AxiosRequestConfig>;
};

export class ZoxiosValidationError extends Error {
  constructor(
    public zodError: ZodError,
    public override name: string = 'ZoxiosValidationError',
    public override message: string = 'HTTP Validation Failed',
  ) {
    super(message);
  }
}

export class RequestValidationError extends ZoxiosValidationError {
  constructor(
    public override zodError: ZodError,
    public metadata: RequestValidationErrorMetadata,
    public override message: string = 'HTTP Request Validation Failed',
  ) {
    super(zodError, 'RequestValidationError', message);
  }
}

export class ResponseValidationError extends ZoxiosValidationError {
  constructor(
    public override zodError: ZodError,
    public metadata: ResponseValidationErrorMetadata,
    public override message: string = 'HTTP Response Validation Failed',
  ) {
    super(zodError, 'ResponseValidationError', message);
  }
}
