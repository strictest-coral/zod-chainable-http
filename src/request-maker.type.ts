import { AxiosRequestConfig, Method } from 'axios';
import { z, ZodSchema } from 'zod';
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

export type RequestValidationErrorHandler = (
  error: RequestValidationError,
) => void;
export type ResponseValidationErrorHandler = (
  error: ResponseValidationError,
) => void;

export type HttpErrorHandler = (error: unknown) => void;

type AsyncOptionsSetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  optionsSetter: AsyncOptionsSetterMethod,
) => RequestMaker<QueryType, BodyType, ResponseType>;

type HandleRequestValidationError<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  handler: RequestValidationErrorHandler,
) => RequestMaker<QueryType, BodyType, ResponseType>;

type HandleResponseValidationError<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  handler: ResponseValidationErrorHandler,
) => RequestMaker<QueryType, BodyType, ResponseType>;

type HandleHttpError<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  handler: HttpErrorHandler,
) => RequestMaker<QueryType, BodyType, ResponseType>;

type OptionsSetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  options: Partial<AxiosRequestConfig>,
) => RequestMaker<QueryType, BodyType, ResponseType>;

type ConcatPath<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (path: string) => RequestMaker<QueryType, BodyType, ResponseType>;

type MethodSetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (method: Method) => RequestMaker<QueryType, BodyType, ResponseType>;

type QuerySetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  query: QueryType extends QuerySchema ? z.infer<QueryType> : unknown,
) => RequestMaker<QueryType, BodyType, ResponseType>;

type BodySetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  body: BodyType extends BodySchema ? z.infer<BodyType> : unknown,
) => RequestMaker<QueryType, BodyType, ResponseType>;

type Exec<ResponseType> = () => Promise<ResponseType>;

type HostSetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (host: string) => RequestMaker<QueryType, BodyType, ResponseType>;

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

export type RequestMaker<
  QuerySchemaType extends QueryFullSchema = undefined,
  BodySchemaType extends BodyFullSchema = undefined,
  ResponseType = unknown,
> = {
  host: HostSetter<QuerySchemaType, BodySchemaType, ResponseType>;
  exec: Exec<ResponseType>;
  body: BodySetter<QuerySchemaType, BodySchemaType, ResponseType>;
  query: QuerySetter<QuerySchemaType, BodySchemaType, ResponseType>;
  method: MethodSetter<QuerySchemaType, BodySchemaType, ResponseType>;
  options: OptionsSetter<QuerySchemaType, BodySchemaType, ResponseType>;
  concatPath: ConcatPath<QuerySchemaType, BodySchemaType, ResponseType>;
  getDefinition: () => RequestMakerDefinition<QuerySchemaType, BodySchemaType>;
  asyncOptionsSetter: AsyncOptionsSetter<
    QuerySchemaType,
    BodySchemaType,
    ResponseType
  >;
  querySchema: <QuerySchemaType extends QuerySchema>(
    schema: QuerySchemaType,
  ) => RequestMaker<QuerySchemaType, BodySchemaType, ResponseType>;
  bodySchema: <BodySchemaType extends BodySchema>(
    schema: BodySchemaType,
  ) => RequestMaker<QuerySchemaType, BodySchemaType, ResponseType>;
  handleRequestValidationError: HandleRequestValidationError<
    QuerySchemaType,
    BodySchemaType,
    ResponseType
  >;
  handleResponseValidationError: HandleResponseValidationError<
    QuerySchemaType,
    BodySchemaType,
    ResponseType
  >;
  handleHttpError: HandleHttpError<
    QuerySchemaType,
    BodySchemaType,
    ResponseType
  >;
  responseSchema: <
    SpecificResponseType extends z.infer<ResponseSchemaType>,
    ResponseSchemaType extends ResponseSchema,
  >(
    schema: ResponseSchemaType,
  ) => RequestMaker<QuerySchemaType, BodySchemaType, SpecificResponseType>;
};

export type ZoxiosMaker = {
  (host?: string): RequestMaker;
  zoxiosOptions: {
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
  requestMaker: RequestMaker;
};
