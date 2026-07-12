function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function matchesTerm(text, term) {
  const haystack = String(text ?? '').toLowerCase();
  const needle = String(term ?? '').trim().toLowerCase();
  if (!needle) return false;
  const prefix = needle.endsWith('*');
  const core = prefix ? needle.slice(0, -1) : needle;
  if (!core) return false;
  const left = /^[a-z0-9]/i.test(core) ? '\\b' : '';
  const right = !prefix && /[a-z0-9]$/i.test(core) ? '\\b' : '';
  return new RegExp(`${left}${escapeRegex(core)}${right}`, 'i').test(haystack);
}
