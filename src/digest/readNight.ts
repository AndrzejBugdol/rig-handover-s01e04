import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, Night, RunStatus } from './types.js';

const statuses = new Set<string>(['ok', 'retry', 'fail']);

type Entry = { at: string; job: string; status: RunStatus; owner: string | null; error: string | null };

function parseLine(line: string): Entry | null {
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
  if (typeof o.status !== 'string' || !statuses.has(o.status)) return null;
  return {
    at: o.at,
    job: o.job,
    status: o.status as RunStatus,
    owner: typeof o.owner === 'string' ? o.owner : null,
    error: typeof o.error === 'string' ? o.error : null,
  };
}

// null when runs/<night>.jsonl does not exist. Lines that don't parse are counted, never thrown.
export function readNight(runsDir: string, night: string): Night | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  const path = join(runsDir, `${night}.jsonl`);
  if (!existsSync(path)) return null;

  const rows = new Map<string, DigestRow>();
  let badLines = 0;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (line.trim() === '') continue;
    const e = parseLine(line);
    if (!e) {
      badLines++;
      continue;
    }
    const row = rows.get(e.job);
    if (!row) {
      rows.set(e.job, {
        job: e.job,
        owner: e.owner,
        runs: 1,
        retries: e.status === 'retry' ? 1 : 0,
        lastStatus: e.status,
        lastError: e.error,
        first: e.at,
        last: e.at,
      });
      continue;
    }
    row.runs++;
    if (e.status === 'retry') row.retries++;
    row.owner = e.owner ?? row.owner;
    if (e.at < row.first) row.first = e.at;
    if (e.at >= row.last) {
      row.last = e.at;
      row.lastStatus = e.status;
      row.lastError = e.error;
    }
  }
  return { night, rows: [...rows.values()].sort((a, b) => a.job.localeCompare(b.job)), badLines };
}
