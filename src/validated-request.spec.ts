/* eslint-disable max-nested-callbacks */
import nock from 'nock';
import { z } from 'zod';
import { validatedRequestMaker } from './validated-request-maker';
import {
  RequestValidationError,
  ResponseValidationError,
} from './validated-request.errors';

const host = 'https://localhost/api';

const beforeEachBlock = () => {
  nock.cleanAll();
};

describe(validatedRequestMaker.name, () => {
  describe('when calling path multiple times', () => {
    beforeEach(beforeEachBlock);
    it(`should concat all of the paths one after the other while adding '/' between them`, async () => {
      const [path1, path2, path3] = ['path1', 'path2', 'path3'];
      const response = { name: 'yes' };

      const nockScope = nock(host)
        .get(`/${path1}/${path2}/${path3}`)
        .reply(200, response);

      const validatedRequestResponse = await validatedRequestMaker(host)
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

          const validatedRequestResponse = await validatedRequestMaker(host)
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

          const validatedRequestResponse = await validatedRequestMaker(host)
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
            validatedRequestMaker(host)
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

          const validatedRequestResponse = await validatedRequestMaker(host)
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

          const validatedRequestResponse = await validatedRequestMaker(host)
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
            validatedRequestMaker(host)
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
            validatedRequestMaker(host)
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
          validatedRequestMaker(host)
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
          validatedRequestMaker(host)
            .concatPath(path)
            .responseSchema(z.object({ name: z.number() }))
            .handleResponseValidationError((error) => {
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

        const validatedRequestResponse = await validatedRequestMaker(host)
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
      const tokens = ['token_2', 'token_1'];
      const [token2, token1] = tokens;

      const nockScope1 = nock(host)
        .get(`/${path}`)
        .matchHeader('Authorization', token1)
        .reply(200);
      const nockScope2 = nock(host)
        .get(`/${path}`)
        .matchHeader('Authorization', token2)
        .reply(200);

      const requestMaker = validatedRequestMaker(host)
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

      const requestMaker = validatedRequestMaker(host)
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
        validatedRequestMaker(host)
          .bodySchema(z.object({ name: z.number(), street: z.number() }))
          .querySchema(z.object({ id: z.string(), age: z.number() }))
          .concatPath(path)
          .method('post')
          .body(requestBody as any)
          .query(requestQuery)
          .exec(),
      ).rejects.toThrowError(RequestValidationError);

      await expect(() =>
        validatedRequestMaker(host)
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
});
