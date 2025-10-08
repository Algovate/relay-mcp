# Relay

Universal OpenAPI ➜ MCP relay server with enterprise authentication.

[![npm version](https://badge.fury.io/js/relay-mcp.svg)](https://badge.fury.io/js/relay-mcp)
[![npm downloads](https://img.shields.io/npm/dm/relay-mcp.svg)](https://www.npmjs.com/package/relay-mcp)

## What is Relay?

Relay converts any OpenAPI/Swagger specification into AI-callable MCP tools. It acts as a bridge between AI assistants and REST APIs, automatically generating tools from API documentation and executing real HTTP requests.

**Main Function**: Transform any REST API into MCP tools that AI assistants can use directly.

## Installation

```bash
npm install relay-mcp
```

## Basic Usage

1. **Install and build**:
```bash
npm install
npm run build
```

2. **Configure** (create `.env` file):
```env
SWAGGER_SOURCE=url
SWAGGER_URL=https://petstore.swagger.io/v2/swagger.json
AUTH_TYPE=none
```

3. **Run the server**:
```bash
npm start
```

4. **Add to MCP client** (e.g., Claude Desktop):
```json
{
  "mcpServers": {
    "relay": {
      "command": "node",
      "args": ["/path/to/relay/dist/index.js"],
      "env": {
        "SWAGGER_SOURCE": "url",
        "SWAGGER_URL": "https://petstore.swagger.io/v2/swagger.json",
        "AUTH_TYPE": "none"
      }
    }
  }
}
```

## Features

- Dynamic tool generation from any OpenAPI/Swagger spec
- Real HTTP execution with interceptors and structured logging
- Auth: API Key (header/query), Bearer, Basic
- OpenAPI 2.0 and 3.x support

## Documentation

- Getting started: `docs/QUICKSTART.md`
- Changelog: `CHANGELOG.md`

## Links

- **NPM Package**: [relay-mcp](https://www.npmjs.com/package/relay-mcp)
- **GitHub Repository**: [Algovate/relay-mcp](https://github.com/Algovate/relay-mcp)
- **Documentation Site**: [algovate.github.io/relay-mcp](https://algovate.github.io/relay-mcp)

## License

MIT
