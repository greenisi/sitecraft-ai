import assert from 'node:assert/strict';
import { completePromptWithFallback } from '../src/lib/ai/parse-prompt-provider';

async function main() {
  let fallbackCalls = 0;
  const result = await completePromptWithFallback(
    async () => {
      throw new Error('Your credit balance is too low to access the Anthropic API.');
    },
    async () => {
      fallbackCalls += 1;
      return '{"mode":"generate"}';
    },
  );

  assert.equal(result, '{"mode":"generate"}');
  assert.equal(fallbackCalls, 1);
  console.log('PASS parse-prompt billing fallback');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
