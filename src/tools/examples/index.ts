// Example tools barrel export
// Central export point for all example tool implementations

// Calculator tools (migrated from original implementation)
export { addTool, calculateTool } from './calculator.js';

// System tools
export { healthCheckTool } from './health-check.js';

// API tools
export { apiTools } from './api-tools.js';

import { addTool, calculateTool } from './calculator.js';
import { healthCheckTool } from './health-check.js';
import { apiTools } from './api-tools.js';

// Convenience array of all example tools
export const exampleTools = [
  addTool,
  calculateTool,
  healthCheckTool,
  ...apiTools
] as const;