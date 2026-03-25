import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { store } from '../store.js';

export function register(server: McpServer, sessionId: string): void {
  server.resource(
    'slate-current',
    'slate://current',
    { description: 'Latest handwriting image' },
    async () => {
      const latest = store.getLatest(sessionId);
      if (!latest) {
        return {
          contents: [
            {
              uri: 'slate://current',
              mimeType: 'text/plain',
              text: 'No handwriting available.',
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: 'slate://current',
            mimeType: latest.mimeType,
            blob: latest.imageBase64,
          },
        ],
      };
    }
  );
}
