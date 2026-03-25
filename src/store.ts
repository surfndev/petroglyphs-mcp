import { randomInt } from 'node:crypto';
import { config } from './config.js';
import type { Submission } from './types.js';

const DEFAULT_SESSION = '__local__';
const PAIRING_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += PAIRING_CHARS[randomInt(PAIRING_CHARS.length)];
  }
  return code;
}

class SessionStore {
  private sessions = new Map<string, Submission[]>();
  private pairingToSession = new Map<string, string>();
  private sessionToPairing = new Map<string, string>();

  private getOrCreate(sessionId: string): Submission[] {
    let subs = this.sessions.get(sessionId);
    if (!subs) {
      subs = [];
      this.sessions.set(sessionId, subs);
    }
    return subs;
  }

  addSubmission(sessionId: string, submission: Submission): void {
    const subs = this.getOrCreate(sessionId);
    subs.unshift(submission);
    if (subs.length > config.maxHistory) {
      subs.length = config.maxHistory;
    }
  }

  getLatest(sessionId: string): Submission | null {
    return this.sessions.get(sessionId)?.[0] ?? null;
  }

  getHistory(sessionId: string, limit?: number): Submission[] {
    const subs = this.sessions.get(sessionId) ?? [];
    const n = limit ?? subs.length;
    return subs.slice(0, n);
  }

  getCount(sessionId: string): number {
    return this.sessions.get(sessionId)?.length ?? 0;
  }

  clear(sessionId: string): void {
    const subs = this.sessions.get(sessionId);
    if (subs) subs.length = 0;
  }

  createPairingCode(sessionId: string): string {
    // Idempotent — return existing code if session already has one
    const existing = this.sessionToPairing.get(sessionId);
    if (existing) return existing;

    // Generate unique code
    let code: string;
    do {
      code = generateCode();
    } while (this.pairingToSession.has(code));

    this.pairingToSession.set(code, sessionId);
    this.sessionToPairing.set(sessionId, code);
    return code;
  }

  resolveSession(pairingCode: string): string | null {
    return this.pairingToSession.get(pairingCode.toUpperCase()) ?? null;
  }

  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    const code = this.sessionToPairing.get(sessionId);
    if (code) {
      this.pairingToSession.delete(code);
      this.sessionToPairing.delete(sessionId);
    }
  }

  getActiveSessionCount(): number {
    return this.sessions.size;
  }
}

export const store = new SessionStore();
export { DEFAULT_SESSION };
