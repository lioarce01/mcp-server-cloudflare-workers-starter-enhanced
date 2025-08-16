import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Import the modular configuration system
import { resolveConfig, getConfigSummary } from './config/index.js';
import { registerTools, filterTools, exampleTools } from './tools/index.js';
import { createScopedLogger, ErrorHandler } from './utils/index.js';

// Create scoped logger for this module
const logger = createScopedLogger('MCP');

/**
 * Main MCP Agent class with flexible configuration support
 * Handles tool registration and request processing with 3-level priority configuration
 */
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Flexible MCP Starter",
		version: "2.0.0",
	});

	async init() {
		logger.info('Initializing MCP Agent...');
		
		try {
			// Register all example tools in the global registry at startup
			registerTools([...exampleTools]);
			logger.info('Registered tools', { tools: exampleTools.map(t => t.name) });

			// Setup backward compatibility tools (original implementation)
			await this.setupBackwardCompatibilityTools();
			
			logger.info('MCP Agent initialization complete');
		} catch (error) {
			logger.error('Failed to initialize MCP Agent', error);
			throw error;
		}
	}

	/**
	 * Setup backward compatibility tools from original implementation
	 * These maintain the exact same interface as the original index.ts
	 */
	private async setupBackwardCompatibilityTools() {
		logger.debug('Setting up backward compatibility tools...');

		// Simple addition tool (exact copy of original)
		this.server.tool(
			"add",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			})
		);

		// Calculator tool with multiple operations (exact copy of original)
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			}
		);

		// Enhanced health check tool using the new flexible configuration system
		this.server.tool(
			"health_check",
			{ 
				includeConfig: z.boolean().optional().default(false),
				testConnectivity: z.boolean().optional().default(false)
			},
			async ({ includeConfig = false, testConnectivity = false }) => {
				try {
					logger.debug('Health check requested', { includeConfig, testConnectivity });
					
					// Extract configuration using the flexible system
					// Note: In tool context, we use default env since headers aren't directly accessible
					const configContext = resolveConfig(new Headers(), {});
					
					const healthInfo: any = {
						status: 'healthy',
						timestamp: new Date().toISOString(),
						system: {
							platform: 'Cloudflare Workers',
							runtime: 'V8',
							version: '2.0.0',
							agent: 'Flexible MCP Starter'
						}
					};

					// Include configuration details if requested
					if (includeConfig) {
						healthInfo.configuration = {
							...configContext.resolved,
							availableToolsCount: configContext.resolved.availableTools.length,
							configSources: configContext.sources,
							// Redact sensitive information
							...Object.fromEntries(
								Object.entries(configContext.resolved).map(([key, value]) => [
									key,
									key.toLowerCase().includes('pass') || 
									key.toLowerCase().includes('secret') || 
									key.toLowerCase().includes('token') 
										? '[REDACTED]' 
										: value
								])
							)
						};
					}

					// Test connectivity if requested
					if (testConnectivity) {
						healthInfo.connectivity = await this.testConnectivity(configContext.resolved);
						if (healthInfo.connectivity.some?.((c: any) => c.error)) {
							healthInfo.status = 'degraded';
						}
					}

					// Get tool filtering information
					const toolFilter = filterTools(configContext.resolved);
					healthInfo.tools = {
						total: toolFilter.summary.total,
						available: toolFilter.summary.included,
						excluded: toolFilter.summary.excluded,
						filteredTools: toolFilter.tools.map(t => t.name),
						excludedTools: toolFilter.excluded
					};

					logger.debug('Health check completed', { status: healthInfo.status });

					return {
						content: [{
							type: "text",
							text: JSON.stringify(healthInfo, null, 2)
						}]
					};
				} catch (error) {
					logger.error('Health check failed', error);
					return ErrorHandler.createToolErrorResponse(error, 'health_check');
				}
			}
		);

		logger.debug('Backward compatibility tools setup complete');
	}

	/**
	 * Test connectivity to configured URLs
	 */
	private async testConnectivity(config: any): Promise<any> {
		// Find URL fields in configuration (flexible approach)
		const urlFields = Object.entries(config)
			.filter(([key, value]) => 
				typeof value === 'string' && 
				key.toLowerCase().includes('url') &&
				(value.startsWith('http://') || value.startsWith('https://'))
			);
		
		if (urlFields.length === 0) {
			return {
				status: 'no_urls_found',
				message: 'No URL fields found in configuration for connectivity testing'
			};
		}

		const results = [];
		for (const [key, url] of urlFields) {
			try {
				// Basic URL validation
				new URL(url as string);
				results.push({
					field: key,
					url: url,
					status: 'url_valid',
					message: `${key} is properly formatted`
				});
			} catch (error) {
				results.push({
					field: key,
					url: url,
					status: 'url_invalid',
					message: `Invalid ${key}: ${ErrorHandler.extractMessage(error)}`,
					error: true
				});
			}
		}

		return results;
	}
}

/**
 * Helper function to log configuration for a request
 * Demonstrates the 3-level priority configuration system in action
 */
export function logRequestConfiguration(headers: Headers, env: any) {
	const logger = createScopedLogger('Config');
	
	try {
		const configContext = resolveConfig(headers, env);
		
		logger.info('=== Request Configuration ===');
		logger.info('Configuration summary', getConfigSummary(configContext));
		
		// Log tool filtering
		const toolFilter = filterTools(configContext.resolved);
		logger.info('Tool filtering', {
			available: `${toolFilter.summary.included}/${toolFilter.summary.total}`,
			tools: toolFilter.tools.map(t => t.name),
			excluded: toolFilter.excluded
		});
		
		logger.info('=== End Configuration ===');
	} catch (error) {
		logger.error('Error logging configuration', error);
	}
}