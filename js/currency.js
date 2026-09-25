// === CURRENCY SYSTEM (V2.0.0) ===
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

// === DEFAULT CURRENCY BY REGION (V2.0.4) ===
// Only used when the user has never picked a currency. Order:
// 1. Phone time zone (where the user actually is), 2. region in the phone language (en-GB -> GB),
// 3. most likely region for the language (ja -> JP), 4. USD.
var FT_EUR = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ');
var FT_REGION_CUR = { US:'USD', CA:'CAD', MX:'MXN', GB:'GBP', CH:'CHF', SE:'SEK', NO:'NOK', DK:'DKK', PL:'PLN', CZ:'CZK', HU:'HUF', RU:'RUB', UA:'UAH', TR:'TRY', JP:'JPY', CN:'CNY', KR:'KRW', TW:'TWD', HK:'HKD', SG:'SGD', MY:'MYR', ID:'IDR', TH:'THB', PH:'PHP', VN:'VND', BN:'BND', MM:'MMK', KH:'KHR', IN:'INR', PK:'PKR', BD:'BDT', LK:'LKR', NP:'NPR', SA:'SAR', AE:'AED', QA:'QAR', OM:'OMR', BH:'BHD', KW:'KWD', AU:'AUD', NZ:'NZD', BR:'BRL', AR:'ARS', CL:'CLP', CO:'COP', ZA:'ZAR', NG:'NGN', EG:'EGP', KE:'KES' };
FT_EUR.forEach(function(r) { FT_REGION_CUR[r] = 'EUR'; });
var FT_TZ_REGION = {
  'Asia/Kuala_Lumpur':'MY','Asia/Kuching':'MY','Asia/Singapore':'SG','Asia/Jakarta':'ID','Asia/Makassar':'ID','Asia/Jayapura':'ID','Asia/Pontianak':'ID',
  'Asia/Bangkok':'TH','Asia/Manila':'PH','Asia/Ho_Chi_Minh':'VN','Asia/Saigon':'VN','Asia/Brunei':'BN','Asia/Yangon':'MM','Asia/Rangoon':'MM','Asia/Phnom_Penh':'KH',
  'Asia/Tokyo':'JP','Asia/Shanghai':'CN','Asia/Chongqing':'CN','Asia/Urumqi':'CN','Asia/Harbin':'CN','Asia/Seoul':'KR','Asia/Taipei':'TW','Asia/Hong_Kong':'HK',
  'Asia/Kolkata':'IN','Asia/Calcutta':'IN','Asia/Karachi':'PK','Asia/Dhaka':'BD','Asia/Colombo':'LK','Asia/Kathmandu':'NP','Asia/Katmandu':'NP',
  'Asia/Riyadh':'SA','Asia/Dubai':'AE','Asia/Qatar':'QA','Asia/Muscat':'OM','Asia/Bahrain':'BH','Asia/Kuwait':'KW','Europe/Istanbul':'TR','Asia/Istanbul':'TR',
  'Europe/London':'GB','Europe/Belfast':'GB','Europe/Zurich':'CH','Europe/Stockholm':'SE','Europe/Oslo':'NO','Europe/Copenhagen':'DK','Europe/Warsaw':'PL','Europe/Prague':'CZ','Europe/Budapest':'HU',
  'Europe/Moscow':'RU','Europe/Kiev':'UA','Europe/Kyiv':'UA','Europe/Dublin':'IE','Europe/Berlin':'DE','Europe/Paris':'FR','Europe/Madrid':'ES','Europe/Rome':'IT','Europe/Amsterdam':'NL',
  'Europe/Brussels':'BE','Europe/Vienna':'AT','Europe/Lisbon':'PT','Europe/Helsinki':'FI','Europe/Athens':'GR','Europe/Luxembourg':'LU','Europe/Tallinn':'EE','Europe/Riga':'LV',
  'Europe/Vilnius':'LT','Europe/Bratislava':'SK','Europe/Ljubljana':'SI','Europe/Zagreb':'HR','Europe/Malta':'MT','Asia/Nicosia':'CY','Europe/Nicosia':'CY',
  'Pacific/Auckland':'NZ','America/Toronto':'CA','America/Vancouver':'CA','America/Edmonton':'CA','America/Winnipeg':'CA','America/Halifax':'CA','America/St_Johns':'CA','America/Regina':'CA',
  'America/Mexico_City':'MX','America/Monterrey':'MX','America/Tijuana':'MX','America/Cancun':'MX','America/Sao_Paulo':'BR','America/Bahia':'BR','America/Fortaleza':'BR','America/Manaus':'BR','America/Recife':'BR',
  'America/Buenos_Aires':'AR','America/Santiago':'CL','America/Bogota':'CO','Africa/Johannesburg':'ZA','Africa/Lagos':'NG','Africa/Cairo':'EG','Africa/Nairobi':'KE',
  'America/New_York':'US','America/Chicago':'US','America/Denver':'US','America/Los_Angeles':'US','America/Phoenix':'US','America/Anchorage':'US','America/Detroit':'US','America/Boise':'US','Pacific/Honolulu':'US'
};
function ftTzRegion(tz) {
  if (!tz) return null;
  if (FT_TZ_REGION[tz]) return FT_TZ_REGION[tz];
  if (tz.indexOf('Australia/') === 0) return 'AU';
  if (/^America\/(Indiana|Kentucky|North_Dakota)\//.test(tz)) return 'US';
  if (tz.indexOf('America/Argentina/') === 0) return 'AR';
  return null;
}
function ftDetectCurrency() {
  var pick = function(r) { return r && FT_REGION_CUR[r] && CURRENCY_CONFIG[FT_REGION_CUR[r]] ? FT_REGION_CUR[r] : null; };
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var c = pick(ftTzRegion(tz));
    if (c) return c;
  } catch(e) {}
  var langs = [];
  try { langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean); } catch(e) {}
  for (var i = 0; i < langs.length; i++) {
    var m = /[-_]([A-Za-z]{2})(?:$|[-_])/.exec(langs[i]);
    var c2 = m ? pick(m[1].toUpperCase()) : null;
    if (c2) return c2;
  }
  try {
    if (langs[0] && typeof Intl.Locale === 'function') {
      var loc = new Intl.Locale(langs[0]);
      var c3 = pick(loc.maximize ? loc.maximize().region : loc.region);
      if (c3) return c3;
    }
  } catch(e) {}
  return 'USD';
}

// === BASE CURRENCY (V2.0.4) ===
// Every tx.a / goal / investment number is stored in FT_BASE. Existing users stay MYR
// (no data migration). A fresh install with no data takes the region currency once.
// Base is locked after the first transaction (changing it would mean re-pricing history).
var FT_BASE = safeGet('ft_base_cur') || 'MYR';
function ftResolveBase(hasData) {
  var saved = safeGet('ft_base_cur');
  if (saved && CURRENCY_CONFIG[saved]) { FT_BASE = saved; return FT_BASE; }
  FT_BASE = hasData ? 'MYR' : ftDetectCurrency();
  safeSave('ft_base_cur', FT_BASE);
  return FT_BASE;
}
// Only allowed while there is no transaction yet (e.g. first cloud pull on a new phone).
// force = caller already checked the phone had no transactions before loading new ones.
function ftSetBase(cur, force) {
  if (!cur || !CURRENCY_CONFIG[cur]) return false;
  if (!force && typeof TXN !== 'undefined' && TXN.length) return false;
  FT_BASE = cur;
  safeSave('ft_base_cur', cur);
  return true;
}

let displayCurrency = safeGet('ft_currency') || ftDetectCurrency();
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

// Base (FT_BASE) -> display currency. Name kept for older callers.
function convertAmount(amountInBase) {
  return convertFromTo(amountInBase, FT_BASE, displayCurrency);
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
  if (!nativeCurrency) return fmt(amount);
  if (nativeCurrency === displayCurrency) return fmtIn(amount, displayCurrency);
  const nativeStr = fmtIn(amount, nativeCurrency);
  const converted = convertToDisplay(amount, nativeCurrency);
  const convertedStr = fmtIn(converted, displayCurrency);
  return `${nativeStr} <span style="font-size:0.8em;color:var(--text-tertiary)">≈ ${convertedStr}</span>`;
}

function setCurrency(currency) {
  displayCurrency = currency;
  safeSave('ft_currency', currency);
  // V2.0.4: before the first transaction, picking a currency also sets the base (nothing to re-price yet)
  if (typeof TXN !== 'undefined' && !TXN.length) ftSetBase(currency);
  navigate(curPage);
}
