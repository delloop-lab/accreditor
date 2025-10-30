/**
 * Locale-aware number parsing and formatting utilities
 * Handles EU/US number formats for input, storage, and display
 */

export interface LocaleInfo {
  country: string;
  currency: string;
}

/**
 * Parse a localized number string to a normalized US-format number
 * Handles various input formats: 1.234,56, 1 234,56, 1,234.56, 1234.56, etc.
 */
export function parseNumberFromLocale(
  input: string, 
  localeInfo: LocaleInfo
): { value: number | null; error: string | null } {
  if (!input || input.trim() === '') {
    return { value: null, error: null };
  }

  // Clean the input - remove all thousands separators
  let cleaned = input
    .replace(/[\s\u00A0]/g, '') // Remove spaces and non-breaking spaces
    .replace(/[.,](?=.*[.,])/g, '') // Remove all but the last separator
    .trim();

  if (cleaned === '') {
    return { value: null, error: null };
  }

  // Handle edge cases
  if (cleaned === '-' || cleaned === '+' || cleaned === '.') {
    return { value: null, error: 'Incomplete number' };
  }

  // Remove leading/trailing decimal points
  if (cleaned.startsWith('.') || cleaned.endsWith('.')) {
    cleaned = cleaned.replace(/^\.+|\.+$/g, '');
  }

  // Detect if this is EU format (comma as decimal separator)
  const isEUFormat = localeInfo.country && 
    ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'PT', 'GR', 'IE', 'LU', 'MT', 'CY', 'SK', 'SI', 'EE', 'LV', 'LT', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SE', 'DK', 'NO', 'IS', 'CH', 'LI', 'AD', 'MC', 'SM', 'VA'].includes(localeInfo.country.toUpperCase());

  let normalizedValue: number;
  
  try {
    if (isEUFormat) {
      // EU format: comma as decimal separator, dot as thousands separator
      // Convert comma to dot for decimal separator
      cleaned = cleaned.replace(/,/g, '.');
    } else {
      // US format: dot as decimal separator, comma as thousands separator
      // Remove commas (thousands separators)
      cleaned = cleaned.replace(/,/g, '');
    }

    // Final validation - ensure we have a valid number
    if (!/^-?\d*\.?\d*$/.test(cleaned)) {
      return { 
        value: null, 
        error: 'Invalid number format' 
      };
    }

    normalizedValue = parseFloat(cleaned);
    
    if (isNaN(normalizedValue)) {
      return { 
        value: null, 
        error: 'Invalid number format' 
      };
    }

    // Check for reasonable bounds
    if (normalizedValue < -999999999 || normalizedValue > 999999999) {
      return { 
        value: null, 
        error: 'Number too large' 
      };
    }

    return { value: normalizedValue, error: null };
  } catch (error) {
    return { 
      value: null, 
      error: 'Invalid number format' 
    };
  }
}

/**
 * Format a number for display according to user's locale
 */
export function formatNumberForDisplay(
  value: number, 
  localeInfo: LocaleInfo, 
  options: { style?: 'currency' | 'decimal'; minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  const { style = 'decimal', minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;
  
  // Determine locale string from country
  const localeMap: { [key: string]: string } = {
    'US': 'en-US',
    'GB': 'en-GB',
    'DE': 'de-DE',
    'FR': 'fr-FR',
    'ES': 'es-ES',
    'IT': 'it-IT',
    'NL': 'nl-NL',
    'BE': 'nl-BE',
    'AT': 'de-AT',
    'FI': 'fi-FI',
    'PT': 'pt-PT',
    'GR': 'el-GR',
    'IE': 'en-IE',
    'LU': 'fr-LU',
    'MT': 'en-MT',
    'CY': 'el-CY',
    'SK': 'sk-SK',
    'SI': 'sl-SI',
    'EE': 'et-EE',
    'LV': 'lv-LV',
    'LT': 'lt-LT',
    'PL': 'pl-PL',
    'CZ': 'cs-CZ',
    'HU': 'hu-HU',
    'RO': 'ro-RO',
    'BG': 'bg-BG',
    'HR': 'hr-HR',
    'SE': 'sv-SE',
    'DK': 'da-DK',
    'NO': 'nb-NO',
    'IS': 'is-IS',
    'CH': 'de-CH',
    'LI': 'de-LI',
    'AD': 'ca-AD',
    'MC': 'fr-MC',
    'SM': 'it-SM',
    'VA': 'it-VA'
  };

  const locale = localeMap[localeInfo.country?.toUpperCase()] || 'en-US';
  
  const formatOptions: Intl.NumberFormatOptions = {
    style,
    minimumFractionDigits,
    maximumFractionDigits
  };

  if (style === 'currency') {
    formatOptions.currency = localeInfo.currency || 'USD';
  }

  return new Intl.NumberFormat(locale, formatOptions).format(value);
}

/**
 * Get input placeholder text based on locale
 */
export function getNumberInputPlaceholder(localeInfo: LocaleInfo): string {
  const isEUFormat = localeInfo.country && 
    ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'PT', 'GR', 'IE', 'LU', 'MT', 'CY', 'SK', 'SI', 'EE', 'LV', 'LT', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SE', 'DK', 'NO', 'IS', 'CH', 'LI', 'AD', 'MC', 'SM', 'VA'].includes(localeInfo.country.toUpperCase());
  
  return isEUFormat ? '1.234,56' : '1,234.56';
}

/**
 * Validate if a string represents a valid number in the given locale
 */
export function isValidNumberInput(input: string, localeInfo: LocaleInfo): boolean {
  const result = parseNumberFromLocale(input, localeInfo);
  return result.value !== null && result.error === null;
}

/**
 * Extract currency symbol from a string and return the cleaned number
 */
export function extractCurrencyFromString(input: string, localeInfo: LocaleInfo): { 
  cleanedInput: string; 
  currencySymbol: string | null 
} {
  if (!input || input.trim() === '') {
    return { cleanedInput: '', currencySymbol: null };
  }

  // Common currency symbols
  const currencySymbols = ['$', '€', '£', '¥', '₹', '₽', '₩', '₪', '₦', '₨', '₫', '₴', '₸', '₺', '₼', '₾', '₿'];
  
  let cleanedInput = input.trim();
  let currencySymbol = null;

  // Check for currency symbols at the beginning or end
  for (const symbol of currencySymbols) {
    if (cleanedInput.startsWith(symbol)) {
      currencySymbol = symbol;
      cleanedInput = cleanedInput.substring(symbol.length).trim();
      break;
    } else if (cleanedInput.endsWith(symbol)) {
      currencySymbol = symbol;
      cleanedInput = cleanedInput.substring(0, cleanedInput.length - symbol.length).trim();
      break;
    }
  }

  return { cleanedInput, currencySymbol };
}

/**
 * Enhanced parsing that handles currency symbols
 */
export function parseNumberWithCurrency(
  input: string, 
  localeInfo: LocaleInfo
): { value: number | null; error: string | null; currencySymbol: string | null } {
  const { cleanedInput, currencySymbol } = extractCurrencyFromString(input, localeInfo);
  const result = parseNumberFromLocale(cleanedInput, localeInfo);
  
  return {
    value: result.value,
    error: result.error,
    currencySymbol
  };
}
