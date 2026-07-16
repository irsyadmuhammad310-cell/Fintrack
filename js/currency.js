// === CURRENCY SYSTEM (v10.0) ===
const CURRENCY_CONFIG = {
  MYR: { symbol: 'RM', locale: 'en-MY', name: 'Malaysian Ringgit' },
  SGD: { symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar' },
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
  JPY: { symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
  CNY: { symbol: '¥', locale: 'zh-CN', name: 'Chinese Yuan' },
  AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  THB: { symbol: '฿', locale: 'th-TH', name: 'Thai Baht' },
  IDR: { symbol: 'Rp', locale: 'id-ID', name: 'Indonesian Rupiah' }
};

const FALLBACK_RATES = { MYR: 1, SGD: 0.2857, USD: 0.2128, EUR: 0.1961, GBP: 0.1695, JPY: 31.25, CNY: 1.538, AUD: 0.3289, THB: 7.353, IDR: 3401 };

let displayCurrency = localStorage.getItem('ft_currency') || 'MYR';
let exchangeRates = JSON.parse(localStorage.getItem('ft_rates') || 'null') || FALLBACK_RATES;
let ratesLastUpdated = localStorage.getItem('ft_rates_updated') || null;

async function fetchExchangeRates() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/MYR');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    exchangeRates = data.rates;
    exchangeRates.MYR = 1;
    ratesLastUpdated = new Date().toISOString();
    localStorage.setItem('ft_rates', JSON.stringify(exchangeRates));
    localStorage.setItem('ft_rates_updated', ratesLastUpdated);
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
  localStorage.setItem('ft_currency', currency);
  navigate(curPage);
}
