import { OpenAPIV3, OpenAPIV2 } from 'openapi-types';

export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV2.Document;

export type TransportType = 'stdio' | 'sse' | 'http';

export interface Config {
  swaggerSource: 'file' | 'url';
  swaggerUrl?: string;
  swaggerFile?: string;
  apiBaseUrl?: string;
  authType?: 'apikey' | 'bearer' | 'basic' | 'none';
  authToken?: string;
  authApiKey?: string;
  authApiKeyName?: string;
  authApiKeyIn?: 'header' | 'query';
  authUsername?: string;
  authPassword?: string;
  timeout?: number;
  transport?: TransportType;
  transportPort?: number;
  transportHost?: string;
  transportPath?: string;
}

export interface ParsedEndpoint {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters: ParsedParameter[];
  requestBody?: ParsedRequestBody;
  responses: Record<string, any>;
  security?: Array<Record<string, string[]>>;
}

export interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  schema: any;
  description?: string;
}

export interface ParsedRequestBody {
  required: boolean;
  content: Record<string, { schema?: any }>;
  description?: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface APIRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
}

export interface AuthConfig {
  type: 'apikey' | 'bearer' | 'basic' | 'none';
  apiKey?: {
    name: string;
    in: 'header' | 'query';
    value: string;
  };
  bearer?: {
    token: string;
  };
  basic?: {
    username: string;
    password: string;
  };
}
