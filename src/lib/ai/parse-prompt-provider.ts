type Completion = () => Promise<string>;

function isBillingExhausted(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('credit balance is too low') ||
    message.includes('billing') ||
    message.includes('payment required') ||
    message.includes('status 402')
  );
}

export async function completePromptWithFallback(
  primary: Completion,
  fallback: Completion,
): Promise<string> {
  try {
    return await primary();
  } catch (error) {
    if (!isBillingExhausted(error)) throw error;
    return fallback();
  }
}
