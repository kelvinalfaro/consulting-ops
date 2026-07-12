import test from 'node:test';
import assert from 'node:assert/strict';
import { pendingItems } from '../../process-pipeline.mjs';
test('pipeline parser returns only unchecked sources',()=>{const items=pendingItems('# Pipeline\n- [ ] https://example.org/rfp | City | Title\n- [x] https://example.org/done');assert.equal(items.length,1);assert.equal(items[0].source,'https://example.org/rfp');});
