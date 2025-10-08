# Relay

**Universal OpenAPI to MCP relay server with enterprise authentication**

Relay is a production-ready Model Context Protocol (MCP) server that dynamically converts any OpenAPI/Swagger specification into AI-callable MCP tools, enabling seamless API integration for AI assistants.

## Why Relay?

**Relay your APIs to AI in seconds.** Unlike basic bridges, Relay provides enterprise-grade API integration with production-ready reliability.

### Features

- 🔄 **Dynamic Tool Generation**: Automatically converts any API endpoint into MCP tools
- 📡 **Real API Calls**: Makes actual HTTP requests with full request/response handling
- 🔐 **Enterprise Authentication**: API Key (header/query), Bearer Token, and Basic Auth
- 📝 **Flexible Spec Loading**: Load specs from local files or remote URLs
- 🎯 **Universal Compatibility**: Supports both OpenAPI 2.0 and 3.x specifications
- ⚡ **Zero Configuration**: Works out of the box with sensible defaults
- 🏢 **Production Ready**: Clean code, comprehensive error handling, full TypeScript

## Installation

```bash
npm install
npm run build
```

## Configuration

Create a `.env` file in the project root (use `.env.example` as a template):

```env
# Swagger/OpenAPI Spec Source
SWAGGER_SOURCE=url
SWAGGER_URL=https://petstore.swagger.io/v2/swagger.json

# API Base URL (optional - will use URL from spec if not provided)
API_BASE_URL=https://petstore.swagger.io/v2

# Authentication
AUTH_TYPE=none
```

### Configuration Options

#### Spec Source

- `SWAGGER_SOURCE`: Either `file` or `url`
- `SWAGGER_URL`: URL to fetch the OpenAPI spec (if using URL source)
- `SWAGGER_FILE`: Path to local OpenAPI spec file (if using file source)

#### API Configuration

- `API_BASE_URL`: Base URL for API calls (optional, will use server URL from spec if not provided)
- `TIMEOUT`: Request timeout in milliseconds (default: 30000)

#### Authentication

**No Authentication:**

```env
AUTH_TYPE=none
```

**API Key:**

```env
AUTH_TYPE=apikey
AUTH_API_KEY=your-api-key
AUTH_API_KEY_NAME=X-API-Key
AUTH_API_KEY_IN=header
```

**Bearer Token:**

```env
AUTH_TYPE=bearer
AUTH_TOKEN=your-bearer-token
```

**Basic Auth:**

```env
AUTH_TYPE=basic
AUTH_USERNAME=your-username
AUTH_PASSWORD=your-password
```

## Usage

### Running the Server

```bash
npm run dev
```

Or after building:

```bash
npm start
```

### Using with MCP Clients

Add to your MCP client configuration (e.g., Claude Desktop):

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

## Examples

### Example 1: Petstore API (No Auth)

```env
SWAGGER_SOURCE=url
SWAGGER_URL=https://petstore.swagger.io/v2/swagger.json
AUTH_TYPE=none
```

### Example 2: GitHub API (Bearer Token)

```env
SWAGGER_SOURCE=url
SWAGGER_URL=https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json
API_BASE_URL=https://api.github.com
AUTH_TYPE=bearer
AUTH_TOKEN=ghp_your_github_token
```

### Example 3: Custom API (API Key)

```env
SWAGGER_SOURCE=file
SWAGGER_FILE=./specs/my-api.yaml
API_BASE_URL=https://api.myservice.com
AUTH_TYPE=apikey
AUTH_API_KEY=your-secret-key
AUTH_API_KEY_NAME=X-API-Key
AUTH_API_KEY_IN=header
```

## How Relay Works

1. **Spec Loading**: Relay loads an OpenAPI/Swagger specification from a file or URL
2. **Endpoint Parsing**: Each API endpoint is parsed to extract:
   - HTTP method
   - Path and parameters
   - Request body schema
   - Response definitions
3. **Tool Generation**: Each endpoint becomes an MCP tool with:
   - Name derived from the operation ID or path
   - Description from the API documentation
   - JSON Schema for input validation
4. **Request Execution**: When a tool is called:
   - Parameters are validated
   - Authentication is applied
   - HTTP request is made
   - Response is returned to the AI assistant

## Tool Naming Convention

Tools are named based on the OpenAPI operation ID, or if not available:

- Format: `{method}_{path}`
- Example: `GET /users/{id}` → `get_users_id`
- Example: `POST /users` → `post_users`

## Architecture

```
relay-mcp/
├── src/               # TypeScript source code
│   ├── index.ts       # MCP server entry point
│   ├── config.ts      # Configuration loader with Zod validation
│   ├── parser.ts      # OpenAPI spec parser
│   ├── tools.ts       # Tool generator
│   ├── client.ts      # HTTP client with interceptors
│   ├── auth.ts        # Authentication manager
│   ├── logger.ts      # Structured logging
│   ├── errors.ts      # Custom error classes
│   ├── constants.ts   # Application constants
│   └── types.ts       # TypeScript types
├── dist/              # Compiled JavaScript (generated)
└── docs/              # Documentation
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch

# Lint code
npm run lint

# Lint and auto-fix
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run typecheck

# Full check (types + lint)
npm run check
```

### Logging

Control log verbosity with the `LOG_LEVEL` environment variable:

```bash
# Debug mode - show all logs
LOG_LEVEL=debug npm start

# Info mode (default) - show info, warnings, and errors
LOG_LEVEL=info npm start

# Warn mode - show only warnings and errors
LOG_LEVEL=warn npm start

# Error mode - show only errors
LOG_LEVEL=error npm start
```

## Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get started in minutes
- **[Setup Instructions](docs/SETUP.md)** - Detailed setup and configuration
- **[Changelog](CHANGELOG.md)** - Version history and roadmap

## Troubleshooting

**Error: "Could not determine API base URL"**

- Set `API_BASE_URL` explicitly in your `.env` file

**Error: Configuration validation failed**

- Check that required fields are set based on your `SWAGGER_SOURCE` and `AUTH_TYPE`
- Review error message for specific missing fields

**Authentication not working:**

- Verify your auth credentials are correct
- Check that the auth type matches what the API expects
- Enable debug logging: `LOG_LEVEL=debug npm start`

For more help, see the [Setup Guide](docs/SETUP.md).

## License

MIT
