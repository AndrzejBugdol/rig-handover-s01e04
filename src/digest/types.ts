export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log.
export type DigestRow = {
  job: string;
  owner: string | null; // null renders as —
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  first: string; // ISO 8601 with the offset from the log
  last: string;
};

export type Night = {
  night: string;
  rows: DigestRow[];
  badLines: number;
};

// null when runs/<night>.jsonl does not exist.
export type ReadNight = (runsDir: string, night: string) => Night | null;
