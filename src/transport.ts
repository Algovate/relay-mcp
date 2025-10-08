import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response, NextFunction } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { randomUUID } from 'crypto';
import { TransportType } from './types.js';
import { logger } from './logger.js';
import {
  DEFAULT_TRANSPORT_PORT,
  DEFAULT_TRANSPORT_HOST,
  DEFAULT_TRANSPORT_PATH,
} from './constants.js';

export interface TransportConfig {
  type: TransportType;
  port?: number;
  host?: string;
  path?: string;
}

// Simple in-memory event store for streamable HTTP resumability
class InMemoryEventStore {
  private events: Map<string, { streamId: string; message: any }> = new Map();

  private generateEventId(streamId: string): string {
    return `${streamId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private getStreamIdFromEventId(eventId: string): string {
    const parts = eventId.split('_');
    return parts.length > 0 ? parts[0] : '';
  }

  async storeEvent(streamId: string, message: any): Promise<string> {
    const eventId = this.generateEventId(streamId);
    this.events.set(eventId, { streamId, message });
    return eventId;
  }

  async replayEventsAfter(
    lastEventId: string,
    { send }: { send: (eventId: string, message: any) => Promise<void> },
  ): Promise<string> {
    if (!lastEventId || !this.events.has(lastEventId)) {
      return '';
    }

    const streamId = this.getStreamIdFromEventId(lastEventId);
    if (!streamId) {
      return '';
    }

    let foundLastEvent = false;
    const sortedEvents = [...this.events.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    for (const [eventId, { streamId: eventStreamId, message }] of sortedEvents) {
      if (eventStreamId !== streamId) {
        continue;
      }

      if (eventId === lastEventId) {
        foundLastEvent = true;
        continue;
      }

      if (foundLastEvent) {
        await send(eventId, message);
      }
    }

    return streamId;
  }

  clearSession(sessionId: string): void {
    // Clear all events for a given session/stream
    const toDelete = Array.from(this.events.keys()).filter((eventId) =>
      eventId.startsWith(`${sessionId}_`),
    );
    toDelete.forEach((eventId) => this.events.delete(eventId));
  }
}

export class TransportManager {
  private httpServer?: HTTPServer;
  private app?: express.Application;
  private transports: Map<string, Transport> = new Map();

  constructor(private config: TransportConfig) {}

  async createTransport(server: Server): Promise<Transport> {
    switch (this.config.type) {
      case 'stdio':
        return this.createStdioTransport();
      case 'sse':
        return this.createSSETransport(server);
      case 'http':
        return this.createHTTPTransport(server);
      default:
        throw new Error(`Unsupported transport type: ${this.config.type}`);
    }
  }

  private createStdioTransport(): Transport {
    logger.info('Creating stdio transport');
    return new StdioServerTransport();
  }

  private async createSSETransport(server: Server): Promise<Transport> {
    const port = this.config.port || DEFAULT_TRANSPORT_PORT;
    const host = this.config.host || DEFAULT_TRANSPORT_HOST;
    const path = this.config.path || DEFAULT_TRANSPORT_PATH;

    logger.info(`Creating SSE transport on ${host}:${port}${path}`);

    this.app = express();
    this.app.use(express.json());

    // CORS middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', transport: 'sse' });
    });

    // SSE endpoint - GET for event stream
    this.app.get(path, async (req: Request, res: Response) => {
      logger.info('SSE connection established');
      try {
        // Create a new SSE transport for this client
        const transport = new SSEServerTransport('/messages', res);
        const sessionId = (transport as any).sessionId;

        // Store the transport
        this.transports.set(sessionId, transport);

        // Set up onclose handler
        transport.onclose = () => {
          logger.info(`SSE transport closed for session ${sessionId}`);
          this.transports.delete(sessionId);
        };

        // Connect to server
        await server.connect(transport);
        logger.info(`Established SSE stream with session ID: ${sessionId}`);
      } catch (error: any) {
        logger.error('Error establishing SSE stream:', error);
        if (!res.headersSent) {
          res.status(500).send('Error establishing SSE stream');
        }
      }
    });

    // Messages endpoint - POST for client messages
    this.app.post('/messages', async (req: Request, res: Response) => {
      logger.debug('Received SSE POST request');
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        logger.error('No session ID provided in request URL');
        res.status(400).send('Missing sessionId parameter');
        return;
      }

      const transport = this.transports.get(sessionId) as SSEServerTransport | undefined;
      if (!transport) {
        logger.error(`No active transport found for session ID: ${sessionId}`);
        res.status(404).send('Session not found');
        return;
      }

      try {
        await (transport as any).handlePostMessage(req, res, req.body);
      } catch (error: any) {
        logger.error('Error handling SSE POST request:', error);
        if (!res.headersSent) {
          res.status(500).send('Error handling request');
        }
      }
    });

    // Error handling middleware
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Express error:', err);
      res.status(500).json({ error: err.message });
    });

    // Start HTTP server
    await this.startHTTPServer(port, host);

    // Return a dummy transport since we're managing connections per-client
    return {
      async start() {
        logger.info('SSE transport started');
      },
      async close() {
        logger.info('SSE transport closed');
      },
      async send(message: any) {
        logger.debug('SSE transport send (no-op)', { message });
      },
    } as Transport;
  }

  private async createHTTPTransport(server: Server): Promise<Transport> {
    const port = this.config.port || DEFAULT_TRANSPORT_PORT;
    const host = this.config.host || DEFAULT_TRANSPORT_HOST;
    const path = this.config.path || DEFAULT_TRANSPORT_PATH;

    logger.info(`Creating HTTP transport on ${host}:${port}${path}`);

    this.app = express();
    this.app.use(express.json());

    // CORS middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
      res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', transport: 'http' });
    });

    const eventStore = new InMemoryEventStore();

    // HTTP endpoint - handle all methods
    this.app.all(path, async (req: Request, res: Response) => {
      logger.debug(`Received ${req.method} request to ${path}`);
      try {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && this.transports.has(sessionId)) {
          transport = this.transports.get(sessionId) as StreamableHTTPServerTransport;
        } else if (!sessionId && req.method === 'POST' && isInitializeRequest(req.body)) {
          // Create new transport for initialization
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            eventStore,
            onsessioninitialized: (newSessionId: string) => {
              logger.info(`HTTP session initialized with ID: ${newSessionId}`);
              this.transports.set(newSessionId, transport);
            },
          });

          // Set up onclose handler
          transport.onclose = () => {
            const sid = (transport as any).sessionId;
            if (sid && this.transports.has(sid)) {
              logger.info(`Transport closed for session ${sid}`);
              this.transports.delete(sid);
              eventStore.clearSession(sid);
            }
          };

          // Connect to server
          await server.connect(transport);
        } else {
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
          return;
        }

        // Handle the request
        await transport.handleRequest(req, res, req.body);
      } catch (error: any) {
        logger.error('HTTP request handling error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal error',
              data: error.message,
            },
            id: null,
          });
        }
      }
    });

    // Error handling middleware
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Express error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });

    // Start HTTP server
    await this.startHTTPServer(port, host);

    // Return a dummy transport since we're managing connections per-client
    return {
      async start() {
        logger.info('HTTP transport started');
      },
      async close() {
        logger.info('HTTP transport closed');
      },
      async send(message: any) {
        logger.debug('HTTP transport send (no-op)', { message });
      },
    } as Transport;
  }

  private async startHTTPServer(port: number, host: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer = createServer(this.app!);

      this.httpServer.on('error', (error: Error & { code?: string }) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${port} is already in use`);
          reject(new Error(`Port ${port} is already in use`));
        } else {
          logger.error('HTTP server error:', error);
          reject(error);
        }
      });

      this.httpServer.listen(port, host, () => {
        logger.info(`HTTP server listening on ${host}:${port}`);
        resolve();
      });
    });
  }

  async close(): Promise<void> {
    // Close all transports
    for (const [sessionId, transport] of this.transports) {
      try {
        logger.info(`Closing transport for session ${sessionId}`);
        await transport.close();
      } catch (error: any) {
        logger.error(`Error closing transport for session ${sessionId}:`, error);
      }
    }
    this.transports.clear();

    // Close HTTP server
    if (this.httpServer) {
      return new Promise((resolve, reject) => {
        this.httpServer!.close((err) => {
          if (err) {
            logger.error('Error closing HTTP server:', err);
            reject(err);
          } else {
            logger.info('HTTP server closed');
            resolve();
          }
        });
      });
    }
  }
}
