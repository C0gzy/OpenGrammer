// TipTap/ProseMirror integration for OpenGrammer
// Requires @tiptap/pm to be installed as a peer dependency

import { checkAndFormat } from './index.js';

/**
 * Setup grammar checking for a TipTap editor
 * 
 * Requires @tiptap/pm to be installed: npm install @tiptap/pm
 * 
 * @param {Editor} editor - TipTap editor instance
 * @param {Object} options - Configuration options
 * @param {Object} options.decorations - Optional: Decoration and DecorationSet from @tiptap/pm/view
 * @returns {Object} Object with check, destroy methods
 */
export function setupTipTap(editor, options = {}) {
  if (!editor || !editor.view) {
    console.warn('setupTipTap requires a valid TipTap editor instance');
    return;
  }

  // Get Decoration and DecorationSet
  // User can pass them in options, or we try to import
  let Decoration, DecorationSet;
  
  if (options.decorations) {
    Decoration = options.decorations.Decoration;
    DecorationSet = options.decorations.DecorationSet;
  } else {
    // Try to import - will fail if @tiptap/pm not installed
    // User should import and pass: import { Decoration, DecorationSet } from '@tiptap/pm/view'
    try {
      // This is a dynamic import that will work if the module is available
      // We'll handle this at runtime
      console.warn('TipTap integration: Please import Decoration and DecorationSet from @tiptap/pm/view');
      console.warn('Example: import { Decoration, DecorationSet } from "@tiptap/pm/view"');
      console.warn('Then pass them: setupTipTap(editor, { decorations: { Decoration, DecorationSet } })');
      return {
        check: () => console.warn('TipTap integration not initialized - missing Decoration/DecorationSet'),
        destroy: () => {},
        getErrors: () => [],
        getDecorations: () => null
      };
    } catch (e) {
      console.error('Failed to initialize TipTap integration:', e);
      return;
    }
  }

  if (!Decoration || !DecorationSet) {
    console.warn('Decoration and DecorationSet are required for TipTap integration');
    return;
  }

  const {
    debounceMs = 1000,
    autoCheckOnLoad = true,
    autoCheckOnBlur = true,
    debug = false,
    decorationClass = 'grammar-error-decoration',
    decorationStyle = 'background-color: rgba(59, 130, 246, 0.2); border-bottom: 2px wavy rgba(59, 130, 246, 0.6); cursor: help;',
    tooltipStyle = {},
    tooltipMessageStyle = {},
    tooltipSuggestionsStyle = {},
    tooltipLabelStyle = {},
    tooltipListStyle = {},
    tooltipItemStyle = {},
    decorations: _decorations // Remove from options
  } = options;
  
  // Helper to convert style object to CSS string
  function styleObjectToString(styleObj) {
    if (typeof styleObj === 'string') {
      return styleObj;
    }
    if (typeof styleObj === 'object' && styleObj !== null) {
      return Object.entries(styleObj)
        .map(([key, value]) => {
          const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `${kebabKey}: ${value}`;
        })
        .join('; ');
    }
    return '';
  }
  
  // Default tooltip styles
  const defaultTooltipStyle = {
    position: 'fixed',
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    zIndex: '10000',
    maxWidth: '300px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    pointerEvents: 'none',
    ...tooltipStyle
  };
  
  const defaultMessageStyle = {
    fontWeight: '500',
    marginBottom: '8px',
    ...tooltipMessageStyle
  };
  
  const defaultSuggestionsStyle = {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
    ...tooltipSuggestionsStyle
  };
  
  const defaultLabelStyle = {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    ...tooltipLabelStyle
  };
  
  const defaultListStyle = {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    ...tooltipListStyle
  };
  
  const defaultItemStyle = {
    padding: '4px 0',
    color: '#60a5fa',
    ...tooltipItemStyle
  };

  let isChecking = false;
  let debounceTimer = null;
  let grammarErrors = [];
  let decorationSet = DecorationSet.empty;
  let tooltipHandlers = null;

  function log(...args) {
    if (debug) {
      console.log('[OpenGrammer TipTap]', ...args);
    }
  }

  // Convert character offset to ProseMirror position
  function charOffsetToProseMirrorPos(charOffset) {
    const doc = editor.state.doc;
    let pos = 1; // Start after the document start node
    let charCount = 0;

    doc.nodesBetween(0, doc.content.size, (node, nodePos) => {
      if (node.isText) {
        const nodeLength = node.textContent.length;
        if (charCount + nodeLength >= charOffset) {
          pos = nodePos + (charOffset - charCount);
          return false; // Stop iterating
        }
        charCount += nodeLength;
      }
      return true;
    });

    return Math.max(1, Math.min(pos, doc.content.size));
  }

  // Create decorations from errors
  function createDecorations(errors) {
    const decorations = [];
    const doc = editor.state.doc;

    errors.forEach((error) => {
      try {
        const startPos = charOffsetToProseMirrorPos(error.startIndex);
        const endPos = charOffsetToProseMirrorPos(error.endIndex);

        // Ensure positions are valid
        const maxPos = doc.content.size;
        const validStartPos = Math.max(1, Math.min(startPos, maxPos));
        const validEndPos = Math.max(1, Math.min(endPos, maxPos));

        if (validStartPos < validEndPos) {
          log(`Error at char ${error.startIndex}-${error.endIndex} mapped to pos ${validStartPos}-${validEndPos}`);

          const decoration = Decoration.inline(validStartPos, validEndPos, {
            class: decorationClass,
            style: decorationStyle,
            'data-error-id': error.id || String(error.startIndex),
            'data-suggestions': JSON.stringify(error.suggestions || []),
            'data-message': error.message || 'Grammar error'
          });

          decorations.push(decoration);
        }
      } catch (e) {
        log('Error creating decoration:', error, e);
      }
    });

    return DecorationSet.create(doc, decorations);
  }

  // Setup tooltip handlers
  function setupTooltips() {
    const editorDom = editor.view.dom;
    if (!editorDom || tooltipHandlers) return;

    function handleMouseEnter(e) {
      const target = e.target;
      const errorEl = target.closest(`.${decorationClass}`);
      
      if (errorEl) {
        const suggestions = JSON.parse(errorEl.getAttribute('data-suggestions') || '[]');
        const message = errorEl.getAttribute('data-message') || 'Grammar error';

        // Remove existing tooltip
        const existingTooltip = document.querySelector('.grammar-tooltip');
        if (existingTooltip) existingTooltip.remove();

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'grammar-tooltip';
        const tooltipStyleStr = styleObjectToString(defaultTooltipStyle);
        if (tooltipStyleStr) {
          tooltip.style.cssText = tooltipStyleStr;
        }

        const messageEl = document.createElement('div');
        messageEl.className = 'grammar-tooltip-message';
        const messageStyleStr = styleObjectToString(defaultMessageStyle);
        if (messageStyleStr) {
          messageEl.style.cssText = messageStyleStr;
        }
        messageEl.textContent = message;
        tooltip.appendChild(messageEl);

        if (suggestions && suggestions.length > 0) {
          const suggestionsEl = document.createElement('div');
          suggestionsEl.className = 'grammar-tooltip-suggestions';
          const suggestionsStyleStr = styleObjectToString(defaultSuggestionsStyle);
          if (suggestionsStyleStr) {
            suggestionsEl.style.cssText = suggestionsStyleStr;
          }

          const suggestionsLabel = document.createElement('div');
          suggestionsLabel.className = 'grammar-tooltip-label';
          const labelStyleStr = styleObjectToString(defaultLabelStyle);
          if (labelStyleStr) {
            suggestionsLabel.style.cssText = labelStyleStr;
          }
          suggestionsLabel.textContent = 'Suggestions:';
          suggestionsEl.appendChild(suggestionsLabel);

          const suggestionsList = document.createElement('ul');
          suggestionsList.className = 'grammar-tooltip-list';
          const listStyleStr = styleObjectToString(defaultListStyle);
          if (listStyleStr) {
            suggestionsList.style.cssText = listStyleStr;
          }

          suggestions.forEach((suggestion) => {
            const li = document.createElement('li');
            const itemStyleStr = styleObjectToString(defaultItemStyle);
            if (itemStyleStr) {
              li.style.cssText = itemStyleStr;
            }
            li.textContent = suggestion;
            suggestionsList.appendChild(li);
          });

          suggestionsEl.appendChild(suggestionsList);
          tooltip.appendChild(suggestionsEl);
        }

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = errorEl.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const padding = 10;

        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top - tooltipRect.height - padding;

        // Keep tooltip on screen
        if (left < padding) {
          left = padding;
        } else if (left + tooltipRect.width > window.innerWidth - padding) {
          left = window.innerWidth - tooltipRect.width - padding;
        }

        if (top < padding) {
          top = rect.bottom + padding;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;

        // Fade in animation
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(-5px)';
        tooltip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        
        setTimeout(() => {
          tooltip.style.opacity = '1';
          tooltip.style.transform = 'translateY(0)';
        }, 10);
      }
    }

    function handleMouseLeave() {
      const tooltip = document.querySelector('.grammar-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    }

    editorDom.addEventListener('mouseenter', handleMouseEnter, true);
    editorDom.addEventListener('mouseleave', handleMouseLeave, true);

    tooltipHandlers = { handleMouseEnter, handleMouseLeave };
    log('Tooltip handlers attached');
  }

  // Main grammar check function
  function checkGrammar() {
    if (isChecking) {
      log('Already checking, skipping...');
      return;
    }

    isChecking = true;

    const plainText = editor.state.doc.textContent;
    const textLength = plainText.length;

    log('Checking grammar...', { textLength });

    const startTime = performance.now();
    const result = checkAndFormat(plainText);
    const checkTime = performance.now() - startTime;

    log(`Found ${result.errors.length} error(s) in ${checkTime.toFixed(2)}ms`, result.errors);

    grammarErrors = result.errors;
    decorationSet = createDecorations(result.errors);

    // Apply decorations to editor
    const currentDecorations = editor.view.props.decorations;
    editor.view.setProps({
      decorations: (state) => {
        // If there are existing decorations, merge them
        // For now, just return grammar decorations
        // Override this if you need to preserve other decorations
        return decorationSet;
      }
    });

    // Setup tooltips if not already done
    if (!tooltipHandlers) {
      setupTooltips();
    }

    isChecking = false;
  }

  // Debounced check
  function debouncedCheck() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    log('Editor updated, scheduling grammar check');
    debounceTimer = setTimeout(() => {
      log('Debounce timeout reached, checking grammar');
      checkGrammar();
    }, debounceMs);
  }

  // Handle blur
  function handleBlur() {
    log('Editor blurred, checking grammar');
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    checkGrammar();
  }

  // Setup event listeners
  const editorDom = editor.view.dom;
  
  editor.on('update', debouncedCheck);
  
  if (autoCheckOnBlur && editorDom) {
    editorDom.addEventListener('blur', handleBlur);
  }

  if (autoCheckOnLoad) {
    log('Initializing grammar checker on load');
    setTimeout(() => {
      checkGrammar();
    }, 500);
  }

  log('TipTap grammar checker initialized', {
    debounceMs,
    autoCheckOnLoad,
    autoCheckOnBlur,
    debug
  });

  // Return API
  return {
    check: checkGrammar,
    destroy: () => {
      log('Destroying TipTap grammar checker');
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      editor.off('update', debouncedCheck);
      
      if (editorDom) {
        editorDom.removeEventListener('blur', handleBlur);
        
        if (tooltipHandlers) {
          editorDom.removeEventListener('mouseenter', tooltipHandlers.handleMouseEnter, true);
          editorDom.removeEventListener('mouseleave', tooltipHandlers.handleMouseLeave, true);
          tooltipHandlers = null;
        }

        // Remove tooltips
        document.querySelectorAll('.grammar-tooltip').forEach(el => el.remove());

        // Clear decorations
        editor.view.setProps({ decorations: undefined });
      }

      decorationSet = DecorationSet.empty;
      grammarErrors = [];
    },
    getErrors: () => grammarErrors,
    getDecorations: () => decorationSet
  };
}

