import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { store } from '../store.js';

export function register(server: McpServer, sessionId: string): void {
  server.resource(
    'slate-history',
    'slate://history',
    { description: 'All handwriting submissions this session' },
    async () => {
      const history = store.getHistory(sessionId);

      const summary = history.map((sub) => ({
        id: sub.id,
        timestamp: sub.timestamp,
        strokeCount: sub.strokeMetadata.strokeCount,
        duration: sub.strokeMetadata.duration,
      }));

      return {
        contents: [
          {
            uri: 'slate://history',
            mimeType: 'application/json',
            text: JSON.stringify(summary),
          },
        ],
      };
    }
  );
}
