import { ParsedEndpoint, MCPToolDefinition } from './types.js';
import { logger } from './logger.js';
import { ToolGenerationError } from './errors.js';

export class ToolGenerator {
  generateTools(endpoints: ParsedEndpoint[]): MCPToolDefinition[] {
    logger.debug(`Generating tools for ${endpoints.length} endpoints`);
    const tools = endpoints.map((endpoint) => this.endpointToTool(endpoint));
    logger.debug(`Generated ${tools.length} tools`);
    return tools;
  }

  private endpointToTool(endpoint: ParsedEndpoint): MCPToolDefinition {
    try {
      const name = this.generateToolName(endpoint);
      const description = this.generateToolDescription(endpoint);
      const inputSchema = this.generateInputSchema(endpoint);

      logger.debug(`Generated tool: ${name} for ${endpoint.method.toUpperCase()} ${endpoint.path}`);

      return {
        name,
        description,
        inputSchema,
      };
    } catch (error) {
      throw new ToolGenerationError(
        `Failed to generate tool for ${endpoint.method} ${endpoint.path}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  private generateToolName(endpoint: ParsedEndpoint): string {
    // Use operationId if available, otherwise generate from method and path
    if (endpoint.operationId) {
      return endpoint.operationId.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    // Convert path like /users/{id}/posts to users_id_posts
    const pathPart = endpoint.path
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/\{|\}/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return `${endpoint.method}_${pathPart}`.toLowerCase();
  }

  private generateToolDescription(endpoint: ParsedEndpoint): string {
    const parts: string[] = [];

    if (endpoint.summary) {
      parts.push(endpoint.summary);
    }

    if (endpoint.description && endpoint.description !== endpoint.summary) {
      parts.push(endpoint.description);
    }

    if (parts.length === 0) {
      parts.push(`${endpoint.method.toUpperCase()} ${endpoint.path}`);
    }

    return parts.join('\n\n');
  }

  private generateInputSchema(endpoint: ParsedEndpoint): MCPToolDefinition['inputSchema'] {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    // Add parameters
    for (const param of endpoint.parameters) {
      properties[param.name] = this.convertSchemaToJSONSchema(param.schema);

      if (param.description) {
        properties[param.name].description = param.description;
      }

      if (param.required) {
        required.push(param.name);
      }
    }

    // Add request body
    if (endpoint.requestBody) {
      const contentTypes = Object.keys(endpoint.requestBody.content);

      if (contentTypes.length > 0) {
        const contentType = contentTypes[0];
        const mediaType = endpoint.requestBody.content[contentType];

        if (mediaType.schema) {
          properties.body = this.convertSchemaToJSONSchema(mediaType.schema);

          if (endpoint.requestBody.description) {
            properties.body.description = endpoint.requestBody.description;
          }

          if (endpoint.requestBody.required) {
            required.push('body');
          }
        }
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  private convertSchemaToJSONSchema(schema: any): any {
    if (!schema) {
      return { type: 'string' };
    }

    // Handle $ref - for simplicity, we'll just note it
    if (schema.$ref) {
      logger.warn(`Unresolved $ref in schema: ${schema.$ref}`);
      return {
        type: 'object',
        description: `Reference to ${schema.$ref}`,
      };
    }

    // Handle array type
    if (schema.type === 'array') {
      return {
        type: 'array',
        items: this.convertSchemaToJSONSchema(schema.items),
        ...(schema.description ? { description: schema.description } : {}),
      };
    }

    // Handle object type
    if (schema.type === 'object' || schema.properties) {
      const properties: Record<string, any> = {};

      if (schema.properties) {
        for (const [key, value] of Object.entries(schema.properties)) {
          properties[key] = this.convertSchemaToJSONSchema(value);
        }
      }

      return {
        type: 'object',
        properties,
        ...(schema.required ? { required: schema.required } : {}),
        ...(schema.description ? { description: schema.description } : {}),
      };
    }

    // Handle primitive types
    const result: any = {
      type: schema.type || 'string',
    };

    if (schema.enum) {
      result.enum = schema.enum;
    }
    if (schema.format) {
      result.format = schema.format;
    }
    if (schema.description) {
      result.description = schema.description;
    }
    if (schema.default !== undefined) {
      result.default = schema.default;
    }
    if (schema.minimum !== undefined) {
      result.minimum = schema.minimum;
    }
    if (schema.maximum !== undefined) {
      result.maximum = schema.maximum;
    }
    if (schema.pattern) {
      result.pattern = schema.pattern;
    }

    return result;
  }
}
