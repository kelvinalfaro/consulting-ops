import { decodeHtml, stripHtml } from './_html.mjs';
import { matchesTerm } from './_match.mjs';

function resolveUrl(href, base) {
  try { return new URL(href, base).href; } catch { return null; }
}

export function parseHtmlLinks(html, source) {
  const results = [];
  const pattern = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const url = resolveUrl(decodeHtml(match[2]), source.url);
    const title = stripHtml(match[4]);
    if (!url || !/^https?:\/\//i.test(url) || !title) continue;
    const rowStart = html.lastIndexOf('<tr', match.index);
    const rowEnd = html.indexOf('</tr>', match.index);
    const container = rowStart >= 0 && rowEnd > match.index
      ? html.slice(rowStart, rowEnd + 5)
      : html.slice(Math.max(0, match.index - 180), Math.min(html.length, match.index + match[0].length + 240));
    const around = stripHtml(container);
    const include = source.link_include_terms ?? [];
    const exclude = source.link_exclude_terms ?? [];
    const haystack = `${title} ${url}${source.context_filter ? ` ${around}` : ''}`.toLowerCase();
    if (include.length && !include.some((term) => matchesTerm(haystack, term))) continue;
    if (exclude.some((term) => matchesTerm(haystack, term))) continue;
    const dueMatch = around.match(/(?:response|proposal|submission)?\s*due(?: date(?:\s*&\s*time)?)?\s*:?\s*((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/i);
    const deadline = dueMatch ? dueMatch[1].replace(/(\d)(?:st|nd|rd|th)/i, '$1') : null;
    results.push({ title, url, issuer: source.label ?? source.id, published: null, deadline, summary: around, source_id: source.id });
  }
  return [...new Map(results.map((item) => [item.url, item])).values()];
}

export default {
  id: 'html_links',
  async fetch(source, context) {
    if (!source.url) throw new Error(`Source ${source.id} requires url`);
    const response = await context.fetch(source.url, {
      headers: { 'user-agent': 'consulting-ops/0.2 (+local RFP discovery)' },
      redirect: 'follow', signal: AbortSignal.timeout(source.timeout_ms ?? 20000),
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return parseHtmlLinks(await response.text(), source);
  },
};
