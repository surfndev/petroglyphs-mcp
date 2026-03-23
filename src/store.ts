import { config } from './config.js';
import type { Submission } from './types.js';

const submissions: Submission[] = [];

export function addSubmission(submission: Submission): void {
  submissions.unshift(submission);
  if (submissions.length > config.maxHistory) {
    submissions.length = config.maxHistory;
  }
}

export function getLatest(): Submission | null {
  return submissions[0] ?? null;
}

export function getHistory(limit?: number): Submission[] {
  const n = limit ?? submissions.length;
  return submissions.slice(0, n);
}

export function getCount(): number {
  return submissions.length;
}

export function clear(): void {
  submissions.length = 0;
}
