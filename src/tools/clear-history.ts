import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { clear, getCount } from '../store.js';

export function register(server: McpServer): void {
  server.tool(
    'clear_history',
    'Clears all stored handwriting submissions',
    {},
    async () => {
      const count = getCount();
      clear();
      return {
        content: [{ type: 'text', text: `Cleared ${count} submission(s). The slate is clean.` }],
      };
    }
  );
}
