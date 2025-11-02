# OpenGrammer

A JavaScript npm package that scans text for grammar mistakes using custom rules and provides visual indicators with hover tooltips showing correction suggestions.

This is a basic grammer detection and currently only in English. Need a larger dictonary for nouns and such any suggestions will be much loved :)

## Features

- Custom grammar rule engine for detecting common mistakes
- HTML formatting with blue wavy underlines for errors
- Interactive tooltips with suggestions on hover
- Zero external dependencies (for core functionality)
- Easy integration into web projects, React, and TipTap editors
- Context-aware checking to reduce false positives

## Installation

```bash
npm install opengrammer
```

For TipTap integration, also install:

```bash
npm install opengrammer @tiptap/pm
```

## Quick Start

### HTML / ContentEditable (Simplest)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="node_modules/opengrammer/src/styles.css">
</head>
<body>
  <div id="editor" contenteditable>Their going to the store. Its a nice day.</div>

  <script type="module">
    import { GrammerCheckContent } from './node_modules/opengrammer/src/index.js';

    GrammerCheckContent('#editor', {
      debug: false // Set to true for debug logs
    });
  </script>
</body>
</html>
```

That's it! Grammar checking happens automatically as you type.

### React

```jsx
import { useEffect, useRef } from 'react';
import { GrammerCheckContent } from 'opengrammer';
import 'opengrammer/styles';

function GrammarEditor() {
  const editorRef = useRef(null);
  const checkerRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      checkerRef.current = GrammerCheckContent(editorRef.current, {
        debounceMs: 1000,
        autoCheckOnLoad: true,
        autoCheckOnBlur: true,
        debug: false
      });

      return () => {
        checkerRef.current?.destroy();
      };
    }
  }, []);

  return (
    <div
      ref={editorRef}
      contentEditable
      style={{
        minHeight: '150px',
        padding: '12px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px'
      }}
    >
      Type your text here...
    </div>
  );
}
```

See [REACT.md](./REACT.md) for more React examples.

### TipTap

```tsx
import { useEffect, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { GrammerCheckContentTipTap } from 'opengrammer';
import 'opengrammer/styles';

function TipTapEditor() {
  const checkerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      // your extensions
    ],
    content: '<p>Their going to the store. Its a nice day.</p>'
  });

  useEffect(() => {
    if (editor) {
      checkerRef.current = GrammerCheckContentTipTap(editor, {
        decorations: { Decoration, DecorationSet },
        debounceMs: 1000,
        autoCheckOnLoad: true,
        autoCheckOnBlur: true,
        debug: false
      });

      return () => {
        checkerRef.current?.destroy();
      };
    }
  }, [editor]);

  return <EditorContent editor={editor} />;
}
```

See [TIPTAP.md](./TIPTAP.md) for complete TipTap integration guide.

## Core API

### `checkGrammar(text)`

Checks text for grammar errors and returns an array of error objects.

**Parameters:**
- `text` (string): The text to check

**Returns:**
- Array of error objects, each containing:
  - `id` (string): Unique identifier for the error
  - `startIndex` (number): Start position in the original text
  - `endIndex` (number): End position in the original text
  - `text` (string): The incorrect text segment
  - `suggestions` (Array<string>): Array of suggested corrections
  - `message` (string): Explanation of the error

**Example:**
```javascript
import { checkGrammar } from 'opengrammer';

const errors = checkGrammar("Their going there.");
// Returns:
// [
//   {
//     id: "error-0",
//     startIndex: 0,
//     endIndex: 5,
//     text: "Their",
//     suggestions: ["there", "they're"],
//     message: "Check usage of 'there', 'their', or 'they're'"
//   }
// ]
```

### `formatText(text, errors)`

Formats text with errors wrapped in HTML `<span>` tags.

**Parameters:**
- `text` (string): Original text
- `errors` (Array<Object>): Array of error objects from `checkGrammar`

**Returns:**
- HTML string with errors wrapped in `<span class="grammar-error">` tags

**Example:**
```javascript
import { checkGrammar, formatText } from 'opengrammer';

const errors = checkGrammar("Their going there.");
const formatted = formatText("Their going there.", errors);
// Returns: '<span class="grammar-error" data-error-id="error-0" ...>Their</span> going there.'
```

### `checkAndFormat(text)`

Convenience function that checks grammar and formats text in one step.

**Parameters:**
- `text` (string): Text to check and format

**Returns:**
- Object with:
  - `errors` (Array<Object>): Array of error objects
  - `formatted` (string): HTML string with errors wrapped in tags

**Example:**
```javascript
import { checkAndFormat } from 'opengrammer';

const result = checkAndFormat("Their going there.");
console.log(result.errors);    // Array of errors
console.log(result.formatted);  // HTML string
```

### `initTooltips(container)`

Initializes tooltip event listeners on formatted HTML elements.

**Parameters:**
- `container` (HTMLElement|string): Container element or CSS selector containing formatted text

**Example:**
```javascript
import { checkAndFormat, initTooltips } from 'opengrammer';

const result = checkAndFormat(text);
document.getElementById('content').innerHTML = result.formatted;

// Initialize tooltips
initTooltips('#content');
```

### `removeTooltips(container)`

Removes tooltip event listeners from a container.

**Parameters:**
- `container` (HTMLElement|string): Container element or CSS selector

## Setup Functions

### `GrammerCheckContent(selectorOrElement, options)`

Easiest way to add grammar checking to a contenteditable element. Handles cursor position, debouncing, and tooltips automatically.

**Parameters:**
- `selectorOrElement` (string|HTMLElement): CSS selector or DOM element
- `options` (Object): Configuration options
  - `debounceMs` (number): Delay before checking after typing stops (default: 1000)
  - `autoCheckOnLoad` (boolean): Check grammar when element loads (default: true)
  - `autoCheckOnBlur` (boolean): Check grammar when element loses focus (default: true)
  - `debug` (boolean): Enable debug logging (default: false)
  - `decorationClass` (string): CSS class for error highlights (default: 'grammar-error-decoration')
  - `decorationStyle` (string|object): Inline styles for error highlights. Can be a CSS string or an object with camelCase properties
  - `decorationAttributes` (object): Additional HTML attributes to add to decorations (default: {})
  - `tooltipStyle` (string|object): Customize tooltip container styles (default: {})
  - `tooltipMessageStyle` (string|object): Customize error message styles (default: {})
  - `tooltipSuggestionsStyle` (string|object): Customize suggestions section styles (default: {})
  - `tooltipLabelStyle` (string|object): Customize "Suggestions:" label styles (default: {})
  - `tooltipListStyle` (string|object): Customize suggestions list styles (default: {})
  - `tooltipItemStyle` (string|object): Customize individual suggestion item styles (default: {})

**Returns:**
- Object with:
  - `check()`: Manually trigger grammar check
  - `destroy()`: Clean up event listeners

**Example:**
```javascript
import { GrammerCheckContent } from 'opengrammer';

const checker = GrammerCheckContent('#my-editor', {
  debounceMs: 500,
  debug: true
});

// Manual check
checker.check();

// Cleanup
checker.destroy();
```

### `GrammerCheckContentTipTap(editor, options)`

Integrates grammar checking with TipTap/ProseMirror editors.

**Parameters:**
- `editor` (Editor): TipTap editor instance
- `options` (Object): Configuration options
  - `decorations` (Object): Required - `{ Decoration, DecorationSet }` from `@tiptap/pm/view`
  - `debounceMs` (number): Delay before checking (default: 1000)
  - `autoCheckOnLoad` (boolean): Check on load (default: true)
  - `autoCheckOnBlur` (boolean): Check on blur (default: true)
  - `debug` (boolean): Enable debug logging (default: false)
  - `decorationClass` (string): CSS class for error highlights (default: 'grammar-error-decoration')
  - `decorationStyle` (string|object): Inline styles for error highlights. Can be a CSS string or an object with camelCase properties
  - `decorationAttributes` (object): Additional HTML attributes to add to decorations (default: {})
  - `tooltipStyle` (string|object): Customize tooltip container styles (default: {})
  - `tooltipMessageStyle` (string|object): Customize error message styles (default: {})
  - `tooltipSuggestionsStyle` (string|object): Customize suggestions section styles (default: {})
  - `tooltipLabelStyle` (string|object): Customize "Suggestions:" label styles (default: {})
  - `tooltipListStyle` (string|object): Customize suggestions list styles (default: {})
  - `tooltipItemStyle` (string|object): Customize individual suggestion item styles (default: {})

**Returns:**
- Object with:
  - `check()`: Manually trigger grammar check
  - `destroy()`: Clean up event listeners and decorations
  - `getErrors()`: Get current grammar errors array
  - `getDecorations()`: Get current ProseMirror decoration set

**Example:**
```typescript
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { GrammerCheckContentTipTap } from 'opengrammer';

const checker = GrammerCheckContentTipTap(editor, {
  decorations: { Decoration, DecorationSet },
  debounceMs: 1000,
  debug: false
});
```

## Grammar Rules

The package includes custom context-aware rules for detecting:

- **Homophones**: there/their/they're, its/it's, your/you're, to/too/two
- **Double spaces**: Multiple consecutive spaces
- **Missing capitalization**: Lowercase letters after periods
- **Punctuation**: Multiple periods (should use ellipsis)
- **Missing apostrophes**: Common contractions (don't, can't, won't, etc.)

Rules check sentence context to reduce false positives. For example, "Their car" won't be flagged because "their" is correctly followed by a noun.

## Styling

Import the CSS file to get the default styling:

```javascript
import 'opengrammer/styles';
```

Or include it in your HTML:

```html
<link rel="stylesheet" href="node_modules/opengrammer/src/styles.css">
```

The CSS provides:
- Blue wavy underline for grammar errors
- Dark tooltip with suggestions
- Hover effects and animations

You can customize the styling by overriding the CSS classes:
- `.grammar-error` - Error text styling
- `.grammar-tooltip` - Tooltip container
- `.grammar-tooltip-message` - Error message
- `.grammar-tooltip-suggestions` - Suggestions section

## Debug Mode

Enable debug logging to see what's happening:

```javascript
GrammerCheckContent('#editor', { debug: true });
```

Debug output includes:
- When grammar checking starts/completes
- Number of errors found and their details
- Performance timing
- Cursor position restoration
- Debounce and blur events
- Initialization status

## Browser Support

Requires modern browsers with ES6 module support and DOM APIs. Works in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Documentation

- [React Integration Guide](./REACT.md) - Detailed React examples and patterns
- [TipTap Integration Guide](./TIPTAP.md) - Complete TipTap/ProseMirror setup

## License

MIT
