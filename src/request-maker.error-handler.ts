import {
  HttpErrorHandler,
  RequestValidationErrorHandler,
  ResponseValidationErrorHandler,
  ZoxiosMaker,
} from './request-maker.type';

function handleRequestValidationError(
  zoxiosMaker: ZoxiosMaker,
  handler: RequestValidationErrorHandler,
) {
  zoxiosMaker.zoxiosOptions.requestValidationErrorHandler = handler;

  return zoxiosMaker.requestMaker;
}

function handleResponseValidationError(
  zoxiosMaker: ZoxiosMaker,
  handler: ResponseValidationErrorHandler,
) {
  zoxiosMaker.zoxiosOptions.responseValidationErrorHandler = handler;

  return zoxiosMaker.requestMaker;
}

function handleHttpError(zoxiosMaker: ZoxiosMaker, handler: HttpErrorHandler) {
  zoxiosMaker.zoxiosOptions.httpErrorHandlers.push(handler);

  return zoxiosMaker.requestMaker;
}

export function errorHandlersSetters(zoxiosMaker: ZoxiosMaker) {
  const binds = [null, zoxiosMaker] as const;

  return {
    handleHttpError: handleHttpError.bind(...binds),
    handleRequestValidationError: handleRequestValidationError.bind(...binds),
    handleResponseValidationError: handleResponseValidationError.bind(...binds),
  };
}
