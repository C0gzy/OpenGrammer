# OpenGrammer

A JavaScript npm package that scans text for grammar mistakes using custom rules and provides visual indicators with hover tooltips showing correction suggestions.

## Features

- Custom grammar rule engine for detecting common mistakes
- HTML formatting with blue wavy underlines for errors
- Interactive tooltips with suggestions on hover
- Zero external dependencies (for core functionality)
- Easy integration into web projects

## Installation

```bash
npm install opengrammer
```

## Usage

### Basic Usage

```javascript
import { checkGrammar, formatText, checkAndFormat, initTooltips } from 'opengrammer';
import 'opengrammer/styles';

// Check text for grammar errors
const text = "Their going to the store. Its a nice day.";
const errors = checkGrammar(text);
console.log(errors);
// Returns array of error objects

// Format text with HTML tags
const formatted = formatText(text, errors);
// Returns HTML string with errors wrapped in <span> tags

// Or do both in one step
const result = checkAndFormat(text);
console.log(result.errors);    // Array of errors
console.log(result.formatted);  // HTML string
```

### Integration in HTML

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="node_modules/opengrammer/src/styles.css">
</head>
<body>
  <div id="content"></div>
  
  <script type="module">
    import { checkAndFormat, initTooltips } from './node_modules/opengrammer/src/index.js';
    
    const text = "Their going to the store. Its a nice day. I dont know.";
    const result = checkAndFormat(text);
    
    document.getElementById('content').innerHTML = result.formatted;
    
    // Initialize tooltips
    initTooltips('#content');
  </script>
</body>
</html>
```

### API Reference

#### `checkGrammar(text)`

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

#### `formatText(text, errors)`

Formats text with errors wrapped in HTML `<span>` tags.

**Parameters:**
- `text` (string): Original text
- `errors` (Array<Object>): Array of error objects from `checkGrammar`

**Returns:**
- HTML string with errors wrapped in `<span class="grammar-error">` tags

**Example:**
```javascript
const errors = checkGrammar("Their going there.");
const formatted = formatText("Their going there.", errors);
// Returns: '<span class="grammar-error" data-error-id="error-0" ...>Their</span> going there.'
```

#### `checkAndFormat(text)`

Convenience function that checks grammar and formats text in one step.

**Parameters:**
- `text` (string): Text to check and format

**Returns:**
- Object with:
  - `errors` (Array<Object>): Array of error objects
  - `formatted` (string): HTML string with errors wrapped in tags

**Example:**
```javascript
const result = checkAndFormat("Their going there.");
console.log(result.errors);    // Array of errors
console.log(result.formatted);  // HTML string
```

#### `initTooltips(container)`

Initializes tooltip event listeners on formatted HTML elements.

**Parameters:**
- `container` (HTMLElement|string): Container element or CSS selector containing formatted text

**Example:**
```javascript
// After inserting formatted HTML into DOM
const result = checkAndFormat(text);
document.getElementById('content').innerHTML = result.formatted;

// Initialize tooltips
initTooltips('#content');
// or
initTooltips(document.getElementById('content'));
```

#### `removeTooltips(container)`

Removes tooltip event listeners from a container.

**Parameters:**
- `container` (HTMLElement|string): Container element or CSS selector

## Grammar Rules

The package includes custom rules for detecting:

- **Homophones**: there/their/they're, its/it's, your/you're, to/too/two
- **Double spaces**: Multiple consecutive spaces
- **Missing capitalization**: Lowercase letters after periods
- **Punctuation**: Multiple periods (should use ellipsis)
- **Missing apostrophes**: Common contractions (don't, can't, won't, etc.)

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

## Browser Support

Requires modern browsers with ES6 module support and DOM APIs. Works in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

