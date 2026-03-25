import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_SESSION } from './store.js';
import { register as registerGetHandwriting } from './tools/get-handwriting.js';
import { register as registerGetHistory } from './tools/get-handwriting-history.js';
import { register as registerClearHistory } from './tools/clear-history.js';
import { register as registerSaveToObsidian } from './tools/save-to-obsidian.js';
import { register as registerExportToExcalidraw } from './tools/export-to-excalidraw.js';
import { register as registerGetPairingCode } from './tools/get-pairing-code.js';
import { register as registerSlateCurrent } from './resources/slate-current.js';
import { register as registerSlateHistory } from './resources/slate-history.js';

export function createServer(sessionId: string = DEFAULT_SESSION): McpServer {
  const server = new McpServer({
    name: 'petroglyphs-mcp',
    version: '0.1.0',
  });

  // Tools
  registerGetHandwriting(server, sessionId);
  registerGetHistory(server, sessionId);
  registerClearHistory(server, sessionId);
  registerSaveToObsidian(server, sessionId);
  registerExportToExcalidraw(server, sessionId);
  registerGetPairingCode(server, sessionId);

  // Resources
  registerSlateCurrent(server, sessionId);
  registerSlateHistory(server, sessionId);

  return server;
}
