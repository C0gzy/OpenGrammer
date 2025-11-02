// Main exports for the grammar checker package

import { UpdateCSSStyleSheet, UpdateStyle } from "./decorationhandler.js";
import { checkGrammar as checkGrammarRules } from "./grammar-rules.js";
import { formatTextWithErrors } from "./html-formatter.js";
import {
  initTooltips as initTooltipsHandler,
  removeTooltips as removeTooltipsHandler,
} from "./tooltip-handler.js";

// Re-export TipTap integration
export { GrammerCheckContentTipTap } from "./tiptap-integration.js";

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

  function log(...args) {
    if (debug) {
      console.log("[OpenGrammer]", ...args);
    }
  }

  function checkGrammar() {
    if (isChecking) {
      log("Already checking, skipping...");
      return;
    }
    isChecking = true;

    const cursorPosition = getCaretPosition(element);
    const text = getPlainText(element);

    log("Checking grammar...", { textLength: text.length, cursorPosition });

    const startTime = performance.now();
    const result = checkAndFormat(text);
    const checkTime = performance.now() - startTime;

    log(
      `Found ${result.errors.length} error(s) in ${checkTime.toFixed(2)}ms`,
      result.errors,
    );

    element.innerHTML = result.formatted || text;
    initTooltips(element);

    requestAnimationFrame(() => {
      setCaretPosition(element, Math.min(cursorPosition, text.length));
      element.focus();
      log(
        "Cursor restored to position:",
        Math.min(cursorPosition, text.length),
      );
    });

    isChecking = false;
  }

  element.addEventListener("input", () => {
    isTyping = true;
    log("User typing, clearing debounce timer");
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
      removeTooltips(element);
    },
  };
}
