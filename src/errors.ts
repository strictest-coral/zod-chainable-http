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

export class RequestValidationError extends Error {
  constructor(
    public zodError: ZodError,
    public metadata: RequestValidationErrorMetadata,
    public override message: string = 'HTTP Request Validation Failed',
  ) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export class ResponseValidationError extends Error {
  constructor(
    public zodError: ZodError,
    public metadata: ResponseValidationErrorMetadata,
    public override message: string = 'HTTP Response Validation Failed',
  ) {
    super(message);
    this.name = 'ResponseValidationError';
  }
}
