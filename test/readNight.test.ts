import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/readNight.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const n = readNight('runs', '2026-10-28');
    expect(n?.badLines).toBe(1);
    expect(n?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    const f = n!.rows.find((r) => r.job === 'fixtures/refresh')!;
    expect(f).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', owner: 'rook' });
    const b = n!.rows.find((r) => r.job === 'notes/backup')!;
    expect(b).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps a row whose owner is null', () => {
    const d = n('digest/render');
    expect(d.owner).toBeNull();
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '2000-01-01')).toBeNull();
  });
});

function n(job: string) {
  return readNight('runs', '2026-10-28')!.rows.find((r) => r.job === job)!;
}
