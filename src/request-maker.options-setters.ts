import { AxiosRequestConfig, Method } from 'axios';
import { AsyncOptionsSetterMethod, ZoxiosMaker } from './request-maker.type';

function getURL(host = '', path = '') {
  return `${host}${path}`;
}

function setHost(zoxiosMaker: ZoxiosMaker, host: string) {
  zoxiosMaker.zoxiosOptions.hostname = host;
  zoxiosMaker.zoxiosOptions.baseOptions.url = getURL(
    zoxiosMaker.zoxiosOptions.hostname,
    zoxiosMaker.zoxiosOptions.requestPath,
  );

  return zoxiosMaker.requestMaker;
}

function asyncOptionsSetter(
  zoxiosMaker: ZoxiosMaker,
  optionsSetter: AsyncOptionsSetterMethod,
) {
  zoxiosMaker.zoxiosOptions.asyncOptionsSetterMethod = optionsSetter;
  return zoxiosMaker.requestMaker;
}

function optionsSetter(
  zoxiosMaker: ZoxiosMaker,
  options: Partial<AxiosRequestConfig>,
) {
  zoxiosMaker.zoxiosOptions.baseOptions = {
    ...zoxiosMaker.zoxiosOptions.baseOptions,
    ...options,
  };
  return zoxiosMaker.requestMaker;
}

function querySetter<QueryType>(zoxiosMaker: ZoxiosMaker, query: QueryType) {
  zoxiosMaker.zoxiosOptions.baseOptions.params = query;

  return zoxiosMaker.requestMaker;
}

function concatPath(zoxiosMaker: ZoxiosMaker, path: string) {
  zoxiosMaker.zoxiosOptions.requestPath += `/${path}`;
  zoxiosMaker.zoxiosOptions.baseOptions.url = getURL(
    zoxiosMaker.zoxiosOptions.hostname,
    zoxiosMaker.zoxiosOptions.requestPath,
  );
  return zoxiosMaker.requestMaker;
}

function setMethod(zoxiosMaker: ZoxiosMaker, method: Method) {
  zoxiosMaker.zoxiosOptions.baseOptions.method = method;
  return zoxiosMaker.requestMaker;
}

function setBody<BodyType>(zoxiosMaker: ZoxiosMaker, body: BodyType) {
  zoxiosMaker.zoxiosOptions.baseOptions.data = body;

  return zoxiosMaker.requestMaker;
}

export function optionsSetters(zoxiosMaker: ZoxiosMaker) {
  const binds = [null, zoxiosMaker] as const;

  return {
    body: setBody.bind(...binds),
    host: setHost.bind(...binds),
    method: setMethod.bind(...binds),
    query: querySetter.bind(...binds),
    options: optionsSetter.bind(...binds),
    concatPath: concatPath.bind(...binds),
    asyncOptionsSetter: asyncOptionsSetter.bind(...binds),
  };
}
