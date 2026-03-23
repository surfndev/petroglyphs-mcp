#!/usr/bin/env node

import { config } from './config.js';
import { startStdio } from './transport-stdio.js';
import { startHttp } from './transport-http.js';

const hasPortFlag = process.argv.includes('--port');
const isStdioPiped = !process.stdin.isTTY;

async function main(): Promise<void> {
  console.error('[petroglyphs] petroglyphs-mcp v0.1.0');

  // If stdin is piped (e.g. Claude Desktop spawned us), start stdio transport
  if (isStdioPiped && !hasPortFlag) {
    console.error('[petroglyphs] starting in stdio mode');
    await startStdio();
    return;
  }

  // Start HTTP server (for iPad + MCP Streamable HTTP)
  await startHttp(config.port);

  // If also piped via stdio, start that too (dual transport)
  if (isStdioPiped) {
    console.error('[petroglyphs] also starting stdio transport');
    await startStdio();
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('\n[petroglyphs] shutting down');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[petroglyphs] shutting down');
  process.exit(0);
});

main().catch((err) => {
  console.error('[petroglyphs] fatal error:', err);
  process.exit(1);
});
