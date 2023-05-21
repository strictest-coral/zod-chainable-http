/* eslint-disable max-statements */
import axios, { AxiosRequestConfig, Method } from 'axios';
import { z, ZodSchema } from 'zod';
import {
  AsyncOptionsSetterMethod,
  BodyFullSchema,
  BodySchema,
  QueryFullSchema,
  QuerySchema,
  RequestMakerDefinition,
  RequestValidationErrorHandler,
  ResponseSchema,
  ResponseValidationErrorHandler,
  RequestMaker,
} from './request-maker.type';
import { RequestValidationError, ResponseValidationError } from './errors';
import {
  defaultRequestValidationHandler,
  defaultResponseValidationHandler,
} from './error-handler';

async function handleValidatedResponse<ResponseType>(
  baseOptions: Partial<AxiosRequestConfig>,
  response: ResponseType,
  schema?: ZodSchema,
): Promise<ResponseType> {
  if (!schema) return response;

  const parseResponse = schema.safeParse(response);

  if (!parseResponse.success) {
    throw new ResponseValidationError(parseResponse.error, {
      response,
      requestOptions: baseOptions,
    });
  }

  return parseResponse.data;
}

async function execRequest<ResponseType>(
  baseOptions: AxiosRequestConfig,
  asyncOptionsSetterMethod?: AsyncOptionsSetterMethod,
  schemas?: {
    query?: QuerySchema;
    body?: BodySchema;
    response?: ResponseSchema;
  },
): Promise<ResponseType> {
  const asyncOptions = asyncOptionsSetterMethod
    ? await asyncOptionsSetterMethod()
    : {};
  const requestOptions: AxiosRequestConfig = {
    ...baseOptions,
    ...asyncOptions,
  };

  requestOptions.params = validateRequestItem(
    requestOptions,
    requestOptions.params,
    schemas?.query,
  );
  requestOptions.data = validateRequestItem(
    requestOptions,
    requestOptions.data,
    schemas?.body,
  );

  const response = await axios(requestOptions);

  return handleValidatedResponse(
    requestOptions,
    response.data,
    schemas?.response,
  );
}

function validateRequestItem<RequestItemType>(
  baseOptions: AxiosRequestConfig,
  requestItem: RequestItemType,
  schema?: ZodSchema,
): RequestItemType {
  if (!schema) return requestItem;

  const parseResponse = schema.safeParse(requestItem);

  if (!parseResponse.success) {
    throw new RequestValidationError(parseResponse.error, {
      requestOptions: baseOptions,
      request: requestItem,
    });
  }

  return parseResponse.data;
}

function getURL(host = '', path = '') {
  return `${host}${path}`;
}

/**
  This wrapper allows to optionally validate the request / response / both using Zod.
  It has a chainable interface that can ease the process of creating custom API wrappers, it also allows to minimize code duplication when multiple endpoints have the same base path, HTTP-method or request-body\query, by creating a chain including all the common options between them.
  It also allows to config options in an asynchronous way, can be used for token generation.

  This wrappers throws its own errors for validation failure, both for requests and responses.
  Those errors contain all of the invalid properties in the request\response and the reason for the failure.

  @example
  const response = await requestMaker('http://localhost')
    .concatPath('api')
    .concatPath('v2')
    .method('POST')
    .querySchema(z.object({ name: z.string() }))
    .bodySchema(z.object({ age: z.number() }))
    .responseSchema(z.object({ id: z.number() }))
    .body({ age: 1 })
    .query({ name: '1' })
    .exec();
 */
export function zoxios(host?: string): RequestMaker {
  let hostname: string | undefined = host;

  let baseOptions: AxiosRequestConfig = { url: hostname };
  let asyncOptionsSetterMethod: AsyncOptionsSetterMethod;

  let querySchema: QueryFullSchema;
  let bodySchema: BodyFullSchema;
  let responseSchema: ZodSchema | undefined;
  let requestValidationErrorHandler: RequestValidationErrorHandler =
    defaultRequestValidationHandler;
  let responseValidationErrorHandler: ResponseValidationErrorHandler =
    defaultResponseValidationHandler;
  let requestPath = '';

  const requestMaker: RequestMaker = {
    getDefinition: () => {
      return {
        hostname,
        querySchema,
        bodySchema,
        responseSchema,
        method: baseOptions.method as Method,
        path: requestPath,
        options: baseOptions,
        body: baseOptions.data,
        query: baseOptions.params,
      } as RequestMakerDefinition<undefined, undefined>;
    },
    host: (host: string) => {
      hostname = host;
      baseOptions.url = getURL(hostname, requestPath);

      return requestMaker;
    },
    asyncOptionsSetter: (optionsSetter: AsyncOptionsSetterMethod) => {
      asyncOptionsSetterMethod = optionsSetter;
      return requestMaker;
    },
    handleRequestValidationError: (
      handler: (error: RequestValidationError) => void,
    ) => {
      requestValidationErrorHandler = handler;

      return requestMaker;
    },
    handleResponseValidationError: (
      handler: (error: ResponseValidationError) => void,
    ) => {
      responseValidationErrorHandler = handler;

      return requestMaker;
    },
    options: (options: Partial<AxiosRequestConfig>) => {
      baseOptions = { ...baseOptions, ...options };
      return requestMaker;
    },
    concatPath: (path: string) => {
      requestPath += `/${path}`;
      baseOptions.url = getURL(hostname, requestPath);
      return requestMaker;
    },
    method: (method: Method) => {
      baseOptions.method = method;
      return requestMaker;
    },
    querySchema: <QuerySchemaType extends QuerySchema>(
      schema: QuerySchemaType,
    ) => {
      querySchema = schema;

      return requestMaker as unknown as RequestMaker<
        QuerySchemaType,
        undefined,
        ZodSchema<unknown>
      >;
    },
    query: <QueryType>(query: QueryType) => {
      baseOptions.params = query;

      return requestMaker;
    },
    responseSchema: <
      SpecificResponseType extends z.infer<ResponseSchemaType>,
      ResponseSchemaType extends ResponseSchema,
    >(
      schema: ResponseSchemaType,
    ) => {
      responseSchema = schema;

      return requestMaker as RequestMaker<
        undefined,
        undefined,
        SpecificResponseType
      >;
    },
    exec: async () =>
      execRequest(baseOptions, asyncOptionsSetterMethod, {
        body: bodySchema,
        query: querySchema,
        response: responseSchema,
      }).catch((error) => {
        if (error instanceof RequestValidationError) {
          return requestValidationErrorHandler(error);
        }

        if (error instanceof ResponseValidationError) {
          return responseValidationErrorHandler(error);
        }

        throw error;
      }),
    bodySchema: <BodySchemaType extends BodySchema>(schema: BodySchemaType) => {
      bodySchema = schema;
      return requestMaker as unknown as RequestMaker<
        undefined,
        BodySchemaType,
        ZodSchema<unknown>
      >;
    },
    body: <BodyType>(body: BodyType) => {
      baseOptions.data = body;

      return requestMaker;
    },
  };

  return requestMaker;
}
