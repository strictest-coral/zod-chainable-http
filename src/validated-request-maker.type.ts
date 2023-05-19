import { AxiosRequestConfig, Method } from 'axios';
import { z, ZodSchema } from 'zod';
import {
  RequestValidationError,
  ResponseValidationError,
} from './validated-request.errors';

export type QuerySchema = ZodSchema<Record<string, unknown>>;
export type BodySchema = ZodSchema<Record<string, unknown> | unknown[]>;
export type ResponseSchema = ZodSchema<unknown>;
export type AsyncOptionsSetterMethod = () => Promise<
  Partial<AxiosRequestConfig>
>;
export type UnknownSchema = ZodSchema<unknown>;
export type QueryFullSchema = QuerySchema | UnknownSchema;
export type BodyFullSchema = BodySchema | UnknownSchema;

export type RequestValidationHandler = (error: RequestValidationError) => void;
export type ResponseValidationHandler = (
  error: ResponseValidationError,
) => void;

type AsyncOptionsSetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  optionsSetter: AsyncOptionsSetterMethod,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type HandleRequestValidationError<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  handler: RequestValidationHandler,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type HandleResponseValidationError<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  handler: ResponseValidationHandler,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type OptionsSetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  options: Partial<AxiosRequestConfig>,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type ConcatPath<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (path: string) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type MethodSetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  method: Method,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type QuerySetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  query: z.infer<QueryType>,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type BodySetter<
  QueryType extends QueryFullSchema,
  BodyType extends BodyFullSchema,
  ResponseType,
> = (
  body: z.infer<BodyType>,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type Exec<ResponseType> = () => Promise<ResponseType>;

type GetDefinition<
  QuerySchemaType extends QueryFullSchema,
  BodySchemaType extends BodyFullSchema,
> = () => {
  query?: unknown;
  body?: unknown;
  querySchema?: QuerySchemaType;
  bodySchema?: BodySchemaType;
  responseSchema?: ResponseSchema;
  path: string;
  hostname: string;
  method?: Method;
  options: AxiosRequestConfig;
};

export type ValidatedRequestMaker<
  QuerySchemaType extends QueryFullSchema = UnknownSchema,
  BodySchemaType extends BodyFullSchema = UnknownSchema,
  ResponseType = unknown,
> = {
  getDefinition: GetDefinition<QuerySchemaType, BodySchemaType>;
  exec: Exec<ResponseType>;
  body: BodySetter<QuerySchemaType, BodySchemaType, ResponseType>;
  query: QuerySetter<QuerySchemaType, BodySchemaType, ResponseType>;
  method: MethodSetter<QuerySchemaType, BodySchemaType, ResponseType>;
  options: OptionsSetter<QuerySchemaType, BodySchemaType, ResponseType>;
  concatPath: ConcatPath<QuerySchemaType, BodySchemaType, ResponseType>;
  asyncOptionsSetter: AsyncOptionsSetter<
    QuerySchemaType,
    BodySchemaType,
    ResponseType
  >;
  querySchema: <QuerySchemaType extends QuerySchema>(
    schema: QuerySchemaType,
  ) => ValidatedRequestMaker<QuerySchemaType, BodySchemaType, ResponseType>;
  bodySchema: <BodySchemaType extends BodySchema>(
    schema: BodySchemaType,
  ) => ValidatedRequestMaker<QuerySchemaType, BodySchemaType, ResponseType>;
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
  responseSchema: <
    SpecificResponseType extends z.infer<ResponseSchemaType>,
    ResponseSchemaType extends ResponseSchema,
  >(
    schema: ResponseSchemaType,
  ) => ValidatedRequestMaker<
    QuerySchemaType,
    BodySchemaType,
    SpecificResponseType
  >;
};
