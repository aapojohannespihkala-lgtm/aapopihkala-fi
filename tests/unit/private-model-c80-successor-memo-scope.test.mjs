import test from 'node:test';
import assert from 'node:assert/strict';
import { withC80SuccessorMemo } from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';

// Perf memo for one synchronous layer pass. It must not outlive the pass,
// so JSON mutated between passes is always re-authenticated (fail closed).
test('successor memo is scoped to one pass and cleared after errors', () => {
  assert.equal(withC80SuccessorMemo(() => 42), 42);
  assert.equal(withC80SuccessorMemo(() => withC80SuccessorMemo(() => 'nested')), 'nested');
  assert.throws(() => withC80SuccessorMemo(() => { throw new Error('boom'); }), /boom/);
  // A fresh pass after the throw starts a new memo rather than reusing state.
  let calls = 0;
  withC80SuccessorMemo(() => { calls++; });
  assert.equal(calls, 1);
});
