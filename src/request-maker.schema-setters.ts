import { ZodSchema } from 'zod';
import {
  BodySchema,
  QuerySchema,
  RequestMaker,
  ZoxiosMaker,
} from './request-maker.type';

function querySchema<QuerySchemaType extends QuerySchema>(
  zoxiosMaker: ZoxiosMaker,
  schema: QuerySchemaType,
) {
  zoxiosMaker.zoxiosOptions.querySchema = schema;

  return zoxiosMaker.requestMaker as unknown as RequestMaker<
    QuerySchemaType,
    undefined,
    ZodSchema<unknown>
  >;
}

function bodySchema<BodySchemaType extends BodySchema>(
  zoxiosMaker: ZoxiosMaker,
  schema: BodySchemaType,
) {
  zoxiosMaker.zoxiosOptions.bodySchema = schema;
  return zoxiosMaker.requestMaker as unknown as RequestMaker<
    undefined,
    BodySchemaType,
    ZodSchema<unknown>
  >;
}

export function requestSchemaSetters(zoxiosMaker: ZoxiosMaker) {
  return {
    querySchema: <QuerySchemaType extends QuerySchema>(
      schema: QuerySchemaType,
    ) => querySchema(zoxiosMaker, schema),
    bodySchema: <BodySchemaType extends BodySchema>(schema: BodySchemaType) =>
      bodySchema(zoxiosMaker, schema),
  };
}
