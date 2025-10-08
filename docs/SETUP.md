# Relay - Setup Instructions

**Universal OpenAPI to MCP relay server**

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the server:**

   Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

   Edit `.env` with your API settings.

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Test the server:**
   ```bash
   npm start
   ```

## Testing with Petstore API

The easiest way to test the server is with the public Petstore API:

```env
SWAGGER_SOURCE=url
SWAGGER_URL=https://petstore.swagger.io/v2/swagger.json
AUTH_TYPE=none
```

Run the server:
```bash
npm run dev
```

You should see output like:
```
Loaded API: Swagger Petstore (v1.0.0)
Base URL: https://petstore.swagger.io/v2
Endpoints loaded: 20
Tools available: 20
Relay MCP Server running on stdio
```

## Integration with MCP Clients

### Claude Desktop

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "relay-petstore": {
      "command": "node",
      "args": [
        "/Users/your-username/path/to/relay/dist/index.js"
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

### Other MCP Clients

Any MCP-compatible client can use this server by:
1. Running the compiled server via `node dist/index.js`
2. Communicating via stdio transport
3. Setting environment variables for configuration

## Troubleshooting

### TypeScript/Linter Errors

The linter may show errors before running `npm install`. These will resolve after installing dependencies:

```bash
npm install
```

### Build Errors

If you encounter build errors:
1. Delete `node_modules` and `dist` directories
2. Run `npm install` again
3. Run `npm run build`

### Runtime Errors

**"Cannot find module":**
- Make sure you've run `npm run build` before `npm start`

**"Could not determine API base URL":**
- Set `API_BASE_URL` in your `.env` file

**"Failed to load OpenAPI spec":**
- Check that your `SWAGGER_URL` is accessible
- If using a file, ensure the path is correct

## Development Mode

For development with auto-rebuild:

Terminal 1 (watch for changes):
```bash
npm run watch
```

Terminal 2 (run the server):
```bash
npm start
```
