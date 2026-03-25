import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { store, DEFAULT_SESSION } from './store.js';
import type { Submission, Combo, StrokeMetadata } from './types.js';

const sessions = new Map<string, StreamableHTTPServerTransport>();

export async function startHttp(port: number): Promise<void> {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // ── iPad REST API ──

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: '0.1.0',
      submissions: store.getCount(DEFAULT_SESSION),
      activeSessions: store.getActiveSessionCount(),
    });
  });

  app.get('/api/validate-code', (req, res) => {
    const code = (req.query['code'] as string | undefined)?.toUpperCase();
    if (!code) {
      res.status(400).json({ valid: false, error: 'Missing code' });
      return;
    }
    const sessionId = store.resolveSession(code);
    if (sessionId) {
      res.json({ valid: true });
    } else {
      res.status(404).json({ valid: false, error: 'Invalid pairing code' });
    }
  });

  app.post('/api/submit', (req, res) => {
    const { image, strokeMetadata, combo, pairing_code } = req.body as {
      image?: string;
      strokeMetadata?: StrokeMetadata;
      combo?: Combo | null;
      pairing_code?: string;
    };

    if (!image || !strokeMetadata) {
      res.status(400).json({ error: 'Missing required fields: image, strokeMetadata' });
      return;
    }

    // Resolve session from pairing code, fall back to local
    let sessionId = DEFAULT_SESSION;
    if (pairing_code) {
      const resolved = store.resolveSession(pairing_code);
      if (!resolved) {
        res.status(400).json({ error: 'Invalid pairing code' });
        return;
      }
      sessionId = resolved;
    }

    const submission: Submission = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      imageBase64: image,
      mimeType: 'image/png',
      strokeMetadata,
      combo: combo ?? null,
    };

    store.addSubmission(sessionId, submission);

    res.json({ id: submission.id, status: 'received' });
    console.error(`[petroglyphs] submission received: ${submission.id} (session: ${sessionId === DEFAULT_SESSION ? 'local' : sessionId.slice(0, 8)})`);
  });

  // ── MCP Streamable HTTP ──

  app.post('/mcp', async (req, res) => {
    const existingSessionId = req.headers['mcp-session-id'] as string | undefined;

    if (existingSessionId && sessions.has(existingSessionId)) {
      const transport = sessions.get(existingSessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // New session — pre-generate ID so both transport and server share it
    const sessionId = randomUUID();

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        sessions.delete(sid);
        store.removeSession(sid);
      }
    };

    const server = createServer(sessionId);
    await server.connect(transport);

    sessions.set(sessionId, transport);

    await transport.handleRequest(req, res, req.body);
  });

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  app.listen(port, () => {
    console.error(`[petroglyphs] HTTP server listening on http://localhost:${port}`);
    console.error(`[petroglyphs]   iPad API:  POST http://localhost:${port}/api/submit`);
    console.error(`[petroglyphs]   Health:    GET  http://localhost:${port}/api/health`);
    console.error(`[petroglyphs]   MCP HTTP:  POST http://localhost:${port}/mcp`);
  });
}
