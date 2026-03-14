export const MORSE_CODE: Record<string, string> = {
  // Letters
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  // Numbers
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  // Punctuation
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
  // Special
  ' ': '/'
};

// Prosigns (represented as single keys for mapping)
export const PROSIGNS: Record<string, string> = {
  '<BT>': '-...-',   // Break
  '<SK>': '...-.-',  // End of contact
  '<AR>': '.-.-.',   // End of message
  '<KN>': '-.--.',   // Invitation to specific station
  '<SOS>': '...---...', // Distress signal
};

export const MORSE_TO_CHAR: Record<string, string> = {
  ...Object.entries(MORSE_CODE).reduce((acc, [char, morse]) => {
    if (char !== ' ') acc[morse] = char;
    return acc;
  }, {} as Record<string, string>),
  ...Object.entries(PROSIGNS).reduce((acc, [char, morse]) => {
    acc[morse] = char;
    return acc;
  }, {} as Record<string, string>)
};

export interface MorseSettings {
  dotDuration: number;
  dashDuration: number;
  symbolSpace: number;
  letterSpace: number;
  wordSpace: number;
  visualFlash: boolean;
  customPatterns: Record<string, number[]>;
}

export const DEFAULT_SETTINGS: MorseSettings = {
  dotDuration: 100,
  dashDuration: 300,
  symbolSpace: 100,
  letterSpace: 300,
  wordSpace: 700,
  visualFlash: true,
  customPatterns: {
    'SOS': [100, 100, 100, 100, 100, 300, 300, 100, 300, 100, 300, 300, 100, 100, 100, 100, 100],
    'HI': [100, 100, 100, 100, 100, 100, 100, 300, 100, 100, 100],
  },
};

export function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map(char => MORSE_CODE[char] || '')
    .filter(code => code !== '')
    .join(' ');
}

export function morseToVibrationPattern(morse: string, settings: MorseSettings = DEFAULT_SETTINGS): number[] {
  const pattern: number[] = [];
  
  for (let i = 0; i < morse.length; i++) {
    const char = morse[i];
    
    if (char === '.') {
      pattern.push(settings.dotDuration);
      pattern.push(settings.symbolSpace);
    } else if (char === '-') {
      pattern.push(settings.dashDuration);
      pattern.push(settings.symbolSpace);
    } else if (char === ' ') {
      if (pattern.length > 0 && pattern[pattern.length - 1] === settings.symbolSpace) {
        pattern[pattern.length - 1] = settings.letterSpace;
      }
    } else if (char === '/') {
      if (pattern.length > 0) {
        pattern[pattern.length - 1] = settings.wordSpace;
      }
    }
  }
  
  return pattern;
}

export function textToVibrationPattern(text: string, settings: MorseSettings = DEFAULT_SETTINGS): number[] {
  const words = text.toUpperCase().trim().split(/\s+/);
  const finalPattern: number[] = [];

  words.forEach((word, wordIndex) => {
    // Check if the entire word has a custom pattern
    if (settings.customPatterns && settings.customPatterns[word]) {
      finalPattern.push(...settings.customPatterns[word]);
    } else {
      // Process character by character
      const chars = word.split('');
      chars.forEach((char, charIndex) => {
        if (settings.customPatterns && settings.customPatterns[char]) {
          finalPattern.push(...settings.customPatterns[char]);
        } else {
          const morse = MORSE_CODE[char] || '';
          const charPattern = morseToVibrationPattern(morse, settings);
          finalPattern.push(...charPattern);
        }
        
        // Add letter space if not the last character in word
        if (charIndex < chars.length - 1) {
          if (finalPattern.length % 2 === 1) {
            finalPattern.push(settings.letterSpace);
          } else if (finalPattern.length > 0) {
            finalPattern[finalPattern.length - 1] = settings.letterSpace;
          }
        }
      });
    }

    // Add word space if not the last word
    if (wordIndex < words.length - 1) {
      if (finalPattern.length % 2 === 1) {
        finalPattern.push(settings.wordSpace);
      } else if (finalPattern.length > 0) {
        finalPattern[finalPattern.length - 1] = settings.wordSpace;
      }
    }
  });

  // Ensure it ends with a vibration (remove trailing pause)
  if (finalPattern.length % 2 === 0 && finalPattern.length > 0) {
    finalPattern.pop();
  }

  return finalPattern;
}
