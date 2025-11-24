// Grammar checking rules and helpers

/**
 * @typedef {Object} GrammarRule
 * @property {RegExp} pattern
 * @property {string} message
 * @property {Function} getSuggestions
 * @property {Function} [contextCheck]
 */

import { 
  correctTo, youreCorrectVersion, correctToo, excpetionIng, contractions, hyphens, concise, commonNouns, Anexceptions 
} from './DictList.js';

// Get words before/after a match to check context
function getContext(text, index, length) {
  const before = text.substring(Math.max(0, index - 50), index).trim();
  const after = text.substring(index + length, Math.min(text.length, index + length + 50)).trim();
  const sentence = new Worker(new URL('getSentence.js', import.meta.url)).postMessage({text, index});
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
  word = word.replace(/[':]/g, '')
  if ( word[word.length - 1].toLowerCase() == 's' ) {
    word = word.slice(0, -1);
  }

  return commonNouns.includes(word.toLowerCase())  || /^[A-Z]/.test(word);
}

function AnAExceptions(word) {
  
  return Anexceptions.includes(word.toLowerCase());
}

// expetion ing's
function isExceptionIng(word) {
    if (!word) return false;
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
        if (isVerbForm(context.nextWord) || youreCorrectVersion.includes(context.nextWord)) {
          return ["you're"];
        }
        return ["you're"];
      }
      
      if (word === "you're") {
        // "you're happy/going" is correct
        if (isVerbForm(context.nextWord) || youreCorrectVersion.includes(context.nextWord)) {
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
        if (isVerbForm(context.nextWord) || correctTo.includes(context.nextWord)) {
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
        if (correctToo.includes(context.nextWord)) {
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

  // An / a
  {
    pattern: /\b(an|a)\b/gi,
    message: "Check usage of 'an' or 'a'",
    getSuggestions: (match, fullMatch, text, index) => {
      const word = match.toLowerCase();
      const context = getContext(text, index, match.length);
      if (word === 'an') {
        if (context.nextWord[0].match(/^[aeiou]/) || AnAExceptions(context.nextWord)) {
          return [];
        }
        return ['a'];
      }
      if (word === 'a') {
        if (context.nextWord[0].match(/^[aeiou]/) || AnAExceptions(context.nextWord)) {
          return ['an'];
        }
        return [];
      }
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
     
      return [contractions[word] || match];
    }
  },
  // join words with -
  {
    pattern: /\b(end to end|state of the art|up to date|well known|long term|short term|real time|high quality|low cost|full time|part time|hands on|one on one|face to face|day to day|word for word|side by side|back to back|well being|self esteem|long standing|wide ranging|far reaching|close knit|high end|low end|middle aged|old fashioned|new found|well rounded|well informed|well established|well deserved|well designed|well written|well made|well maintained|well documented|well received|well thought|well planned|well organized|well structured|well balanced|well educated|well trained|well equipped|well prepared|well executed|well managed|well funded|well supported|well liked|well respected|well regarded|well understood|well defined|well developed|well tested|well proven|well researched|well studied|well publicized|well advertised|well marketed|well positioned|well placed|well timed|well coordinated|well integrated|well connected|well synchronized|well aligned|well matched|well suited|well adapted|well adjusted)\b/gi,
    message: "Join words with a hyphen",
    getSuggestions: (match, fullMatch) => {
      console.log(match);
      const words = match.toLowerCase().split(' ');
      return [hyphens[words.join(' ')] || match];
    }
  },

  // concise language
  {
    pattern: /\b(as a whole the|in order to|due to the fact that|at this point in time|in the event that|for the purpose of|in the case of|with regard to|a large number of|a small number of|in the near future|at the present time|as a result of|in spite of the fact that|on account of the fact that|in the absence of|in the presence of|in the course of|with respect to|it is important to note that|it should be noted that|there is no doubt that|it is clear that|it is evident that|in terms of|for all intents and purposes|in the final analysis)\b/gi,
    message: "Concise language may be preferred",
    getSuggestions: (match, fullMatch) => {

      const words = match.toLowerCase().split(' ');
      return [concise[words.join(' ')] || match];
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

