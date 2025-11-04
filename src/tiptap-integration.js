// TipTap/ProseMirror integration for OpenGrammer
// Requires @tiptap/pm to be installed as a peer dependency

import { checkAndFormat } from "./index.js";
import { UpdateStyle } from "./decorationhandler.js";

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
  console.error(
    "'setupTipTap' Been renamed in latest version please switch to 'GrammerCheckContentTipTap' ",
  );
  return GrammerCheckContentTipTap(editor, options);
}

export function GrammerCheckContentTipTap(editor, options = {}) {
  if (!editor || !editor.view) {
    console.warn("setupTipTap requires a valid TipTap editor instance");
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
      console.warn(
        "TipTap integration: Please import Decoration and DecorationSet from @tiptap/pm/view",
      );
      console.warn(
        'Example: import { Decoration, DecorationSet } from "@tiptap/pm/view"',
      );
      console.warn(
        "Then pass them: setupTipTap(editor, { decorations: { Decoration, DecorationSet } })",
      );
      return {
        check: () =>
          console.warn(
            "TipTap integration not initialized - missing Decoration/DecorationSet",
          ),
        destroy: () => {},
        getErrors: () => [],
        getDecorations: () => null,
      };
    } catch (e) {
      console.error("Failed to initialize TipTap integration:", e);
      return;
    }
  }

  if (!Decoration || !DecorationSet) {
    console.warn(
      "Decoration and DecorationSet are required for TipTap integration",
    );
    return;
  }

  const {
    debounceMs = 1000,
    autoCheckOnLoad = true,
    autoCheckOnBlur = true,
    debug = false,
    decorationClass = "grammar-error",
    decorationStyle = {},
    tooltipStyle = {},
    tooltipMessageStyle = {},
    tooltipSuggestionsStyle = {},
    tooltipLabelStyle = {},
    tooltipListStyle = {},
    tooltipItemStyle = {},
    decorations: _decorations, // Remove from options
  } = options;

  // Helper to convert style object to CSS string
  function styleObjectToString(styleObj) {
    if (typeof styleObj === "string") {
      return styleObj;
    }
    if (typeof styleObj === "object" && styleObj !== null) {
      return Object.entries(styleObj)
        .map(([key, value]) => {
          const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
          return `${kebabKey}: ${value}`;
        })
        .join("; ");
    }
    return "";
  }


  // Default decoration styles
  const defaultDecorationStyle = UpdateStyle("grammarerror", decorationStyle);
  // Default tooltip styles
  const defaultTooltipStyle = UpdateStyle("TooltipStyle", tooltipStyle);

  const defaultMessageStyle = UpdateStyle(
    "defaultMessageStyle",
    tooltipMessageStyle,
  );

  const defaultSuggestionsStyle = UpdateStyle(
    "defaultSuggestionsStyle",
    tooltipSuggestionsStyle,
  );

  const defaultLabelStyle = UpdateStyle("defaultLabelStyle", tooltipLabelStyle);

  const defaultListStyle = UpdateStyle("defaultListStyle", tooltipListStyle);

  const defaultItemStyle = UpdateStyle("defaultItemStyle", tooltipItemStyle);

  let isChecking = false;
  let debounceTimer = null;
  let grammarErrors = [];
  let decorationSet = DecorationSet.empty;
  let tooltipHandlers = null;

  function log(...args) {
    if (debug) {
      console.log("[OpenGrammer TipTap]", ...args);
    }
  }

  // Build plain text from document structure (matching how we count in charOffsetToProseMirrorPos)
  // This ensures consistency between text extraction and position mapping
  function getPlainTextFromDoc() {
    let text = '';
    const doc = editor.state.doc;
    
    // Walk through nodes in document order - this MUST match charOffsetToProseMirrorPos
    doc.nodesBetween(0, doc.content.size, (node) => {
      if (node.isText) {
        text += node.textContent;
      }
      return true;
    });
    
    return text;
  }

  // Convert character offset to ProseMirror position
  // This function MUST visit nodes in the exact same order as getPlainTextFromDoc()
  function charOffsetToProseMirrorPos(charOffset) {
    const doc = editor.state.doc;
    let charCount = 0;
    let pmPos = 1;
    let found = false;
    
    // Walk through nodes in the exact same order as getPlainTextFromDoc()
    // This ensures character offsets map correctly to ProseMirror positions
    doc.nodesBetween(0, doc.content.size, (node, nodePos) => {
      if (node.isText) {
        const nodeLength = node.textContent.length;
        
        // Check if our target offset is within this text node
        if (!found && charCount <= charOffset && charOffset < charCount + nodeLength) {
          // Calculate the offset within this text node
          const offsetInNode = charOffset - charCount;
          // nodePos is the absolute ProseMirror position where this text node starts
          // Add the character offset within the node to get the exact position
          pmPos = nodePos + offsetInNode;
          found = true;
          return false; // Stop iterating
        }
        
        // Accumulate character count (matching getPlainTextFromDoc)
        charCount += nodeLength;
      }
      
      return true; // Continue iterating
    });

    // Fallback: if offset is beyond all text, place at end of document
    if (!found && charCount > 0 && charOffset >= charCount) {
      pmPos = doc.content.size;
    }

    // Clamp to valid document bounds
    const validPos = Math.max(1, Math.min(pmPos, doc.content.size));
    
    return validPos;
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

        if (error.startIndex < error.endIndex) {
          log(
            `Error at char ${error.startIndex}-${error.endIndex} mapped to pos ${validStartPos}-${validEndPos}`,
          );

          const decoration = Decoration.inline(validStartPos, validEndPos, {
            class: decorationClass,
            style: styleObjectToString(defaultDecorationStyle),
            "data-error-id": error.id || String(error.startIndex),
            "data-suggestions": JSON.stringify(error.suggestions || []),
            "data-message": error.message || "Grammar error",
          });

          decorations.push(decoration);
        }
      } catch (e) {
        log("Error creating decoration:", error, e);
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
        const suggestions = JSON.parse(
          errorEl.getAttribute("data-suggestions") || "[]",
        );
        const message = errorEl.getAttribute("data-message") || "Grammar error";

        // Remove existing tooltip
        const existingTooltip = document.querySelector(".grammar-tooltip");
        if (existingTooltip) existingTooltip.remove();

        // Create tooltip element
        const tooltip = document.createElement("div");
        tooltip.className = "grammar-tooltip";
        const tooltipStyleStr = styleObjectToString(defaultTooltipStyle);
        if (tooltipStyleStr) {
          tooltip.style.cssText = tooltipStyleStr;
        }

        const messageEl = document.createElement("div");
        messageEl.className = "grammar-tooltip-message";
        const messageStyleStr = styleObjectToString(defaultMessageStyle);
        if (messageStyleStr) {
          messageEl.style.cssText = messageStyleStr;
        }
        messageEl.textContent = message;
        tooltip.appendChild(messageEl);

        if (suggestions && suggestions.length > 0) {
          const suggestionsEl = document.createElement("div");
          suggestionsEl.className = "grammar-tooltip-suggestions";
          const suggestionsStyleStr = styleObjectToString(
            defaultSuggestionsStyle,
          );
          if (suggestionsStyleStr) {
            suggestionsEl.style.cssText = suggestionsStyleStr;
          }

          const suggestionsLabel = document.createElement("div");
          suggestionsLabel.className = "grammar-tooltip-label";
          const labelStyleStr = styleObjectToString(defaultLabelStyle);
          if (labelStyleStr) {
            suggestionsLabel.style.cssText = labelStyleStr;
          }
          suggestionsLabel.textContent = "Suggestions:";
          suggestionsEl.appendChild(suggestionsLabel);

          const suggestionsList = document.createElement("ul");
          suggestionsList.className = "grammar-tooltip-list";
          const listStyleStr = styleObjectToString(defaultListStyle);
          if (listStyleStr) {
            suggestionsList.style.cssText = listStyleStr;
          }

          suggestions.forEach((suggestion) => {
            const li = document.createElement("li");
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
        tooltip.style.opacity = "0";
        tooltip.style.transform = "translateY(-5px)";
        tooltip.style.transition = "opacity 0.2s ease, transform 0.2s ease";

        setTimeout(() => {
          tooltip.style.opacity = "1";
          tooltip.style.transform = "translateY(0)";
        }, 10);
      }
    }

    function handleMouseLeave() {
      const tooltip = document.querySelector(".grammar-tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    }

    editorDom.addEventListener("mouseenter", handleMouseEnter, true);
    editorDom.addEventListener("mouseleave", handleMouseLeave, true);

    tooltipHandlers = { handleMouseEnter, handleMouseLeave };
    log("Tooltip handlers attached");
  }

  // Main grammar check function
  function checkGrammar() {
    if (isChecking) {
      log("Already checking, skipping...");
      return;
    }

    isChecking = true;

    // Use consistent text extraction method that matches position mapping
    const plainText = getPlainTextFromDoc();
    const textLength = plainText.length;
    const docSize = editor.state.doc.content.size;

    log("Checking grammar...", { textLength, docSize });

    const startTime = performance.now();
    const result = checkAndFormat(plainText);
    const checkTime = performance.now() - startTime;

    log(
      `Found ${result.errors.length} error(s) in ${checkTime.toFixed(2)}ms`,
      result.errors,
    );

    // Debug: Log position mappings for errors
    if (result.errors.length > 0 && debug) {
      result.errors.forEach((error) => {
        const startPos = charOffsetToProseMirrorPos(error.startIndex);
        const endPos = charOffsetToProseMirrorPos(error.endIndex);
        log(`Error "${error.text}" at char ${error.startIndex}-${error.endIndex} mapped to PM pos ${startPos}-${endPos} (doc size: ${docSize})`);
      });
    }

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
      },
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

    log("Editor updated, scheduling grammar check");
    debounceTimer = setTimeout(() => {
      log("Debounce timeout reached, checking grammar");
      checkGrammar();
    }, debounceMs);
  }

  // Handle blur
  function handleBlur() {
    log("Editor blurred, checking grammar");
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    checkGrammar();
  }

  // Setup event listeners
  const editorDom = editor.view.dom;

  editor.on("update", debouncedCheck);

  if (autoCheckOnBlur && editorDom) {
    editorDom.addEventListener("blur", handleBlur);
  }

  if (autoCheckOnLoad) {
    log("Initializing grammar checker on load");
    setTimeout(() => {
      checkGrammar();
    }, 500);
  }

  log("TipTap grammar checker initialized", {
    debounceMs,
    autoCheckOnLoad,
    autoCheckOnBlur,
    debug,
  });

  // Return API
  return {
    check: checkGrammar,
    destroy: () => {
      log("Destroying TipTap grammar checker");

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      editor.off("update", debouncedCheck);

      if (editorDom) {
        editorDom.removeEventListener("blur", handleBlur);

        if (tooltipHandlers) {
          editorDom.removeEventListener(
            "mouseenter",
            tooltipHandlers.handleMouseEnter,
            true,
          );
          editorDom.removeEventListener(
            "mouseleave",
            tooltipHandlers.handleMouseLeave,
            true,
          );
          tooltipHandlers = null;
        }

        // Remove tooltips
        document
          .querySelectorAll(".grammar-tooltip")
          .forEach((el) => el.remove());

        // Clear decorations
        editor.view.setProps({ decorations: undefined });
      }

      decorationSet = DecorationSet.empty;
      grammarErrors = [];
    },
    getErrors: () => grammarErrors,
    getDecorations: () => decorationSet,
  };
}
