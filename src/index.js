// Main exports for the grammar checker package

import { UpdateCSSStyleSheet, UpdateStyle } from "./decorationhandler.js";
import { checkGrammar as checkGrammarRules } from "./grammar-rules.js";
import { formatTextWithErrors } from "./html-formatter.js";
import {
  initTooltips as initTooltipsHandler,
  removeTooltips as removeTooltipsHandler,
} from "./tooltip-handler.js";

// Re-export TipTap integration
export {
  GrammerCheckContentTipTap,
  setupTipTap,
} from "./tiptap-integration.js";

export function checkGrammar(text) {
  return checkGrammarRules(text);
}

export function formatText(text, errors) {
  return formatTextWithErrors(text, errors);
}

export function checkAndFormat(text) {
  const errors = checkGrammarRules(text);
  const formatted = formatTextWithErrors(text, errors);
  return {
    errors,
    formatted,
  };
}

export function initTooltips(container) {
  if (typeof window === "undefined" || !window.document) {
    console.warn("initTooltips requires a browser environment");
    return;
  }
  return initTooltipsHandler(container);
}

export function removeTooltips(container) {
  if (typeof window === "undefined" || !window.document) {
    return;
  }
  return removeTooltipsHandler(container);
}

// Helper to work with contenteditable elements
function getCaretPosition(element) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length;
}

function setCaretPosition(element, position) {
  const selection = window.getSelection();
  const range = document.createRange();

  let charCount = 0;
  const nodeStack = [element];
  let node,
    foundStart = false;

  while (!foundStart && (node = nodeStack.pop())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const nextCharCount = charCount + node.textContent.length;
      if (position >= charCount && position <= nextCharCount) {
        range.setStart(node, position - charCount);
        range.setEnd(node, position - charCount);
        foundStart = true;
      }
      charCount = nextCharCount;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }

  if (foundStart) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function getPlainText(element) {
  return element.innerText || element.textContent || "";
}

export function setupContentEditable(selectorOrElement, options = {}) {
  console.error(
    "'setupContentEditable' Been renamed in latest version please switch to 'GrammerCheckContent' ",
  );
  return GrammerCheckContent(selectorOrElement, options);
}

// Setup grammar checking for a contenteditable element
export function GrammerCheckContent(selectorOrElement, options = {}) {
  if (typeof window === "undefined" || !window.document) {
    console.warn("setupContentEditable requires a browser environment");
    return;
  }

  const element =
    typeof selectorOrElement === "string"
      ? document.querySelector(selectorOrElement)
      : selectorOrElement;

  if (!element) {
    console.warn("Element not found");
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
  } = options;

  // Default tooltip styles
  const grammarerror = UpdateStyle("grammarerror", decorationStyle);
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

  UpdateCSSStyleSheet("." + decorationClass, grammarerror);
  UpdateCSSStyleSheet(".grammar-tooltip", defaultTooltipStyle);
  UpdateCSSStyleSheet(".grammar-tooltip-message", defaultMessageStyle);
  UpdateCSSStyleSheet(".grammar-tooltip-suggestions", defaultSuggestionsStyle);
  UpdateCSSStyleSheet(".grammar-tooltip-label", defaultLabelStyle);
  UpdateCSSStyleSheet(".grammar-tooltip-list", defaultListStyle);
  UpdateCSSStyleSheet(".grammar-tooltip-item", defaultItemStyle);

  let isChecking = false;
  let debounceTimer;
  let isTyping = false;
  let lastClickedErrorPosition = null;
  let lastCursorPosition = null;
  let currentErrors = []; // Store current errors with their positions
  let userInteractionTime = 0; // Track when user last interacted
  let restoreCursorTimer = null; // Timer for delayed cursor restoration
  let focusTime = 0; // Track when element was focused

  function log(...args) {
    if (debug) {
      console.log("[OpenGrammer]", ...args);
    }
  }

  // Track clicks on error elements
  function setupErrorClickTracking() {
    // Track all clicks to detect user interaction
    element.addEventListener('click', (e) => {
      userInteractionTime = Date.now();
      const errorEl = e.target.closest('.grammar-error');
      if (errorEl) {
        // User clicked on an error, find its position from stored errors
        const errorId = errorEl.getAttribute('data-error-id');
        if (errorId) {
          // Find the error in our stored errors array
          const error = currentErrors.find(err => 
            err.id === errorId || String(err.startIndex) === errorId
          );
          
          if (error) {
            // Save the start position of the clicked error
            lastClickedErrorPosition = error.startIndex;
            // Move cursor to the start of the error immediately
            setCaretPosition(element, error.startIndex);
            log("User clicked on error, cursor moved to position:", error.startIndex);
            // Don't restore cursor for a bit after user click
            if (restoreCursorTimer) {
              clearTimeout(restoreCursorTimer);
              restoreCursorTimer = null;
            }
          } else {
            // Fallback: try to find position from text content
            const errorText = errorEl.textContent;
            const allText = getPlainText(element);
            const errorIndex = allText.indexOf(errorText);
            if (errorIndex !== -1) {
              lastClickedErrorPosition = errorIndex;
              setCaretPosition(element, errorIndex);
              log("User clicked on error (fallback), cursor moved to position:", errorIndex);
              if (restoreCursorTimer) {
                clearTimeout(restoreCursorTimer);
                restoreCursorTimer = null;
              }
            }
          }
        }
      } else {
        // User clicked outside an error, clear the tracking
        lastClickedErrorPosition = null;
      }
    }, true);

    // Track mouse down to detect user interaction
    element.addEventListener('mousedown', () => {
      userInteractionTime = Date.now();
      // Cancel any pending cursor restoration when user clicks
      if (restoreCursorTimer) {
        clearTimeout(restoreCursorTimer);
        restoreCursorTimer = null;
      }
    }, true);

    // Track focus events
    element.addEventListener('focus', () => {
      focusTime = Date.now();
      userInteractionTime = Date.now();
      log("Element focused");
    }, true);

    // Track selection changes (this is a document-level event)
    document.addEventListener('selectionchange', () => {
      if (element.contains(document.activeElement)) {
        userInteractionTime = Date.now();
      }
    }, true);
  }

  function checkGrammar() {
    if (isChecking) {
      log("Already checking, skipping...");
      return;
    }
    isChecking = true;

    // Check if element is currently focused
    const isFocused = document.activeElement === element;
    const currentCursorPosition = isFocused ? getCaretPosition(element) : -1;
    const text = getPlainText(element);
    const timeSinceFocus = Date.now() - focusTime;

    log("Checking grammar...", { textLength: text.length, currentCursorPosition, lastClickedErrorPosition, isFocused, timeSinceFocus });

    const startTime = performance.now();
    const result = checkAndFormat(text);
    const checkTime = performance.now() - startTime;

    log(
      `Found ${result.errors.length} error(s) in ${checkTime.toFixed(2)}ms`,
      result.errors,
    );

    // Store current errors for click tracking
    currentErrors = result.errors;

    element.innerHTML = result.formatted || text;
    initTooltips(element);

    // Check if user recently interacted (within last 300ms - longer window to avoid conflicts)
    const timeSinceInteraction = Date.now() - userInteractionTime;
    const shouldRestoreCursor = timeSinceInteraction > 300; // Only restore if user hasn't interacted recently

    requestAnimationFrame(() => {
      // Only restore cursor if user hasn't recently interacted AND user clicked on an error
      if (!shouldRestoreCursor) {
        log("Skipping cursor restoration - user recently interacted");
        return;
      }

      // Only restore cursor if user explicitly clicked on an error
      // Don't restore for normal typing/editing - let the browser handle cursor position
      if (lastClickedErrorPosition !== null) {
        // Use a delay to ensure DOM is ready and user interaction has fully settled
        if (restoreCursorTimer) {
          clearTimeout(restoreCursorTimer);
        }
        restoreCursorTimer = setTimeout(() => {
          // Double-check user hasn't interacted in the meantime
          const timeSinceInteractionNow = Date.now() - userInteractionTime;
          if (timeSinceInteractionNow > 200) {
            const positionToRestore = Math.min(lastClickedErrorPosition, text.length);
            // Only focus if element doesn't already have focus
            const wasFocused = document.activeElement === element;
            if (!wasFocused) {
              element.focus();
            }
            // Set cursor position after DOM has settled
            requestAnimationFrame(() => {
              setCaretPosition(element, positionToRestore);
              log(
                "Cursor restored to last clicked error position:",
                positionToRestore,
              );
            });
          } else {
            log("Skipping cursor restoration - user interacted during delay");
          }
          restoreCursorTimer = null;
        }, 100); // Longer delay to avoid conflicts
      } else if (isFocused && currentCursorPosition > 0 && currentCursorPosition <= text.length && timeSinceFocus > 200) {
        // Element is focused and we have a valid cursor position (> 0) - preserve it
        // Only restore if element has been focused for a while (not just focused)
        // This prevents cursor from resetting to 0 when element is first focused
        // Only restore if enough time has passed since interaction to avoid conflicts
        if (timeSinceInteraction > 100) {
          const positionToRestore = Math.min(currentCursorPosition, text.length);
          requestAnimationFrame(() => {
            // Double-check element is still focused and user hasn't interacted
            if (document.activeElement === element && (Date.now() - userInteractionTime) > 50) {
              setCaretPosition(element, positionToRestore);
              log("Preserving cursor position for focused element:", positionToRestore);
            }
          });
        }
      }
      // Don't restore cursor if user hasn't clicked on an error and element isn't focused
    });

    lastCursorPosition = currentCursorPosition;
    isChecking = false;
  }

  element.addEventListener("input", () => {
    isTyping = true;
    userInteractionTime = Date.now();
    // Clear clicked error tracking when user starts typing
    lastClickedErrorPosition = null;
    // Cancel any pending cursor restoration
    if (restoreCursorTimer) {
      clearTimeout(restoreCursorTimer);
      restoreCursorTimer = null;
    }
    log("User typing, clearing debounce timer and clicked error tracking");
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      isTyping = false;
      log("Debounce timeout reached, checking grammar");
      checkGrammar();
    }, debounceMs);
  });

  if (autoCheckOnBlur) {
    element.addEventListener("blur", () => {
      if (!isTyping) {
        log("Element blurred, checking grammar");
        checkGrammar();
      } else {
        log("Element blurred but user was typing, skipping check");
      }
    });
  }

  // Setup error click tracking
  setupErrorClickTracking();

  if (autoCheckOnLoad) {
    log("Initializing grammar checker on load");
    checkGrammar();
  }

  log("Grammar checker initialized", {
    debounceMs,
    autoCheckOnLoad,
    autoCheckOnBlur,
    debug,
  });

  return {
    check: checkGrammar,
    destroy: () => {
      log("Destroying grammar checker");
      clearTimeout(debounceTimer);
      if (restoreCursorTimer) {
        clearTimeout(restoreCursorTimer);
      }
      removeTooltips(element);
      lastClickedErrorPosition = null;
      lastCursorPosition = null;
      currentErrors = [];
      userInteractionTime = 0;
    },
  };
}
