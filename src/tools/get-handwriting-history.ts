import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { store } from '../store.js';

export function register(server: McpServer, sessionId: string): void {
  server.tool(
    'get_handwriting_history',
    'Returns the last N handwriting submissions with metadata',
    { limit: z.number().optional().describe('Number of submissions to return (default: all)') },
    async ({ limit }) => {
      const history = store.getHistory(sessionId, limit);

      if (history.length === 0) {
        return {
          content: [{ type: 'text', text: 'No handwriting history. The slate has been empty this session.' }],
        };
      }

      const entries = history.map((sub) => ({
        id: sub.id,
        timestamp: sub.timestamp,
        strokeCount: sub.strokeMetadata.strokeCount,
        duration: sub.strokeMetadata.duration,
        hasImage: true,
      }));

      return {
        content: [
          {
            type: 'text',
            text: `${history.length} submission(s):\n${JSON.stringify(entries, null, 2)}`,
          },
        ],
      };
    }
  );
}
