import type { GenerationEvent } from '@/types/generation';

// --------------------------------------------------------------------------
// Server-side: encode GenerationEvents as SSE
// --------------------------------------------------------------------------

/**
 * Encodes a GenerationEvent as an SSE-formatted string.
 * Each event is sent as `data: <json>\n\n`.
 */
export function encodeSSE(event: GenerationEvent): string {
  const json = JSON.stringify(event);
  return `data: ${json}\n\n`;
}

/**
 * Sends a stream-terminating SSE comment.
 * Clients should treat this as the signal to close the connection.
 */
export function encodeSSEDone(): string {
  return 'data: [DONE]\n\n';
}

/**
 * Creates a ReadableStream that converts an async iterable of GenerationEvents
 * into SSE-formatted text chunks.
 */
export function createSSEStream(
  events: AsyncIterable<GenerationEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(encodeSSE(event)));
        }
        controller.enqueue(encoder.encode(encodeSSEDone()));
      } catch (err) {
        const errorEvent: GenerationEvent = {
          type: 'error',
          stage: 'error',
          error: err instanceof Error ? err.message : 'Unknown stream error',
        };
        controller.enqueue(encoder.encode(encodeSSE(errorEvent)));
        controller.enqueue(encoder.encode(encodeSSEDone()));
      } finally {
        controller.close();
      }
    },
  });
}

// --------------------------------------------------------------------------
// Client-side: decode SSE stream into GenerationEvents
// --------------------------------------------------------------------------

/**
 * Parses a raw SSE line into a GenerationEvent, or null if the line is
 * not a data line or signals completion.
 */
export function parseSSELine(line: string): GenerationEvent | null | 'done' {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith(':')) {
    // Empty line or SSE comment -- skip
    return null;
  }

  if (!trimmed.startsWith('data: ')) {
    return null;
  }

  const payload = trimmed.slice(6); // strip "data: "

  if (payload === '[DONE]') {
    return 'done';
  }

  try {
    return JSON.parse(payload) as GenerationEvent;
  } catch {
    // Malformed JSON -- skip
    return null;
  }
}

/**
 * Async generator that reads an SSE response body and yields GenerationEvents.
 * Handles chunked transfer where lines may be split across chunks.
 */
export async function* readSSEStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<GenerationEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          const result = parseSSELine(buffer);
          if (result && result !== 'done') {
            yield result;
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE events are delimited by double newlines
      const parts = buffer.split('\n\n');

      // Process all complete events (all but the last part)
      for (let i = 0; i < parts.length - 1; i++) {
        const lines = parts[i].split('\n');
        for (const line of lines) {
          const result = parseSSELine(line);
          if (result === 'done') {
            return;
          }
          if (result) {
            yield result;
          }
        }
      }

      // Keep the incomplete trailing part in the buffer
      buffer = parts[parts.length - 1];
    }
  } finally {
    reader.releaseLock();
  }
}
