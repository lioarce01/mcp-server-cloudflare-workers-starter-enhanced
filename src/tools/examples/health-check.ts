// Health check tool for system monitoring and diagnostics
// Provides basic system health information and connectivity tests

import { z } from 'zod';
import type { MCPTool, MCPToolResult } from '../types.js';
import type { ResolvedConfig } from '../../config/types.js';

/**
 * Health check tool
 * Provides system health information and basic diagnostics
 */
export const healthCheckTool: MCPTool = {
  name: 'health_check',
  description: 'Check system health and configuration status',
  schema: z.object({
    includeConfig: z.boolean()
      .optional()
      .default(false)
      .describe('Whether to include configuration details in the response'),
    testConnectivity: z.boolean()
      .optional()
      .default(false)
      .describe('Whether to test connectivity to the configured client URL')
  }),
  handler: async ({ 
    includeConfig = false, 
    testConnectivity = false 
  }: { 
    includeConfig?: boolean; 
    testConnectivity?: boolean; 
  }, config: ResolvedConfig): Promise<MCPToolResult> => {
    const healthInfo: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system: {
        platform: 'Cloudflare Workers',
        runtime: 'V8',
        version: '1.0.0'
      }
    };

    // Include configuration details if requested
    if (includeConfig) {
      healthInfo.configuration = {
        ...config, // Include all configuration fields flexibly
        availableToolsCount: config.availableTools.length,
        // Redact sensitive fields that might contain 'pass' or 'secret'
        ...Object.fromEntries(
          Object.entries(config).map(([key, value]) => [
            key,
            key.toLowerCase().includes('pass') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token') 
              ? '[REDACTED]' 
              : value
          ])
        )
      };
    }

    // Test connectivity if requested
    if (testConnectivity) {
      // Try to find a URL field in config (flexible approach)
      const urlFields = Object.entries(config)
        .filter(([key, value]) => 
          typeof value === 'string' && 
          key.toLowerCase().includes('url') &&
          (value.startsWith('http://') || value.startsWith('https://'))
        );
      
      if (urlFields.length > 0) {
        healthInfo.connectivity = [];
        
        for (const [key, url] of urlFields) {
          try {
            new URL(url as string);
            healthInfo.connectivity.push({
              field: key,
              url: url,
              status: 'url_valid',
              message: `${key} is properly formatted`
            });
          } catch (error) {
            healthInfo.connectivity.push({
              field: key,
              url: url,
              status: 'url_invalid',
              message: `Invalid ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              error: true
            });
            healthInfo.status = 'degraded';
          }
        }
      } else {
        healthInfo.connectivity = {
          status: 'no_urls_found',
          message: 'No URL fields found in configuration for connectivity testing'
        };
      }
    }

    // Add memory and performance info if available
    try {
      // Note: In Cloudflare Workers, performance.memory may not be available
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        healthInfo.performance = {
          memoryUsed: memory.usedJSHeapSize,
          memoryTotal: memory.totalJSHeapSize,
          memoryLimit: memory.jsHeapSizeLimit
        };
      }
    } catch {
      // Memory info not available, skip
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(healthInfo, null, 2)
      }]
    };
  },
  metadata: {
    category: 'system',
    tags: ['health', 'diagnostics', 'monitoring'],
    version: '1.0.0',
    author: 'MCP Starter',
    requiresAuth: false,
    cacheable: false,
    estimatedDuration: 50
  }
};