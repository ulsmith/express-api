export declare enum SwaggerSchemaContentTypesType {
    'application/json' = "application/json",
    'application/pdf' = "application/pdf",
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    'text/plain' = "text/plain",
    'text/html' = "text/html",
    'text/markdown' = "text/markdown",
    'text/event-stream' = "text/event-stream"
}
export type SwaggerSchemaStringParameterType = {
    description: string;
    type: 'string';
    default?: string;
    format?: string;
    pattern?: string;
    enum?: string[];
};
export type SwaggerSchemaNumberParameterType = {
    description: string;
    type: 'number';
    default?: number;
    enum?: number[];
};
export type SwaggerSchemaBooleanParameterType = {
    description: string;
    type: 'boolean';
    default?: boolean;
};
export type SwaggerSchemaObjectParameterType = {
    description: string;
    type: 'object';
    required?: string[];
    default?: object;
    additionalProperties?: boolean;
    properties: {
        [key: string]: SwaggerSchemaParametersType | {
            description: '$repeat.parent';
        };
    };
};
export type SwaggerSchemaArrayParameterType = {
    description: string;
    type: 'array';
    default?: [];
    items: SwaggerSchemaParametersType | {
        description: '$repeat.parent';
    };
};
export type SwaggerSchemaUnionParameterType = {
    description: string;
    type: ('string' | 'number' | 'boolean' | 'array' | 'object')[];
    default?: any;
};
export type SwaggerSchemaOneOfParameterType = {
    description: string;
    oneOf: SwaggerSchemaParametersType[];
};
export type SwaggerSchemaParametersType = SwaggerSchemaStringParameterType | SwaggerSchemaNumberParameterType | SwaggerSchemaBooleanParameterType | SwaggerSchemaObjectParameterType | SwaggerSchemaArrayParameterType | SwaggerSchemaUnionParameterType | SwaggerSchemaOneOfParameterType | {
    description: string;
};
export type SwaggerSchemaRequestContentType = {
    description: string;
    content: {
        [key in SwaggerSchemaContentTypesType]?: {
            schema: SwaggerSchemaParametersType;
        };
    };
};
export type SwaggerSchemaResponseContentType = {
    description: string;
    content?: {
        [key in SwaggerSchemaContentTypesType]?: {
            schema: SwaggerSchemaParametersType;
        };
    };
};
export type SwaggerSchemaSecurityType = {
    bearerAuth?: [];
};
export type SwaggerSchemaParameterType = {
    name: string;
    in: 'path' | 'header' | 'query';
    description: string;
    required?: boolean;
    schema: SwaggerSchemaParametersType;
};
export type SwaggerSchemaMethodType = {
    description: string;
    security?: SwaggerSchemaSecurityType[];
    parameters?: SwaggerSchemaParameterType[];
    requestBody?: SwaggerSchemaRequestContentType;
    responses: {
        [key: number]: SwaggerSchemaResponseContentType;
    };
};
//# sourceMappingURL=Swagger.d.ts.map