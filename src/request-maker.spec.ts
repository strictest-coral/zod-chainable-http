/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-nested-callbacks */
import nock from 'nock';
import { z } from 'zod';
import { zoxios } from './request-maker';
import { RequestValidationError, ResponseValidationError } from './errors';

const host = 'https://localhost/api';

const beforeEachBlock = () => {
  nock.cleanAll();
};

describe(zoxios.name, () => {
  describe('when changing hostname', () => {
    beforeEach(beforeEachBlock);

    const path = 'api';
    const host1 = 'https://localhost-1';
    const host2 = 'https://localhost-2';
    it(`should make a request to the new hostname`, async () => {
      const response = { name: 'yes' };

      const nockScope1 = nock(host1).get(`/${path}`).reply(200, response);
      const nockScope2 = nock(host2).get(`/${path}`).reply(200, response);

      const requestMaker = zoxios(host1).concatPath(path).method('get');
      const validatedRequestResponse1 = await requestMaker.exec();

      const validatedRequestResponse2 = await requestMaker.host(host2).exec();

      expect(nockScope1.isDone()).toBe(true);
      expect(nockScope2.isDone()).toBe(true);
      expect(validatedRequestResponse1).toMatchObject(response);
      expect(validatedRequestResponse2).toMatchObject(response);
    });
  });
  describe('when calling path multiple times', () => {
    beforeEach(beforeEachBlock);
    it(`should concat all of the paths one after the other while adding '/' between them`, async () => {
      const [path1, path2, path3] = ['path1', 'path2', 'path3'];
      const response = { name: 'yes' };

      const nockScope = nock(host)
        .get(`/${path1}/${path2}/${path3}`)
        .reply(200, response);

      const validatedRequestResponse = await zoxios(host)
        .concatPath(path1)
        .concatPath(path2)
        .concatPath(path3)
        .method('get')
        .exec();

      expect(nockScope.isDone()).toBe(true);
      expect(validatedRequestResponse).toMatchObject(response);
    });
  });

  describe('when defining a request schema', () => {
    const response = { name: 'yes' };
    const path = 'path1';
    const requestBody = { name: 1, street: 'san' };
    const requestQuery = { id: '114', age: 2 };

    describe('when defining a query schema', () => {
      describe('when query is valid', () => {
        beforeEach(beforeEachBlock);
        it('should make the request', async () => {
          const nockScope = nock(host)
            .post(`/${path}`)
            .query(requestQuery)
            .reply(200, response);

          const validatedRequestResponse = await zoxios(host)
            .concatPath(path)
            .method('post')
            .querySchema(z.object({ id: z.string(), age: z.number() }))
            .query(requestQuery)
            .exec();

          expect(nockScope.isDone()).toBe(true);
          expect(validatedRequestResponse).toMatchObject(response);
        });
        it('should not validate the body', async () => {
          const nockScope = nock(host)
            .post(`/${path}`, requestBody)
            .query(requestQuery)
            .reply(200, response);

          const validatedRequestResponse = await zoxios(host)
            .concatPath(path)
            .method('post')
            .querySchema(z.object({ id: z.string(), age: z.number() }))
            .query(requestQuery)
            .body(requestBody)
            .exec();

          expect(nockScope.isDone()).toBe(true);
          expect(validatedRequestResponse).toMatchObject(response);
        });
      });
      describe('when query is invalid', () => {
        beforeEach(beforeEachBlock);

        it('should not make the request and throw an error', async () => {
          const nockScope = nock(host)
            .post(`/${path}`)
            .query(requestQuery)
            .reply(200, response);

          await expect(() =>
            zoxios(host)
              .concatPath(path)
              .method('post')
              .querySchema(z.object({ id: z.string(), age: z.string() }))
              .query(requestQuery as any)
              .exec(),
          ).rejects.toThrowError(RequestValidationError);

          expect(nockScope.isDone()).toBe(false);
        });
      });
    });

    describe('when defining a body schema', () => {
      describe('when body is valid', () => {
        beforeEach(beforeEachBlock);
        it('should make the request', async () => {
          const nockScope = nock(host)
            .post(`/${path}`, requestBody)
            .reply(200, response);

          const validatedRequestResponse = await zoxios(host)
            .concatPath(path)
            .method('post')
            .bodySchema(z.object({ name: z.number(), street: z.string() }))
            .body(requestBody)
            .exec();

          expect(nockScope.isDone()).toBe(true);
          expect(validatedRequestResponse).toMatchObject(response);
        });
        it('should not validate the query', async () => {
          const nockScope = nock(host)
            .post(`/${path}`, requestBody)
            .query(requestQuery)
            .reply(200, response);

          const validatedRequestResponse = await zoxios(host)
            .concatPath(path)
            .method('post')
            .bodySchema(z.object({ name: z.number(), street: z.string() }))
            .query(requestQuery)
            .body(requestBody)
            .exec();

          expect(nockScope.isDone()).toBe(true);
          expect(validatedRequestResponse).toMatchObject(response);
        });
      });
      describe('when body is invalid', () => {
        beforeEach(beforeEachBlock);

        it('should not make the request and throw an error', async () => {
          const nockScope = nock(host)
            .post(`/${path}`, requestBody)
            .reply(200, response);

          await expect(() =>
            zoxios(host)
              .concatPath(path)
              .method('post')
              .bodySchema(z.object({ name: z.string(), street: z.string() }))
              .body(requestBody as any)
              .exec(),
          ).rejects.toThrowError(RequestValidationError);

          expect(nockScope.isDone()).toBe(false);
        });

        it('should run handleRequestValidationError', async () => {
          nock(host).post(`/${path}`, requestBody).reply(200, response);
          const newErrorMessage = 'test error message';

          await expect(() =>
            zoxios(host)
              .concatPath(path)
              .method('post')
              .bodySchema(z.object({ name: z.string(), street: z.string() }))
              .body(requestBody as any)
              .handleRequestValidationError(() => {
                throw new Error(newErrorMessage);
              })
              .exec(),
          ).rejects.toThrowError(newErrorMessage);
        });
      });
    });
  });

  describe('when defining a response schema', () => {
    const response = { name: 'yes' };
    const path = 'path1';

    describe('when response is invalid', () => {
      beforeEach(beforeEachBlock);

      it('should throw validation error', async () => {
        const nockScope = nock(host).get(`/${path}`).reply(200, response);

        await expect(() =>
          zoxios(host)
            .concatPath(path)
            .responseSchema(z.object({ name: z.number() }))
            .exec(),
        ).rejects.toThrowError(ResponseValidationError);

        expect(nockScope.isDone()).toBe(true);
      });

      it('should run handleResponseValidationError', async () => {
        nock(host).get(`/${path}`).reply(200, response);
        const newErrorMessage = 'test error message';

        await expect(() =>
          zoxios(host)
            .concatPath(path)
            .responseSchema(z.object({ name: z.number() }))
            .handleResponseValidationError(() => {
              throw new Error(newErrorMessage);
            })
            .exec(),
        ).rejects.toThrowError(newErrorMessage);
      });
    });
    describe('when response is valid', () => {
      beforeEach(beforeEachBlock);

      it('should return the response', async () => {
        const nockScope = nock(host).get(`/${path}`).reply(200, response);

        const validatedRequestResponse = await zoxios(host)
          .concatPath(path)
          .responseSchema(z.object({ name: z.string() }))
          .exec();

        expect(nockScope.isDone()).toBe(true);
        expect(validatedRequestResponse).toMatchObject(response);
      });
    });
  });

  describe('when defining a asyncOptionSetter', () => {
    const path = 'path1';

    beforeEach(beforeEachBlock);

    it('should ran the setter before each request', async () => {
      const tokens: [string, string] = ['token_2', 'token_1'];
      const [token2, token1] = tokens;

      const nockScope1 = nock(host)
        .get(`/${path}`)
        .matchHeader('Authorization', token1)
        .reply(200);
      const nockScope2 = nock(host)
        .get(`/${path}`)
        .matchHeader('Authorization', token2)
        .reply(200);

      const requestMaker = zoxios(host)
        .method('get')
        .concatPath(path)
        .asyncOptionsSetter(() =>
          Promise.resolve({
            headers: { Authorization: tokens.pop() || 'unused-token' },
          }),
        );

      await requestMaker.exec();
      await requestMaker.exec();

      expect(nockScope1.isDone()).toBe(true);
      expect(nockScope2.isDone()).toBe(true);
    });
    it('should override existing option properties', async () => {
      const token = 'token 1';
      const nockScope1 = nock(host)
        .get(`/${path}`)
        .matchHeader('Authorization', token)
        .reply(200);

      const requestMaker = zoxios(host)
        .method('get')
        .concatPath(path)
        .options({ headers: { Authorization: 'no-token' } })
        .asyncOptionsSetter(() =>
          Promise.resolve({ headers: { Authorization: token } }),
        );

      await requestMaker.exec();

      expect(nockScope1.isDone()).toBe(true);
    });
  });

  describe('when defining the query and body a few chains after their schema', () => {
    it('should validate them', async () => {
      const response = { name: 'yes' };
      const path = 'path1';
      const requestBody = { name: 1, street: 'san' };
      const requestQuery = { id: '114', age: 2 };

      const nockScope1 = nock(host)
        .post(`/${path}`, requestBody)
        .query(requestQuery)
        .reply(200, response);
      const nockScope2 = nock(host)
        .post(`/${path}`, requestBody)
        .query(requestQuery)
        .reply(200, response);

      await expect(() =>
        zoxios(host)
          .bodySchema(z.object({ name: z.number(), street: z.number() }))
          .querySchema(z.object({ id: z.string(), age: z.number() }))
          .concatPath(path)
          .method('post')
          .body(requestBody as any)
          .query(requestQuery)
          .exec(),
      ).rejects.toThrowError(RequestValidationError);

      await expect(() =>
        zoxios(host)
          .bodySchema(z.object({ name: z.number(), street: z.string() }))
          .querySchema(z.object({ id: z.string(), age: z.string() }))
          .concatPath(path)
          .method('post')
          .body(requestBody)
          .query(requestQuery as any)
          .exec(),
      ).rejects.toThrowError(RequestValidationError);

      expect(nockScope1.isDone()).toBe(false);
      expect(nockScope2.isDone()).toBe(false);
    });
  });

  describe('when getting definition', () => {
    const querySchema = z.object({ startDate: z.date(), endDate: z.date() });
    const bodySchema = z.object({ name: z.string(), age: z.number() });
    const responseSchema = z.object({ id: z.number() });
    const body = { name: 'n', age: 1 };
    const query = { endDate: new Date(), startDate: new Date() };
    it('should return all defined values', () => {
      const requestMaker = zoxios('localhost')
        .concatPath('api')
        .concatPath('orders')
        .querySchema(querySchema)
        .bodySchema(bodySchema)
        .responseSchema(responseSchema)
        .body(body)
        .query(query);

      const definition = requestMaker.getDefinition();

      expect(definition.querySchema).toEqual(querySchema);
      expect(definition.bodySchema).toEqual(bodySchema);
      expect(definition.responseSchema).toEqual(responseSchema);
      expect(definition.body).toEqual(body);
      expect(definition.query).toEqual(query);
      expect(definition.hostname).toEqual('localhost');
      expect(definition.path).toEqual('/api/orders');
    });
  });

  describe('when getting http response error', () => {
    describe('when one handleHttpError is defined', () => {
      it('should run the handler and handle the error', async () => {
        const path = 'api';
        const originalError = new Error('unknown error');
        nock(host).get(`/${path}`).reply(500, originalError);
        let didHandlerRun = false;

        const response = await zoxios(host)
          .concatPath(path)
          .method('get')
          .handleHttpError(() => {
            didHandlerRun = true;
            return null;
          })
          .exec();

        expect(didHandlerRun).toBeTruthy();
        expect(response).toBeNull();
      });
    });
    describe('when multiple handleHttpError are defined', () => {
      it('should run the handlers and handle the error', async () => {
        const path = 'api';
        const originalError = new Error('unknown error');
        const newError = new Error('new error');
        nock(host).get(`/${path}`).reply(500, originalError);
        let didHandler1Run = false;
        let didHandler2Run = false;

        await expect(() =>
          zoxios(host)
            .concatPath(path)
            .method('get')
            .handleHttpError((error) => {
              didHandler1Run = true;
              throw error;
            })
            .handleHttpError(() => {
              didHandler2Run = true;
              throw newError;
            })
            .exec(),
        ).rejects.toThrowError(newError);

        expect(didHandler1Run).toBeTruthy();
        expect(didHandler2Run).toBeTruthy();
      });
    });
    describe('when an handleHttpError is not defined', () => {
      const path = 'api';
      it('should throw an error', async () => {
        const error = new Error('Request failed with status code 500');
        nock(host).get(`/${path}`).reply(500, error);

        await expect(() =>
          zoxios(host).concatPath(path).method('get').exec(),
        ).rejects.toThrowError(error);
      });
    });
  });

  describe('when changing definition', () => {
    it('should keep the original request-maker the same', () => {
      const requestMaker1 = zoxios('http://google.com')
        .method('get')
        .concatPath('api')
        .responseSchema(z.object({ name: z.string() }));

      const requestMaker2 = requestMaker1
        .method('post')
        .concatPath('auth')
        .host('www.bing.com')
        .responseSchema(z.object({ id: z.number() }));

      const requestMaker1Definition = requestMaker1.getDefinition();
      const requestMaker2Definition = requestMaker2.getDefinition();

      expect(requestMaker1Definition.method).not.toEqual(
        requestMaker2Definition.method,
      );
      expect(requestMaker1Definition.path).not.toEqual(
        requestMaker2Definition.path,
      );

      expect(requestMaker1Definition.hostname).not.toEqual(
        requestMaker2Definition.hostname,
      );

      expect(requestMaker1Definition.path).toEqual('/api');
      expect(requestMaker2Definition.path).toEqual('/api/auth');
    });
  });
});
