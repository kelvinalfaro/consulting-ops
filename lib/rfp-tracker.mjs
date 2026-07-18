function cells(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((value) => value.trim());
}

function key(value) {
  if (String(value).trim() === '#') return '#';
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function parseTracker(markdown) {
  const lines = markdown.split(/\r?\n/).filter((line) => /^\s*\|/.test(line));
  if (lines.length < 2) return [];
  const headers = cells(lines[0]).map(key);
  return lines.slice(2).map(cells).filter((row) => row.some(Boolean)).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))
  );
}

export function trackerMetrics(rows, now = new Date()) {
  const activeStates = new Set(['qualified', 'evaluated', 'bid', 'drafting', 'review']);
  const outcomes = rows.filter((row) => ['won', 'lost'].includes(row.status?.toLowerCase()));
  const won = outcomes.filter((row) => row.status?.toLowerCase() === 'won').length;
  const upcoming = rows.map((row) => ({ row, due: new Date(row.due || row.closing_date || '') }))
    .filter(({ due }) => !Number.isNaN(due.valueOf()) && due >= now)
    .sort((a, b) => a.due - b.due);
  return {
    total: rows.length,
    active: rows.filter((row) => activeStates.has(row.status?.toLowerCase())).length,
    submitted: rows.filter((row) => ['submitted', 'shortlisted', 'won', 'lost'].includes(row.status?.toLowerCase())).length,
    won,
    win_rate: outcomes.length ? Math.round((won / outcomes.length) * 100) : null,
    next_deadline: upcoming[0]?.due.toISOString() ?? null,
  };
}

export function pursuitFunnel(rows) {
  const rank = new Map([
    ['discovered', 0], ['qualified', 1], ['evaluated', 2], ['bid', 3], ['drafting', 3],
    ['review', 3], ['submitted', 4], ['shortlisted', 5], ['won', 6], ['lost', 6],
  ]);
  const reached = (stage) => rows.filter((row) => (rank.get(String(row.status ?? '').toLowerCase()) ?? -1) >= stage).length;
  const discovered = rows.length;
  const bid = reached(3);
  const submitted = reached(4);
  const shortlisted = reached(5);
  const won = rows.filter((row) => String(row.status ?? '').toLowerCase() === 'won').length;
  const rate = (value, base) => base ? Math.round(value / base * 1000) / 10 : null;
  return {
    discovered,
    bid,
    submitted,
    shortlisted,
    won,
    bid_rate: rate(bid, discovered),
    submission_rate: rate(submitted, bid),
    shortlist_rate: rate(shortlisted, submitted),
    win_rate: rate(won, submitted),
    small_sample: submitted < 10,
  };
}

export const TRACKER_COLUMNS = ['#', 'Identified', 'Issuer', 'Opportunity', 'Score', 'Questions Due', 'Intent Due', 'Due', 'Value', 'Status', 'Last Activity', 'Next Action', 'Report', 'Notes'];

export function renderTracker(rows) {
  const header = `| ${TRACKER_COLUMNS.join(' | ')} |`;
  const divider = `|${TRACKER_COLUMNS.map(() => '---').join('|')}|`;
  const body = rows.map((row) => {
    const normalized = Object.fromEntries(Object.entries(row).map(([name, value]) => [key(name), value]));
    return `| ${TRACKER_COLUMNS.map((column) => String(normalized[key(column)] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`;
  });
  return `# RFP tracker\n\n${header}\n${divider}\n${body.join('\n')}${body.length ? '\n' : ''}`;
}
