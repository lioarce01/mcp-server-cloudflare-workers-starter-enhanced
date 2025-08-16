// Calculator tools - migrated from the original implementation
// These are the core mathematical tools that were in the original index.ts

import { z } from 'zod';
import type { MCPTool, MCPToolResult } from '../types.js';
import type { ResolvedConfig } from '../../config/types.js';

/**
 * Simple addition tool
 * Adds two numbers together
 */
export const addTool: MCPTool = {
  name: 'add',
  description: 'Add two numbers together',
  schema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number')
  }),
  handler: async ({ a, b }: { a: number; b: number }): Promise<MCPToolResult> => {
    const result = a + b;
    return {
      content: [{
        type: 'text',
        text: String(result)
      }]
    };
  },
  metadata: {
    category: 'math',
    tags: ['arithmetic', 'basic'],
    version: '1.0.0',
    author: 'MCP Starter',
    cacheable: true,
    estimatedDuration: 5
  }
};

/**
 * Advanced calculator tool with multiple operations
 * Supports add, subtract, multiply, divide operations
 */
export const calculateTool: MCPTool = {
  name: 'calculate',
  description: 'Perform arithmetic operations on two numbers',
  schema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide'])
      .describe('The arithmetic operation to perform'),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number')
  }),
  handler: async ({ 
    operation, 
    a, 
    b 
  }: { 
    operation: 'add' | 'subtract' | 'multiply' | 'divide'; 
    a: number; 
    b: number; 
  }): Promise<MCPToolResult> => {
    let result: number;
    
    try {
      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) {
            return {
              content: [{
                type: 'text',
                text: 'Error: Cannot divide by zero'
              }],
              isError: true
            };
          }
          result = a / b;
          break;
        default:
          return {
            content: [{
              type: 'text',
              text: `Error: Unknown operation '${operation}'`
            }],
            isError: true
          };
      }

      return {
        content: [{
          type: 'text',
          text: String(result)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Calculation failed'}`
        }],
        isError: true
      };
    }
  },
  metadata: {
    category: 'math',
    tags: ['arithmetic', 'calculator', 'operations'],
    version: '1.0.0',
    author: 'MCP Starter',
    cacheable: true,
    estimatedDuration: 10
  }
};