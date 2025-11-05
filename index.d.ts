// Type definitions for opengrammer

export interface GrammarError {
  id: string;
  startIndex: number;
  endIndex: number;
  text: string;
  suggestions: string[];
  message: string;
}

export interface CheckAndFormatResult {
  errors: GrammarError[];
  formatted: string;
}

export interface GrammarCheckerOptions {
  debounceMs?: number;
  autoCheckOnLoad?: boolean;
  autoCheckOnBlur?: boolean;
  debug?: boolean;
  decorationClass?: string;
  decorationStyle?: string | Record<string, string>;
  decorationAttributes?: Record<string, string>;
  tooltipStyle?: string | Record<string, string>;
  tooltipMessageStyle?: string | Record<string, string>;
  tooltipSuggestionsStyle?: string | Record<string, string>;
  tooltipLabelStyle?: string | Record<string, string>;
  tooltipListStyle?: string | Record<string, string>;
  tooltipItemStyle?: string | Record<string, string>;
}

export interface TipTapGrammarCheckerOptions extends GrammarCheckerOptions {
  decorations: {
    Decoration: any;
    DecorationSet: any;
  };
}

export interface GrammarCheckerInstance {
  check: () => void;
  destroy: () => void;
}

export interface TipTapGrammarCheckerInstance extends GrammarCheckerInstance {
  getErrors: () => GrammarError[];
  getDecorations: () => any;
}

/**
 * Checks text for grammar errors
 * @param text - The text to check
 * @returns Array of grammar error objects
 */
export function checkGrammar(text: string): GrammarError[];

/**
 * Formats text with error spans
 * @param text - The original text
 * @param errors - Array of grammar errors
 * @returns HTML string with errors wrapped in span tags
 */
export function formatText(text: string, errors: GrammarError[]): string;

/**
 * Checks grammar and formats text in one step
 * @param text - The text to check and format
 * @returns Object with errors array and formatted HTML string
 */
export function checkAndFormat(text: string): CheckAndFormatResult;

/**
 * Initializes tooltip event listeners on formatted HTML elements
 * @param container - Container element or CSS selector containing formatted text
 */
export function initTooltips(container: string | HTMLElement): void;

/**
 * Removes tooltip event listeners from a container
 * @param container - Container element or CSS selector
 */
export function removeTooltips(container: string | HTMLElement): void;

/**
 * Setup grammar checking for a contenteditable element
 * @param selectorOrElement - CSS selector or DOM element
 * @param options - Configuration options
 * @returns Object with check() and destroy() methods
 */
export function GrammerCheckContent(
  selectorOrElement: string | HTMLElement,
  options?: GrammarCheckerOptions
): GrammarCheckerInstance | undefined;

/**
 * @deprecated Use GrammerCheckContent instead
 */
export function setupContentEditable(
  selectorOrElement: string | HTMLElement,
  options?: GrammarCheckerOptions
): GrammarCheckerInstance | undefined;

/**
 * Integrates grammar checking with TipTap/ProseMirror editors
 * @param editor - TipTap editor instance
 * @param options - Configuration options (requires decorations)
 * @returns Object with check(), destroy(), getErrors(), and getDecorations() methods
 */
export function GrammerCheckContentTipTap(
  editor: any,
  options: TipTapGrammarCheckerOptions
): TipTapGrammarCheckerInstance | undefined;

/**
 * @deprecated Use GrammerCheckContentTipTap instead
 */
export function setupTipTap(
  editor: any,
  options?: TipTapGrammarCheckerOptions
): TipTapGrammarCheckerInstance | undefined;

// Allow importing styles
declare module 'opengrammer/styles' {
  const styles: string;
  export default styles;
}

