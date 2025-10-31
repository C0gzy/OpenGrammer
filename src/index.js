// Main exports for the grammar checker package

import { checkGrammar as checkGrammarRules } from './grammar-rules.js';
import { formatTextWithErrors } from './html-formatter.js';
import { initTooltips as initTooltipsHandler, removeTooltips as removeTooltipsHandler } from './tooltip-handler.js';

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
    formatted
  };
}

export function initTooltips(container) {
  if (typeof window === 'undefined' || !window.document) {
    console.warn('initTooltips requires a browser environment');
    return;
  }
  return initTooltipsHandler(container);
}

export function removeTooltips(container) {
  if (typeof window === 'undefined' || !window.document) {
    return;
  }
  return removeTooltipsHandler(container);
}

