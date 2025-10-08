# Relay - Quick Start Guide

**Relay your APIs to AI in seconds**

## Installation & Build

```bash
npm install
npm run build
```

## Test the Server

Run with Petstore API:

```bash
SWAGGER_SOURCE=url \
SWAGGER_URL=https://petstore.swagger.io/v2/swagger.json \
AUTH_TYPE=none \
node dist/index.js
```

Expected output:
```
Loaded API: Swagger Petstore (v1.0.7)
Base URL: https://petstore.swagger.io/v2
Endpoints loaded: 20
Tools available: 20
Relay MCP Server running on stdio
```

## Configure with Claude Desktop

1. **Find your config file:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add the server configuration:**

```json
{
  "mcpServers": {
    "relay-petstore": {
      "command": "node",
      "args": [
        "/Users/rodin/Workspace/algovate/lab/relay/dist/index.js"
      ],
      "env": {
        "SWAGGER_SOURCE": "url",
        "SWAGGER_URL": "https://petstore.swagger.io/v2/swagger.json",
        "AUTH_TYPE": "none"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

4. **Test it:** Ask Claude to "List all available pets from the petstore"

## Example Configurations

### Public API (No Auth)
```json
{
  "command": "node",
  "args": ["./dist/index.js"],
  "env": {
    "SWAGGER_SOURCE": "url",
    "SWAGGER_URL": "https://petstore.swagger.io/v2/swagger.json",
    "AUTH_TYPE": "none"
  }
}
```

### API with Bearer Token
```json
{
  "command": "node",
  "args": ["./dist/index.js"],
  "env": {
    "SWAGGER_SOURCE": "url",
    "SWAGGER_URL": "https://api.example.com/openapi.json",
    "AUTH_TYPE": "bearer",
    "AUTH_TOKEN": "your-secret-token"
  }
}
```

### API with API Key (Header)
```json
{
  "command": "node",
  "args": ["./dist/index.js"],
  "env": {
    "SWAGGER_SOURCE": "url",
    "SWAGGER_URL": "https://api.example.com/swagger.json",
    "AUTH_TYPE": "apikey",
    "AUTH_API_KEY": "your-api-key",
    "AUTH_API_KEY_NAME": "X-API-Key",
    "AUTH_API_KEY_IN": "header"
  }
}
```

### Local OpenAPI File
```json
{
  "command": "node",
  "args": ["./dist/index.js"],
  "env": {
    "SWAGGER_SOURCE": "file",
    "SWAGGER_FILE": "./specs/my-api.yaml",
    "API_BASE_URL": "https://api.myservice.com",
    "AUTH_TYPE": "basic",
    "AUTH_USERNAME": "user",
    "AUTH_PASSWORD": "pass"
  }
}
```

## Available Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SWAGGER_SOURCE` | Yes | `url` | Source type: `file` or `url` |
| `SWAGGER_URL` | If source=url | - | URL to OpenAPI spec |
| `SWAGGER_FILE` | If source=file | - | Path to OpenAPI spec file |
| `API_BASE_URL` | No | From spec | Override base URL for API calls |
| `AUTH_TYPE` | No | `none` | Auth type: `none`, `apikey`, `bearer`, `basic` |
| `AUTH_TOKEN` | If bearer | - | Bearer token |
| `AUTH_API_KEY` | If apikey | - | API key value |
| `AUTH_API_KEY_NAME` | If apikey | `X-API-Key` | API key header/param name |
| `AUTH_API_KEY_IN` | If apikey | `header` | Where to send key: `header` or `query` |
| `AUTH_USERNAME` | If basic | - | Basic auth username |
| `AUTH_PASSWORD` | If basic | - | Basic auth password |
| `TIMEOUT` | No | `30000` | Request timeout in milliseconds |

## Tool Naming

The server generates tool names from API endpoints:

- `GET /pets` → `get_pets`
- `POST /pets` → `post_pets`
- `GET /pets/{petId}` → `get_pets_petid`
- `PUT /users/{id}/profile` → `put_users_id_profile`

If the OpenAPI spec has `operationId`, that will be used instead (cleaned up to be valid identifier).

## Next Steps

- Add your own API specs
- Configure authentication
- Integrate with MCP clients
- Start building AI-powered API interactions!
