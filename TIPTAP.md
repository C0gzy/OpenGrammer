# Using OpenGrammer with TipTap

OpenGrammer includes built-in support for TipTap editors, making integration much simpler than manual setup.

## Installation

```bash
npm install opengrammer @tiptap/core @tiptap/pm
```

## Basic Usage

```tsx
import { Editor } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { setupTipTap } from 'opengrammer';
import 'opengrammer/styles';

// Create your TipTap editor
const editor = new Editor({
  extensions: [
    // your extensions
  ],
  content: '<p>Their going to the store. Its a nice day.</p>'
});

// Setup grammar checking
const grammarChecker = setupTipTap(editor, {
  decorations: { Decoration, DecorationSet }, // Required
  debounceMs: 1000,
  autoCheckOnLoad: true,
  autoCheckOnBlur: true,
  debug: true // Enable debug logging
});

// Cleanup when done
// grammarChecker.destroy();
```

## React Integration

```tsx
import { useEffect, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { setupTipTap } from 'opengrammer';
import 'opengrammer/styles';

function GrammarEditor() {
  const checkerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      // your extensions
    ],
    content: '<p>Their going to the store.</p>'
  });

  useEffect(() => {
    if (editor) {
      checkerRef.current = setupTipTap(editor, {
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

  return (
    <EditorContent editor={editor} />
  );
}
```

## Vue Integration

```vue
<template>
  <editor-content :editor="editor" />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useEditor } from '@tiptap/vue-3';
import { setupTipTap } from 'opengrammer';
import 'opengrammer/styles';

const editor = useEditor({
  extensions: [
    // your extensions
  ],
  content: '<p>Their going to the store.</p>'
});

let grammarChecker = null;

onMounted(() => {
  if (editor.value) {
    grammarChecker = setupTipTap(editor.value, {
      debounceMs: 1000,
      autoCheckOnLoad: true,
      autoCheckOnBlur: true
    });
  }
});

onBeforeUnmount(() => {
  grammarChecker?.destroy();
  editor.value?.destroy();
});
</script>
```

## Options

```typescript
setupTipTap(editor, {
  decorations: { Decoration, DecorationSet }, // Required: from @tiptap/pm/view
  debounceMs: 1000,           // Delay before checking after typing stops
  autoCheckOnLoad: true,      // Check grammar when editor loads
  autoCheckOnBlur: true,       // Check grammar when editor loses focus
  debug: false,               // Enable debug logging
  decorationClass: 'grammar-error-decoration', // CSS class for error highlights
  decorationStyle: 'background-color: rgba(59, 130, 246, 0.2); border-bottom: 2px wavy rgba(59, 130, 246, 0.6); cursor: help;', // Inline styles (string or object)
  decorationAttributes: {}, // Additional HTML attributes for decorations
  tooltipStyle: {}, // Customize tooltip container styles
  tooltipMessageStyle: {}, // Customize error message styles
  tooltipSuggestionsStyle: {}, // Customize suggestions section styles
  tooltipLabelStyle: {}, // Customize "Suggestions:" label styles
  tooltipListStyle: {}, // Customize suggestions list styles
  tooltipItemStyle: {} // Customize individual suggestion item styles
})
```

**Style options** (decorationStyle, tooltipStyle, etc.) can be:
- A string: `'background-color: yellow; border-bottom: 2px solid red;'`
- An object: `{ backgroundColor: 'yellow', borderBottom: '2px solid red' }` (camelCase properties are converted to CSS)

## API

The `setupTipTap` function returns an object with:

- `check()` - Manually trigger grammar check
- `destroy()` - Clean up event listeners and decorations
- `getErrors()` - Get current grammar errors array
- `getDecorations()` - Get current ProseMirror decoration set

## Customizing Decorations

You can customize how errors are highlighted in several ways:

### Using Inline Styles (String)

```typescript
const grammarChecker = setupTipTap(editor, {
  decorations: { Decoration, DecorationSet },
  decorationClass: 'my-custom-error-class',
  decorationStyle: 'background-color: yellow; text-decoration: underline; border-bottom: 2px solid red;'
});
```

### Using Inline Styles (Object)

```typescript
const grammarChecker = setupTipTap(editor, {
  decorations: { Decoration, DecorationSet },
  decorationStyle: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderBottom: '2px wavy rgba(255, 0, 0, 0.8)',
    cursor: 'help',
    textDecoration: 'underline'
  }
});
```

### Custom CSS Class

```typescript
const grammarChecker = setupTipTap(editor, {
  decorations: { Decoration, DecorationSet },
  decorationClass: 'my-custom-error-class'
});
```

Then add CSS:

```css
.my-custom-error-class {
  background-color: rgba(255, 0, 0, 0.1);
  border-bottom: 2px wavy red;
  cursor: help;
}

.my-custom-error-class:hover {
  background-color: rgba(255, 0, 0, 0.2);
}
```

### Additional Decoration Attributes

You can add custom data attributes or other HTML attributes:

```typescript
const grammarChecker = setupTipTap(editor, {
  decorations: { Decoration, DecorationSet },
  decorationAttributes: {
    'data-custom': 'value',
    'aria-label': 'Grammar error',
    title: 'Click to see suggestions'
  }
});
```

### Customizing Tooltips

You can customize the tooltip appearance:

```typescript
const grammarChecker = setupTipTap(editor, {
  decorations: { Decoration, DecorationSet },
  tooltipStyle: {
    backgroundColor: '#ffffff',
    color: '#1f2937',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  tooltipMessageStyle: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#dc2626'
  },
  tooltipSuggestionsStyle: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '2px solid #e5e7eb'
  },
  tooltipLabelStyle: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600'
  },
  tooltipItemStyle: {
    padding: '6px 0',
    color: '#2563eb',
    cursor: 'pointer'
  }
});
```

### Complete Customization Example

```typescript
const grammarChecker = setupTipTap(editor, {
  decorations: { Decoration, DecorationSet },
  decorationClass: 'grammar-error-custom',
  decorationStyle: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)', // Yellow tint
    borderBottom: '2px dashed rgba(251, 191, 36, 0.8)',
    cursor: 'pointer',
    padding: '2px 0'
  },
  decorationAttributes: {
    'data-severity': 'warning',
    'aria-label': 'Grammar suggestion'
  },
  tooltipStyle: {
    backgroundColor: '#fff7ed',
    border: '2px solid #fb923c',
    borderRadius: '8px'
  },
  tooltipMessageStyle: {
    color: '#9a3412',
    fontWeight: '600'
  },
  tooltipItemStyle: {
    color: '#ea580c'
  }
});
```

## Preserving Other Decorations

If you have other decorations in your editor, you'll need to merge them:

```typescript
const grammarChecker = setupTipTap(editor);

// Override the decorations prop to merge with existing ones
editor.view.setProps({
  decorations: (state) => {
    const grammarDecorations = grammarChecker.getDecorations();
    const otherDecorations = yourOtherDecorationSource(state);
    
    // Merge decorations (you'll need to implement this based on your needs)
    return grammarDecorations.compose(otherDecorations);
  }
});
```

## Example: Manual Check Button

```tsx
function EditorWithButton() {
  const editor = useEditor({ /* ... */ });
  const checkerRef = useRef(null);

  useEffect(() => {
    if (editor) {
      checkerRef.current = setupTipTap(editor, {
        autoCheckOnLoad: false, // Disable auto-check
        autoCheckOnBlur: false
      });
    }
  }, [editor]);

  const handleCheck = () => {
    checkerRef.current?.check();
  };

  return (
    <div>
      <EditorContent editor={editor} />
      <button onClick={handleCheck}>Check Grammar</button>
    </div>
  );
}
```

## How It Works

1. **Position Mapping**: Converts character offsets from grammar checker to ProseMirror document positions
2. **Decorations**: Uses ProseMirror's decoration system to highlight errors inline
3. **Tooltips**: Event delegation handles tooltips on decorated elements
4. **Auto-checking**: Listens to editor updates and checks grammar with debouncing
5. **Cleanup**: Properly removes event listeners and decorations on destroy

## Debug Mode

Enable debug logging to see what's happening:

```typescript
setupTipTap(editor, { debug: true });
```

This will log:
- When grammar checking starts/completes
- Error count and details
- Position mapping (char offsets → ProseMirror positions)
- Performance timing
- Event handling (updates, blur, etc.)

## Notes

- Make sure to import the CSS: `import 'opengrammer/styles'`
- The integration handles cursor position automatically (no need to worry about it)
- Tooltips work automatically with the decorations
- Clean up with `destroy()` when component unmounts
- Decorations are recreated on each check, so they stay in sync with the document

