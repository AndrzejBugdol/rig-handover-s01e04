import type { DigestRow, Night } from '../digest/types.js';

const dash = '—';

export function DigestPage({ data }: { data: Night }) {
  return (
    <>
      <h1>digest · {data.night}</h1>
      {data.badLines > 0 && <p class="mute">{data.badLines} line(s) in the log could not be read</p>}
      {data.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr><th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last status</th><th>last error</th><th>first</th><th>last</th></tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <Row row={r} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function Row({ row }: { row: DigestRow }) {
  const flagged = row.retries >= 3 || row.lastStatus === 'fail';
  return (
    <tr class={flagged ? 'warn' : undefined}>
      <td>{row.job}{flagged ? ' ⚠' : ''}</td>
      <td>{row.owner ?? dash}</td>
      <td>{row.runs}</td>
      <td>{row.retries}</td>
      <td>{row.lastStatus}</td>
      <td>{row.lastError ?? dash}</td>
      <td>{row.first}</td>
      <td>{row.last}</td>
    </tr>
  );
}
