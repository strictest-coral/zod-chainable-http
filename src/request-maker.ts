import axios, { AxiosRequestConfig, Method } from 'axios';
import { z, ZodSchema, ZodUnknown } from 'zod';
import {
  AsyncOptionsSetterMethod,
  BodySchema,
  QuerySchema,
  RequestMakerDefinition,
  ResponseSchema,
  HttpErrorHandler,
  ZoxiosOptions,
  BodyFullSchema,
  QueryFullSchema,
  ResponseFullSchema,
  ResponseValidationErrorHandler,
  RequestValidationErrorHandler,
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

async function handleHttpError(
  error: unknown,
  httpErrorHandlers: HttpErrorHandler[],
) {
  let currentError = error;
  let response: unknown;

  const isErrorUnHandled = httpErrorHandlers.every((errorHandler) => {
    try {
      response = errorHandler(error);
      return false;
    } catch (newError: unknown) {
      currentError = newError;
      return true;
    }
  });

  if (isErrorUnHandled) throw currentError;

  return response;
}

async function execRequest<ResponseType>(
  baseOptions: AxiosRequestConfig,
  httpErrorHandlers: HttpErrorHandler[],
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

  const response = await axios(requestOptions).catch((error) => {
    return { data: handleHttpError(error, httpErrorHandlers) };
  });

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
export function zoxios(host?: string): Zoxios {
  return new Zoxios(host);
}

export function getURL(host = '', path = '') {
  return `${host}${path}`;
}

export class Zoxios<
  QuerySchemaType extends QueryFullSchema = undefined,
  BodySchemaType extends BodyFullSchema = undefined,
  ResponseSchemaType extends ResponseFullSchema = undefined,
> {
  // private requestMaker: RequestMaker;
  private readonly zoxiosOptions: ZoxiosOptions;

  constructor(private originalHost?: string, zoxiosOptions?: ZoxiosOptions) {
    this.zoxiosOptions = zoxiosOptions || {
      hostname: originalHost,
      baseOptions: { url: originalHost },
      requestValidationErrorHandler: defaultRequestValidationHandler,
      responseValidationErrorHandler: defaultResponseValidationHandler,
      requestPath: '',
      httpErrorHandlers: [],
    };
  }

  private setOption<
    OptionType extends keyof typeof this.zoxiosOptions.baseOptions,
    OptionValue extends (typeof this.zoxiosOptions.baseOptions)[OptionType],
  >(optionType: OptionType, value: OptionValue) {
    const baseOptions = {
      ...this.zoxiosOptions.baseOptions,
      [optionType]: value,
    };

    return new Zoxios(this.zoxiosOptions.hostname, {
      ...this.zoxiosOptions,
      baseOptions,
    });
  }

  body<
    BodyType extends z.infer<
      BodySchemaType extends undefined ? ZodUnknown : BodySchemaType
    >,
  >(body: BodyType) {
    return this.setOption('data', body);
  }

  method(method: Method) {
    return this.setOption('method', method);
  }

  host(host: string) {
    const { requestPath, baseOptions } = this.zoxiosOptions;

    return new Zoxios(host, {
      ...this.zoxiosOptions,
      hostname: host,
      baseOptions: { ...baseOptions },
    }).setOption('url', getURL(host, requestPath));
  }

  query<
    QueryType extends z.infer<
      QuerySchemaType extends undefined ? ZodUnknown : QuerySchemaType
    >,
  >(query: QueryType) {
    return this.setOption('params', query);
  }

  options(options: Partial<AxiosRequestConfig>) {
    const { baseOptions } = this.zoxiosOptions;

    return new Zoxios(this.originalHost, {
      ...this.zoxiosOptions,
      baseOptions: { ...baseOptions, ...options },
    });
  }

  private setRequestPath(path: string) {
    const zoxiosOptions: ZoxiosOptions = {
      ...this.zoxiosOptions,
      requestPath: path,
    };

    return new Zoxios(this.originalHost, zoxiosOptions);
  }

  concatPath(path: string) {
    const { requestPath, hostname } = this.zoxiosOptions;
    const newRequestPath = `${requestPath}/${path}`;
    const url = getURL(hostname, newRequestPath);

    return this.setOption('url', url).setRequestPath(newRequestPath);
  }

  getDefinition() {
    const {
      hostname,
      querySchema,
      bodySchema,
      baseOptions,
      responseSchema,
      requestPath,
    } = this.zoxiosOptions;
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
    } as RequestMakerDefinition<QuerySchemaType, BodySchemaType>;
  }

  asyncOptionsSetter(optionsSetter: AsyncOptionsSetterMethod) {
    const zoxiosOptions: ZoxiosOptions = {
      ...this.zoxiosOptions,
      asyncOptionsSetterMethod: optionsSetter,
    };

    return new Zoxios(this.originalHost, zoxiosOptions);
  }

  querySchema<SchemaType extends QuerySchema>(schema: SchemaType) {
    const zoxiosOptions: ZoxiosOptions = {
      ...this.zoxiosOptions,
      querySchema: schema,
    };

    return new Zoxios<SchemaType, BodySchemaType, ZodSchema<unknown>>(
      this.originalHost,
      zoxiosOptions,
    );
  }

  bodySchema<SchemaType extends BodySchema>(schema: SchemaType) {
    const zoxiosOptions: ZoxiosOptions = {
      ...this.zoxiosOptions,
      bodySchema: schema,
    };

    return new Zoxios<QuerySchemaType, SchemaType, ZodSchema<unknown>>(
      this.originalHost,
      zoxiosOptions,
    );
  }

  responseSchema<SchemaType extends ResponseSchema>(schema: SchemaType) {
    const zoxiosOptions: ZoxiosOptions = {
      ...this.zoxiosOptions,
      responseSchema: schema,
    };

    return new Zoxios<QuerySchemaType, BodySchemaType, SchemaType>(
      this.originalHost,
      zoxiosOptions,
    );
  }

  handleRequestValidationError(handler: RequestValidationErrorHandler) {
    const zoxiosOptions = {
      ...this.zoxiosOptions,
      requestValidationErrorHandler: handler,
    };

    return new Zoxios(this.originalHost, zoxiosOptions);
  }

  handleResponseValidationError(handler: ResponseValidationErrorHandler) {
    const zoxiosOptions = {
      ...this.zoxiosOptions,
      responseValidationErrorHandler: handler,
    };

    return new Zoxios(this.originalHost, zoxiosOptions);
  }

  handleHttpError(handler: HttpErrorHandler) {
    const zoxiosOptions = {
      ...this.zoxiosOptions,
      httpErrorHandlers: [...this.zoxiosOptions.httpErrorHandlers, handler],
    };

    return new Zoxios(this.originalHost, zoxiosOptions);
  }

  exec<
    ResponseType extends z.infer<
      ResponseSchemaType extends undefined ? ZodUnknown : ResponseSchemaType
    >,
  >(): Promise<ResponseType> {
    const {
      baseOptions,
      httpErrorHandlers,
      asyncOptionsSetterMethod,
      bodySchema,
      querySchema,
      responseSchema,
      requestValidationErrorHandler,
      responseValidationErrorHandler,
    } = this.zoxiosOptions;

    return execRequest(
      baseOptions,
      httpErrorHandlers,
      asyncOptionsSetterMethod,
      {
        body: bodySchema,
        query: querySchema,
        response: responseSchema,
      },
    ).catch((error) => {
      if (error instanceof RequestValidationError) {
        return requestValidationErrorHandler(error);
      }

      if (error instanceof ResponseValidationError) {
        return responseValidationErrorHandler(error);
      }

      throw error;
    }) as Promise<ResponseType>;
  }
}
