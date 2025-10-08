---
noteId: "2b8353e0a43811f0b4396fdb67b0c4c2"
tags: []
---

# Relay-MCP Documentation

Welcome to the relay-mcp documentation! This directory contains guides for using the relay-mcp server.

## 📚 Documentation

### Getting Started

1. **[Quick Start Guide](QUICKSTART.md)**
   - Installation and basic setup
   - Running your first relay server
   - Connecting to MCP clients

2. **[Setup Instructions](SETUP.md)**
   - Detailed configuration options
   - Authentication methods
   - Environment variables
   - Production deployment

## 📖 Quick Reference

### Transport Modes

| Mode | Use Case | Configuration |
|------|----------|---------------|
| **stdio** | Claude Desktop, local clients | `TRANSPORT=stdio` |
| **SSE** | Web clients, streaming | `TRANSPORT=sse TRANSPORT_PORT=3000` |
| **HTTP** | Web APIs, resumable connections | `TRANSPORT=http TRANSPORT_PORT=3000` |

### Key Environment Variables

```bash
# Core Configuration
SWAGGER_SOURCE=url|file
SWAGGER_URL=https://...
AUTH_TYPE=none|apikey|bearer|basic

# Transport Configuration
TRANSPORT=stdio|sse|http
TRANSPORT_PORT=3000
TRANSPORT_HOST=0.0.0.0
TRANSPORT_PATH=/mcp
```

### Transport Usage Examples

**Stdio (Default)**
```bash
npm start
```

**SSE Transport**
```bash
TRANSPORT=sse TRANSPORT_PORT=3000 npm start
# Server available at http://localhost:3000/mcp
```

**HTTP Transport**
```bash
TRANSPORT=http TRANSPORT_PORT=3000 npm start
# Server available at http://localhost:3000/mcp
```

## 🔗 External Resources

- [Main README](../README.md) - Project overview
- [Changelog](../CHANGELOG.md) - Version history
- [NPM Package](https://www.npmjs.com/package/relay-mcp)
- [GitHub Repository](https://github.com/Algovate/relay-mcp)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

## 💡 Common Use Cases

### Local Development with Claude Desktop
See [Quick Start Guide](QUICKSTART.md) for stdio transport setup.

### Web-based MCP Client
Use SSE or HTTP transport modes. Configure via `TRANSPORT` environment variable.

### Production Deployment
See [Setup Instructions](SETUP.md) for authentication, SSL, and deployment options.

## 🤝 Contributing

Found an issue or want to improve the documentation? Please open an issue or pull request on our GitHub repository.

## 📄 License

MIT - See LICENSE file in the project root.