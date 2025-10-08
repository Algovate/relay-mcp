import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { Config } from './types.js';
import { ConfigurationError } from './errors.js';
import {
  DEFAULT_TIMEOUT,
  DEFAULT_SWAGGER_SOURCE,
  DEFAULT_AUTH_TYPE,
  DEFAULT_API_KEY_HEADER,
  DEFAULT_API_KEY_LOCATION,
} from './constants.js';

dotenvConfig();

// Zod schema for configuration validation
const ConfigSchema = z
  .object({
    swaggerSource: z.enum(['file', 'url']),
    swaggerUrl: z.string().url().optional(),
    swaggerFile: z.string().optional(),
    apiBaseUrl: z.string().url().optional(),
    authType: z.enum(['apikey', 'bearer', 'basic', 'none']),
    timeout: z.number().positive().int(),
    authApiKey: z.string().optional(),
    authApiKeyName: z.string().optional(),
    authApiKeyIn: z.enum(['header', 'query']).optional(),
    authToken: z.string().optional(),
    authUsername: z.string().optional(),
    authPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate swagger source requirements
      if (data.swaggerSource === 'url' && !data.swaggerUrl) {
        return false;
      }
      if (data.swaggerSource === 'file' && !data.swaggerFile) {
        return false;
      }
      return true;
    },
    {
      message: 'Must provide SWAGGER_URL for url source or SWAGGER_FILE for file source',
    },
  )
  .refine(
    (data) => {
      // Validate auth-specific requirements
      if (data.authType === 'apikey' && !data.authApiKey) {
        return false;
      }
      if (data.authType === 'bearer' && !data.authToken) {
        return false;
      }
      if (data.authType === 'basic' && (!data.authUsername || !data.authPassword)) {
        return false;
      }
      return true;
    },
    {
      message: 'Auth credentials missing for the specified auth type',
    },
  );

export function loadConfig(): Config {
  const rawConfig = {
    swaggerSource: process.env.SWAGGER_SOURCE || DEFAULT_SWAGGER_SOURCE,
    swaggerUrl: process.env.SWAGGER_URL,
    swaggerFile: process.env.SWAGGER_FILE,
    apiBaseUrl: process.env.API_BASE_URL,
    authType: process.env.AUTH_TYPE || DEFAULT_AUTH_TYPE,
    timeout: parseInt(process.env.TIMEOUT || String(DEFAULT_TIMEOUT), 10),
    authApiKey: process.env.AUTH_API_KEY,
    authApiKeyName: process.env.AUTH_API_KEY_NAME || DEFAULT_API_KEY_HEADER,
    authApiKeyIn: process.env.AUTH_API_KEY_IN || DEFAULT_API_KEY_LOCATION,
    authToken: process.env.AUTH_TOKEN,
    authUsername: process.env.AUTH_USERNAME,
    authPassword: process.env.AUTH_PASSWORD,
  };

  try {
    return ConfigSchema.parse(rawConfig) as Config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new ConfigurationError(`Configuration validation failed: ${errorMessages}`);
    }
    throw new ConfigurationError(`Failed to load configuration: ${error}`);
  }
}
