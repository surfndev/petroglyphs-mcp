import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { store } from '../store.js';

export function register(server: McpServer, sessionId: string): void {
  server.tool(
    'get_handwriting',
    'Returns the latest handwriting image (base64 PNG) with metadata',
    {},
    async () => {
      const latest = store.getLatest(sessionId);
      if (!latest) {
        return {
          content: [{ type: 'text', text: 'No handwriting available. The slate is empty.' }],
        };
      }

      const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [
        {
          type: 'image',
          data: latest.imageBase64,
          mimeType: latest.mimeType,
        },
      ];

      const meta: Record<string, unknown> = {
        id: latest.id,
        timestamp: latest.timestamp,
        strokeCount: latest.strokeMetadata.strokeCount,
        bounds: latest.strokeMetadata.bounds,
        duration: latest.strokeMetadata.duration,
      };

      content.push({
        type: 'text',
        text: `Metadata: ${JSON.stringify(meta)}`,
      });

      return { content };
    }
  );
}
