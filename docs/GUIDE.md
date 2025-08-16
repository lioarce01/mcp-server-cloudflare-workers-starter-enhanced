# MCP Starter - Implementation Guide & Examples

## 🏗️ Architecture Overview

This MCP starter implements a **3-level priority configuration system** with dynamic tool filtering, providing a scalable foundation for any API integration.

### Core Components

```
src/
├── config/           # 3-level priority configuration
├── tools/            # Tool registry and filtering  
├── clients/          # REST API client with auth
├── utils/            # Logging and error handling
├── mcp.ts           # MCP agent implementation
└── index.ts         # Clean entry point
```

### Key Features Implemented

- **✅ 3-Level Priority Configuration** - Headers → Environment → Defaults
- **✅ Dynamic Tool Filtering** - Control available tools per request via `to-use` header
- **✅ REST API Client** - Built-in client with auth, retries, and error handling
- **✅ Modular Architecture** - Easy to extend and maintain
- **✅ Backward Compatibility** - Preserves existing MCP/SSE endpoints

## 🔧 Configuration System

### Priority Levels

1. **🔝 Headers (Priority 1)** - Per-request configuration via HTTP headers
2. **🔄 Environment Variables (Priority 2)** - Deployment configuration  
3. **🛡️ Defaults (Priority 3)** - Development fallback

### Configuration Flow

```
Request → Check Headers → Check Environment → Use Defaults → Final Config
   ↓         ↓               ↓                 ↓            ↓
Arrives   Priority 1      Priority 2       Priority 3   Applied to Tools
```

### Configuration Examples

#### Headers (Priority 1 - Per Request)
```bash
curl -H "api-url: https://api.example.com" \
     -H "api-token: your-secret-token" \
     -H "to-use: [\"api_get\", \"api_post\"]" \
     https://your-mcp-server.com/mcp
```

#### Environment Variables (Priority 2 - Deployment)
```bash
# In wrangler.toml or Cloudflare Dashboard
API_URL=https://api.example.com
API_TOKEN=your-secret-token
TIMEOUT=30000
TO_USE=["api_get", "api_post", "health_check"]
```

#### Defaults (Priority 3 - Development)
```typescript
// Automatically used if headers and env vars are missing
{
  apiUrl: "http://localhost:3000",
  timeout: 30000,
  retries: 3
}
```

### Configuration Mapping

Headers and environment variables are automatically mapped:
- `"api-url"` → `apiUrl`
- `"API_URL"` → `apiUrl`
- `"auth-token"` → `authToken`
- `"AUTH_TOKEN"` → `authToken`

## 🛠️ Creating API Clients

### Step 1: Create Your Client

```typescript
// src/clients/my-api-client.ts
import { RestApiClient } from './rest-api-client.js';
import type { ResolvedConfig } from '../config/types.js';

export class MyApiClient extends RestApiClient {
  constructor(config: ResolvedConfig) {
    // Map your specific configuration fields
    const configMapping = {
      baseUrl: 'myApiUrl',        // Maps 'my-api-url' header to baseUrl
      authToken: 'myApiToken',    // Maps 'my-api-token' header to authToken
      timeout: 'myTimeout'        // Maps 'my-timeout' header to timeout
    };
    
    super(config, configMapping);
  }

  // Add your specific API methods
  async getUsers() {
    return this.get('/users');
  }

  async createUser(userData: any) {
    return this.post('/users', userData);
  }
}
```

### Step 2: Export Your Client

```typescript
// src/clients/index.ts
export { RestApiClient } from './rest-api-client.js';
export { MyApiClient } from './my-api-client.js';
```

## 🔨 Creating MCP Tools

### Step 1: Define Your Tool

```typescript
// src/tools/examples/my-api-tools.ts
import { z } from 'zod';
import type { MCPTool, MCPToolResult } from '../types.js';
import type { ResolvedConfig } from '../../config/types.js';
import { MyApiClient } from '../../clients/index.js';
import { ErrorHandler } from '../../utils/index.js';

export const getUsersTool: MCPTool = {
  name: 'get_users',
  description: 'Get list of users from the API',
  schema: z.object({
    page: z.number().optional().describe('Page number for pagination'),
    limit: z.number().optional().describe('Number of users per page')
  }),
  
  handler: async ({ page = 1, limit = 10 }, config: ResolvedConfig): Promise<MCPToolResult> => {
    try {
      const client = new MyApiClient(config);
      const response = await client.get('/users', { 
        params: { page, limit } 
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return ErrorHandler.createToolErrorResponse(error, 'get_users');
    }
  }
};
```

### Step 2: Register Your Tools

```typescript
// src/tools/examples/index.ts
export { myApiTools } from './my-api-tools.js';

// Combine all example tools
import { calculatorTools } from './calculator.js';
import { healthCheckTool } from './health-check.js';
import { myApiTools } from './my-api-tools.js';

export const exampleTools = [
  ...calculatorTools,
  healthCheckTool,
  ...myApiTools  // Include your tools
];
```

## 🎯 Tool Filtering System

### `to-use` Header

Control which tools are available for each request:

```bash
# Only make specific tools available
curl -H "to-use: [\"get_users\", \"create_user\"]" \
     -H "my-api-url: https://api.example.com" \
     https://your-mcp-server.com/mcp

# Use all tools (default behavior)
curl -H "my-api-url: https://api.example.com" \
     https://your-mcp-server.com/mcp
```

## 🧪 Testing & Usage

### Local Development

```bash
npm install           # Install dependencies
npm run type-check   # Verify TypeScript
npm run dev          # Start local development server
```

### Basic Health Check

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

### Testing with Headers

```bash
# Test with specific configuration
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "api-url: https://jsonplaceholder.typicode.com" \
  -H "to-use: [\"api_get\"]" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "api_get",
      "arguments": {"endpoint": "/users/1"}
    }
  }'
```

### Tool Filtering Tests

```bash
# Only calculator tools
curl -H "to-use: [\"add\", \"calculate\"]" http://localhost:8787/mcp

# Only API tools  
curl -H "to-use: [\"api_get\", \"api_post\"]" http://localhost:8787/mcp

# All tools (default)
curl http://localhost:8787/mcp
```

## 🚀 Deployment

### Cloudflare Workers

1. **Configure Environment Variables**
```bash
# In wrangler.toml
[vars]
API_URL = "https://your-api.com"
API_TOKEN = "your-production-token"
TO_USE = "[\"get_users\", \"create_user\"]"
```

2. **Deploy**
```bash
npm run deploy
```

## 🔍 Debugging Configuration

The system logs configuration resolution for every request:

```
=== Request Configuration ===
Configuration Resolution Summary:
- API URL: https://api.example.com (from header)
- API Token: ******** (from header)
- Available Tools: [get_users, create_user] (from header)

Tool Filtering: 2/5 tools available
Available tools: get_users, create_user
=== End Configuration ===
```

## 📚 Integration Examples

### REST API Integration
```bash
curl -H "api-url: https://api.example.com" \
     -H "api-token: bearer-token" \
     -H "to-use: [\"api_get\", \"api_post\"]" \
     /mcp
```

### Custom Auth Headers
```bash
curl -H "base-url: https://custom-api.com" \
     -H "auth-key: abc123" \
     -H "version: v2" \
     -H "to-use: [\"custom_tool\"]" \
     /mcp
```

## 🎯 Success Metrics Met

- **✅ Modular Architecture** - Clear separation of concerns
- **✅ Configuration Flexibility** - 3-level priority working
- **✅ Tool Management** - Dynamic filtering implemented  
- **✅ Scalability** - Easy to add new integrations
- **✅ Developer Experience** - Clear docs and examples
- **✅ Backward Compatibility** - No breaking changes
- **✅ Type Safety** - Comprehensive TypeScript coverage

## 🔄 Next Steps

The foundation is ready for:
- Adding new client integrations (Odoo, CRM, etc.)
- Implementing client-specific tools
- Adding authentication and authorization
- Building more complex tool workflows
- Creating client-specific configuration schemas

The modular architecture makes it easy to extend while maintaining the robust foundation.