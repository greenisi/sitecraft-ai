/**
 * Singleton ref holder for the preview iframe element.
 * This allows the PropertiesPanel to send postMessages to the iframe
 * without needing to thread a ref through multiple component layers.
 */

let _iframeElement: HTMLIFrameElement | null = null;

export function setPreviewIframe(el: HTMLIFrameElement | null) {
  _iframeElement = el;
}

export function getPreviewIframe(): HTMLIFrameElement | null {
  return _iframeElement;
}

export function sendToPreviewIframe(message: Record<string, unknown>) {
  const iframe = _iframeElement;
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(message, '*');
}

/**
 * Reload the preview iframe to discard all unsaved visual changes.
 * The iframe re-renders from the original saved files.
 */
export function reloadPreviewIframe() {
  const iframe = _iframeElement;
  if (!iframe) return;
  try {
    // Force reload by resetting the src
    const currentSrc = iframe.src;
    if (currentSrc) {
      iframe.src = currentSrc;
    } else {
      iframe.contentWindow?.location.reload();
    }
  } catch {
    // Cross-origin fallback
    iframe.contentWindow?.location.reload();
  }
}
