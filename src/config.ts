import { homedir } from 'node:os';
import { resolve } from 'node:path';
import type { Config } from './types.js';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

function resolvePath(p: string): string {
  if (p.startsWith('~')) {
    return resolve(homedir(), p.slice(2));
  }
  return resolve(p);
}

const vaultPathRaw = getArg('--vault-path');
const exportPathRaw = getArg('--export-path');

export const config: Config = {
  port: parseInt(getArg('--port') ?? '3333', 10),
  vaultPath: vaultPathRaw ? resolvePath(vaultPathRaw) : null,
  exportPath: resolvePath(exportPathRaw ?? '~/Desktop'),
  maxHistory: parseInt(getArg('--max-history') ?? '50', 10),
};
