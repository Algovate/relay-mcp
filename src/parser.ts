import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3, OpenAPIV2 } from 'openapi-types';
import { OpenAPIDocument, ParsedEndpoint, ParsedParameter, ParsedRequestBody } from './types.js';
import { SpecParsingError } from './errors.js';
import { logger } from './logger.js';
import { SUPPORTED_HTTP_METHODS } from './constants.js';

export class SwaggerAPIParser {
  private spec: OpenAPIDocument | null = null;

  async loadSpec(source: string): Promise<void> {
    try {
      logger.debug(`Loading OpenAPI spec from: ${source}`);
      this.spec = (await SwaggerParser.validate(source)) as OpenAPIDocument;
      logger.debug('OpenAPI spec loaded and validated successfully');
    } catch (error) {
      throw new SpecParsingError(
        `Failed to load OpenAPI spec from ${source}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  getEndpoints(): ParsedEndpoint[] {
    if (!this.spec) {
      throw new SpecParsingError('Spec not loaded. Call loadSpec() first.');
    }

    const endpoints: ParsedEndpoint[] = [];
    const paths = this.spec.paths;

    if (!paths) {
      logger.warn('No paths found in OpenAPI spec');
      return endpoints;
    }

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem) {
        continue;
      }

      for (const method of SUPPORTED_HTTP_METHODS) {
        const operation = (pathItem as any)[method];
        if (!operation) {
          continue;
        }

        try {
          const endpoint = this.parseOperation(path, method, operation, pathItem);
          endpoints.push(endpoint);
        } catch (error) {
          logger.warn(`Failed to parse endpoint ${method.toUpperCase()} ${path}`, error);
        }
      }
    }

    logger.info(`Parsed ${endpoints.length} endpoints from OpenAPI spec`);
    return endpoints;
  }

  private parseOperation(
    path: string,
    method: string,
    operation: OpenAPIV3.OperationObject | OpenAPIV2.OperationObject,
    pathItem: OpenAPIV3.PathItemObject | OpenAPIV2.PathItemObject,
  ): ParsedEndpoint {
    const parameters = this.parseParameters(operation, pathItem);
    const requestBody = this.parseRequestBody(operation);

    return {
      path,
      method: method.toLowerCase(),
      operationId: operation.operationId,
      summary: operation.summary,
      description: operation.description,
      parameters,
      requestBody,
      responses: operation.responses || {},
      security: operation.security,
    };
  }

  private parseParameters(
    operation: OpenAPIV3.OperationObject | OpenAPIV2.OperationObject,
    pathItem: OpenAPIV3.PathItemObject | OpenAPIV2.PathItemObject,
  ): ParsedParameter[] {
    const params: ParsedParameter[] = [];

    // Combine path-level and operation-level parameters
    const allParams = [...(pathItem.parameters || []), ...(operation.parameters || [])];

    for (const param of allParams) {
      // Handle $ref parameters (they should already be resolved by swagger-parser)
      if ('$ref' in param) {
        logger.warn(`Unresolved parameter $ref found: ${param.$ref}`);
        continue;
      }

      // Handle both OpenAPI 3.0 and 2.0 parameter formats
      const parsedParam: ParsedParameter = {
        name: param.name,
        in: param.in as 'path' | 'query' | 'header' | 'cookie',
        required: param.required || false,
        schema: 'schema' in param ? param.schema : { type: (param as any).type || 'string' },
        description: param.description,
      };
      params.push(parsedParam);
    }

    return params;
  }

  private parseRequestBody(
    operation: OpenAPIV3.OperationObject | OpenAPIV2.OperationObject,
  ): ParsedRequestBody | undefined {
    // OpenAPI 3.0 has requestBody, OpenAPI 2.0 doesn't
    if ('requestBody' in operation && operation.requestBody) {
      const requestBody = operation.requestBody;

      // Handle $ref in requestBody (should already be resolved)
      if ('$ref' in requestBody) {
        logger.warn(`Unresolved requestBody $ref found: ${requestBody.$ref}`);
        return undefined;
      }

      return {
        required: requestBody.required || false,
        content: (requestBody.content || {}) as Record<string, { schema?: any }>,
        description: requestBody.description,
      };
    }

    return undefined;
  }

  getBaseUrl(): string {
    if (!this.spec) {
      throw new SpecParsingError('Spec not loaded');
    }

    // OpenAPI 3.0
    if ('servers' in this.spec && this.spec.servers && this.spec.servers.length > 0) {
      const baseUrl = this.spec.servers[0].url;
      logger.debug(`Base URL from OpenAPI 3.0 servers: ${baseUrl}`);
      return baseUrl;
    }

    // Swagger 2.0
    if ('host' in this.spec) {
      const spec = this.spec as OpenAPIV2.Document;
      const scheme = spec.schemes?.[0] || 'https';
      const basePath = spec.basePath || '';
      const baseUrl = `${scheme}://${spec.host}${basePath}`;
      logger.debug(`Base URL from Swagger 2.0: ${baseUrl}`);
      return baseUrl;
    }

    logger.warn('No base URL found in OpenAPI spec');
    return '';
  }

  getInfo(): { title: string; version: string; description?: string } {
    if (!this.spec || !this.spec.info) {
      return { title: 'API', version: '1.0.0' };
    }

    return {
      title: this.spec.info.title,
      version: this.spec.info.version,
      description: this.spec.info.description,
    };
  }
}
