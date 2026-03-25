import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { store } from '../store.js';

export function register(server: McpServer, sessionId: string): void {
  server.tool(
    'get_pairing_code',
    'Returns a 4-character pairing code for this session. The user enters this code on their iPad to link it to this Claude session. Each session gets one stable code.',
    {},
    async () => {
      const code = store.createPairingCode(sessionId);
      return {
        content: [
          {
            type: 'text',
            text: `Pairing code: **${code}**\n\nTell the user to enter this code in the iPad app's connection screen to link their drawings to this session.`,
          },
        ],
      };
    }
  );
}
