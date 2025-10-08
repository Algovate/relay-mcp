/**
 * Application constants
 */

// Server information
export const SERVER_NAME = 'relay-mcp';
export const SERVER_VERSION = '1.1.0';

// Default configuration values
export const DEFAULT_TIMEOUT = 30000;
export const DEFAULT_LOG_LEVEL = 'info';
export const DEFAULT_SWAGGER_SOURCE = 'url';
export const DEFAULT_AUTH_TYPE = 'none';
export const DEFAULT_TRANSPORT = 'stdio';
export const DEFAULT_TRANSPORT_PORT = 3000;
export const DEFAULT_TRANSPORT_HOST = '0.0.0.0';
export const DEFAULT_TRANSPORT_PATH = '/mcp';

// Auth defaults
export const DEFAULT_API_KEY_HEADER = 'X-API-Key';
export const DEFAULT_API_KEY_LOCATION = 'header' as const;

// Supported HTTP methods
export const SUPPORTED_HTTP_METHODS = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'options',
  'head',
] as const;

// Supported parameter locations
export const SUPPORTED_PARAM_LOCATIONS = ['path', 'query', 'header', 'cookie'] as const;

// Content types
export const CONTENT_TYPE_JSON = 'application/json';
export const CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded';
export const CONTENT_TYPE_MULTIPART = 'multipart/form-data';

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpMethod = (typeof SUPPORTED_HTTP_METHODS)[number];
export type ParamLocation = (typeof SUPPORTED_PARAM_LOCATIONS)[number];
