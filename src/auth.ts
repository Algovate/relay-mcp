import { AuthConfig } from './types.js';
import { AxiosRequestConfig } from 'axios';
import { logger } from './logger.js';
import { AuthenticationError } from './errors.js';

export class AuthManager {
  constructor(private _authConfig: AuthConfig) {}

  applyAuth(requestConfig: AxiosRequestConfig): AxiosRequestConfig {
    const config = { ...requestConfig };

    if (this._authConfig.type === 'none') {
      logger.debug('No authentication applied');
      return config;
    }

    if (this._authConfig.type === 'bearer' && this._authConfig.bearer) {
      logger.debug('Applying Bearer token authentication');
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this._authConfig.bearer.token}`,
      };
    } else if (this._authConfig.type === 'apikey' && this._authConfig.apiKey) {
      const { name, in: location, value } = this._authConfig.apiKey;

      logger.debug(`Applying API key authentication in ${location}: ${name}`);
      if (location === 'header') {
        config.headers = {
          ...config.headers,
          [name]: value,
        };
      } else if (location === 'query') {
        config.params = {
          ...config.params,
          [name]: value,
        };
      }
    } else if (this._authConfig.type === 'basic' && this._authConfig.basic) {
      logger.debug('Applying Basic authentication');
      const { username, password } = this._authConfig.basic;
      const token = Buffer.from(`${username}:${password}`).toString('base64');
      config.headers = {
        ...config.headers,
        Authorization: `Basic ${token}`,
      };
    }

    return config;
  }
}

export function createAuthConfig(
  type: 'apikey' | 'bearer' | 'basic' | 'none',
  options: Record<string, any>,
): AuthConfig {
  const config: AuthConfig = { type };

  logger.debug(`Creating auth config for type: ${type}`);

  if (type === 'apikey') {
    if (!options.authApiKey) {
      throw new AuthenticationError('API key is required when auth type is "apikey"');
    }
    config.apiKey = {
      name: options.authApiKeyName || 'X-API-Key',
      in: options.authApiKeyIn || 'header',
      value: options.authApiKey,
    };
  } else if (type === 'bearer') {
    if (!options.authToken) {
      throw new AuthenticationError('Token is required when auth type is "bearer"');
    }
    config.bearer = {
      token: options.authToken,
    };
  } else if (type === 'basic') {
    if (!options.authUsername || !options.authPassword) {
      throw new AuthenticationError('Username and password are required when auth type is "basic"');
    }
    config.basic = {
      username: options.authUsername,
      password: options.authPassword,
    };
  }

  return config;
}
