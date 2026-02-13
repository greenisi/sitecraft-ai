/**
 * Returns a self-contained JavaScript string that gets injected into the preview iframe.
 * Handles: hover overlay, click selection, double-click inline editing,
 * floating toolbar, breadcrumb bar, right-click context menu, section awareness,
 * touch support, and receiving style/text changes from the parent frame.
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

  // ========== FLOATING TOOLBAR ==========
  const toolbar = document.createElement('div');
  toolbar.id = '__sc-toolbar';
  Object.assign(toolbar.style, {
    position: 'fixed',
    zIndex: '100000',
    display: 'none',
    background: '#1e1e2e',
    border: '1px solid #3b3b4f',
    borderRadius: '8px',
    padding: '4px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '2px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  });

  function createToolbarBtn(innerHTML, title, clickHandler) {
    var btn = document.createElement('button');
    btn.innerHTML = innerHTML;
    btn.title = title;
    Object.assign(btn.style, {
      background: 'transparent',
      border: 'none',
      color: '#cdd6f4',
      cursor: 'pointer',
      padding: '5px 8px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: '600',
      lineHeight: '1',
      minWidth: '28px',
      height: '28px',
    });
    btn.addEventListener('mouseenter', function() {
      btn.style.background = '#313244';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.background = 'transparent';
    });
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      clickHandler();
    });
    return btn;
  }

  function createSeparator() {
    var sep = document.createElement('div');
    Object.assign(sep.style, {
      width: '1px',
      height: '20px',
      background: '#45475a',
      margin: '0 2px',
    });
    return sep;
  }

  // SVG icons
  var boldIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>';
  var italicIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>';
  var underlineIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>';
  var duplicateIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var moveUpIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
  var moveDownIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var deleteIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';

  // Bold
  toolbar.appendChild(createToolbarBtn(boldIcon, 'Bold', function() {
    if (!selectedEl) return;
    var cs = window.getComputedStyle(selectedEl);
    var newVal = (parseInt(cs.fontWeight, 10) >= 700) ? '400' : '700';
    selectedEl.style.fontWeight = newVal;
    positionOverlay(selectOverlay, selectedEl);
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'style', property: 'fontWeight', value: newVal, cssPath: getCssPath(selectedEl) },
    }, '*');
  }));

  // Italic
  toolbar.appendChild(createToolbarBtn(italicIcon, 'Italic', function() {
    if (!selectedEl) return;
    var cs = window.getComputedStyle(selectedEl);
    var newVal = cs.fontStyle === 'italic' ? 'normal' : 'italic';
    selectedEl.style.fontStyle = newVal;
    positionOverlay(selectOverlay, selectedEl);
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'style', property: 'fontStyle', value: newVal, cssPath: getCssPath(selectedEl) },
    }, '*');
  }));

  // Underline
  toolbar.appendChild(createToolbarBtn(underlineIcon, 'Underline', function() {
    if (!selectedEl) return;
    var cs = window.getComputedStyle(selectedEl);
    var newVal = cs.textDecorationLine === 'underline' || cs.textDecoration.indexOf('underline') !== -1 ? 'none' : 'underline';
    selectedEl.style.textDecoration = newVal;
    positionOverlay(selectOverlay, selectedEl);
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'style', property: 'textDecoration', value: newVal, cssPath: getCssPath(selectedEl) },
    }, '*');
  }));

  // Separator
  toolbar.appendChild(createSeparator());

  // Duplicate
  toolbar.appendChild(createToolbarBtn(duplicateIcon, 'Duplicate', function() {
    if (!selectedEl) return;
    var clone = selectedEl.cloneNode(true);
    selectedEl.parentNode.insertBefore(clone, selectedEl.nextSibling);
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'duplicate', cssPath: getCssPath(selectedEl) },
    }, '*');
  }));

  // Move Up
  toolbar.appendChild(createToolbarBtn(moveUpIcon, 'Move Up', function() {
    if (!selectedEl) return;
    var prev = selectedEl.previousElementSibling;
    if (prev) {
      selectedEl.parentNode.insertBefore(selectedEl, prev);
      positionOverlay(selectOverlay, selectedEl);
      positionToolbar();
      updateBreadcrumb();
      window.parent.postMessage({
        type: 'sitecraft:toolbar-action',
        data: { action: 'moveUp', cssPath: getCssPath(selectedEl) },
      }, '*');
    }
  }));

  // Move Down
  toolbar.appendChild(createToolbarBtn(moveDownIcon, 'Move Down', function() {
    if (!selectedEl) return;
    var next = selectedEl.nextElementSibling;
    if (next) {
      selectedEl.parentNode.insertBefore(next, selectedEl);
      positionOverlay(selectOverlay, selectedEl);
      positionToolbar();
      updateBreadcrumb();
      window.parent.postMessage({
        type: 'sitecraft:toolbar-action',
        data: { action: 'moveDown', cssPath: getCssPath(selectedEl) },
      }, '*');
    }
  }));

  // Delete (hide)
  toolbar.appendChild(createToolbarBtn(deleteIcon, 'Delete', function() {
    if (!selectedEl) return;
    var cssPath = getCssPath(selectedEl);
    selectedEl.style.display = 'none';
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'hide', cssPath: cssPath },
    }, '*');
    deselectElement();
  }));

  document.body.appendChild(toolbar);

  function positionToolbar() {
    if (!selectedEl) {
      toolbar.style.display = 'none';
      return;
    }
    var rect = selectedEl.getBoundingClientRect();
    toolbar.style.display = 'flex';
    var toolbarHeight = toolbar.offsetHeight || 36;
    var toolbarWidth = toolbar.offsetWidth || 300;

    // Prefer above element
    var topPos = rect.top - toolbarHeight - 8;
    if (topPos < 4) {
      // Fall back to below element
      topPos = rect.bottom + 8;
    }

    var leftPos = rect.left + (rect.width / 2) - (toolbarWidth / 2);
    if (leftPos < 4) leftPos = 4;
    if (leftPos + toolbarWidth > window.innerWidth - 4) {
      leftPos = window.innerWidth - toolbarWidth - 4;
    }

    Object.assign(toolbar.style, {
      top: topPos + 'px',
      left: leftPos + 'px',
    });
  }

  // ========== BREADCRUMB BAR ==========
  var breadcrumb = document.createElement('div');
  breadcrumb.id = '__sc-breadcrumb';
  Object.assign(breadcrumb.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: '100000',
    display: 'none',
    background: '#1e1e2e',
    borderTop: '1px solid #3b3b4f',
    padding: '6px 12px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: '12px',
    color: '#a6adc8',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
  });
  document.body.appendChild(breadcrumb);

  function updateBreadcrumb() {
    if (!selectedEl) {
      breadcrumb.style.display = 'none';
      return;
    }
    breadcrumb.innerHTML = '';
    breadcrumb.style.display = 'block';

    var chain = [];
    var cur = selectedEl;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      chain.unshift(cur);
      cur = cur.parentElement;
    }

    for (var i = 0; i < chain.length; i++) {
      (function(idx) {
        var el = chain[idx];
        var tag = el.tagName.toLowerCase();
        var cls = el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\\s+/).filter(function(c) { return c && !c.startsWith('__sc-'); }).slice(0, 2).join('.')
          : '';
        var crumbText = tag + cls;

        var crumb = document.createElement('span');
        crumb.textContent = crumbText;
        var isActive = el === selectedEl;
        Object.assign(crumb.style, {
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: '3px',
          background: isActive ? 'rgba(139, 92, 246, 0.8)' : 'transparent',
          color: isActive ? '#fff' : '#a6adc8',
          transition: 'background 0.15s',
        });
        crumb.addEventListener('mouseenter', function() {
          if (!isActive) crumb.style.background = '#313244';
        });
        crumb.addEventListener('mouseleave', function() {
          if (!isActive) crumb.style.background = 'transparent';
        });
        crumb.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          selectElement(el);
        });
        breadcrumb.appendChild(crumb);

        // Add separator
        if (idx < chain.length - 1) {
          var sep = document.createElement('span');
          sep.textContent = ' > ';
          sep.style.color = '#585b70';
          sep.style.margin = '0 2px';
          breadcrumb.appendChild(sep);
        }
      })(i);
    }
  }

  // ========== CONTEXT MENU ==========
  var contextMenu = document.createElement('div');
  contextMenu.id = '__sc-context-menu';
  Object.assign(contextMenu.style, {
    position: 'fixed',
    zIndex: '100001',
    display: 'none',
    background: '#1e1e2e',
    border: '1px solid #3b3b4f',
    borderRadius: '8px',
    padding: '4px 0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    color: '#cdd6f4',
    minWidth: '180px',
  });
  document.body.appendChild(contextMenu);

  function createContextMenuItem(label, iconSvg, handler) {
    var item = document.createElement('div');
    item.innerHTML = (iconSvg ? '<span style="display:inline-flex;align-items:center;margin-right:8px;vertical-align:middle;opacity:0.7">' + iconSvg + '</span>' : '') + label;
    Object.assign(item.style, {
      padding: '7px 14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
    });
    item.addEventListener('mouseenter', function() {
      item.style.background = '#313244';
    });
    item.addEventListener('mouseleave', function() {
      item.style.background = 'transparent';
    });
    item.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      hideContextMenu();
      handler();
    });
    return item;
  }

  function createContextMenuSeparator() {
    var sep = document.createElement('div');
    Object.assign(sep.style, {
      height: '1px',
      background: '#3b3b4f',
      margin: '4px 0',
    });
    return sep;
  }

  function showContextMenu(x, y, targetEl) {
    contextMenu.innerHTML = '';

    // Edit Text
    if (isTextEditable(targetEl)) {
      var editIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      contextMenu.appendChild(createContextMenuItem('Edit Text', editIcon, function() {
        onDblClick({ target: targetEl, preventDefault: function(){}, stopImmediatePropagation: function(){} });
      }));
    }

    // Duplicate
    var dupIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    contextMenu.appendChild(createContextMenuItem('Duplicate', dupIcon, function() {
      if (!targetEl) return;
      var clone = targetEl.cloneNode(true);
      targetEl.parentNode.insertBefore(clone, targetEl.nextSibling);
      window.parent.postMessage({
        type: 'sitecraft:toolbar-action',
        data: { action: 'duplicate', cssPath: getCssPath(targetEl) },
      }, '*');
    }));

    // Hide Element
    var hideIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    contextMenu.appendChild(createContextMenuItem('Hide Element', hideIcon, function() {
      if (!targetEl) return;
      var cssPath = getCssPath(targetEl);
      targetEl.style.display = 'none';
      window.parent.postMessage({
        type: 'sitecraft:toolbar-action',
        data: { action: 'hide', cssPath: cssPath },
      }, '*');
      deselectElement();
    }));

    // Separator
    contextMenu.appendChild(createContextMenuSeparator());

    // Select Parent
    var parentIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/><line x1="12" y1="9" x2="12" y2="21"/></svg>';
    contextMenu.appendChild(createContextMenuItem('Select Parent', parentIcon, function() {
      if (targetEl && targetEl.parentElement && !shouldIgnore(targetEl.parentElement)) {
        selectElement(targetEl.parentElement);
      }
    }));

    // Select Section
    var sectionIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>';
    contextMenu.appendChild(createContextMenuItem('Select Section', sectionIcon, function() {
      var section = findParentSection(targetEl);
      if (section) {
        selectElement(section);
      }
    }));

    // Position context menu
    contextMenu.style.display = 'block';
    var menuWidth = contextMenu.offsetWidth;
    var menuHeight = contextMenu.offsetHeight;
    var posX = x;
    var posY = y;
    if (posX + menuWidth > window.innerWidth - 4) {
      posX = window.innerWidth - menuWidth - 4;
    }
    if (posX < 4) posX = 4;
    if (posY + menuHeight > window.innerHeight - 4) {
      posY = window.innerHeight - menuHeight - 4;
    }
    if (posY < 4) posY = 4;
    Object.assign(contextMenu.style, {
      left: posX + 'px',
      top: posY + 'px',
    });
  }

  function hideContextMenu() {
    contextMenu.style.display = 'none';
  }

  // ========== STATE ==========
  let selectedEl = null;
  let hoveredEl = null;
  let isInlineEditing = false;
  let longPressTimer = null;

  // Elements to ignore — overlay IDs that the bridge itself creates
  const OVERLAY_IDS = ['__sc-hover-overlay', '__sc-select-overlay', '__sc-toolbar', '__sc-breadcrumb', '__sc-context-menu'];
  function shouldIgnore(el) {
    if (!el || el === document.body || el === document.documentElement) return true;
    if (OVERLAY_IDS.includes(el.id)) return true;
    if (el.id && el.id.startsWith('__sc-')) return true;
    // Walk up to see if we are inside an overlay element (NOT #root — that's the app container!)
    var parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (OVERLAY_IDS.includes(parent.id)) return true;
      if (parent.id && parent.id.startsWith('__sc-')) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  // ========== SECTION AWARENESS ==========
  var sectionTags = ['section', 'header', 'footer', 'nav', 'main', 'article'];

  function isSection(el) {
    if (!el) return false;
    var tag = el.tagName.toLowerCase();
    if (sectionTags.indexOf(tag) !== -1) return true;
    // div that is a direct child of <main>
    if (tag === 'div' && el.parentElement && el.parentElement.tagName.toLowerCase() === 'main') return true;
    return false;
  }

  function findParentSection(el) {
    var cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (isSection(cur)) return cur;
      cur = cur.parentElement;
    }
    return null;
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
      fontStyle: cs.fontStyle,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      textAlign: cs.textAlign,
      textDecoration: cs.textDecoration,
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
      borderStyle: cs.borderStyle,
      opacity: cs.opacity,
      boxShadow: cs.boxShadow,
      display: cs.display,
      overflow: cs.overflow,
      cursor: cs.cursor,
      width: cs.width,
      height: cs.height,
      maxWidth: cs.maxWidth,
      minHeight: cs.minHeight,
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

  // ========== SELECT/DESELECT HELPERS ==========
  function selectElement(el) {
    if (!el || shouldIgnore(el)) return;
    selectedEl = el;
    hoverOverlay.style.display = 'none';
    hideContextMenu();
    var rect = positionOverlay(selectOverlay, el);
    selectLabel.textContent = '<' + el.tagName.toLowerCase() + '>';
    positionToolbar();
    updateBreadcrumb();

    var styles = getElementStyles(el);
    var textContent = el.textContent ? el.textContent.substring(0, 200) : '';

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

  function deselectElement() {
    selectedEl = null;
    selectOverlay.style.display = 'none';
    hoverOverlay.style.display = 'none';
    toolbar.style.display = 'none';
    breadcrumb.style.display = 'none';
    hideContextMenu();
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
    // Bug fix: if inline editing, blur the editing element before returning
    if (isInlineEditing) {
      if (selectedEl && selectedEl.contentEditable === 'true') {
        selectedEl.blur();
      }
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();

    hideContextMenu();

    const el = e.target;
    if (shouldIgnore(el)) return;

    // Shift+Click: select parent section
    if (e.shiftKey) {
      var section = findParentSection(el);
      if (section) {
        selectElement(section);
        return;
      }
    }

    selectElement(el);
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

    // Hide toolbar while editing
    toolbar.style.display = 'none';

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

      // Re-show toolbar
      if (selectedEl) {
        positionToolbar();
      }

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

  // RIGHT-CLICK — CONTEXT MENU
  function onContextMenu(e) {
    if (isInlineEditing) return;
    var el = e.target;
    if (shouldIgnore(el)) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    // If right-clicking an unselected element, select it first
    if (el !== selectedEl) {
      selectElement(el);
    }

    showContextMenu(e.clientX, e.clientY, el);
  }

  // Clicking anywhere hides context menu
  function onDocumentClick(e) {
    if (contextMenu.style.display !== 'none') {
      // Only hide if the click is not inside the context menu
      if (!contextMenu.contains(e.target)) {
        hideContextMenu();
      }
    }
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
    selectElement(el);
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
          positionToolbar();
          window.parent.postMessage({ type: 'sitecraft:styles-updated' }, '*');
        }
        break;
      }
      case 'sitecraft:deselect': {
        deselectElement();
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
      positionToolbar();
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
  document.addEventListener('contextmenu', onContextMenu, true);
  document.addEventListener('click', onDocumentClick, false);
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
    document.removeEventListener('contextmenu', onContextMenu, true);
    document.removeEventListener('click', onDocumentClick, false);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('message', onMessage);
    window.removeEventListener('scroll', updateOverlays, true);
    window.removeEventListener('resize', updateOverlays);
    if (hoverOverlay.parentNode) hoverOverlay.parentNode.removeChild(hoverOverlay);
    if (selectOverlay.parentNode) selectOverlay.parentNode.removeChild(selectOverlay);
    if (toolbar.parentNode) toolbar.parentNode.removeChild(toolbar);
    if (breadcrumb.parentNode) breadcrumb.parentNode.removeChild(breadcrumb);
    if (contextMenu.parentNode) contextMenu.parentNode.removeChild(contextMenu);
    window.__sitecraftBridge = false;
  }

  window.__sitecraftCleanup = cleanup;
})();
`;
}
