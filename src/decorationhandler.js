export function UpdateStyle(Style, AddedStyles) {
  switch (Style) {
    case "TooltipStyle":
      return Object.assign(TooltipStyle, AddedStyles);
    case "defaultMessageStyle":
      return Object.assign(defaultMessageStyle, AddedStyles);
    case "defaultSuggestionsStyle":
      return Object.assign(defaultSuggestionsStyle, AddedStyles);
    case "defaultLabelStyle":
      return Object.assign(defaultLabelStyle, AddedStyles);
    case "defaultListStyle":
      return Object.assign(defaultListStyle, AddedStyles);
    case "defaultItemStyle":
      return Object.assign(defaultItemStyle, AddedStyles);
    case "grammarerror":
      return Object.assign(grammarerror, AddedStyles);
  }
}

export function UpdateCSSStyleSheet(selector, props, sheets) {
  // get stylesheet(s)
  if (!sheets) sheets = [...document.styleSheets];
  else if (typeof sheets === "string") {
    // sheets is a string (URL)
    let absoluteURL = new URL(sheets, document.baseURI).href;
    sheets = [...document.styleSheets].filter((i) => i.href == absoluteURL);
  } else sheets = [sheets]; // sheets is a stylesheet

  // CSS (& HTML) reduce spaces to one. TODO: ignore quoted spaces.
  selector = selector.replace(/\s+/g, " ");
  const findRule = (s) => {
    try {
      return [...s.cssRules]
        .reverse()
        .find(
          (i) =>
            i.selectorText && i.selectorText.replace(/\s+/g, " ") === selector,
        );
    } catch (e) {
      // Some stylesheets may not be accessible (CORS)
      return null;
    }
  };
  let rule = sheets
    .map(findRule)
    .filter((i) => i)
    .pop();

  const isString = typeof props === "string";
  const propsArr = isString
    ? props.split(/\s*;\s*/).map((i) => i.split(/\s*:\s*/)) // from string
    : Object.entries(props); // from Object

  if (rule) {
    for (let [prop, val] of propsArr) {
      // Handle CSS properties with hyphens
      if (prop.includes("-")) {
        rule.style.setProperty(prop, val);
      } else {
        rule.style[prop] = val;
      }
    }
  } else {
    var sheet = sheets.pop();
    if (!sheet) {
      // No accessible stylesheet found, create a new style element
      const style = document.createElement("style");
      document.head.appendChild(style);
      sheet = style.sheet;
    }
    if (!isString) {
      props = propsArr.reduce((str, [k, v]) => `${str}${k}: ${v}; `, "").trim();
    }
    try {
      sheet.insertRule(`${selector} { ${props} }`, sheet.cssRules.length);
    } catch (e) {
      console.warn(`Failed to insert CSS rule for ${selector}:`, e);
    }
  }
}

const grammarerror = {
  position: "relative",
  "text-decoration": "underline",
  "text-decoration-color": "#3b82f6",
  "text-decoration-thickness": "2px",
  "text-decoration-style": "wavy",
  cursor: "help",
  "background-color": "transparent",
};

const TooltipStyle = {
  position: "fixed",
  backgroundColor: "#1f2937",
  color: "#f9fafb",
  padding: "12px 16px",
  borderRadius: "8px",
  fontSize: "14px",
  zIndex: "10000",
  maxWidth: "300px",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  pointerEvents: "none",
};

const defaultMessageStyle = {
  fontWeight: "500",
  marginBottom: "8px",
};

const defaultSuggestionsStyle = {
  marginTop: "8px",
  paddingTop: "8px",
  borderTop: "1px solid rgba(255, 255, 255, 0.2)",
};

const defaultLabelStyle = {
  fontSize: "12px",
  color: "#9ca3af",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const defaultListStyle = {
  listStyle: "none",
  padding: "0",
  margin: "0",
};

const defaultItemStyle = {
  padding: "4px 0",
  color: "#60a5fa",
};
