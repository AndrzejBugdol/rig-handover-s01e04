import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

function appWith(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  for (const [n, text] of Object.entries(files)) writeFileSync(join(dir, `${n}.jsonl`), text);
  return createApp({ adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir: dir });
}

const line = (job: string, status: string, owner: string | null = 'rook') =>
  JSON.stringify({ at: '2026-10-28T23:00:00+01:00', job, status, owner });

describe('digest routes', () => {
  const app = appWith({
    '2026-10-28': [line('b/job', 'ok'), line('a/job', 'fail', null), 'not json'].join('\n'),
    '2026-10-29': '',
  });

  it('page: 200, sorted by job, fail marked, null owner as dash', async () => {
    const res = await app.request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('⚠');
    expect(html).toContain('—');
  });

  it('json: same jobs in the same order as the page', async () => {
    const html = await (await app.request('/digest/2026-10-28')).text();
    const json = (await (await app.request('/api/digest/2026-10-28')).json()) as { rows: { job: string }[] };
    expect(json.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
  });

  it('404 for a night with no file, on both routes', async () => {
    expect((await app.request('/digest/2000-01-01')).status).toBe(404);
    expect((await app.request('/api/digest/2000-01-01')).status).toBe(404);
  });

  it('empty night renders "nothing ran"', async () => {
    const res = await app.request('/digest/2026-10-29');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('a bad line is counted and the night still renders', async () => {
    const json = (await (await app.request('/api/digest/2026-10-28')).json()) as { badLines: number };
    expect(json.badLines).toBe(1);
  });

  it('board links each night with counts', async () => {
    const html = await (await app.request('/')).text();
    expect(html).toContain('href="/digest/2026-10-28"');
    expect(html).toContain('ok 1 · retry 0 · fail 1');
  });
});
