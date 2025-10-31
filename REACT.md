# Using OpenGrammer in React

Here are several ways to integrate OpenGrammer into your React project.

## Installation

```bash
npm install opengrammer
```

## Option 1: ContentEditable Component (Recommended)

Use the `setupContentEditable` function with a contenteditable div:

```jsx
import { useEffect, useRef } from 'react';
import { setupContentEditable } from 'opengrammer';
import 'opengrammer/styles';

function GrammarEditor() {
  const editorRef = useRef(null);
  const checkerRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      // Setup grammar checking
      checkerRef.current = setupContentEditable(editorRef.current, {
        debounceMs: 1000,
        autoCheckOnLoad: true,
        autoCheckOnBlur: true,
        debug: true // Enable debug logging
      });

      // Cleanup on unmount
      return () => {
        if (checkerRef.current) {
          checkerRef.current.destroy();
        }
      };
    }
  }, []);

  return (
    <div>
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
    </div>
  );
}
```

## Option 2: Custom Hook

Create a reusable hook for easier integration:

```jsx
import { useEffect, useRef } from 'react';
import { setupContentEditable } from 'opengrammer';
import 'opengrammer/styles';

function useGrammarChecker(selectorOrRef, options = {}) {
  const checkerRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = typeof selectorOrRef === 'string' 
      ? document.querySelector(selectorOrRef)
      : selectorOrRef?.current || selectorOrRef;

    if (!element) return;

    elementRef.current = element;
    checkerRef.current = setupContentEditable(element, options);

    return () => {
      if (checkerRef.current) {
        checkerRef.current.destroy();
      }
    };
  }, [selectorOrRef]);

  return {
    check: () => checkerRef.current?.check(),
    destroy: () => checkerRef.current?.destroy()
  };
}

// Usage
function MyEditor() {
  const editorRef = useRef(null);
  const { check } = useGrammarChecker(editorRef, { 
    debounceMs: 500,
    debug: true // Enable debug logging
  });

  return (
    <div>
      <div ref={editorRef} contentEditable />
      <button onClick={check}>Check Grammar</button>
    </div>
  );
}
```

## Option 3: Controlled Component with Textarea

For textarea/input elements, check on change:

```jsx
import { useState, useCallback } from 'react';
import { checkAndFormat, initTooltips } from 'opengrammer';
import 'opengrammer/styles';

function GrammarTextarea() {
  const [text, setText] = useState('');
  const [formatted, setFormatted] = useState('');
  const outputRef = useRef(null);

  const handleCheck = useCallback(() => {
    const result = checkAndFormat(text);
    setFormatted(result.formatted);
    
    // Initialize tooltips after React updates DOM
    setTimeout(() => {
      if (outputRef.current) {
        initTooltips(outputRef.current);
      }
    }, 0);
  }, [text]);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your text here..."
        style={{ width: '100%', minHeight: '150px' }}
      />
      <button onClick={handleCheck}>Check Grammar</button>
      
      <div
        ref={outputRef}
        dangerouslySetInnerHTML={{ __html: formatted || text }}
        style={{ marginTop: '20px', padding: '12px', border: '1px solid #ccc' }}
      />
    </div>
  );
}
```

## Option 4: Auto-checking Component

Automatically check as user types:

```jsx
import { useState, useEffect, useRef } from 'react';
import { checkAndFormat, initTooltips } from 'opengrammer';
import 'opengrammer/styles';

function AutoCheckEditor() {
  const [text, setText] = useState('');
  const editorRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Debounce grammar checking
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (editorRef.current && text) {
        const result = checkAndFormat(text);
        editorRef.current.innerHTML = result.formatted;
        initTooltips(editorRef.current);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text]);

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={(e) => setText(e.target.innerText)}
      style={{
        minHeight: '150px',
        padding: '12px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px'
      }}
    >
      {text || 'Type your text here...'}
    </div>
  );
}
```

## Option 5: Complete Component with Manual Check

Full-featured component with manual check button:

```jsx
import { useRef, useCallback } from 'react';
import { setupContentEditable } from 'opengrammer';
import 'opengrammer/styles';

function GrammarEditor() {
  const editorRef = useRef(null);
  const checkerRef = useRef(null);

  const handleSetup = useCallback((node) => {
    if (node) {
      editorRef.current = node;
      checkerRef.current = setupContentEditable(node, {
        debounceMs: 1000,
        autoCheckOnLoad: true,
        autoCheckOnBlur: true,
        debug: false // Set to true to see debug logs
      });
    }
  }, []);

  const handleManualCheck = useCallback(() => {
    checkerRef.current?.check();
  }, []);

  return (
    <div>
      <div
        ref={handleSetup}
        contentEditable
        style={{
          minHeight: '150px',
          padding: '12px',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          marginBottom: '10px'
        }}
      >
        Their going to the store. Its a nice day.
      </div>
      <button onClick={handleManualCheck}>
        Check Grammar
      </button>
    </div>
  );
}
```

## TypeScript Support

If you're using TypeScript, you can add type definitions:

```typescript
// types/opengrammer.d.ts
declare module 'opengrammer' {
  export function checkGrammar(text: string): Array<{
    id: string;
    startIndex: number;
    endIndex: number;
    text: string;
    suggestions: string[];
    message: string;
  }>;

  export function formatText(text: string, errors: any[]): string;

  export function checkAndFormat(text: string): {
    errors: any[];
    formatted: string;
  };

  export function initTooltips(container: HTMLElement | string): void;
  export function removeTooltips(container: HTMLElement | string): void;

  export function setupContentEditable(
    selectorOrElement: string | HTMLElement,
    options?: {
      debounceMs?: number;
      autoCheckOnLoad?: boolean;
      autoCheckOnBlur?: boolean;
      debug?: boolean;
    }
  ): {
    check: () => void;
    destroy: () => void;
  } | undefined;
}
```

## Debug Mode

Enable debug logging to see what's happening under the hood:

```jsx
setupContentEditable(editorRef.current, {
  debug: true // Logs checking status, errors found, timing, etc.
});
```

Debug output includes:
- When grammar checking starts/completes
- Number of errors found and their details
- Performance timing
- Cursor position restoration
- Debounce and blur events
- Initialization status

## Notes

- Make sure to import the CSS: `import 'opengrammer/styles'`
- For contenteditable elements, use `setupContentEditable` for the best experience
- The function handles cursor position preservation automatically
- Clean up on component unmount to prevent memory leaks
- Tooltips work automatically after calling `initTooltips` or using `setupContentEditable`
- Enable `debug: true` during development to troubleshoot issues

