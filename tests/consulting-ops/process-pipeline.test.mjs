import test from 'node:test';
import assert from 'node:assert/strict';
import { pendingItems } from '../../process-pipeline.mjs';
test('pipeline parser returns only unchecked sources under Pending',()=>{const items=pendingItems('# Pipeline\n## Pending\n- [ ] https://example.org/rfp | City | Title\n- [x] https://example.org/done\n## Source leads\n- [ ] https://example.org/portal\n## Processed\n- [ ] https://example.org/legacy');assert.equal(items.length,1);assert.equal(items[0].source,'https://example.org/rfp');});
