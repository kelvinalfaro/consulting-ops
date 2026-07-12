import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

function decodeEntities(text) {
  return text.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function htmlToText(html) {
  return decodeEntities(html
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export async function extractTextFromFile(path) {
  const extension = extname(path).toLowerCase();
  if (['.txt', '.md', '.csv', '.yml', '.yaml', '.json'].includes(extension)) return readFileSync(path, 'utf8');
  if (['.html', '.htm'].includes(extension)) return htmlToText(readFileSync(path, 'utf8'));
  if (extension === '.pdf') {
    const pdf = (await import('pdf-parse')).default;
    return (await pdf(readFileSync(path))).text;
  }
  if (extension === '.docx') {
    const mammoth = await import('mammoth');
    return (await mammoth.extractRawText({ path })).value;
  }
  throw new Error(`Unsupported solicitation format: ${extension || 'unknown'}`);
}

function lines(text) {
  return text.split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function firstMatch(items, patterns) {
  for (const line of items) for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function parseDateCandidate(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/\b(?:at|by|no later than)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  const value = new Date(cleaned);
  return Number.isNaN(value.valueOf()) ? raw.trim() : value.toISOString();
}

function dateFor(items, labels) {
  const label = labels.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const pattern = new RegExp(`(?:${label})\\s*(?::|-)?\\s*(.+)$`, 'i');
  return parseDateCandidate(firstMatch(items, [pattern]));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function extractOpportunityFields(text) {
  const sourceLines = lines(text);
  const title = firstMatch(sourceLines.slice(0, 40), [
    /(?:request for (?:proposals?|qualifications?|information)|invitation to bid|call for consultants?)\s*[:#-]?\s*(.+)$/i,
    /(?:rfp|rfq|rfi)\s*(?:no\.?|number|#)?\s*[\w.-]*\s*[:|-]\s*(.+)$/i,
  ]);
  const issuer = firstMatch(sourceLines.slice(0, 80), [
    /(?:issued|released|prepared|published) by\s*[:|-]?\s*(.+)$/i,
    /(?:contracting|issuing) (?:agency|organization|authority)\s*[:|-]\s*(.+)$/i,
  ]);
  const emails = unique([...text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) => match[0]));
  const budgetMatch = text.match(/(?:budget|not[- ]to[- ]exceed|maximum (?:contract|award)|estimated value)\s*(?::|is|of)?\s*\$\s*([\d,]+(?:\.\d{1,2})?)/i);
  const mandatory = unique(sourceLines.filter((line) =>
    /\b(?:must|shall|required|mandatory|minimum qualification|responsive proposal)\b/i.test(line)
    && line.length >= 15 && line.length <= 500
  )).slice(0, 100).map((name) => ({ name, source: 'Extracted text; confirm page/section', status: 'unknown' }));
  const attachments = unique(sourceLines.filter((line) =>
    /\b(?:attachment|appendix|form|certificate|certification|references?|resumes?|cost proposal|price sheet)\b/i.test(line)
    && /\b(?:submit|include|complete|provide|attach|required)\b/i.test(line)
    && line.length <= 400
  )).slice(0, 50).map((name) => ({ name, status: 'open' }));
  const criteria = unique(sourceLines.filter((line) =>
    /(?:evaluation|selection|scoring|points?|weight)/i.test(line) && /(?:\d+\s*%|\d+\s*points?)/i.test(line)
  )).slice(0, 30).map((name) => ({ name }));
  const scopeStart = sourceLines.findIndex((line) => /^(?:scope of (?:work|services)|project (?:scope|overview)|statement of work)\b/i.test(line));
  const scopeSummary = scopeStart >= 0 ? sourceLines.slice(scopeStart + 1, scopeStart + 5).join(' ').slice(0, 1200) || null : null;
  const submissionLine = sourceLines.find((line) => /\b(?:submit|submission|proposal delivery)\b/i.test(line)
    && /\b(?:email|portal|upload|mail|deliver)\b/i.test(line));
  const method = /email/i.test(submissionLine ?? '') ? 'email'
    : /portal|upload/i.test(submissionLine ?? '') ? 'portal_upload'
      : /mail|deliver/i.test(submissionLine ?? '') ? 'physical_delivery' : null;

  return {
    title,
    issuer,
    questions_due: dateFor(sourceLines, ['questions due', 'deadline for questions', 'inquiries due']),
    intent_to_bid_due: dateFor(sourceLines, ['intent to bid due', 'notice of intent due', 'letter of intent due']),
    proposal_due: dateFor(sourceLines, ['proposals due', 'proposal due', 'responses due', 'submission deadline', 'closing date']),
    anticipated_start: dateFor(sourceLines, ['anticipated start', 'contract start', 'project start']),
    scope_summary: scopeSummary,
    budget: budgetMatch ? { stated: true, amount: Number(budgetMatch[1].replace(/,/g, '')), currency: 'USD' } : undefined,
    submission: { method, portal: null, contact: emails[0] ?? null },
    mandatory_requirements: mandatory,
    required_attachments: attachments,
    evaluation_criteria: criteria,
    extraction: {
      extracted_at: new Date().toISOString(),
      text_length: text.length,
      warnings: [
        ...(!title ? ['Title not confidently extracted'] : []),
        ...(!issuer ? ['Issuer not confidently extracted'] : []),
        ...(!dateFor(sourceLines, ['proposals due', 'proposal due', 'responses due', 'submission deadline', 'closing date']) ? ['Proposal deadline not confidently extracted'] : []),
        'Machine extraction requires review against the authoritative solicitation and amendments',
      ],
    },
  };
}

export function mergeExtractedFields(opportunity, extracted) {
  const mergeValue = (current, candidate) => current == null || current === '' ? candidate : current;
  return {
    ...opportunity,
    title: mergeValue(opportunity.title, extracted.title),
    issuer: mergeValue(opportunity.issuer, extracted.issuer),
    questions_due: mergeValue(opportunity.questions_due, extracted.questions_due),
    intent_to_bid_due: mergeValue(opportunity.intent_to_bid_due, extracted.intent_to_bid_due),
    proposal_due: mergeValue(opportunity.proposal_due, extracted.proposal_due),
    anticipated_start: mergeValue(opportunity.anticipated_start, extracted.anticipated_start),
    scope_summary: mergeValue(opportunity.scope_summary, extracted.scope_summary),
    budget: opportunity.budget?.stated ? opportunity.budget : extracted.budget ?? opportunity.budget,
    submission: { ...extracted.submission, ...opportunity.submission,
      method: mergeValue(opportunity.submission?.method, extracted.submission?.method),
      contact: mergeValue(opportunity.submission?.contact, extracted.submission?.contact),
    },
    mandatory_requirements: opportunity.mandatory_requirements?.length ? opportunity.mandatory_requirements : extracted.mandatory_requirements,
    required_attachments: opportunity.required_attachments?.length ? opportunity.required_attachments : extracted.required_attachments,
    evaluation_criteria: opportunity.evaluation_criteria?.length ? opportunity.evaluation_criteria : extracted.evaluation_criteria,
    extraction: extracted.extraction,
  };
}
