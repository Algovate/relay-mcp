import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthManager } from './auth.js';
import { ParsedEndpoint } from './types.js';
import { APIRequestError } from './errors.js';
import { logger } from './logger.js';
import { CONTENT_TYPE_JSON } from './constants.js';

export class APIClient {
  private axiosInstance: AxiosInstance;

  // Sanitize a headers object by removing nullish/empty string values
  private sanitizeHeaders(raw: Record<string, unknown>): Record<string, string> {
    const entries = Object.entries(raw)
      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      .map(([k, v]) => [k, String(v).trim()]);
    return Object.fromEntries(entries);
  }

  constructor(
    private baseUrl: string,
    private _authManager: AuthManager,
    timeout: number = 30000,
  ) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout,
      validateStatus: () => true, // Handle all status codes manually
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.debug('Outgoing API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        logger.error('Request setup failed', error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug('API response received', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('Response error', error);
        return Promise.reject(error);
      },
    );
  }

  async executeRequest(
    endpoint: ParsedEndpoint,
    params: Record<string, unknown>,
  ): Promise<{ status: number; data: unknown; headers: Record<string, unknown> }> {
    try {
      const requestConfig = this.buildRequestConfig(endpoint, params);
      const authedConfig = this._authManager.applyAuth(requestConfig);

      logger.info(`Executing ${endpoint.method.toUpperCase()} ${endpoint.path}`);
      const response: AxiosResponse = await this.axiosInstance.request(authedConfig);

      logger.info(`Request completed with status ${response.status}`);
      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      // If axios error with response, return the response data
      if (error.response) {
        logger.warn(`Request failed with status ${error.response.status}`);
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        };
      }

      // For network errors or other failures, throw custom error
      const message =
        error.code === 'ECONNABORTED' ? 'Request timeout' : `Request failed: ${error.message}`;

      throw new APIRequestError(message, undefined, { originalError: error.message });
    }
  }

  private buildRequestConfig(
    endpoint: ParsedEndpoint,
    params: Record<string, unknown>,
  ): AxiosRequestConfig {
    let url = endpoint.path;
    const queryParams: Record<string, unknown> = {};
    const headers: Record<string, string> = {};
    let data: unknown = undefined;

    // Process parameters
    for (const param of endpoint.parameters) {
      const value = params[param.name];

      if (param.required && (value === undefined || value === null)) {
        throw new APIRequestError(
          `Required parameter '${param.name}' is missing for ${endpoint.method.toUpperCase()} ${endpoint.path}`,
        );
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (param.in === 'path') {
        url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)));
      } else if (param.in === 'query') {
        queryParams[param.name] = value;
      } else if (param.in === 'header') {
        const headerValue = String(value).trim();
        // Skip empty/whitespace-only header values to avoid invalid headers like Authorization: ""
        if (headerValue !== '') {
          headers[param.name] = headerValue;
        } else {
          logger.warn(`Skipping empty header parameter '${param.name}'`);
        }
      }
    }

    // Process request body
    if (endpoint.requestBody) {
      const bodyParam =
        (params as Record<string, unknown>).body || (params as Record<string, unknown>).requestBody;

      if (endpoint.requestBody.required && !bodyParam) {
        throw new APIRequestError(
          `Request body is required for ${endpoint.method.toUpperCase()} ${endpoint.path}`,
        );
      }

      if (bodyParam) {
        data = bodyParam;

        // Determine content type from the requestBody definition
        const contentTypes = Object.keys(endpoint.requestBody.content || {});
        if (contentTypes.length > 0) {
          headers['Content-Type'] = contentTypes[0];
        } else {
          headers['Content-Type'] = CONTENT_TYPE_JSON;
        }
      }
    }

    // Remove any headers that ended up empty/undefined/null
    const sanitizedHeaders = this.sanitizeHeaders(headers);

    return {
      method: endpoint.method,
      url,
      params: queryParams,
      headers: sanitizedHeaders,
      data,
    };
  }
}
