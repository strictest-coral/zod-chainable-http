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

export type RequestValidationHandler = (error: RequestValidationError) => void;
export type ResponseValidationHandler = (
  error: ResponseValidationError,
) => void;

type AsyncOptionsSetter<QueryType, BodyType, ResponseType> = (
  optionsSetter: AsyncOptionsSetterMethod,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type HandleRequestValidationError<QueryType, BodyType, ResponseType> = (
  handler: RequestValidationHandler,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type HandleResponseValidationError<QueryType, BodyType, ResponseType> = (
  handler: ResponseValidationHandler,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type OptionsSetter<QueryType, BodyType, ResponseType> = (
  options: Partial<AxiosRequestConfig>,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type ConcatPath<QueryType, BodyType, ResponseType> = (
  path: string,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type MethodSetter<QueryType, BodyType, ResponseType> = (
  method: Method,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type QuerySetter<QueryType, BodyType, ResponseType> = (
  query: QueryType,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type BodySetter<QueryType, BodyType, ResponseType> = (
  body: BodyType,
) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;

type Exec<ResponseType> = () => Promise<ResponseType>;

type GetDefinition = () => {
  query: unknown;
  body: unknown;
  responseSchema?: ResponseSchema;
  path: string;
  hostname: string;
  method?: Method;
  options: AxiosRequestConfig;
};

export type ValidatedRequestMaker<
  QueryType = unknown,
  BodyType = unknown,
  ResponseType = unknown,
> = {
  getDefinition: GetDefinition;
  exec: Exec<ResponseType>;
  body: BodySetter<QueryType, BodyType, ResponseType>;
  query: QuerySetter<QueryType, BodyType, ResponseType>;
  method: MethodSetter<QueryType, BodyType, ResponseType>;
  options: OptionsSetter<QueryType, BodyType, ResponseType>;
  concatPath: ConcatPath<QueryType, BodyType, ResponseType>;
  asyncOptionsSetter: AsyncOptionsSetter<QueryType, BodyType, ResponseType>;
  querySchema: <
    SpecificQueryType extends z.infer<QuerySchemaType>,
    QuerySchemaType extends QuerySchema,
  >(
    schema: QuerySchemaType,
  ) => ValidatedRequestMaker<SpecificQueryType, BodyType, ResponseType>;
  bodySchema: <
    SpecificBodyType extends z.infer<BodySchemaType>,
    BodySchemaType extends BodySchema,
  >(
    schema: BodySchemaType,
  ) => ValidatedRequestMaker<QueryType, SpecificBodyType, ResponseType>;
  handleRequestValidationError: HandleRequestValidationError<
    QueryType,
    BodyType,
    ResponseType
  >;
  handleResponseValidationError: HandleResponseValidationError<
    QueryType,
    BodyType,
    ResponseType
  >;
  responseSchema: <
    SpecificResponseType extends z.infer<ResponseSchemaType>,
    ResponseSchemaType extends ResponseSchema,
  >(
    schema: ResponseSchemaType,
  ) => ValidatedRequestMaker<QueryType, BodyType, SpecificResponseType>;
};
