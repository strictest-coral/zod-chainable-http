import { AxiosRequestConfig, Method } from 'axios';
import { ZodSchema } from 'zod';
import { RequestValidationError, ResponseValidationError } from './errors';

export type QuerySchema = ZodSchema<Record<string, unknown>>;
export type BodySchema = ZodSchema<Record<string, unknown> | unknown[]>;
export type ResponseSchema = ZodSchema<unknown>;
export type AsyncOptionsSetterMethod = () => Promise<
  Partial<AxiosRequestConfig>
>;
export type UnknownSchema = ZodSchema<unknown>;
export type QueryFullSchema = QuerySchema | undefined;
export type BodyFullSchema = BodySchema | undefined;
export type ResponseFullSchema = ResponseSchema | undefined;

export type RequestValidationErrorHandler = (
  error: RequestValidationError,
) => void;
export type ResponseValidationErrorHandler = (
  error: ResponseValidationError,
) => void;

export type HttpErrorHandler = (error: unknown) => void;

export type RequestMakerDefinition<QuerySchemaType, BodySchemaType> = {
  query?: unknown;
  body?: unknown;
  querySchema: QuerySchemaType;
  bodySchema: BodySchemaType;
  responseSchema?: ResponseSchema;
  path: string;
  hostname: string;
  method?: Method;
  options: AxiosRequestConfig;
};

export type ZoxiosOptions = {
  hostname?: string;
  baseOptions: AxiosRequestConfig;
  asyncOptionsSetterMethod?: AsyncOptionsSetterMethod;
  querySchema?: QueryFullSchema;
  bodySchema?: BodyFullSchema;
  responseSchema?: ZodSchema;
  requestValidationErrorHandler: RequestValidationErrorHandler;
  responseValidationErrorHandler: ResponseValidationErrorHandler;
  requestPath: string;
  httpErrorHandlers: HttpErrorHandler[];
};
