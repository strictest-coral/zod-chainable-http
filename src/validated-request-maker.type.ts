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

export type ValidatedRequestMaker<
  QueryType = unknown,
  BodyType = unknown,
  ResponseType = unknown,
> = {
  asyncOptionsSetter: (
    optionsSetter: AsyncOptionsSetterMethod,
  ) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;
  handleRequestValidationError(
    handler: RequestValidationHandler,
  ): ValidatedRequestMaker<QueryType, BodyType, ResponseType>;
  handleResponseValidationError(
    handler: ResponseValidationHandler,
  ): ValidatedRequestMaker<QueryType, BodyType, ResponseType>;
  options: (
    options: Partial<AxiosRequestConfig>,
  ) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;
  concatPath: (
    path: string,
  ) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;
  method: (
    method: Method,
  ) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;
  responseSchema: <
    SpecificResponseType extends z.infer<ResponseSchemaType>,
    ResponseSchemaType extends ResponseSchema,
  >(
    schema: ResponseSchemaType,
  ) => ValidatedRequestMaker<QueryType, BodyType, SpecificResponseType>;
  exec: () => Promise<ResponseType>;
  querySchema: <
    SpecificQueryType extends z.infer<QuerySchemaType>,
    QuerySchemaType extends QuerySchema,
  >(
    schema: QuerySchemaType,
  ) => ValidatedRequestMaker<SpecificQueryType, BodyType, ResponseType>;
  query: (
    query: QueryType,
  ) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;
  bodySchema: <
    SpecificBodyType extends z.infer<BodySchemaType>,
    BodySchemaType extends BodySchema,
  >(
    schema: BodySchemaType,
  ) => ValidatedRequestMaker<QueryType, SpecificBodyType, ResponseType>;
  body: (
    body: BodyType,
  ) => ValidatedRequestMaker<QueryType, BodyType, ResponseType>;
};
