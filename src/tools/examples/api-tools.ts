// Simple API tools examples
// Shows how to use REST API clients with MCP tools

import { z } from 'zod';
import type { MCPTool, MCPToolResult } from '../types.js';
import type { ResolvedConfig } from '../../config/types.js';
import { RestApiClient } from '../../clients/index.js';
import { ErrorHandler } from '../../utils/index.js';

/**
 * Simple GET request tool
 */
export const apiGetTool: MCPTool = {
  name: 'api_get',
  description: 'Make a GET request to any API endpoint',
  schema: z.object({
    endpoint: z.string().describe('The API endpoint to call (e.g., /users, /products)'),
    params: z.record(z.string()).optional().describe('Query parameters')
  }),
  
  handler: async ({ endpoint, params = {} }, config: ResolvedConfig): Promise<MCPToolResult> => {
    try {
      const client = new RestApiClient(config);
      const response = await client.get(endpoint, { params });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return ErrorHandler.createToolErrorResponse(error, 'api_get');
    }
  }
};

/**
 * Simple POST request tool
 */
export const apiPostTool: MCPTool = {
  name: 'api_post',
  description: 'Make a POST request to any API endpoint',
  schema: z.object({
    endpoint: z.string().describe('The API endpoint to call'),
    data: z.record(z.any()).describe('Data to send in the request body')
  }),
  
  handler: async ({ endpoint, data }, config: ResolvedConfig): Promise<MCPToolResult> => {
    try {
      const client = new RestApiClient(config);
      const response = await client.post(endpoint, data);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return ErrorHandler.createToolErrorResponse(error, 'api_post');
    }
  }
};

/**
 * API health check tool
 */
export const apiHealthTool: MCPTool = {
  name: 'api_health',
  description: 'Check if the API is healthy and reachable',
  schema: z.object({
    endpoint: z.string().optional().describe('Custom health endpoint (default: /health)')
  }),
  
  handler: async ({ endpoint = '/health' }, config: ResolvedConfig): Promise<MCPToolResult> => {
    try {
      const client = new RestApiClient(config);
      const isHealthy = await client.testConnection();
      
      const healthInfo = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        endpoint: config.baseUrl || config.apiUrl || 'unknown',
        customHealthEndpoint: endpoint
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(healthInfo, null, 2)
        }]
      };
    } catch (error) {
      return ErrorHandler.createToolErrorResponse(error, 'api_health');
    }
  }
};

// Export all API tools
export const apiTools = [
  apiGetTool,
  apiPostTool,
  apiHealthTool
];