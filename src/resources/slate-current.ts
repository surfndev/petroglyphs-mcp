import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getLatest } from '../store.js';

export function register(server: McpServer): void {
  server.resource(
    'slate-current',
    'slate://current',
    { description: 'Latest handwriting image' },
    async () => {
      const latest = getLatest();
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
