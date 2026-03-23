import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { addSubmission, getLatest, getCount } from './store.js';
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
      submissions: getCount(),
    });
  });

  app.post('/api/submit', (req, res) => {
    const { image, strokeMetadata, combo } = req.body as {
      image?: string;
      strokeMetadata?: StrokeMetadata;
      combo?: Combo | null;
    };

    if (!image || !strokeMetadata) {
      res.status(400).json({ error: 'Missing required fields: image, strokeMetadata' });
      return;
    }

    const submission: Submission = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      imageBase64: image,
      mimeType: 'image/png',
      strokeMetadata,
      combo: combo ?? null,
    };

    addSubmission(submission);

    res.json({ id: submission.id, status: 'received' });
    console.error(`[petroglyphs] submission received: ${submission.id}`);
  });

  // ── MCP Streamable HTTP ──

  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // New session — create transport and server
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) sessions.delete(sid);
    };

    const server = createServer();
    await server.connect(transport);

    // After connect, the transport has a sessionId
    if (transport.sessionId) {
      sessions.set(transport.sessionId, transport);
    }

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
