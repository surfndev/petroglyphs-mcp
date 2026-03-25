import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { store } from '../store.js';

export function register(server: McpServer, sessionId: string): void {
  server.tool(
    'clear_history',
    'Clears all stored handwriting submissions',
    {},
    async () => {
      const count = store.getCount(sessionId);
      store.clear(sessionId);
      return {
        content: [{ type: 'text', text: `Cleared ${count} submission(s). The slate is clean.` }],
      };
    }
  );
}
