import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { store } from '../store.js';

export function register(server: McpServer, sessionId: string): void {
  server.resource(
    'slate-current-combo',
    'slate://current/combo',
    { description: 'Combo configuration for the latest submission' },
    async () => {
      const latest = store.getLatest(sessionId);

      const combo = latest?.combo ?? null;
      return {
        contents: [
          {
            uri: 'slate://current/combo',
            mimeType: 'application/json',
            text: JSON.stringify(combo),
          },
        ],
      };
    }
  );
}
