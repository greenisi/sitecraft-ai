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

  var isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var btnSize = isMobile ? '40px' : '28px';
  var btnPadding = isMobile ? '8px 10px' : '5px 8px';

  function createToolbarBtn(innerHTML, title, clickHandler) {
    var btn = document.createElement('button');
    btn.innerHTML = innerHTML;
    btn.title = title;
    Object.assign(btn.style, {
      background: 'transparent',
      border: 'none',
      color: '#cdd6f4',
      cursor: 'pointer',
      padding: btnPadding,
      borderRadius: isMobile ? '8px' : '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: '600',
      lineHeight: '1',
      minWidth: btnSize,
      height: btnSize,
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
  var checkIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var imageIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  var slidersIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>';

  // Toolbar mode: 'default' | 'text-editing' | 'image-selected'
  var toolbarMode = 'default';

  // ===== NAMED TOOLBAR ACTION HANDLERS =====
  function handleBold() {
    if (!selectedEl) return;
    var cs = window.getComputedStyle(selectedEl);
    var newVal = (parseInt(cs.fontWeight, 10) >= 700) ? '400' : '700';
    selectedEl.style.fontWeight = newVal;
    positionOverlay(selectOverlay, selectedEl);
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'style', property: 'fontWeight', value: newVal, cssPath: getCssPath(selectedEl) },
    }, '*');
  }

  function handleItalic() {
    if (!selectedEl) return;
    var cs = window.getComputedStyle(selectedEl);
    var newVal = cs.fontStyle === 'italic' ? 'normal' : 'italic';
    selectedEl.style.fontStyle = newVal;
    positionOverlay(selectOverlay, selectedEl);
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'style', property: 'fontStyle', value: newVal, cssPath: getCssPath(selectedEl) },
    }, '*');
  }

  function handleUnderline() {
    if (!selectedEl) return;
    var cs = window.getComputedStyle(selectedEl);
    var newVal = cs.textDecorationLine === 'underline' || cs.textDecoration.indexOf('underline') !== -1 ? 'none' : 'underline';
    selectedEl.style.textDecoration = newVal;
    positionOverlay(selectOverlay, selectedEl);
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'style', property: 'textDecoration', value: newVal, cssPath: getCssPath(selectedEl) },
    }, '*');
  }

  function handleDuplicate() {
    if (!selectedEl) return;
    var clone = selectedEl.cloneNode(true);
    selectedEl.parentNode.insertBefore(clone, selectedEl.nextSibling);
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'duplicate', cssPath: getCssPath(selectedEl) },
    }, '*');
  }

  function handleMoveUp() {
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
  }

  function handleMoveDown() {
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
  }

  function handleDelete() {
    if (!selectedEl) return;
    var cssPath = getCssPath(selectedEl);
    selectedEl.style.display = 'none';
    window.parent.postMessage({
      type: 'sitecraft:toolbar-action',
      data: { action: 'hide', cssPath: cssPath },
    }, '*');
    deselectElement();
  }

  function handleReplaceImage() {
    if (!selectedEl) return;
    window.parent.postMessage({
      type: 'sitecraft:request-image-picker',
      data: { cssPath: getCssPath(selectedEl), currentSrc: getImageSrc(selectedEl) },
    }, '*');
  }

  function handleOpenMoreStyles() {
    window.parent.postMessage({ type: 'sitecraft:open-styles-drawer' }, '*');
  }

  // ===== REBUILD TOOLBAR BASED ON MODE =====
  function rebuildToolbar(mode) {
    toolbarMode = mode;
    // Clear existing buttons
    while (toolbar.firstChild) toolbar.removeChild(toolbar.firstChild);

    if (mode === 'text-editing') {
      // Text editing: B/I/U + Done
      toolbar.appendChild(createToolbarBtn(boldIcon, 'Bold', handleBold));
      toolbar.appendChild(createToolbarBtn(italicIcon, 'Italic', handleItalic));
      toolbar.appendChild(createToolbarBtn(underlineIcon, 'Underline', handleUnderline));
      toolbar.appendChild(createSeparator());
      toolbar.appendChild(createToolbarBtn(checkIcon, 'Done', function() {
        if (selectedEl) selectedEl.blur();
      }));
    } else if (mode === 'image-selected') {
      // Image: Replace + More Styles + Delete
      var replaceBtn = createToolbarBtn(imageIcon, 'Replace Image', handleReplaceImage);
      replaceBtn.style.color = '#a78bfa';
      toolbar.appendChild(replaceBtn);
      toolbar.appendChild(createSeparator());
      toolbar.appendChild(createToolbarBtn(slidersIcon, 'More Styles', handleOpenMoreStyles));
      toolbar.appendChild(createToolbarBtn(deleteIcon, 'Hide', handleDelete));
    } else {
      // Default: B/I/U | Dup, Move, Delete + More Styles on mobile
      toolbar.appendChild(createToolbarBtn(boldIcon, 'Bold', handleBold));
      toolbar.appendChild(createToolbarBtn(italicIcon, 'Italic', handleItalic));
      toolbar.appendChild(createToolbarBtn(underlineIcon, 'Underline', handleUnderline));
      toolbar.appendChild(createSeparator());
      if (!isMobile) {
        toolbar.appendChild(createToolbarBtn(duplicateIcon, 'Duplicate', handleDuplicate));
        toolbar.appendChild(createToolbarBtn(moveUpIcon, 'Move Up', handleMoveUp));
        toolbar.appendChild(createToolbarBtn(moveDownIcon, 'Move Down', handleMoveDown));
      }
      toolbar.appendChild(createToolbarBtn(deleteIcon, 'Delete', handleDelete));
      if (isMobile) {
        toolbar.appendChild(createSeparator());
        toolbar.appendChild(createToolbarBtn(slidersIcon, 'More Styles', handleOpenMoreStyles));
      }
    }
  }

  // Initial toolbar build
  rebuildToolbar('default');

  document.body.appendChild(toolbar);

  function positionToolbar() {
    if (!selectedEl) {
      toolbar.style.display = 'none';
      return;
    }

    // During text editing on mobile, pin toolbar to top of viewport
    if (isMobile && toolbarMode === 'text-editing') {
      toolbar.style.display = 'flex';
      var vvTop = 0;
      if (window.visualViewport) {
        vvTop = window.visualViewport.offsetTop;
      }
      Object.assign(toolbar.style, {
        position: 'fixed',
        top: (vvTop + 8) + 'px',
        left: '50%',
        transform: 'translateX(-50%)',
      });
      return;
    }

    // Reset transform if previously in text-editing mode
    toolbar.style.transform = '';

    var rect = selectedEl.getBoundingClientRect();
    toolbar.style.display = 'flex';
    var toolbarHeight = toolbar.offsetHeight || (isMobile ? 48 : 36);
    var toolbarWidth = toolbar.offsetWidth || 300;

    // On mobile, reserve space for the bottom bar (48px)
    var bottomReserve = isMobile ? 56 : 0;
    var maxBottom = window.innerHeight - bottomReserve;

    // Prefer above element
    var topPos = rect.top - toolbarHeight - 8;
    if (topPos < 4) {
      // Fall back to below element
      topPos = rect.bottom + 8;
    }
    // Don't let toolbar go behind bottom bar on mobile
    if (topPos + toolbarHeight > maxBottom) {
      topPos = rect.top - toolbarHeight - 8;
      if (topPos < 4) topPos = 4;
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

  // ========== BREADCRUMB BAR (hidden on mobile — the parent sheet handles it) ==========
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
  if (!isMobile) {
    document.body.appendChild(breadcrumb);
  }

  function updateBreadcrumb() {
    if (isMobile) return; // Skip on mobile — bottom bar handles element info
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

    // Section management options
    var parentSection = findParentSection(targetEl);
    if (parentSection || isSection(targetEl)) {
      contextMenu.appendChild(createContextMenuSeparator());
      var theSection = isSection(targetEl) ? targetEl : parentSection;

      // Move Section Up
      var moveUpSectionIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
      contextMenu.appendChild(createContextMenuItem('Move Section Up', moveUpSectionIcon, function() {
        if (!theSection) return;
        var prev = theSection.previousElementSibling;
        if (prev && !shouldIgnore(prev)) {
          theSection.parentNode.insertBefore(theSection, prev);
          positionOverlay(selectOverlay, selectedEl || theSection);
          positionToolbar();
          window.parent.postMessage({
            type: 'sitecraft:toolbar-action',
            data: { action: 'moveUp', cssPath: getCssPath(theSection) },
          }, '*');
        }
      }));

      // Move Section Down
      var moveDownSectionIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
      contextMenu.appendChild(createContextMenuItem('Move Section Down', moveDownSectionIcon, function() {
        if (!theSection) return;
        var next = theSection.nextElementSibling;
        if (next && !shouldIgnore(next)) {
          theSection.parentNode.insertBefore(next, theSection);
          positionOverlay(selectOverlay, selectedEl || theSection);
          positionToolbar();
          window.parent.postMessage({
            type: 'sitecraft:toolbar-action',
            data: { action: 'moveDown', cssPath: getCssPath(theSection) },
          }, '*');
        }
      }));

      // Duplicate Section
      var dupSectionIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      contextMenu.appendChild(createContextMenuItem('Duplicate Section', dupSectionIcon, function() {
        if (!theSection) return;
        var clone = theSection.cloneNode(true);
        theSection.parentNode.insertBefore(clone, theSection.nextSibling);
        window.parent.postMessage({
          type: 'sitecraft:toolbar-action',
          data: { action: 'duplicate', cssPath: getCssPath(theSection) },
        }, '*');
      }));

      // Hide Section
      var hideSectionIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
      contextMenu.appendChild(createContextMenuItem('Hide Section', hideSectionIcon, function() {
        if (!theSection) return;
        var cssPath = getCssPath(theSection);
        theSection.style.display = 'none';
        window.parent.postMessage({
          type: 'sitecraft:toolbar-action',
          data: { action: 'hide', cssPath: cssPath },
        }, '*');
        deselectElement();
      }));
    }

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

  // ========== CHECK IF IMAGE ==========
  function isImageElement(el) {
    var tag = el.tagName.toLowerCase();
    if (tag === 'img') return true;
    // Background image containers
    var cs = window.getComputedStyle(el);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
    return false;
  }

  function getImageSrc(el) {
    var tag = el.tagName.toLowerCase();
    if (tag === 'img') return el.src || el.getAttribute('src') || '';
    var cs = window.getComputedStyle(el);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      var match = cs.backgroundImage.match(/url\\(["\\'"]?([^"\\'"\\)]+)["\\'"]?\\)/);
      return match ? match[1] : '';
    }
    return '';
  }

  // ========== SELECT/DESELECT HELPERS ==========
  function selectElement(el) {
    if (!el || shouldIgnore(el)) return;
    selectedEl = el;
    hoverOverlay.style.display = 'none';
    hideContextMenu();
    var rect = positionOverlay(selectOverlay, el);
    selectLabel.textContent = '<' + el.tagName.toLowerCase() + '>';

    // Set contextual toolbar mode on mobile
    if (isMobile && isImageElement(el)) {
      rebuildToolbar('image-selected');
    } else if (toolbarMode !== 'default') {
      rebuildToolbar('default');
    }

    positionToolbar();
    updateBreadcrumb();

    var styles = getElementStyles(el);
    var textContent = el.textContent ? el.textContent.substring(0, 200) : '';

    var isImage = isImageElement(el);

    window.parent.postMessage({
      type: 'sitecraft:element-selected',
      data: {
        tagName: el.tagName.toLowerCase(),
        textContent: textContent,
        isTextEditable: isTextEditable(el),
        isImage: isImage,
        imageSrc: isImage ? getImageSrc(el) : undefined,
        cssPath: getCssPath(el),
        className: el.className || '',
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        styles: styles,
        href: el.getAttribute ? el.getAttribute('href') || undefined : undefined,
        target: el.getAttribute ? el.getAttribute('target') || undefined : undefined,
        title: el.getAttribute ? el.getAttribute('title') || undefined : undefined,
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

  // DOUBLE-CLICK / INLINE EDIT
  function onDblClick(e) {
    // On mobile, inline editing is triggered by onTouchEnd — skip native dblclick
    if (isMobile && e.type === 'dblclick') return;

    const el = e.target;
    if (shouldIgnore(el)) return;
    if (!isTextEditable(el)) return;

    if (e.preventDefault) e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    selectedEl = el;
    isInlineEditing = true;

    // On mobile: switch toolbar to text-editing mode (B/I/U + Done)
    // On desktop: hide toolbar during editing (current behavior)
    if (isMobile) {
      rebuildToolbar('text-editing');
      positionToolbar();
      // Fade out selection overlay — the inline outline replaces it
      selectOverlay.style.transition = 'opacity 0.2s';
      selectOverlay.style.opacity = '0';
      setTimeout(function() {
        selectOverlay.style.display = 'none';
        selectOverlay.style.opacity = '1';
        selectOverlay.style.transition = '';
      }, 200);
    } else {
      toolbar.style.display = 'none';
    }

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

      // Restore toolbar to default mode and re-show
      if (isMobile) {
        rebuildToolbar('default');
      }
      if (selectedEl) {
        positionOverlay(selectOverlay, selectedEl);
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

  // TOUCH — MOBILE SUPPORT (enhanced)
  var touchStartPos = { x: 0, y: 0 };
  var touchMoved = false;

  function showTapFeedback(x, y) {
    var feedback = document.createElement('div');
    feedback.id = '__sc-tap-feedback';
    Object.assign(feedback.style, {
      position: 'fixed',
      left: (x - 20) + 'px',
      top: (y - 20) + 'px',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(139, 92, 246, 0.3)',
      pointerEvents: 'none',
      zIndex: '99997',
      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
      transform: 'scale(0.5)',
      opacity: '1',
    });
    document.body.appendChild(feedback);
    requestAnimationFrame(function() {
      feedback.style.transform = 'scale(1.5)';
      feedback.style.opacity = '0';
    });
    setTimeout(function() {
      if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
    }, 300);
  }

  function onTouchStart(e) {
    var touch = e.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    touchMoved = false;

    // Long-press (500ms) opens context menu on mobile
    longPressTimer = setTimeout(function() {
      longPressTimer = null;
      if (touchMoved) return;
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el && !shouldIgnore(el)) {
        showTapFeedback(touch.clientX, touch.clientY);
        if (el !== selectedEl) selectElement(el);
        showContextMenu(touch.clientX, touch.clientY, el);
      }
    }, 500);
  }

  function onTouchMove(e) {
    if (longPressTimer) {
      var touch = e.touches[0];
      var dx = Math.abs(touch.clientX - touchStartPos.x);
      var dy = Math.abs(touch.clientY - touchStartPos.y);
      if (dx > 10 || dy > 10) {
        touchMoved = true;
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
  }

  function onTouchEnd(e) {
    if (isInlineEditing) return;
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    // Don't select if user was scrolling
    if (touchMoved) return;

    var touch = e.changedTouches[0];
    var el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el || shouldIgnore(el)) return;

    e.preventDefault();
    showTapFeedback(touch.clientX, touch.clientY);

    // If tapping the already-selected text element, immediately enter inline edit
    if (el === selectedEl && isTextEditable(el)) {
      onDblClick({ target: el, preventDefault: function(){}, stopImmediatePropagation: function(){} });
      return;
    }

    // Select the element
    selectElement(el);

    // On mobile, immediately enter inline edit for text-editable elements
    if (isTextEditable(el)) {
      onDblClick({ target: el, preventDefault: function(){}, stopImmediatePropagation: function(){} });
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
          positionOverlay(selectOverlay, selectedEl);
          positionToolbar();
          window.parent.postMessage({ type: 'sitecraft:styles-updated' }, '*');
        }
        break;
      }
      case 'sitecraft:apply-attribute': {
        if (selectedEl && msg.attribute && msg.value !== undefined) {
          selectedEl.setAttribute(msg.attribute, msg.value);
        }
        break;
      }
      case 'sitecraft:trigger-inline-edit': {
        if (selectedEl && isTextEditable(selectedEl)) {
          onDblClick({ target: selectedEl, preventDefault: function(){}, stopImmediatePropagation: function(){} });
        }
        break;
      }
      case 'sitecraft:get-sections': {
        // Collect all top-level sections and send to parent
        var mainEl = document.querySelector('main') || document.body;
        var allSections = [];
        var children = mainEl.children;
        for (var si = 0; si < children.length; si++) {
          var child = children[si];
          if (shouldIgnore(child)) continue;
          var tag = child.tagName.toLowerCase();
          // Get the first heading text for section name
          var headingEl = child.querySelector('h1, h2, h3');
          var sectionName = headingEl ? headingEl.textContent.trim().substring(0, 50) : (tag + ' section');
          allSections.push({
            index: si,
            tag: tag,
            name: sectionName,
            cssPath: getCssPath(child),
            visible: child.style.display !== 'none',
          });
        }
        window.parent.postMessage({
          type: 'sitecraft:sections-list',
          data: allSections,
        }, '*');
        break;
      }
      case 'sitecraft:select-section': {
        // Select a section by cssPath
        if (msg.cssPath) {
          try {
            var sectionEl = document.querySelector(msg.cssPath);
            if (sectionEl) {
              selectElement(sectionEl);
              sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } catch(e) {}
        }
        break;
      }
      case 'sitecraft:toggle-section-visibility': {
        if (msg.cssPath) {
          try {
            var toggleEl = document.querySelector(msg.cssPath);
            if (toggleEl) {
              var isHidden = toggleEl.style.display === 'none';
              toggleEl.style.display = isHidden ? '' : 'none';
              window.parent.postMessage({
                type: 'sitecraft:toolbar-action',
                data: {
                  action: isHidden ? 'show' : 'hide',
                  cssPath: msg.cssPath,
                  property: 'display',
                  value: isHidden ? '' : 'none',
                },
              }, '*');
            }
          } catch(e) {}
        }
        break;
      }
      case 'sitecraft:duplicate-section': {
        if (msg.cssPath) {
          try {
            var dupEl = document.querySelector(msg.cssPath);
            if (dupEl) {
              var clone = dupEl.cloneNode(true);
              dupEl.parentNode.insertBefore(clone, dupEl.nextSibling);
              window.parent.postMessage({
                type: 'sitecraft:toolbar-action',
                data: { action: 'duplicate', cssPath: msg.cssPath },
              }, '*');
            }
          } catch(e) {}
        }
        break;
      }
      case 'sitecraft:reorder-section': {
        if (msg.cssPath && msg.direction) {
          try {
            var reorderEl = document.querySelector(msg.cssPath);
            if (reorderEl) {
              if (msg.direction === 'up' && reorderEl.previousElementSibling) {
                reorderEl.parentNode.insertBefore(reorderEl, reorderEl.previousElementSibling);
              } else if (msg.direction === 'down' && reorderEl.nextElementSibling) {
                reorderEl.parentNode.insertBefore(reorderEl.nextElementSibling, reorderEl);
              }
              window.parent.postMessage({
                type: 'sitecraft:toolbar-action',
                data: { action: msg.direction === 'up' ? 'moveUp' : 'moveDown', cssPath: msg.cssPath },
              }, '*');
            }
          } catch(e) {}
        }
        break;
      }
      case 'sitecraft:image-picker-result': {
        // Result from parent image picker overlay
        if (selectedEl && msg.src) {
          var ipTag = selectedEl.tagName.toLowerCase();
          if (ipTag === 'img') {
            selectedEl.src = msg.src;
            selectedEl.setAttribute('src', msg.src);
          } else {
            selectedEl.style.backgroundImage = 'url(' + msg.src + ')';
          }
          positionOverlay(selectOverlay, selectedEl);
          window.parent.postMessage({
            type: 'sitecraft:toolbar-action',
            data: { action: 'replace-image', cssPath: getCssPath(selectedEl), src: msg.src },
          }, '*');
        }
        break;
      }
      case 'sitecraft:replace-image': {
        if (selectedEl && msg.src) {
          var elTag = selectedEl.tagName.toLowerCase();
          if (elTag === 'img') {
            selectedEl.src = msg.src;
            selectedEl.setAttribute('src', msg.src);
          } else {
            // Background image
            selectedEl.style.backgroundImage = 'url(' + msg.src + ')';
          }
          positionOverlay(selectOverlay, selectedEl);
          window.parent.postMessage({
            type: 'sitecraft:toolbar-action',
            data: { action: 'replace-image', cssPath: getCssPath(selectedEl), src: msg.src },
          }, '*');
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

  // ========== ANNOUNCE READY ==========
  window.parent.postMessage({ type: 'sitecraft:bridge-ready' }, '*');

  // ========== VISUAL VIEWPORT (keyboard-aware toolbar on mobile) ==========
  function onVisualViewportResize() {
    if (isInlineEditing && toolbarMode === 'text-editing') {
      positionToolbar();
    }
  }
  if (isMobile && window.visualViewport) {
    window.visualViewport.addEventListener('resize', onVisualViewportResize);
    window.visualViewport.addEventListener('scroll', onVisualViewportResize);
  }

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
    if (isMobile && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', onVisualViewportResize);
      window.visualViewport.removeEventListener('scroll', onVisualViewportResize);
    }
    if (hoverOverlay.parentNode) hoverOverlay.parentNode.removeChild(hoverOverlay);
    if (selectOverlay.parentNode) selectOverlay.parentNode.removeChild(selectOverlay);
    if (toolbar.parentNode) toolbar.parentNode.removeChild(toolbar);
    if (breadcrumb.parentNode) breadcrumb.parentNode.removeChild(breadcrumb);
    if (contextMenu.parentNode) contextMenu.parentNode.removeChild(contextMenu);
    // Clean up any leftover tap feedback
    var feedbacks = document.querySelectorAll('#__sc-tap-feedback');
    feedbacks.forEach(function(f) { if (f.parentNode) f.parentNode.removeChild(f); });
    window.__sitecraftBridge = false;
  }

  window.__sitecraftCleanup = cleanup;
})();
`;
}
