
<p align="center">
  <h1 align="center">ZoXios</h1>
  <p align="center">
    A chainable validated HTTP request maker that uses zod to validated the requests and response.
  </p>
</p>


## Features
   * Parsing HTTP requests' body and query parameters and responses' body using [Zod](https://github.com/colinhacks/zod)
   * Chainable API.
   * Make HTTP requests using axios

## installation

### Install peer dependencies

```bash
npm i axios zod
```

### Install zoxios
```bash
npm i zoxios
```

## Basic usage

Parsing request's query and response's body.

```typescript
import { zoxios } from 'zoxios';

// GET http://hostname/api/orders?page=1&limit=10
const response = await zoxios('http://hostname/api/orders')
    .method('GET')
    .querySchema(z.object({ page: z.number(), limit: z.number() }))
    .query({ page: 1, limit: 10 }) // { page: number; limit: number; }
    .responseSchema(z.array(z.object({ id: z.number() })))
    .exec();

// response: { id: number; }[]

console.log(response);
// [ { id: 1 }, { id: 2 } ]
```

## Without Parsing
Requests can be made without defining parsing schemas for the request and the response.

```typescript
// GET http://hostname/api/orders?page=1&limit=10
const response = await zoxios('http://hostname/api/orders')
    .method('GET')
    .query({ page: 1, limit: 10 }) // unknown
    .exec();

// response: unknown

console.log(response);
// [ { id: 1 }, { id: 2 } ]
```

## Reusing and adding on-top of the request-maker

The request-maker is chainable, therefore it can help minimize code repetition by defining reusable "api layers".

### Example

Every request maker built on top on this one will have the same host, headers and the /api path
```typescript
function getBaseRequestMaker() {
    const options = { headers: { Authorization: `Bearer token` } };

    return zoxios('http://hostname')
        .options(options)
        .concatPath('api');
}
```

Every request maker built on top of this one will include the settings from `getBaseRequestMaker` and the `/orders` path

```typescript
function buildOrdersRequestMaker() {
    return getBaseRequestMaker().concatPath('orders');
}
```

This function will make a request including all of the settings from `buildOrdersRequestMaker` and:
* set the HTTP method as POST
* parse the specified body with the provided bodySchema.
* parse the response with the provided responseSchema

```typescript
function createOrder(itemId: string, amount: number) {
    return buildOrdersRequestMaker()
        .method('post')
        .bodySchema(z.object({ itemId: z.string(), amount: z.number() }))
        .responseSchema(z.object({ id: z.number() }))
        .body({ itemId, amount })
        .exec(); // Promise<{ id: number }>
}

```

Every request maker built on top on this one will include the settings from `buildOrdersRequestMaker` and the settings from this maker:
 * A GET HTTP method
 * A response schema definition

```typescript
function buildGetOrdersRequestMaker() {
    return buildOrdersRequestMaker()
        .method('get')
        .responseSchema(z.array(z.object({ id: z.number() })));
}
```

This function will make a request including all of the settings from `buildGetOrdersRequestMaker` and parse the specified query with the provided querySchema.
```typescript
function getOrdersPaginated(page: number, limit: number) {
    return buildGetOrdersRequestMaker()
        .querySchema(z.object({ page: z.number(), limit: z.number() }))
        .query({ page, limit }) // { page: number; limit: number; }
        .exec(); // Promise<{ id: number }[]
}
```

This function will make a request including all of the settings from `buildGetOrdersRequestMaker` and parse the specified query with the provided querySchema.
```typescript
function getOrdersInDateRange(startDate: Date, endDate: Date) {
    return buildGetOrdersRequestMaker()
        .querySchema(z.object({ startDate: z.date(), endDate: z.date() }))
        .query({ startDate, endDate }) // { startDate: Date; endDate: Date; }
        .exec(); // Promise<{ id: number }[]
}
```

## .options

Set axios options.
Every options set here will be overridden if set again in later chains, by calling `options` or other method resetting the value you defined here. 
```typescript
requestMaker('http://hostname').options({ timeout: 1000 });
```

## .asyncOptionsSetter

Set axios options asynchronously.
Provide an async function that will return axios options object.
This async function will run before each request and set the options.
Other set options will have priority over this one (only relevant when same option property is set).

Can be useful when each request have to calculate a request-signature or a token asynchronously.

```typescript
zoxios('http://hostname')
    .asyncOptionsSetter(async () => ({ headers: { Authorization: await Promise.resolve('token') } }))
```

## .concatPath
Will concat to the path defined up until its usage.
Each concatPath adds a "`/`" before the provided value.

```typescript
zoxios('http://hostname')
    .concatPath('api') // current url - http://hostname/api
    .concatPath('users') // current url - http://hostname/api/users
    .concatPath(5); // current url - http://hostname/api/users/5
```
This example will create the following URL:
`http://hostname/api/users/5`


## .getDefinition
Will return the definition of the request-maker which will include the hostname, querySchema, bodySchema, responseSchema, query, body, path, options and method.

```typescript
const body = { name: 'n', age: 1 };
const responseSchema = z.object({ id: z.number() });
const query = { endDate: new Date(), startDate: new Date() };
const bodySchema = z.object({ name: z.string(), age: z.number() });
const querySchema = z.object({ startDate: z.date(), endDate: z.date() });

const requestMaker = zoxios('localhost')
    .concatPath('api')
    .concatPath('orders')
    .querySchema(querySchema)
    .bodySchema(bodySchema)
    .responseSchema(responseSchema)
    .body(body)
    .query(query);

const definition = requestMaker.getDefinition();

// definition.body = body;
// definition.query = query;
// definition.path = '/api/orders';
// definition.hostname = 'localhost';
// definition.bodySchema = bodySchema;
// definition.querySchema = querySchema;
// definition.responseSchema = responseSchema;
```

## .host
Will change the host of the request-maker.

```typescript
const requestMaker = zoxios('https://localhost-1').concatPath('api').method('get');

// GET https://localhost-1/api
const validatedRequestResponse1 = await requestMaker.exec();

// GET https://localhost-2/api
const validatedRequestResponse2 = await requestMaker.host('https://localhost-2').exec();
```
