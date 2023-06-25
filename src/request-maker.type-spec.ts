import { ZodDate, ZodNumber, ZodObject, ZodString, ZodTypeAny, z } from 'zod';
import { zoxios } from './request-maker';
import type { Equal, Expect } from './type.utils';
import { AxiosRequestConfig } from 'axios';

export function validatedRequestTest() {
  const validatedRequest = zoxios('host')
    .bodySchema(z.object({ name: z.string() }))
    .querySchema(z.object({ id: z.number(), startDate: z.date() }))
    .responseSchema(
      z.array(z.object({ id: z.number(), type: z.enum(['type1', 'type2']) })),
    );

  type BodyType = Parameters<typeof validatedRequest.body>[0];
  type QueryType = Parameters<typeof validatedRequest.query>[0];
  type ResponseType = ReturnType<typeof validatedRequest.exec>;
  type AwaitedResponseType = Awaited<ReturnType<typeof validatedRequest.exec>>;
  type DefinitionType = ReturnType<typeof validatedRequest.getDefinition>;

  type BodySchemaType = ZodObject<{ name: ZodString }, "strip", ZodTypeAny, BodyType, BodyType>;
  type QuerySchemaType = ZodObject<{ id: ZodNumber, startDate: ZodDate }, "strip", ZodTypeAny, QueryType, QueryType>;


  type Tests = [
    Expect<Equal<BodyType, { name: string }>>,
    Expect<Equal<QueryType, { id: number; startDate: Date }>>,
    Expect<
      Equal<ResponseType, Promise<{ id: number; type: 'type1' | 'type2' }[]>>
    >,
    Expect<
      Equal<AwaitedResponseType, { id: number; type: 'type1' | 'type2' }[]>
    >,
    Expect<Equal<DefinitionType['body'], unknown>>,
    Expect<Equal<DefinitionType['query'], unknown>>,
    Expect<Equal<DefinitionType['bodySchema'], BodySchemaType>>,
    Expect<Equal<DefinitionType['querySchema'], QuerySchemaType>>,
    Expect<Equal<DefinitionType['options'], AxiosRequestConfig>>,
  ];
}

export function schemaLessRequestTest() {
  const validatedRequest = zoxios('host');

  type BodyType = Parameters<typeof validatedRequest.body>[0];
  type QueryType = Parameters<typeof validatedRequest.query>[0];
  type ResponseType = ReturnType<typeof validatedRequest.exec>;
  type DefinitionType = ReturnType<typeof validatedRequest.getDefinition>;

  type Tests = [
    Expect<Equal<BodyType, unknown>>,
    Expect<Equal<QueryType, unknown>>,
    Expect<Equal<ResponseType, Promise<unknown>>>,
    Expect<Equal<DefinitionType['bodySchema'], undefined>>,
    Expect<Equal<DefinitionType['querySchema'], undefined>>,
  ];
}
