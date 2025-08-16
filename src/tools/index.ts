// Tools barrel export
// Central export point for all tool-related functionality

// Types
export type {
  MCPTool,
  MCPToolHandler,
  MCPToolResult,
  MCPToolMetadata,
  ToolRegistration,
  ToolRegistry,
  ToolFilterOptions,
  ToolFilterResult,
  ToolCondition
} from './types.js';

// Registry functions
export {
  registerTool,
  registerTools,
  getAllTools,
  getTool,
  isToolRegistered,
  filterTools,
  clearRegistry,
  getRegistryStats
} from './registry.js';

// Example tools
export {
  addTool,
  calculateTool,
  healthCheckTool,
  exampleTools
} from './examples/index.js';