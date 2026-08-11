// === CURRENCY SYSTEM (v15.8.1) ===
const CURRENCY_CONFIG = {
  // Southeast Asia
  MYR: { symbol: 'RM', locale: 'en-MY', name: 'Malaysian Ringgit' },
  SGD: { symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar' },
  IDR: { symbol: 'Rp', locale: 'id-ID', name: 'Indonesian Rupiah' },
  THB: { symbol: '฿', locale: 'th-TH', name: 'Thai Baht' },
  PHP: { symbol: '₱', locale: 'en-PH', name: 'Philippine Peso' },
  VND: { symbol: '₫', locale: 'vi-VN', name: 'Vietnamese Dong' },
  BND: { symbol: 'B$', locale: 'ms-BN', name: 'Brunei Dollar' },
  MMK: { symbol: 'K', locale: 'my-MM', name: 'Myanmar Kyat' },
  KHR: { symbol: '៛', locale: 'km-KH', name: 'Cambodian Riel' },
  // East Asia
  JPY: { symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
  CNY: { symbol: '¥', locale: 'zh-CN', name: 'Chinese Yuan' },
  KRW: { symbol: '₩', locale: 'ko-KR', name: 'South Korean Won' },
  TWD: { symbol: 'NT$', locale: 'zh-TW', name: 'Taiwan Dollar' },
  HKD: { symbol: 'HK$', locale: 'zh-HK', name: 'Hong Kong Dollar' },
  // South Asia
  INR: { symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  PKR: { symbol: '₨', locale: 'en-PK', name: 'Pakistani Rupee' },
  BDT: { symbol: '৳', locale: 'bn-BD', name: 'Bangladeshi Taka' },
  LKR: { symbol: 'Rs', locale: 'si-LK', name: 'Sri Lankan Rupee' },
  NPR: { symbol: 'Rs', locale: 'ne-NP', name: 'Nepalese Rupee' },
  // West Asia / Middle East
  SAR: { symbol: '﷼', locale: 'ar-SA', name: 'Saudi Riyal' },
  AED: { symbol: 'د.إ', locale: 'ar-AE', name: 'UAE Dirham' },
  QAR: { symbol: '﷼', locale: 'ar-QA', name: 'Qatari Riyal' },
  OMR: { symbol: '﷼', locale: 'ar-OM', name: 'Omani Rial' },
  BHD: { symbol: '.د.ب', locale: 'ar-BH', name: 'Bahraini Dinar' },
  KWD: { symbol: 'د.ك', locale: 'ar-KW', name: 'Kuwaiti Dinar' },
  TRY: { symbol: '₺', locale: 'tr-TR', name: 'Turkish Lira' },
  // Europe
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
  CHF: { symbol: 'CHF', locale: 'de-CH', name: 'Swiss Franc' },
  SEK: { symbol: 'kr', locale: 'sv-SE', name: 'Swedish Krona' },
  NOK: { symbol: 'kr', locale: 'nb-NO', name: 'Norwegian Krone' },
  DKK: { symbol: 'kr', locale: 'da-DK', name: 'Danish Krone' },
  PLN: { symbol: 'zł', locale: 'pl-PL', name: 'Polish Zloty' },
  CZK: { symbol: 'Kč', locale: 'cs-CZ', name: 'Czech Koruna' },
  HUF: { symbol: 'Ft', locale: 'hu-HU', name: 'Hungarian Forint' },
  RUB: { symbol: '₽', locale: 'ru-RU', name: 'Russian Ruble' },
  UAH: { symbol: '₴', locale: 'uk-UA', name: 'Ukrainian Hryvnia' },
  // North America
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
  CAD: { symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar' },
  MXN: { symbol: 'MX$', locale: 'es-MX', name: 'Mexican Peso' },
  // South America
  BRL: { symbol: 'R$', locale: 'pt-BR', name: 'Brazilian Real' },
  ARS: { symbol: 'AR$', locale: 'es-AR', name: 'Argentine Peso' },
  CLP: { symbol: 'CL$', locale: 'es-CL', name: 'Chilean Peso' },
  COP: { symbol: 'CO$', locale: 'es-CO', name: 'Colombian Peso' },
  // Africa
  ZAR: { symbol: 'R', locale: 'en-ZA', name: 'South African Rand' },
  NGN: { symbol: '₦', locale: 'en-NG', name: 'Nigerian Naira' },
  EGP: { symbol: 'E£', locale: 'ar-EG', name: 'Egyptian Pound' },
  KES: { symbol: 'KSh', locale: 'en-KE', name: 'Kenyan Shilling' },
  // Oceania
  AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  NZD: { symbol: 'NZ$', locale: 'en-NZ', name: 'New Zealand Dollar' }
};

const FALLBACK_RATES = { MYR: 1, SGD: 0.286, USD: 0.213, EUR: 0.196, GBP: 0.170, JPY: 31.25, CNY: 1.54, AUD: 0.329, THB: 7.35, IDR: 3401, PHP: 12.1, VND: 5300, BND: 0.286, MMK: 447, KHR: 870, KRW: 280, TWD: 6.8, HKD: 1.66, INR: 17.8, PKR: 59, BDT: 25, LKR: 64, NPR: 28.4, SAR: 0.80, AED: 0.78, QAR: 0.78, OMR: 0.082, BHD: 0.080, KWD: 0.065, TRY: 6.9, CHF: 0.188, SEK: 2.24, NOK: 2.27, DKK: 1.46, PLN: 0.85, CZK: 4.93, HUF: 78, RUB: 19.5, UAH: 8.8, CAD: 0.29, MXN: 3.7, BRL: 1.16, ARS: 195, CLP: 200, COP: 880, ZAR: 3.85, NGN: 340, EGP: 10.4, KES: 27.5, NZD: 0.355 };

let displayCurrency = safeGet('ft_currency') || 'USD';
let exchangeRates = JSON.parse(safeGet('ft_rates') || 'null') || FALLBACK_RATES;
let ratesLastUpdated = safeGet('ft_rates_updated') || null;

async function fetchExchangeRates() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/MYR');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    exchangeRates = data.rates;
    exchangeRates.MYR = 1;
    ratesLastUpdated = new Date().toISOString();
    safeSave('ft_rates', JSON.stringify(exchangeRates));
    safeSave('ft_rates_updated', ratesLastUpdated);
    return true;
  } catch (e) {
    console.warn('Exchange rate fetch failed, using fallback/cached rates.');
    return false;
  }
}

function convertAmount(amountInMYR) {
  if (displayCurrency === 'MYR') return amountInMYR;
  const rate = exchangeRates[displayCurrency] || FALLBACK_RATES[displayCurrency] || 1;
  return amountInMYR * rate;
}

// Convert amount from one currency to another (v15.1)
function convertFromTo(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = exchangeRates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;
  // Convert to MYR first, then to target: amount / fromRate gives MYR, * toRate gives target
  return (amount / fromRate) * toRate;
}

// Convert from any native currency to the display currency (v15.1)
function convertToDisplay(amount, nativeCurrency) {
  if (!nativeCurrency || nativeCurrency === displayCurrency) return amount;
  return convertFromTo(amount, nativeCurrency, displayCurrency);
}

// Format amount in a specific currency (v15.1)
function fmtIn(amount, currency) {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.MYR;
  const formatted = cfg.symbol + ' ' + Math.abs(amount).toLocaleString(cfg.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? '-' + formatted : formatted;
}

// Dual display: native + converted (returns HTML string) (v15.1)
function fmtDual(amount, nativeCurrency) {
  if (!nativeCurrency || nativeCurrency === displayCurrency) return fmt(amount);
  const nativeStr = fmtIn(amount, nativeCurrency);
  const converted = convertToDisplay(amount, nativeCurrency);
  const convertedStr = fmtIn(converted, displayCurrency);
  return `${nativeStr} <span style="font-size:0.8em;color:var(--text-tertiary)">≈ ${convertedStr}</span>`;
}

function setCurrency(currency) {
  displayCurrency = currency;
  safeSave('ft_currency', currency);
  navigate(curPage);
}
