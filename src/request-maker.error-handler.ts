import { RequestValidationError, ResponseValidationError } from './errors';
import { ZoxiosMaker } from './request-maker.type';

type RequestValidationErrorHandler = (error: RequestValidationError) => void;
type ResponseValidationErrorHandler = (error: ResponseValidationError) => void;

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

export function errorHandlersSetters(zoxiosMaker: ZoxiosMaker) {
  const binds = [null, zoxiosMaker] as const;

  return {
    handleRequestValidationError: handleRequestValidationError.bind(...binds),
    handleResponseValidationError: handleResponseValidationError.bind(...binds),
  };
}
