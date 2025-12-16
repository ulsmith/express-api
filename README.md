# ExpressAPI

A TypeScript MVC framework for building APIs and Services in a microservice architecture on top of Express.js. ExpressAPI provides a structured, object-oriented approach to Express development with built-in support for databases, middleware, authentication, and services.

Supports FaaS systems too such as Lambda and Functions including event based requests from things such as SQS through additional handlers and template files.

## Overview

ExpressAPI is designed for microservice architectures and supports two main application types:

- **APIs** - Full-featured REST APIs with authentication, multiple HTTP methods (GET, POST, PUT, PATCH, DELETE), and access level controls
- **Services** - Lightweight services that only accept POST requests with no authentication requirements

## Features

- 🏗️ **MVC Architecture** - Clean separation of concerns with Controllers, Models, and Services
- 🔐 **Authentication & Authorization** - Built-in access level system for API endpoints
- 🔌 **Database Support** - Built-in support for PostgreSQL, MySQL, and DynamoDB
- 🛠️ **Service Layer** - Singleton services for reusable business logic
- 🔄 **Middleware System** - Flexible middleware pipeline with multiple hook points
- 🌍 **Global Access** - Access environment variables, services, and client data via `$environment`, `$services`, and `$client`
- 📦 **TypeScript First** - Full TypeScript support with type safety
- 🚀 **Zero Build Step** - Import directly from source TypeScript files
- 📋 **Schema Validation** - Automatic request/response validation using Swagger/OpenAPI schemas for both incoming and outgoing data
- 📚 **Auto Documentation** - Automatic Swagger/OpenAPI documentation generation from controller schemas

## Installation

```bash
npm install express-api
```

**Note:** This package exports TypeScript source files. Your project needs TypeScript configured, or a bundler that handles TypeScript (webpack, esbuild, etc.).

## Quick Start

### Setting Up Your Express Application

```typescript
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import requestIp from 'request-ip';
import bodyParser from 'body-parser';
import Application from 'express-api/System/Application';
import Response from 'express-api/System/Response';
import CorsMiddleware from 'express-api/Middleware/Cors';
import AuthMiddleware from './Middleware/Auth'; // Your custom auth middleware
import AuthService from './Service/Auth';
import LoggerService from './Service/Logger';

interface MyGlobals {
  $environment?: { [key: string]: any };
  $services?: { [key: string]: any };
  $client?: { [key: string]: any };
}

const server = express();

server.use(requestIp.mw());
server.use(bodyParser.json({ limit: '50mb' }));

server.use('/', (req, res) => {
  const app = new Application<MyGlobals>(req, 'express');
  
  // Register middleware
  const corsMiddleware = new CorsMiddleware<MyGlobals>(app.globals);
  const authMiddleware = new AuthMiddleware(app.globals);
  app.middleware([corsMiddleware, authMiddleware]);
  
  // Register services
  const authService = new AuthService(app.globals);
  const loggerService = new LoggerService(app.globals);
  app.service([authService, loggerService]);
  
  app.run().then((response: Response) => {
    // Log errors
    if (response.status >= 500) {
      loggerService.logHttp('error', req.path, req.method, req.headers, req.body, response);
    } else if (response.status >= 400) {
      loggerService.logHttp('warning', req.path, req.method, req.headers, req.body, response);
    }
    
    res.set(response.headers).status(response.status).send(response.body);
  });
});

const port = process.env.EAPI_PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## Global Variables

All classes that extend `Core` (Controllers, Models, Services, Middleware) automatically have access to global properties through the `globals` object passed to their constructor. These globals are shared across your entire application.

### Available Global Variables

#### `$environment`

Environment variables and configuration. Automatically populated from `process.env` variables that start with `EAPI_`.

```typescript
// Access in controllers, models, services, middleware
const apiKey = this.$environment?.EAPI_API_KEY;
const dbHost = this.$environment?.EAPI_DB_HOST;
const mode = this.$environment?.EAPI_MODE; // 'development' | 'production'
```

**Common Environment Variables:**
- `EAPI_NAME` - Application name
- `EAPI_ADDRESS` - Application address
- `EAPI_VERSION` - Application version
- `EAPI_MODE` - Running mode (development, production, etc.)
- `EAPI_PORT` - Server port
- `EAPI_CLUSTER_SIZE` - Number of cluster workers
- `EAPI_LOGGING` - Logging level ('all', 'error', 'warning', 'info', 'none')
- `EAPI_CORS_LIST` - Comma-separated list of allowed CORS origins
- `EAPI_PATH_UNSHIFT` - Path prefix to remove from routes
- `EAPI_PATH_SHIFT` - Path prefix to add to routes

#### `$services`

Registered singleton services. Services are registered via `api.service(serviceInstance)` and can be accessed by their service identifier.

```typescript
// Register a service
const postgres = new Postgres(app.globals, 'mydb', {...});
app.service(postgres); // Available as this.$services?.['postgres:mydb']

// Access in controllers, models, services, middleware
const postgres = this.$services?.['postgres:mydb'];
const emailService = this.$services?.['email'];
const logger = this.$services?.['logger'];
```

**Service Naming:**
- Database services: `'postgres:dbname'`, `'mysql:dbname'`, `'dynamo:dbname'`
- Custom services: Use the `service` property value (e.g., `'email'`, `'logger'`)

#### `$client`

Client-specific information automatically populated from the request.

```typescript
// Access in controllers, models, services, middleware
const origin = this.$client?.origin; // Request origin URL
const ipAddress = this.$client?.ipAddress; // Client IP address
```

#### `$socket` & `$io`

Socket.io specific properties (available when using socket.io integration).

```typescript
const socket = this.$socket;
const io = this.$io;
```

#### `$globals`

Access to the entire globals object.

```typescript
const globals = this.$globals;
```

## Creating APIs

APIs extend `Api` controller (from `express-api/Base/Controller/Api`) and support multiple HTTP methods (GET, POST, PUT, PATCH, DELETE) with authentication and access level controls.

**Note:** You can also extend the base `Controller` class (from `express-api/Base/Controller`) for controllers that don't need schema validation, such as health check or documentation endpoints.

### API Controller Structure

```typescript
import ApiController, { Schema } from 'express-api/Base/Controller/Api';
import Request from 'express-api/System/Request';
import { RequestAccessType, RequestAccessLevel } from './Types/Request';

interface MyGlobals {
  $environment?: { [key: string]: any };
  $services?: { [key: string]: any };
  $client?: { [key: string]: any };
}

export default class UserController extends ApiController<MyGlobals> {
  
  /**
   * Define the schema for all methods (Swagger/OpenAPI format)
   * These schemas are used for:
   * - Automatic request/response validation (incoming and outgoing)
   * - Swagger/OpenAPI documentation generation
   */
  options(): Schema {
    return {
      get: {
        description: 'Get a user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'The user ID',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'A user object',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        description: 'Create a new user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Created user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Define access level for GET method
   * All methods are restricted by default unless set to PUBLIC
   */
  static get get(): RequestAccessType {
    return { level: RequestAccessLevel.AUTHED_USER };
  }

  /**
   * GET handler
   */
  async get(request: Request) {
    // Parse and validate path parameters
    const { id } = this.parsePathParameters<{ id: string }>(request);
    
    // Access globals
    const logger = this.$services?.['logger'];
    
    // Your business logic
    // const user = await userModel.find(id);
    
    // Parse and validate output
    return this.parseOutput({ id, name: 'John Doe' });
  }

  /**
   * Define access level for POST method
   */
  static get post(): RequestAccessType {
    return { level: RequestAccessLevel.AUTHED_USER };
  }

  /**
   * POST handler
   */
  async post(request: Request) {
    // Parse and validate request body
    const { name, email } = this.parseBody<{ name: string; email: string }>(request, 'post');
    
    // Your business logic
    // const user = await userModel.insert({ name, email });
    
    // Parse and validate output
    return this.parseOutput({ id: '123', name, email });
  }
}
```

### Access Levels

Access levels control who can access API endpoints. Set them using static getters on the controller class:

```typescript
export enum RequestAccessLevel {
  PUBLIC,              // No authentication required
  AUTHED,              // Any authenticated user/application
  AUTHED_USER,         // Authenticated user only
  AUTHED_APPLICATION,  // Authenticated application only
}
```

**Example:**

```typescript
// Public endpoint - no auth required
static get get(): RequestAccessType {
  return { level: RequestAccessLevel.PUBLIC };
}

// Requires any authentication
static get post(): RequestAccessType {
  return { level: RequestAccessLevel.AUTHED };
}

// Requires user authentication
static get put(): RequestAccessType {
  return { level: RequestAccessLevel.AUTHED_USER };
}

// Requires application authentication
static get delete(): RequestAccessType {
  return { level: RequestAccessLevel.AUTHED_APPLICATION };
}
```

**Note:** If you don't define an access level for a method, it defaults to requiring authentication (AUTHED). The access level is checked in your authentication middleware via `request.access.level`.

### API Methods

APIs support all standard HTTP methods:

- `get(request: Request)` - GET requests
- `post(request: Request)` - POST requests
- `put(request: Request)` - PUT requests
- `patch(request: Request)` - PATCH requests
- `delete(request: Request)` - DELETE requests

### Schema Validation

The `options()` method returns Swagger/OpenAPI schemas that are used for **automatic validation of both incoming and outgoing data**. This ensures data integrity and type safety throughout your API.

**Incoming Validation:**
- **`parseBody()`** - Validates request body against the schema, removes extra fields, and ensures required fields are present
- **`parsePathParameters()`** - Validates path parameters (e.g., `/user/{id}`)
- **`parseQueryParameters()`** - Validates query parameters (e.g., `?page=1&limit=10`)

**Outgoing Validation:**
- **`parseOutput()`** - Validates response data against the schema, removes extra fields, and ensures required fields are present

All validation methods will throw a `RestError` with status 400 if validation fails, providing clear error messages about what's wrong with the data.

```typescript
// Parse request body (auto-detects method from call stack)
// This validates the body against the schema defined in options().post.requestBody
const data = this.parseBody<{ name: string; email: string }>(request);

// Or specify method explicitly
const data = this.parseBody<{ name: string; email: string }>(request, 'post');

// Parse path parameters (validates against options().get.parameters where in: 'path')
const { id } = this.parsePathParameters<{ id: string }>(request);

// Parse query parameters (validates against options().get.parameters where in: 'query')
const { page, limit } = this.parseQueryParameters<{ page: number; limit: number }>(request);

// Parse and validate output (validates against options().post.responses[200].content schema)
// This ensures only defined fields are returned and required fields are present
return this.parseOutput({ id: '123', name: 'John' });
```

### Swagger/OpenAPI Documentation

ExpressAPI automatically generates Swagger/OpenAPI documentation from your controller schemas. The `options()` method in each controller defines the OpenAPI schema for that endpoint, which is used for both validation and documentation.

To expose your API documentation, create an Index controller that aggregates all endpoint schemas:

```typescript
import Controller from 'express-api/Base/Controller';
import { RequestAccessType, RequestAccessLevel } from './Types/Request';
import UserController from './User';
import ProductController from './Product';

export default class Index extends Controller<MyGlobals> {
  private user: UserController;
  private product: ProductController;

  constructor(globals: MyGlobals) {
    super(globals);
    this.user = new UserController(this.$globals);
    this.product = new ProductController(this.$globals);
  }

  static get get(): RequestAccessType {
    return { level: RequestAccessLevel.PUBLIC };
  }

  get() {
    return {
      openapi: '3.1.0',
      info: {
        version: this.$environment?.EAPI_VERSION || '1.0.0',
        title: 'My API',
        description: 'API documentation',
      },
      servers: [
        { 
          url: this.$environment?.EAPI_ADDRESS || 'http://localhost:3000',
          description: this.$environment?.EAPI_MODE || 'development'
        }
      ],
      paths: {
        '/user/{id}': {
          get: this.user.options().get,
          put: this.user.options().put,
        },
        '/user': {
          post: this.user.options().post,
        },
        '/product/{id}': {
          get: this.product.options().get,
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Bearer token',
          },
        },
      },
    };
  }
}
```

Then add a route for the documentation endpoint:

```typescript
// src/routes.ts
const routes: RouteType[] = [
  {
    name: 'Index',
    method: ['get'],
    path: '/',
  },
  // ... other routes
];
```

Access your API documentation at `GET /` (or whatever path you configure). The response will be a complete OpenAPI 3.1.0 specification that can be:
- Imported into Swagger UI
- Used with tools like Postman
- Shared with frontend teams for API integration
- Used for API testing and validation

**Benefits:**
- **Single Source of Truth** - Your schemas define both validation rules and documentation
- **Always Up-to-Date** - Documentation is generated from your code, so it never gets out of sync
- **Type Safety** - TypeScript types and runtime validation use the same schema definitions
- **Automatic Validation** - Incoming requests and outgoing responses are automatically validated against the schemas

## Creating Services

Services extend `Service` controller (from `express-api/Base/Controller/Service`) and only support POST requests with no authentication requirements. They're designed for internal microservice communication.

**Note:** While services can technically use `ApiController` (and only implement POST) or the base `Controller` class, it's recommended to use the `Service` controller base class for proper type safety, clarity, and automatic POST-only enforcement.

### Service Controller Structure

```typescript
import Service, { Schema } from 'express-api/Base/Controller/Service';
import Request from 'express-api/System/Request';

interface MyGlobals {
  $environment?: { [key: string]: any };
  $services?: { [key: string]: any };
  $client?: { [key: string]: any };
}

export default class LoggerService extends Service<MyGlobals> {
  
  /**
   * Define the schema for POST method (Swagger/OpenAPI format)
   * Used for automatic validation and documentation generation
   */
  options(): Schema {
    return {
      post: {
        description: 'Log a message',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['level', 'message'],
                properties: {
                  level: { 
                    type: 'string',
                    enum: ['error', 'warning', 'info', 'debug']
                  },
                  message: { type: 'string' },
                  metadata: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Log entry created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    id: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * POST handler (only method available for services)
   */
  async post(request: Request) {
    // Parse and validate request body (no method parameter needed for Service controller)
    const { level, message, metadata } = this.parseBody<{
      level: 'error' | 'warning' | 'info' | 'debug';
      message: string;
      metadata?: any;
    }>(request);
    
    // Access globals
    const logger = this.$services?.['logger'];
    
    // Your business logic
    // await logger.save({ level, message, metadata });
    
    // Parse and validate output (no method parameter needed for Service controller)
    return this.parseOutput({ success: true, id: 'log-123' });
  }
}
```

**Key Differences from APIs:**
- Only `post()` method is available
- No access level configuration needed (always public, but you can still define `static get post()` if using `ApiController`)
- No authentication required
- Simpler structure for internal service communication
- `parseBody()` and `parseOutput()` don't require method parameter (always POST)

## Routes Configuration

Routes define the URL patterns that map to your controllers. Create a `routes.ts` file:

```typescript
import { RouteType } from 'express-api/Types/System';

const routes: RouteType[] = [
  {
    name: 'Index',
    method: ['get'],
    path: '/',
  },
  {
    name: 'User',
    method: ['get', 'put', 'delete', 'options'],
    path: '/user/{id}',
  },
  {
    name: 'User',
    method: ['post', 'options'],
    path: '/user',
  },
  {
    name: 'Logger',
    method: ['post', 'options'],
    path: '/logger',
  },
];

export default routes;
```

**Route Properties:**
- `name` - Controller class name (must match your controller file name)
- `method` - Array of HTTP methods or `'any'` for all methods
- `path` - URL path pattern with optional parameters using `{paramName}` syntax

**Path Parameters:**
- `{id}` - Single path segment parameter
- `{path+}` - Catch-all parameter (matches multiple segments)

**Environment Variables:**
- `_EAPI_ROUTES_FILE` - Path to routes file (default: `src/routes.js`)
- `_EAPI_CONTROLLER_PATH` - Path to controller directory (default: `src/Controller`)
- `_EAPI_HANDLER_FILE` - Path to handler file (default: `src/handler.js`)

## Middleware

Middleware provides hooks at different stages of the request/response cycle.

### Middleware Hooks

```typescript
import Middleware from 'express-api/Base/Middleware';
import Request from 'express-api/System/Request';
import Response from 'express-api/System/Response';
import RestError from 'express-api/Error/Rest';
import { RequestAccessLevel } from './Types/Request';

export default class AuthMiddleware extends Middleware<MyGlobals> {
  
  /**
   * Run before any request processing
   */
  async start(requests: Request[]): Promise<Request[]> {
    // Process multiple requests (for batch operations)
    return requests;
  }

  /**
   * Run after controller is resolved but before it executes
   */
  async mount(request: Request): Promise<Request> {
    // Access request.access.level here
    // Can modify request before controller runs
    return request;
  }

  /**
   * Run before controller execution
   */
  async in(request: Request): Promise<Request> {
    // Check authentication
    // OPTIONS requests and PUBLIC endpoints don't require auth
    if (request.method === 'options' || request.access.level === RequestAccessLevel.PUBLIC) {
      return request;
    }

    // Set client origin (can be from Origin header or X-Origin header)
    this.$client.origin = this.$client.origin || request.headers['X-Origin'] || request.headers['x-origin'] || '';
    if (!this.$client.origin) {
      throw new RestError('Origin is not set, access denied', 401);
    }

    // Verify authentication token
    const token = request.headers.Authorization;
    if (!token) {
      throw new RestError('Missing Authentication Token', 401);
    }

    // Verify token and check access level
    // const accessLevel = await this.$services.auth.verify(token, request.headers['User-Agent'], this.$client.origin);
    // 
    // // Check if user has required access level
    // if (request.access.level === RequestAccessLevel.AUTHED) return request;
    // if (request.access.level === RequestAccessLevel.AUTHED_USER && accessLevel === RequestAccessLevel.AUTHED_USER) return request;
    // if (request.access.level === RequestAccessLevel.AUTHED_APPLICATION && accessLevel === RequestAccessLevel.AUTHED_APPLICATION) return request;
    // throw new RestError('Access level not allowed for this resource', 403);

    return request;
  }

  /**
   * Run after controller execution
   */
  async out(response: Response): Promise<Response> {
    // Modify response before sending
    // response.headers['X-Custom-Header'] = 'value';
    return response;
  }

  /**
   * Run after all processing is complete
   */
  async end(response: Response): Promise<Response> {
    // Cleanup, logging, etc.
    return response;
  }
}
```

### Registering Middleware

```typescript
const app = new Application<MyGlobals>(req, 'express');

const corsMiddleware = new CorsMiddleware<MyGlobals>(app.globals);
const authMiddleware = new AuthMiddleware(app.globals);

// Register all middleware
app.middleware([corsMiddleware, authMiddleware]);

// Or register specific hooks
app.middlewareStart(authMiddleware);
app.middlewareMount(authMiddleware);
app.middlewareIn(authMiddleware);
app.middlewareOut(authMiddleware);
app.middlewareEnd(authMiddleware);
```

## Complete Example: API Setup

Here's a complete example of setting up an API with authentication:

### 1. Handler (`src/handler.ts`)

```typescript
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import requestIp from 'request-ip';
import bodyParser from 'body-parser';
import Application from 'express-api/System/Application';
import Response from 'express-api/System/Response';
import CorsMiddleware from 'express-api/Middleware/Cors';
import AuthMiddleware from './Middleware/Auth';
import AuthService from './Service/Auth';
import LoggerService from './Service/Logger';

interface Globals {
  $environment?: { [key: string]: any };
  $services?: { [key: string]: any };
  $client?: { [key: string]: any };
}

const server = express();

server.use(requestIp.mw());
server.use(bodyParser.json({ limit: '50mb' }));

server.use('/', (req, res) => {
  const app = new Application<Globals>(req, 'express');

  // Register middleware
  const corsMiddleware = new CorsMiddleware<Globals>(app.globals);
  const authMiddleware = new AuthMiddleware(app.globals);
  app.middleware([corsMiddleware, authMiddleware]);

  // Register services
  const authService = new AuthService(app.globals);
  const loggerService = new LoggerService(app.globals);
  app.service([authService, loggerService]);

  app.run().then((response: Response) => {
    // Log errors
    if (response.status >= 500) {
      loggerService.logHttp('error', req.path, req.method, req.headers, req.body, response);
    } else if (response.status >= 400) {
      loggerService.logHttp('warning', req.path, req.method, req.headers, req.body, response);
    }

    res.set(response.headers).status(response.status).send(response.body);
  });
});

const port = process.env.EAPI_PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### 2. Routes (`src/routes.ts`)

```typescript
import { RouteType } from 'express-api/Types/System';

const routes: RouteType[] = [
  {
    name: 'Index',
    method: ['get'],
    path: '/',
  },
  {
    name: 'User',
    method: ['get', 'put', 'delete', 'options'],
    path: '/user/{id}',
  },
  {
    name: 'User',
    method: ['post', 'options'],
    path: '/user',
  },
];

export default routes;
```

### 3. API Controller (`src/Controller/User.ts`)

```typescript
import ApiController, { Schema } from 'express-api/Base/Controller/Api';
import Request from 'express-api/System/Request';
import { RequestAccessType, RequestAccessLevel } from '../Types/Request';

export default class User extends ApiController<Globals> {
  
  options(): Schema {
    return {
      get: {
        description: 'Get user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        description: 'Create a new user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  static get get(): RequestAccessType {
    return { level: RequestAccessLevel.AUTHED_USER };
  }

  async get(request: Request) {
    const { id } = this.parsePathParameters<{ id: string }>(request);
    // const user = await userModel.find(id);
    return this.parseOutput({ id, name: 'John Doe', email: 'john@example.com' });
  }

  static get post(): RequestAccessType {
    return { level: RequestAccessLevel.AUTHED_USER };
  }

  async post(request: Request) {
    const { name, email } = this.parseBody<{ name: string; email: string }>(request);
    // const user = await userModel.insert({ name, email });
    return this.parseOutput({ id: '123', name, email });
  }
}
```

### 4. Service Controller (`src/Controller/Logger.ts`)

```typescript
import Service, { Schema } from 'express-api/Base/Controller/Service';
import Request from 'express-api/System/Request';

export default class Logger extends Service<Globals> {
  
  options(): Schema {
    return {
      post: {
        description: 'Log a message',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['level', 'message'],
                properties: {
                  level: { 
                    type: 'string',
                    enum: ['error', 'warning', 'info', 'debug']
                  },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  async post(request: Request) {
    // Service controller parseBody/parseOutput don't need method parameter
    const { level, message } = this.parseBody<{
      level: 'error' | 'warning' | 'info' | 'debug';
      message: string;
    }>(request);
    
    const logger = this.$services?.['logger'];
    // await logger.save({ level, message });
    
    return this.parseOutput({ success: true });
  }
}
```

## Running Your Application

### Development

```bash
# Set environment variables
export EAPI_MODE=development
export EAPI_PORT=3000
export EAPI_LOGGING=all

# Run with TypeScript
npx tsx src/handler.ts

# Or compile and run
npm run build
node dist/handler.js
```

### Production

```bash
# Set environment variables
export EAPI_MODE=production
export EAPI_PORT=3000
export EAPI_LOGGING=error
export EAPI_CLUSTER_SIZE=4

# Run
npm start
```

### Environment Variables

Set these in your `.env` file or environment:

```bash
# Application
EAPI_NAME=MyAPI
EAPI_ADDRESS=localhost
EAPI_VERSION=1.0.0
EAPI_MODE=development
EAPI_PORT=3000
EAPI_CLUSTER_SIZE=1
EAPI_LOGGING=all

# CORS
EAPI_CORS_LIST=http://localhost:3000,http://localhost:5173

# Paths
EAPI_PATH_UNSHIFT=/api
EAPI_PATH_SHIFT=/v1

# File Paths (optional, defaults shown)
_EAPI_CONTROLLER_PATH=src/Controller
_EAPI_ROUTES_FILE=src/routes.js
_EAPI_HANDLER_FILE=src/handler.js
```

## Database Models

ExpressAPI provides model base classes for different databases:

### PostgreSQL Model

```typescript
import ModelPG from 'express-api/Base/Model/Postgres';

class UserModel extends ModelPG<MyGlobals> {
  constructor(globals: MyGlobals) {
    super(globals, 'mydb', 'users', {
      softDelete: true,
      idCol: 'id',
      createdCol: 'created_at',
      updatedCol: 'updated_at'
    });
  }
  
  // Built-in methods: get, find, first, last, all, insert, update, delete, restore
}
```

### MySQL Model

```typescript
import ModelMysql from 'express-api/Base/Model/Mysql';

class UserModel extends ModelMysql<MyGlobals> {
  constructor(globals: MyGlobals) {
    super(globals, 'mydb', 'users', {
      softDelete: true
    });
  }
}
```

### DynamoDB Model

```typescript
import ModelDynamo from 'express-api/Base/Model/Dynamo';

class UserModel extends ModelDynamo<MyGlobals> {
  constructor(globals: MyGlobals) {
    super(globals, 'mydb', 'users');
  }
  
  // Built-in methods: createTable, get, put, update, listAppend
}
```

## Services

### Database Services

```typescript
import Postgres from 'express-api/Service/Postgres';

const postgres = new Postgres(app.globals, 'mydb', {
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

app.service(postgres); // Available as this.$services?.['postgres:mydb']
```

### Custom Services

```typescript
import Service from 'express-api/Base/Service';

class EmailService extends Service<MyGlobals> {
  public service = 'email'; // Required identifier
  
  async send(to: string, subject: string, body: string) {
    const apiKey = this.$environment?.EMAIL_API_KEY;
    // Email sending logic
    return { success: true };
  }
}

app.service(new EmailService(app.globals)); // Available as this.$services?.['email']
```

## Error Handling

ExpressAPI provides custom error classes:

```typescript
import ModelError from 'express-api/Error/Model';
import RestError from 'express-api/Error/Rest';
import SystemError from 'express-api/Error/System';

// In your code
throw new ModelError('Invalid data format');
throw new RestError('Not found', 404);
throw new SystemError('Internal server error', 500);
```

## TypeScript Support

ExpressAPI is written in TypeScript and provides full type safety. Define your globals interface for type-safe access:

```typescript
interface MyGlobals {
  $environment?: {
    EAPI_NAME: string;
    EAPI_PORT: number;
    EAPI_MODE: string;
    DB_HOST: string;
    DB_NAME: string;
  };
  $services?: {
    'postgres:mydb': Postgres;
    'email': EmailService;
    'logger': LoggerService;
  };
  $client?: {
    origin: string;
    ipAddress: string;
  };
}

// Use in your classes
class MyController extends ApiController<MyGlobals> {
  // this.$environment, this.$services are now fully typed!
}
```

## Utilities

ExpressAPI includes utility libraries:

- **Crypto** - `express-api/Library/Crypto` - Encryption, hashing, JWT
- **DataTools** - `express-api/Library/DataTools` - Data manipulation utilities
- **ObjectTools** - `express-api/Library/ObjectTools` - Object utilities
- **SchemaTools** - `express-api/Library/SchemaTools` - Schema validation utilities

## License

MIT

## Author

Paul Smith
