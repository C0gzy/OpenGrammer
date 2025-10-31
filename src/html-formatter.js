// Wrap grammar errors in HTML span tags for styling

export function formatTextWithErrors(text, errors) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (!errors || errors.length === 0) {
    return escapeHtml(text);
  }
  
  // Process from end to start so indices don't shift
  const sortedErrors = [...errors].sort((a, b) => b.startIndex - a.startIndex);
  
  let result = text;
  
  sortedErrors.forEach((error) => {
    const before = result.substring(0, error.startIndex);
    const errorText = result.substring(error.startIndex, error.endIndex);
    const after = result.substring(error.endIndex);
    
    const escapedErrorText = escapeHtml(errorText);
    const suggestionsJson = escapeHtml(JSON.stringify(error.suggestions));
    const messageAttr = escapeHtml(error.message);
    
    const spanTag = `<span class="grammar-error" 
      data-error-id="${error.id}" 
      data-suggestions='${suggestionsJson}' 
      data-message="${messageAttr}" 
      title="${messageAttr}">${escapedErrorText}</span>`;
    
    result = before + spanTag + after;
  });
  
  return result;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

