// Grammar checking rules and helpers

/**
 * @typedef {Object} GrammarRule
 * @property {RegExp} pattern
 * @property {string} message
 * @property {Function} getSuggestions
 * @property {Function} [contextCheck]
 */

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

// Get words before/after a match to check context
function getContext(text, index, length) {
  const before = text.substring(Math.max(0, index - 50), index).trim();
  const after = text.substring(index + length, Math.min(text.length, index + length + 50)).trim();
  const sentence = getSentence(text, index);
  const wordsBefore = before.split(/\s+/).filter(w => w.length > 0);
  const wordsAfter = after.split(/\s+/).filter(w => w.length > 0);
  
  // Strip punctuation from words for matching
  const nextWordRaw = wordsAfter[0] || '';
  const nextWord = nextWordRaw.toLowerCase().replace(/[.,!?;:]+$/, '');
  const secondWordRaw = wordsAfter[1] || '';
  const secondWord = secondWordRaw.toLowerCase().replace(/[.,!?;:]+$/, '');
  
  return {
    before,
    after,
    sentence,
    wordsBefore,
    wordsAfter,
    nextWord: nextWord,
    secondWord: secondWord,
    prevWord: wordsBefore[wordsBefore.length - 1]?.toLowerCase().replace(/[.,!?;:]+$/, '') || ''
  };
}

// Quick check if a word is probably a noun
function isLikelyNoun(word) {
  if (!word) return false;
  const commonNouns = ['car', 'house', 'dog', 'cat', 'book', 'person', 'people', 'friend', 'day', 'time', 'thing', 'way', 'man', 'woman', 'child', 'work', 'life', 'world', 'school', 'home', 'family', 'year', 'place', 'city', 'country', 'name', 'problem', 'question', 'answer', 'idea', 'job', 'word', 'number', 'name', 'part', 'hand', 'eye', 'head', 'body', 'face', 'door', 'window', 'room', 'food', 'water', 'money', 'love', 'mind', 'heart', 'soul', 'spirit', 'son', 'daughter', 'mother', 'father', 'brother', 'sister', 'process', 'system', 'method', 'approach', 'strategy', 'plan', 'project', 'task', 'activity', 'event', 'service', 'product', 'item', 'element', 'component', 'feature', 'function', 'tool', 'device', 'machine', 'equipment', 'material', 'substance', 'resource', 'asset', 'property', 'document', 'file', 'record', 'account', 'report', 'article', 'story', 'chapter', 'section', 'page', 'line', 'point', 'detail', 'fact', 'information', 'data', 'knowledge', 'skill', 'ability', 'talent', 'experience', 'background', 'history', 'culture', 'tradition', 'custom', 'habit', 'routine', 'pattern', 'behavior', 'action', 'movement', 'change', 'development', 'growth', 'progress', 'improvement', 'increase', 'decrease', 'reduction', 'addition', 'subtraction', 'multiplication', 'division', 'calculation', 'computation', 'analysis', 'study', 'research', 'investigation', 'examination', 'inspection', 'review', 'evaluation', 'assessment', 'judgment', 'decision', 'choice', 'option', 'alternative', 'possibility', 'opportunity', 'chance', 'risk', 'danger', 'threat', 'challenge', 'difficulty', 'problem', 'issue', 'concern', 'matter', 'subject', 'topic', 'theme', 'focus', 'attention', 'interest', 'concern', 'care', 'worry', 'anxiety', 'fear', 'hope', 'dream', 'goal', 'objective', 'target', 'aim', 'purpose', 'intention', 'motivation', 'reason', 'cause', 'effect', 'result', 'outcome', 'consequence', 'impact', 'influence', 'power', 'strength', 'force', 'energy', 'effort', 'work', 'labor', 'task', 'duty', 'responsibility', 'obligation', 'requirement', 'need', 'demand', 'request', 'question', 'inquiry', 'query', 'statement', 'declaration', 'announcement', 'message', 'communication', 'conversation', 'discussion', 'debate', 'argument', 'disagreement', 'conflict', 'dispute', 'controversy', 'disagreement', 'difference', 'similarity', 'comparison', 'contrast', 'relationship', 'connection', 'link', 'bond', 'tie', 'association', 'partnership', 'collaboration', 'cooperation', 'team', 'group', 'organization', 'company', 'business', 'enterprise', 'industry', 'sector', 'field', 'area', 'domain', 'realm', 'sphere', 'world', 'universe', 'space', 'environment', 'atmosphere', 'surroundings', 'setting', 'location', 'position', 'place', 'spot', 'site', 'venue', 'arena', 'stage', 'platform', 'base', 'foundation', 'ground', 'floor', 'surface', 'level', 'layer', 'stratum', 'level', 'tier', 'rank', 'grade', 'class', 'category', 'type', 'kind', 'sort', 'variety', 'form', 'shape', 'structure', 'framework', 'design', 'pattern', 'model', 'example', 'instance', 'case', 'sample', 'specimen'];
  return commonNouns.includes(word.toLowerCase()) || /^[A-Z]/.test(word);
}

// unneeded for now, but could be used later
function islikelyaAdjective(word) {
  if (!word) return false;
  const commonAdjectives = ['good', 'bad', 'nice', 'fine', 'okay', 'ok', 'a', 'the', 'not', 'very', 'happy', 'sad', 'angry', 'anxious', 'depressed', 'excited', 'frightened', 'glad', 'helpless', 'lonely', 'miserable', 'nervous', 'obnoxious', 'outraged', 'repulsed', 'terrible', 'thoughtless', 'tired', 'upset', 'worried'];
  return commonAdjectives.includes(word.toLowerCase());
}

// expetion ing's
function isExceptionIng(word) {
    if (!word) return false;
    const excpetionIng = ['booking' , "meeting", "training", "building", "painting", "hearing", "understanding",
        "feeling", "recording", "reading", "following", "planning", "offering",
        "writing", "finding", "beginning", "funding", "dressing", "setting",
        "housing", "manufacturing", "learning", "teaching", "processing", "printing",
        "engineering", "advertising", "marketing", "packaging", "handling" ];
    return excpetionIng.includes(word.toLowerCase());
}
// Check if word looks like a verb (ends with ing, ed, etc)
function isVerbForm(word) {
  if (!word) return false;
  const verbPatterns = ['ing$', 'ed$', 'es$', 's$'];
  return verbPatterns.some(pattern => new RegExp(pattern).test(word.toLowerCase()));
}

// Grammar rules we check for
const grammarRules = [
  // there/their/they're
  {
    pattern: /\b(there|their|they're)\b/gi,
    message: "Check usage of 'there', 'their', or 'they're'",
    getSuggestions: (match, fullMatch, text, index) => {
      const word = match.toLowerCase();
      const context = getContext(text, index, match.length);
      
      if (word === 'their') {
        // "their" + noun is correct
        if (isLikelyNoun(context.nextWord) || isExceptionIng(context.nextWord)) {
          return [];
        }
        // "their is" should be "there is"
        if (['is', 'are', 'was', 'were'].includes(context.nextWord)) {
          return ['there'];
        }
        // "their going" should be "they're going"
        if (isVerbForm(context.nextWord) || ['going', 'coming', 'doing', 'saying', 'looking'].includes(context.nextWord)) {
          return ["they're"];
        }
        return ['there', "they're"];
      }
      
      if (word === 'there') {
        // "there is/are" is correct
        if (['is', 'are', 'was', 'were'].includes(context.nextWord)) {
          return [];
        }
        // "there car" should be "their car"
        if (isLikelyNoun(context.nextWord)) {
          return ['their'];
        }
        return ['their', "they're"];
      }
      
      if (word === "they're") {
        // Check if followed by an -ing word that could be a noun
        // If the -ing word is followed by a noun, then it's being used as a noun
        // Example: "they're booking process" -> "booking" is a noun (should be "their")
        if (isExceptionIng(context.nextWord) || (isVerbForm(context.nextWord) && context.nextWord.endsWith('ing'))) {
          // If the -ing word is followed by a noun, it's being used as a noun
          if (context.secondWord && isLikelyNoun(context.secondWord)) {
            return ['their']; // "they're booking process" -> "their booking process"
          }
          // If no second word or it's punctuation, could be "they're booking" (verb) - acceptable
          if (!context.secondWord || context.after.match(/^[,\.!?\s]/)) {
            return []; // "they're booking" (as verb) is okay
          }
        }
        
        // "they're going/happy" is correct (verb or adjective)
        if ((isVerbForm(context.nextWord) && !isExceptionIng(context.nextWord)) || ['going', 'coming', 'doing', 'saying', 'looking', 'happy', 'sad', 'good', 'bad'].includes(context.nextWord)) {
          return [];
        }
        // "they're car" should be "their car"
        if (isLikelyNoun(context.nextWord)) {
          return ['their'];
        }
        return ['there', 'their'];
      }
      
      return [];
    },
    contextCheck: function(match, text, index) {
      const suggestions = this.getSuggestions(match[0], match, text, index);
      return suggestions.length > 0;
    }
  },
  
  // its/it's
  {
    pattern: /\b(it's|its)\b/gi,
    message: "Check usage of 'its' (possessive) vs 'it's' (it is)",
    getSuggestions: (match, fullMatch, text, index) => {
      const word = match[0].toLowerCase();
      const context = getContext(text, index, match.length);
      
      if (word === 'its') {
        // "its color" is correct
        if (isLikelyNoun(context.nextWord)) {
          return [];
        }
        // "its good" should be "it's good"
        if (isVerbForm(context.nextWord) || ['good', 'bad', 'nice', 'fine', 'okay', 'ok'].includes(context.nextWord)) {
          return ["it's"];
        }
        return ["it's"];
      }
      
      if (word === "it's") {
        // "it's good/nice" is correct
        if (isVerbForm(context.nextWord) || ['good', 'bad', 'nice', 'fine', 'okay', 'ok', 'a', 'the', 'not', 'very'].includes(context.nextWord)) {
          return [];
        }
        // "it's color" should be "its color"
        if (isLikelyNoun(context.nextWord)) {
          return ['its'];
        }
        return ['its'];
      }
      
      return [];
    },
    contextCheck: function(match, text, index) {
      const suggestions = this.getSuggestions(match[0], match, text, index);
      return suggestions.length > 0;
    }
  },
  
  // your/you're
  {
    pattern: /\b(your|you're)\b/gi,
    message: "Check usage of 'your' (possessive) vs 'you're' (you are)",
    getSuggestions: (match, fullMatch, text, index) => {
      const word = match[0].toLowerCase();
      const context = getContext(text, index, match.length);
      
      if (word === 'your') {
        // "your friend" is correct
        if (isLikelyNoun(context.nextWord)) {
          return [];
        }
        // "your going" should be "you're going"
        if (isVerbForm(context.nextWord) || ['going', 'coming', 'doing', 'saying', 'looking', 'happy', 'sad', 'good', 'bad', 'nice'].includes(context.nextWord)) {
          return ["you're"];
        }
        return ["you're"];
      }
      
      if (word === "you're") {
        // "you're happy/going" is correct
        if (isVerbForm(context.nextWord) || ['going', 'coming', 'doing', 'saying', 'looking', 'happy', 'sad', 'good', 'bad', 'nice'].includes(context.nextWord)) {
          return [];
        }
        // "you're friend" should be "your friend"
        if (isLikelyNoun(context.nextWord)) {
          return ['your'];
        }
        return ['your'];
      }
      
      return [];
    },
    contextCheck: function(match, text, index) {
      const suggestions = this.getSuggestions(match[0], match, text, index);
      return suggestions.length > 0;
    }
  },
  
  // to/too/two
  {
    pattern: /\b(to|too|two)\b/gi,
    message: "Check usage of 'to', 'too', or 'two'",
    getSuggestions: (match, fullMatch, text, index) => {
      const word = match[0].toLowerCase();
      const context = getContext(text, index, match.length);
      
      if (word === 'to') {
        // "to go/do/have" is correct (infinitive)
        if (isVerbForm(context.nextWord) || ['go', 'be', 'do', 'have', 'get', 'make', 'see', 'know', 'think', 'take', 'come', 'give', 'find', 'tell', 'work', 'call', 'try', 'ask', 'need', 'want', 'use', 'say', 'let', 'help', 'keep', 'turn', 'move', 'play', 'run', 'show', 'hear', 'bring', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'raise', 'pass', 'sell', 'decide', 'return', 'explain', 'develop', 'carry', 'break', 'receive', 'agree', 'support', 'hit', 'produce', 'eat', 'cover', 'catch', 'draw', 'choose'].includes(context.nextWord)) {
          return [];
        }
        // "to much" should be "too much"
        if (/^\d+/.test(context.nextWord) || ['much', 'many'].includes(context.nextWord)) {
          return ['too'];
        }
        return ['too', 'two'];
      }
      
      if (word === 'too') {
        // "too much/good" is correct
        if (['much', 'many', 'little', 'few', 'big', 'small', 'good', 'bad', 'fast', 'slow', 'early', 'late', 'long', 'short', 'high', 'low', 'hot', 'cold', 'easy', 'hard', 'nice', 'sad', 'happy'].includes(context.nextWord)) {
          return [];
        }
        // "too," at end might be "also"
        if (context.after.match(/^[,\.!?\s]/)) {
          return [];
        }
        // "too go" should be "to go"
        if (isVerbForm(context.nextWord)) {
          return ['to'];
        }
        return ['to', 'two'];
      }
      
      if (word === 'two') {
        // "two cars" or "two hundred" is correct
        if (isLikelyNoun(context.nextWord) || ['hundred', 'thousand', 'million'].includes(context.nextWord)) {
          return [];
        }
        // "to two" is probably fine
        if (context.prevWord === 'to' || /^\d+/.test(context.nextWord)) {
          return [];
        }
        return ['to', 'too'];
      }
      
      return [];
    },
    contextCheck: function(match, text, index) {
      const suggestions = this.getSuggestions(match[0], match, text, index);
      return suggestions.length > 0;
    }
  },
  
  // Double spaces
  {
    pattern: / {2,}/g,
    message: "Multiple consecutive spaces detected",
    getSuggestions: () => [' ']
  },
  
  // Missing capitalization after period
  {
    pattern: /\.\s+([a-z])/g,
    message: "Sentence should start with capital letter after period",
    getSuggestions: (match, fullMatch) => {
      const letter = fullMatch[1];
      return [letter.toUpperCase()];
    }
  },
  
  // Multiple periods
  {
    pattern: /\.{3,}/g,
    message: "Use ellipsis (...) instead of multiple periods",
    getSuggestions: () => ['...']
  },
  
  // Missing apostrophes in contractions
  {
    pattern: /\b(dont|cant|wont|isnt|arent|wasnt|werent|hasnt|havent|shouldnt|couldnt|wouldnt)\b/gi,
    message: "Missing apostrophe in contraction",
    getSuggestions: (match) => {
      const word = match.toLowerCase();
      const contractions = {
        'dont': "don't",
        'cant': "can't",
        'wont': "won't",
        'isnt': "isn't",
        'arent': "aren't",
        'wasnt': "wasn't",
        'werent': "weren't",
        'hasnt': "hasn't",
        'havent': "haven't",
        'shouldnt': "shouldn't",
        'couldnt': "couldn't",
        'wouldnt': "wouldn't"
      };
      return [contractions[word] || match];
    }
  }
];

// Main function to check text for grammar errors
export function checkGrammar(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const errors = [];
  let errorId = 0;
  
  grammarRules.forEach((rule) => {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      // Prevent infinite loops
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }
      
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      const matchedText = match[0];
      
      // Check context first to avoid false positives
      if (rule.contextCheck && !rule.contextCheck.call(rule, match, text, startIndex)) {
        continue;
      }
      
      // Get suggestions for this error
      const suggestions = rule.getSuggestions 
        ? rule.getSuggestions(matchedText, match, text, startIndex)
        : [];
      
      // Skip if no suggestions (not actually an error)
      if (suggestions.length === 0) {
        continue;
      }
      
      errors.push({
        id: `error-${errorId++}`,
        startIndex,
        endIndex,
        text: matchedText,
        suggestions: Array.isArray(suggestions) ? suggestions : [suggestions],
        message: rule.message
      });
    }
  });
  
  // Sort by position
  errors.sort((a, b) => a.startIndex - b.startIndex);
  
  // Remove overlapping errors (keep the first one)
  const filteredErrors = [];
  let lastEndIndex = -1;
  
  errors.forEach((error) => {
    if (error.startIndex >= lastEndIndex) {
      filteredErrors.push(error);
      lastEndIndex = error.endIndex;
    }
  });
  
  return filteredErrors;
}

