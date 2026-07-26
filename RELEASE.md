# RELEASE

## 1.2.0

Added Correlation middleware for distributed request context.
Added ExpressApiService base class for HTTP clients calling other express-api services.
Added console-first Logger service with subclass extension point for remote logging.
Return 200 for browser CORS OPTIONS requests on unmatched routes.
Widened Zod schema types and added generic inference on ApiZod/ServiceZod parse helpers.

## 1.1.1

Created new CryptoTools and deprecated Crypto.
Created new DataTools, FileTools, Eval

## 1.1.0

Added support for zod schemas to automatically generate OpenAPI schemas and support mcp services.
Upgraded application to expose controller class to client.
Exposed method and path to both request and response.
Fixed bug with application not passing generic response to middleware, response is converted after all middleware has run.

## 1.0.4

Add correct return type for mysql so generics can be used to infer return types.
Allow service names to be changed, so multiple conenctions can be used with same service classes

## 1.0.3

Add correct return type for mysql so generics can be used to infer return types.
Allow service names to be changed, so multiple conenctions can be used with same service classes

## 1.0.2

Fixed types for Models.

## 1.0.1

README changes.

## 1.0.0

Init release.