# MCP Starter - Flexible Configuration System

A modular Model Context Protocol (MCP) starter with a hybrid 3-level priority configuration system. Build scalable MCP servers for any API integration (REST, Odoo, Salesforce, custom APIs) with dynamic tool filtering and flexible configuration management.

📖 **[Complete Implementation Guide & Examples →](./docs/GUIDE.md)**

## 🎯 Key Features

- **3-Level Priority Configuration** - Headers → Environment Variables → Defaults
- **Dynamic Tool Filtering** - Control available tools per request via `to-use` header
- **REST API Client** - Built-in client with auth, retries, and error handling
- **Modular Architecture** - Easy to extend and maintain
- **Production Ready** - Cloudflare Workers optimized

## 🚀 Quick Start

```bash
# Install and run
npm install
npm run type-check
npm run dev          # Local development
npm run deploy       # Production deployment
```

## 💡 Basic Usage

### Simple Request (Uses Defaults)
```bash
curl http://localhost:8787/mcp
```

### Per-Request Configuration (Headers)
```bash
curl -H "api-url: https://api.example.com" \
     -H "api-token: your-token" \
     -H "to-use: [\"health_check\", \"api_get\"]" \
     http://localhost:8787/mcp
```

### Health Check
```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "health_check",
      "arguments": {"includeConfig": true}
    }
  }'
```

## 🏗️ Configuration Priority

The system automatically resolves configuration using a 3-level priority system:

1. **Headers** (Highest) - Per-request via HTTP headers
2. **Environment** (Medium) - Set in wrangler.toml or dashboard  
3. **Defaults** (Lowest) - Hardcoded fallbacks

Example:
```bash
# Environment: API_URL=https://env-api.com
# Headers override: api-url=https://header-api.com
# Result: Uses https://header-api.com
```

## 📁 Project Structure

```
src/
├── config/           # 3-level priority configuration
├── tools/            # Tool registry and filtering
├── clients/          # REST API client with auth
├── utils/            # Logging and error handling
├── mcp.ts           # MCP agent implementation
└── index.ts         # Entry point
```

## 🔧 Extending the Starter

### Add New Tools
1. Create tool in `src/tools/examples/`
2. Export from `src/tools/examples/index.ts`
3. Use `to-use` header to control availability

### Add New Clients
1. Extend `RestApiClient` in `src/clients/`
2. Map configuration fields in constructor
3. Use in tool handlers

### Custom Configuration
Add any configuration field via headers or environment:
```bash
curl -H "custom-field: value" /mcp
# OR
CUSTOM_FIELD=value npm run deploy
```

## 🧪 Testing & Development

```bash
# Local testing
npm run dev
curl http://localhost:8787/mcp

# Test with configuration
curl -H "api-url: https://jsonplaceholder.typicode.com" \
     -H "to-use: [\"health_check\"]" \
     http://localhost:8787/mcp

# Type checking
npm run type-check
```

## 🚀 Deployment

```bash
# Configure environment in wrangler.toml
[vars]
API_URL = "https://your-api.com"
API_TOKEN = "your-token"

# Deploy
npm run deploy
```

## 📚 Documentation

- **[Implementation Guide](./docs/GUIDE.md)** - Complete setup and development guide
- **Built-in Tools** - Calculator, health check, API tools
- **Configuration Examples** - REST, Odoo, Salesforce integrations
- **Tool Development** - Step-by-step tool creation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Follow existing patterns and run `npm run type-check`
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.