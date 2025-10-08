/**
 * Base error class for all Relay errors
 */
export class RelayError extends Error {
  constructor(
    message: string,
    public _code: string,
    public _details?: any,
  ) {
    super(message);
    this.name = 'RelayError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration validation or loading errors
 */
export class ConfigurationError extends RelayError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * API request execution errors
 */
export class APIRequestError extends RelayError {
  constructor(
    message: string,
    public statusCode?: number,
    public responseData?: any,
  ) {
    super(message, 'API_REQUEST_ERROR', { statusCode, responseData });
    this.name = 'APIRequestError';
  }
}

/**
 * OpenAPI spec parsing errors
 */
export class SpecParsingError extends RelayError {
  constructor(message: string, details?: any) {
    super(message, 'SPEC_PARSING_ERROR', details);
    this.name = 'SpecParsingError';
  }
}

/**
 * Authentication configuration or application errors
 */
export class AuthenticationError extends RelayError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Tool generation errors
 */
export class ToolGenerationError extends RelayError {
  constructor(message: string, details?: any) {
    super(message, 'TOOL_GENERATION_ERROR', details);
    this.name = 'ToolGenerationError';
  }
}
