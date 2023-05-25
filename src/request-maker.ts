import axios, { AxiosRequestConfig, Method } from 'axios';
import { z, ZodSchema } from 'zod';
import {
  AsyncOptionsSetterMethod,
  BodySchema,
  QuerySchema,
  RequestMakerDefinition,
  ResponseSchema,
  RequestMaker,
  ZoxiosMaker,
} from './request-maker.type';
import { RequestValidationError, ResponseValidationError } from './errors';
import {
  defaultRequestValidationHandler,
  defaultResponseValidationHandler,
} from './error-handler';
import { errorHandlersSetters } from './request-maker.error-handler';
import { optionsSetters } from './request-maker.options-setters';
import { requestSchemaSetters } from './request-maker.schema-setters';

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

function getDefinition(zoxiosMaker: ZoxiosMaker) {
  const {
    hostname,
    querySchema,
    bodySchema,
    baseOptions,
    responseSchema,
    requestPath,
  } = zoxiosMaker.zoxiosOptions;
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
}

function responseSchemaSetter<
  SpecificResponseType extends z.infer<ResponseSchemaType>,
  ResponseSchemaType extends ResponseSchema,
>(zoxiosMaker: ZoxiosMaker, schema: ResponseSchemaType) {
  zoxiosMaker.zoxiosOptions.responseSchema = schema;

  return zoxiosMaker.requestMaker as RequestMaker<
    undefined,
    undefined,
    SpecificResponseType
  >;
}

async function exec(zoxiosMaker: ZoxiosMaker) {
  return execRequest(
    zoxiosMaker.zoxiosOptions.baseOptions,
    zoxiosMaker.zoxiosOptions.asyncOptionsSetterMethod,
    {
      body: zoxiosMaker.zoxiosOptions.bodySchema,
      query: zoxiosMaker.zoxiosOptions.querySchema,
      response: zoxiosMaker.zoxiosOptions.responseSchema,
    },
  ).catch((error) => {
    if (error instanceof RequestValidationError) {
      return zoxiosMaker.zoxiosOptions.requestValidationErrorHandler(error);
    }

    if (error instanceof ResponseValidationError) {
      return zoxiosMaker.zoxiosOptions.responseValidationErrorHandler(error);
    }

    throw error;
  });
}

const zoxiosMaker = <ZoxiosMaker>function (host?: string) {
  zoxiosMaker.zoxiosOptions = {
    hostname: host,
    baseOptions: { url: host },
    requestValidationErrorHandler: defaultRequestValidationHandler,
    responseValidationErrorHandler: defaultResponseValidationHandler,
    requestPath: '',
  };

  zoxiosMaker.requestMaker = {
    ...requestSchemaSetters(zoxiosMaker),
    ...errorHandlersSetters(zoxiosMaker),
    ...optionsSetters(zoxiosMaker),
    getDefinition: () => getDefinition(zoxiosMaker),
    exec: () => exec(zoxiosMaker),
    responseSchema: <ResponseSchemaType extends ResponseSchema>(
      schema: ResponseSchemaType,
    ) => responseSchemaSetter(zoxiosMaker, schema),
  };

  return zoxiosMaker.requestMaker;
};

/**
  This wrapper allows to optionally validate the request / response / both using Zod.
  It has a chainable interface that can ease the process of creating custom API wrappers, it also allows to minimize code duplication when multiple endpoints have the same base path, HTTP-method or request-body\query, by creating a chain including all the common options between them.
  It also allows to config options in an asynchronous way, can be used for token generation.

  This wrappers throws its own errors for validation failure, both for requests and responses.
  Those errors contain all of the invalid properties in the request\response and the reason for the failure.

  @example
  const response = await zoxios('http://localhost')
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
  return zoxiosMaker(host);
}
