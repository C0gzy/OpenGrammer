// Extract the sentence that contains a given character position
function getSentence(text, index) {
    const sentenceEnders = ['.', '!', '?'];
    let start = 0;
    let end = text.length;
    
    // Find sentence start
    for (let i = index - 1; i >= 0; i--) {
      if (sentenceEnders.includes(text[i])) {
        start = i + 1;
        break;
      }
    }
    
    // Find sentence end
    for (let i = index; i < text.length; i++) {
      if (sentenceEnders.includes(text[i])) {
        end = i + 1;
        break;
      }
    }
    
    return text.substring(start, end).trim();
  }

getSentence.postMessage = (text, index) => {
  return getSentence(text, index);
};