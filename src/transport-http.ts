import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { store, DEFAULT_SESSION } from './store.js';
import type { Submission, Combo, StrokeMetadata } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const landingHtml = readFileSync(join(__dirname, '..', 'src', 'landing.html'), 'utf-8');

const sessions = new Map<string, StreamableHTTPServerTransport>();

interface BetaSignup {
  id: string;
  ts: string;
  email: string;
  useCase: string;
  workflow: string;
  ref: string;
}

const betaSignups: BetaSignup[] = [];

export async function startHttp(port: number): Promise<void> {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use('/assets', express.static(join(__dirname, '..', 'public')));

  // ── Landing page ──

  app.get('/', (_req, res) => {
    res.type('html').send(landingHtml);
  });

  // ── Engagement signals ──

  app.post('/api/ping', (req, res) => {
    const { signal, ref } = req.body as { signal?: string; ref?: string };
    if (signal) {
      console.log(JSON.stringify({ signal, ref: ref || '', ts: new Date().toISOString() }));
    }
    res.json({ ok: true });
  });

  // ── Beta signup ──

  app.post('/api/beta-signup', (req, res) => {
    const { email, useCase, workflow, ref } = req.body as {
      email?: string;
      useCase?: string;
      workflow?: string;
      ref?: string;
    };

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const signup: BetaSignup = {
      id: randomUUID(),
      ts: new Date().toISOString(),
      email: email.trim().toLowerCase(),
      useCase: (useCase ?? '').trim(),
      workflow: (workflow ?? '').trim(),
      ref: (ref ?? '').trim(),
    };

    betaSignups.push(signup);
    console.log(JSON.stringify({ signal: 'signup', ...signup }));

    res.json({ success: true });
  });

  app.get('/api/beta-signups', (req, res) => {
    if (req.query['key'] !== process.env.ADMIN_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json({ count: betaSignups.length, signups: betaSignups });
  });

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

    // Stale session ID — tell client to re-initialize
    if (existingSessionId) {
      res.status(404).json({ error: 'Session not found. Please reconnect.' });
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
    console.error(`[petroglyphs]   Landing:   GET  http://localhost:${port}/`);
    console.error(`[petroglyphs]   iPad API:  POST http://localhost:${port}/api/submit`);
    console.error(`[petroglyphs]   Health:    GET  http://localhost:${port}/api/health`);
    console.error(`[petroglyphs]   MCP HTTP:  POST http://localhost:${port}/mcp`);
  });
}
