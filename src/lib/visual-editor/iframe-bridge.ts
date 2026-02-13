/**
 * Returns a self-contained JavaScript string that gets injected into the preview iframe.
 * Handles: hover overlay, click selection, double-click inline editing,
 * and receiving style/text changes from the parent frame.
 */
export function getIframeBridgeScript(): string {
  return `
(function() {
  // Prevent double-init
  if (window.__sitecraftBridge) return;
  window.__sitecraftBridge = true;

  // ========== OVERLAY ELEMENTS ==========
  const hoverOverlay = document.createElement('div');
  hoverOverlay.id = '__sc-hover-overlay';
  Object.assign(hoverOverlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    border: '2px solid rgba(59, 130, 246, 0.6)',
    borderRadius: '2px',
    background: 'rgba(59, 130, 246, 0.05)',
    zIndex: '99998',
    display: 'none',
    transition: 'all 0.1s ease',
  });
  document.body.appendChild(hoverOverlay);

  const selectOverlay = document.createElement('div');
  selectOverlay.id = '__sc-select-overlay';
  Object.assign(selectOverlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    border: '2px solid rgba(139, 92, 246, 0.8)',
    borderRadius: '2px',
    background: 'rgba(139, 92, 246, 0.05)',
    zIndex: '99999',
    display: 'none',
  });

  const selectLabel = document.createElement('div');
  Object.assign(selectLabel.style, {
    position: 'absolute',
    top: '-22px',
    left: '0',
    background: 'rgba(139, 92, 246, 0.9)',
    color: '#fff',
    fontSize: '11px',
    fontFamily: 'monospace',
    padding: '2px 6px',
    borderRadius: '3px 3px 0 0',
    whiteSpace: 'nowrap',
  });
  selectOverlay.appendChild(selectLabel);
  document.body.appendChild(selectOverlay);

  // ========== STATE ==========
  let selectedEl = null;
  let hoveredEl = null;
  let isInlineEditing = false;
  let longPressTimer = null;

  // Elements to ignore
  const IGNORE_IDS = ['__sc-hover-overlay', '__sc-select-overlay', 'root'];
  function shouldIgnore(el) {
    if (!el || el === document.body || el === document.documentElement) return true;
    if (IGNORE_IDS.includes(el.id)) return true;
    if (el.id && el.id.startsWith('__sc-')) return true;
    return false;
  }

  // ========== CSS PATH GENERATOR ==========
  function getCssPath(el) {
    const path = [];
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();
      if (current.id && !current.id.startsWith('__sc-')) {
        selector += '#' + current.id;
        path.unshift(selector);
        break;
      } else {
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            (c) => c.tagName === current.tagName
          );
          if (siblings.length > 1) {
            const idx = siblings.indexOf(current) + 1;
            selector += ':nth-of-type(' + idx + ')';
          }
        }
        path.unshift(selector);
      }
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  // ========== POSITION OVERLAY ==========
  function positionOverlay(overlay, el) {
    const rect = el.getBoundingClientRect();
    Object.assign(overlay.style, {
      top: rect.top + 'px',
      left: rect.left + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      display: 'block',
    });
    return rect;
  }

  // ========== GET COMPUTED STYLES ==========
  function getElementStyles(el) {
    const cs = window.getComputedStyle(el);
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      textAlign: cs.textAlign,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      marginTop: cs.marginTop,
      marginRight: cs.marginRight,
      marginBottom: cs.marginBottom,
      marginLeft: cs.marginLeft,
      borderRadius: cs.borderRadius,
      borderColor: cs.borderColor,
      borderWidth: cs.borderWidth,
    };
  }

  // ========== CHECK IF TEXT-EDITABLE ==========
  function isTextEditable(el) {
    const tag = el.tagName.toLowerCase();
    const textTags = ['h1','h2','h3','h4','h5','h6','p','span','a','li','td','th','label','button','strong','em','b','i','small','blockquote'];
    if (!textTags.includes(tag)) return false;
    // Only if it has direct text content (not just child elements)
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim().length > 0) return true;
    }
    return false;
  }

  // ========== EVENT HANDLERS ==========

  // HOVER
  function onMouseOver(e) {
    if (isInlineEditing) return;
    const el = e.target;
    if (shouldIgnore(el)) return;
    if (el === selectedEl) return;
    hoveredEl = el;
    positionOverlay(hoverOverlay, el);
  }

  function onMouseOut(e) {
    if (e.target === hoveredEl) {
      hoverOverlay.style.display = 'none';
      hoveredEl = null;
    }
  }

  // CLICK — SELECT
  function onClick(e) {
    if (isInlineEditing) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const el = e.target;
    if (shouldIgnore(el)) return;

    selectedEl = el;
    hoverOverlay.style.display = 'none';
    const rect = positionOverlay(selectOverlay, el);
    selectLabel.textContent = '<' + el.tagName.toLowerCase() + '>';

    const styles = getElementStyles(el);
    const textContent = el.textContent ? el.textContent.substring(0, 200) : '';

    window.parent.postMessage({
      type: 'sitecraft:element-selected',
      data: {
        tagName: el.tagName.toLowerCase(),
        textContent: textContent,
        isTextEditable: isTextEditable(el),
        cssPath: getCssPath(el),
        className: el.className || '',
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        styles: styles,
      },
    }, '*');
  }

  // DOUBLE-CLICK — INLINE EDIT
  function onDblClick(e) {
    const el = e.target;
    if (shouldIgnore(el)) return;
    if (!isTextEditable(el)) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    selectedEl = el;
    isInlineEditing = true;

    // Store original text
    el.__scOriginalText = el.textContent;

    el.contentEditable = 'true';
    el.focus();
    el.style.outline = '2px solid rgba(139, 92, 246, 0.6)';
    el.style.outlineOffset = '2px';
    el.style.minWidth = '20px';

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    window.parent.postMessage({ type: 'sitecraft:inline-edit-start' }, '*');

    // On blur, end editing
    function onBlur() {
      el.removeEventListener('blur', onBlur);
      el.removeEventListener('keydown', onKeydown);
      el.contentEditable = 'false';
      el.style.outline = '';
      el.style.outlineOffset = '';
      isInlineEditing = false;

      const newText = el.textContent;
      const oldText = el.__scOriginalText || '';

      if (newText !== oldText) {
        window.parent.postMessage({
          type: 'sitecraft:inline-edit-end',
          data: {
            cssPath: getCssPath(el),
            oldText: oldText,
            newText: newText,
          },
        }, '*');
      } else {
        window.parent.postMessage({ type: 'sitecraft:inline-edit-cancel' }, '*');
      }
    }

    function onKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      }
      if (e.key === 'Escape') {
        el.textContent = el.__scOriginalText || '';
        el.blur();
      }
    }

    el.addEventListener('blur', onBlur);
    el.addEventListener('keydown', onKeydown);
  }

  // TOUCH — MOBILE SUPPORT
  function onTouchEnd(e) {
    if (isInlineEditing) return;
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    // Use touch end as click-select
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el || shouldIgnore(el)) return;

    e.preventDefault();
    selectedEl = el;
    hoverOverlay.style.display = 'none';
    const rect = positionOverlay(selectOverlay, el);
    selectLabel.textContent = '<' + el.tagName.toLowerCase() + '>';

    const styles = getElementStyles(el);
    window.parent.postMessage({
      type: 'sitecraft:element-selected',
      data: {
        tagName: el.tagName.toLowerCase(),
        textContent: (el.textContent || '').substring(0, 200),
        isTextEditable: isTextEditable(el),
        cssPath: getCssPath(el),
        className: el.className || '',
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        styles: styles,
      },
    }, '*');
  }

  function onTouchStart(e) {
    const touch = e.touches[0];
    longPressTimer = setTimeout(function() {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && !shouldIgnore(el) && isTextEditable(el)) {
        onDblClick({ target: el, preventDefault: function(){}, stopImmediatePropagation: function(){} });
      }
    }, 600);
  }

  function onTouchMove() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  // ========== MESSAGE HANDLER (from parent) ==========
  function onMessage(e) {
    const msg = e.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'sitecraft:apply-style': {
        if (selectedEl && msg.property && msg.value !== undefined) {
          selectedEl.style[msg.property] = msg.value;
          // Update overlay position in case size changed
          positionOverlay(selectOverlay, selectedEl);
          window.parent.postMessage({ type: 'sitecraft:styles-updated' }, '*');
        }
        break;
      }
      case 'sitecraft:deselect': {
        selectedEl = null;
        selectOverlay.style.display = 'none';
        hoverOverlay.style.display = 'none';
        break;
      }
      case 'sitecraft:destroy': {
        cleanup();
        break;
      }
    }
  }

  // ========== SCROLL/RESIZE — UPDATE OVERLAYS ==========
  function updateOverlays() {
    if (selectedEl && selectedEl.isConnected) {
      positionOverlay(selectOverlay, selectedEl);
    }
    if (hoveredEl && hoveredEl.isConnected) {
      positionOverlay(hoverOverlay, hoveredEl);
    }
  }

  // ========== ATTACH LISTENERS ==========
  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('dblclick', onDblClick, true);
  document.addEventListener('touchstart', onTouchStart, { passive: false });
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchend', onTouchEnd, { passive: false });
  window.addEventListener('message', onMessage);
  window.addEventListener('scroll', updateOverlays, true);
  window.addEventListener('resize', updateOverlays);

  // ========== CLEANUP ==========
  function cleanup() {
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('mouseout', onMouseOut, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('dblclick', onDblClick, true);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('message', onMessage);
    window.removeEventListener('scroll', updateOverlays, true);
    window.removeEventListener('resize', updateOverlays);
    if (hoverOverlay.parentNode) hoverOverlay.parentNode.removeChild(hoverOverlay);
    if (selectOverlay.parentNode) selectOverlay.parentNode.removeChild(selectOverlay);
    window.__sitecraftBridge = false;
  }

  window.__sitecraftCleanup = cleanup;
})();
`;
}
