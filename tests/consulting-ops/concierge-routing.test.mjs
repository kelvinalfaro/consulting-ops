import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const skillRoot = new URL('../../.agents/skills/consulting-concierge/', import.meta.url);
const fixtures = JSON.parse(readFileSync(new URL('evals/routing_fixtures.json', skillRoot), 'utf8'));
const routingText = [
  readFileSync(new URL('SKILL.md', skillRoot), 'utf8'),
  readFileSync(new URL('references/workflows.md', skillRoot), 'utf8'),
  readFileSync(new URL('references/engagement-intake.md', skillRoot), 'utf8'),
  readFileSync(new URL('references/standalone-workflows.md', skillRoot), 'utf8'),
].join('\n');

test('concierge lifecycle routing fixtures point to documented destinations', () => {
  assert.equal(fixtures.version, 2);
  assert.equal(fixtures.routes.length, 8);
  for (const fixture of fixtures.routes) {
    assert.match(fixture.id, /^[a-z0-9-]+$/);
    assert.ok(fixture.prompt.length > 20, `${fixture.id} needs a realistic prompt`);
    assert.ok(
      routingText.includes(fixture.expected),
      `${fixture.id} expected route is missing from concierge guidance: ${fixture.expected}`,
    );
    if (fixture.fallback) {
      assert.ok(
        routingText.includes(fixture.fallback),
        `${fixture.id} fallback is missing from concierge guidance: ${fixture.fallback}`,
      );
    }
  }
});

test('optional consulting skills have bundled standalone fallbacks', () => {
  assert.match(routingText, /optional enhancements, not installation dependencies/);
  for (const heading of ['Shape an inquiry', 'Shape a standalone proposal or SOW', 'Steward an active engagement', 'Bound non-core analysis', 'Draft a bounded client communication']) {
    assert.match(routingText, new RegExp(heading));
  }
  assert.match(routingText, /does not itself calculate CSV summaries, financial performance, ROI, NPV, or sensitivity analysis/);
});

test('engagement intake keeps system and financial intake separate', () => {
  assert.match(routingText, /System onboarding/);
  assert.match(routingText, /Engagement intake/);
  assert.match(routingText, /Financial-analysis intake/);
  assert.match(routingText, /confirmed terms/);
  assert.match(routingText, /missing access/);
  assert.match(routingText, /decisions required before kickoff/);
});
