#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
  ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig } from './config.js';
import { SwaggerAPIParser } from './parser.js';
import { ToolGenerator } from './tools.js';
import { APIClient } from './client.js';
import { AuthManager, createAuthConfig } from './auth.js';
import { ParsedEndpoint } from './types.js';
import { logger } from './logger.js';
import { ConfigurationError } from './errors.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';

class SwaggerMCPServer {
  private server: Server;
  private parser: SwaggerAPIParser;
  private toolGenerator: ToolGenerator;
  private apiClient: APIClient | null = null;
  private endpoints: ParsedEndpoint[] = [];
  private endpointMap: Map<string, ParsedEndpoint> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.parser = new SwaggerAPIParser();
    this.toolGenerator = new ToolGenerator();

    this.setupHandlers();

    logger.info(`${SERVER_NAME} v${SERVER_VERSION} initialized`);
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
      logger.debug('Listing tools');
      const tools = this.toolGenerator.generateTools(this.endpoints);
      logger.debug(`Returning ${tools.length} tools`);
      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      logger.info(`Tool called: ${name}`);

      const endpoint = this.endpointMap.get(name);
      if (!endpoint) {
        const error = `Unknown tool: ${name}`;
        logger.error(error);
        return {
          content: [
            {
              type: 'text',
              text: error,
            },
          ],
          isError: true,
        };
      }

      if (!this.apiClient) {
        const error = 'API client not initialized';
        logger.error(error);
        return {
          content: [
            {
              type: 'text',
              text: error,
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await this.apiClient.executeRequest(endpoint, args || {});

        logger.info(`Tool ${name} completed successfully`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`Tool ${name} failed`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message || 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async initialize() {
    try {
      logger.info('Starting initialization...');

      // Load configuration
      const config = loadConfig();
      logger.info('Configuration loaded successfully');

      // Load OpenAPI spec
      const specSource = config.swaggerSource === 'url' ? config.swaggerUrl! : config.swaggerFile!;

      logger.info(`Loading OpenAPI spec from ${config.swaggerSource}: ${specSource}`);
      await this.parser.loadSpec(specSource);

      // Get endpoints
      this.endpoints = this.parser.getEndpoints();
      logger.info(`Parsed ${this.endpoints.length} endpoints`);

      // Build endpoint map for quick lookup
      const tools = this.toolGenerator.generateTools(this.endpoints);
      for (let i = 0; i < tools.length; i++) {
        this.endpointMap.set(tools[i].name, this.endpoints[i]);
      }
      logger.debug(`Built endpoint map with ${this.endpointMap.size} entries`);

      // Determine base URL
      const baseUrl = config.apiBaseUrl || this.parser.getBaseUrl();
      if (!baseUrl) {
        throw new ConfigurationError(
          'Could not determine API base URL. Please set API_BASE_URL in config.',
        );
      }
      logger.info(`API base URL: ${baseUrl}`);

      // Setup authentication
      const authConfig = createAuthConfig(config.authType || 'none', config);
      const authManager = new AuthManager(authConfig);
      logger.info(`Authentication configured: ${config.authType}`);

      // Create API client
      this.apiClient = new APIClient(baseUrl, authManager, config.timeout);
      logger.info(`API client created with timeout: ${config.timeout}ms`);

      const info = this.parser.getInfo();
      logger.info(`Loaded API: ${info.title} (v${info.version})`);
      logger.info(`Tools available: ${tools.length}`);
      logger.info('Initialization complete');
    } catch (error: any) {
      logger.error('Initialization failed', error);
      throw error;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info(`${SERVER_NAME} running on stdio`);
  }
}

// Main entry point
async function main() {
  try {
    const server = new SwaggerMCPServer();
    await server.initialize();
    await server.run();
  } catch (error: any) {
    logger.error('Fatal error during startup', error);
    process.exit(1);
  }
}

main();
