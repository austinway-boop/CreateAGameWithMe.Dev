'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const DEVEX_RATE = 0.0035;

interface CountryTaxData {
  name: string;
  usWithholding: number;
  incomeTax: number;
  currency: string;
  symbol: string;
  rate: number; // USD to local currency
}

const COUNTRY_TAX_DATA: { [key: string]: CountryTaxData } = {
  'US': { name: 'United States', usWithholding: 0, incomeTax: 25, currency: 'USD', symbol: '$', rate: 1 },
  'CA': { name: 'Canada', usWithholding: 0, incomeTax: 30, currency: 'CAD', symbol: 'C$', rate: 1.36 },
  'MX': { name: 'Mexico', usWithholding: 10, incomeTax: 30, currency: 'MXN', symbol: '$', rate: 17.15 },
  'GB': { name: 'United Kingdom', usWithholding: 0, incomeTax: 20, currency: 'GBP', symbol: '£', rate: 0.79 },
  'DE': { name: 'Germany', usWithholding: 0, incomeTax: 30, currency: 'EUR', symbol: '€', rate: 0.92 },
  'FR': { name: 'France', usWithholding: 0, incomeTax: 30, currency: 'EUR', symbol: '€', rate: 0.92 },
  'IT': { name: 'Italy', usWithholding: 0, incomeTax: 35, currency: 'EUR', symbol: '€', rate: 0.92 },
  'ES': { name: 'Spain', usWithholding: 0, incomeTax: 24, currency: 'EUR', symbol: '€', rate: 0.92 },
  'PT': { name: 'Portugal', usWithholding: 10, incomeTax: 25, currency: 'EUR', symbol: '€', rate: 0.92 },
  'NL': { name: 'Netherlands', usWithholding: 0, incomeTax: 37, currency: 'EUR', symbol: '€', rate: 0.92 },
  'BE': { name: 'Belgium', usWithholding: 0, incomeTax: 40, currency: 'EUR', symbol: '€', rate: 0.92 },
  'AT': { name: 'Austria', usWithholding: 0, incomeTax: 35, currency: 'EUR', symbol: '€', rate: 0.92 },
  'CH': { name: 'Switzerland', usWithholding: 0, incomeTax: 22, currency: 'CHF', symbol: 'Fr', rate: 0.88 },
  'SE': { name: 'Sweden', usWithholding: 0, incomeTax: 32, currency: 'SEK', symbol: 'kr', rate: 10.85 },
  'NO': { name: 'Norway', usWithholding: 0, incomeTax: 22, currency: 'NOK', symbol: 'kr', rate: 10.95 },
  'DK': { name: 'Denmark', usWithholding: 0, incomeTax: 38, currency: 'DKK', symbol: 'kr', rate: 6.88 },
  'FI': { name: 'Finland', usWithholding: 0, incomeTax: 30, currency: 'EUR', symbol: '€', rate: 0.92 },
  'IE': { name: 'Ireland', usWithholding: 0, incomeTax: 40, currency: 'EUR', symbol: '€', rate: 0.92 },
  'PL': { name: 'Poland', usWithholding: 10, incomeTax: 12, currency: 'PLN', symbol: 'zł', rate: 4.02 },
  'CZ': { name: 'Czech Republic', usWithholding: 10, incomeTax: 15, currency: 'CZK', symbol: 'Kč', rate: 23.5 },
  'HU': { name: 'Hungary', usWithholding: 0, incomeTax: 15, currency: 'HUF', symbol: 'Ft', rate: 365 },
  'RO': { name: 'Romania', usWithholding: 10, incomeTax: 10, currency: 'RON', symbol: 'lei', rate: 4.58 },
  'BG': { name: 'Bulgaria', usWithholding: 10, incomeTax: 10, currency: 'BGN', symbol: 'лв', rate: 1.8 },
  'GR': { name: 'Greece', usWithholding: 0, incomeTax: 22, currency: 'EUR', symbol: '€', rate: 0.92 },
  'SK': { name: 'Slovakia', usWithholding: 10, incomeTax: 19, currency: 'EUR', symbol: '€', rate: 0.92 },
  'SI': { name: 'Slovenia', usWithholding: 5, incomeTax: 27, currency: 'EUR', symbol: '€', rate: 0.92 },
  'HR': { name: 'Croatia', usWithholding: 10, incomeTax: 20, currency: 'EUR', symbol: '€', rate: 0.92 },
  'RS': { name: 'Serbia', usWithholding: 30, incomeTax: 20, currency: 'RSD', symbol: 'дин', rate: 108 },
  'UA': { name: 'Ukraine', usWithholding: 10, incomeTax: 18, currency: 'UAH', symbol: '₴', rate: 41.5 },
  'RU': { name: 'Russia', usWithholding: 0, incomeTax: 13, currency: 'RUB', symbol: '₽', rate: 92 },
  'LT': { name: 'Lithuania', usWithholding: 10, incomeTax: 15, currency: 'EUR', symbol: '€', rate: 0.92 },
  'LV': { name: 'Latvia', usWithholding: 10, incomeTax: 23, currency: 'EUR', symbol: '€', rate: 0.92 },
  'EE': { name: 'Estonia', usWithholding: 10, incomeTax: 20, currency: 'EUR', symbol: '€', rate: 0.92 },
  'IS': { name: 'Iceland', usWithholding: 5, incomeTax: 31, currency: 'ISK', symbol: 'kr', rate: 138 },
  'LU': { name: 'Luxembourg', usWithholding: 0, incomeTax: 25, currency: 'EUR', symbol: '€', rate: 0.92 },
  'MT': { name: 'Malta', usWithholding: 10, incomeTax: 25, currency: 'EUR', symbol: '€', rate: 0.92 },
  'CY': { name: 'Cyprus', usWithholding: 0, incomeTax: 20, currency: 'EUR', symbol: '€', rate: 0.92 },
  'JP': { name: 'Japan', usWithholding: 0, incomeTax: 30, currency: 'JPY', symbol: '¥', rate: 149 },
  'KR': { name: 'South Korea', usWithholding: 10, incomeTax: 24, currency: 'KRW', symbol: '₩', rate: 1320 },
  'CN': { name: 'China', usWithholding: 10, incomeTax: 30, currency: 'CNY', symbol: '¥', rate: 7.24 },
  'TW': { name: 'Taiwan', usWithholding: 30, incomeTax: 20, currency: 'TWD', symbol: 'NT$', rate: 31.5 },
  'HK': { name: 'Hong Kong', usWithholding: 30, incomeTax: 15, currency: 'HKD', symbol: 'HK$', rate: 7.82 },
  'SG': { name: 'Singapore', usWithholding: 0, incomeTax: 15, currency: 'SGD', symbol: 'S$', rate: 1.34 },
  'MY': { name: 'Malaysia', usWithholding: 30, incomeTax: 24, currency: 'MYR', symbol: 'RM', rate: 4.47 },
  'TH': { name: 'Thailand', usWithholding: 15, incomeTax: 25, currency: 'THB', symbol: '฿', rate: 35.8 },
  'VN': { name: 'Vietnam', usWithholding: 10, incomeTax: 20, currency: 'VND', symbol: '₫', rate: 24500 },
  'PH': { name: 'Philippines', usWithholding: 25, incomeTax: 25, currency: 'PHP', symbol: '₱', rate: 56.2 },
  'ID': { name: 'Indonesia', usWithholding: 15, incomeTax: 25, currency: 'IDR', symbol: 'Rp', rate: 15850 },
  'IN': { name: 'India', usWithholding: 15, incomeTax: 30, currency: 'INR', symbol: '₹', rate: 83.4 },
  'PK': { name: 'Pakistan', usWithholding: 30, incomeTax: 25, currency: 'PKR', symbol: 'Rs', rate: 278 },
  'BD': { name: 'Bangladesh', usWithholding: 10, incomeTax: 25, currency: 'BDT', symbol: '৳', rate: 110 },
  'LK': { name: 'Sri Lanka', usWithholding: 10, incomeTax: 24, currency: 'LKR', symbol: 'Rs', rate: 312 },
  'NP': { name: 'Nepal', usWithholding: 30, incomeTax: 25, currency: 'NPR', symbol: 'Rs', rate: 133 },
  'AU': { name: 'Australia', usWithholding: 5, incomeTax: 32, currency: 'AUD', symbol: 'A$', rate: 1.53 },
  'NZ': { name: 'New Zealand', usWithholding: 10, incomeTax: 30, currency: 'NZD', symbol: 'NZ$', rate: 1.67 },
  'IL': { name: 'Israel', usWithholding: 10, incomeTax: 35, currency: 'ILS', symbol: '₪', rate: 3.65 },
  'AE': { name: 'United Arab Emirates', usWithholding: 30, incomeTax: 0, currency: 'AED', symbol: 'د.إ', rate: 3.67 },
  'SA': { name: 'Saudi Arabia', usWithholding: 30, incomeTax: 0, currency: 'SAR', symbol: '﷼', rate: 3.75 },
  'QA': { name: 'Qatar', usWithholding: 30, incomeTax: 0, currency: 'QAR', symbol: '﷼', rate: 3.64 },
  'KW': { name: 'Kuwait', usWithholding: 30, incomeTax: 0, currency: 'KWD', symbol: 'د.ك', rate: 0.31 },
  'BH': { name: 'Bahrain', usWithholding: 30, incomeTax: 0, currency: 'BHD', symbol: 'د.ب', rate: 0.38 },
  'OM': { name: 'Oman', usWithholding: 30, incomeTax: 0, currency: 'OMR', symbol: '﷼', rate: 0.39 },
  'JO': { name: 'Jordan', usWithholding: 30, incomeTax: 20, currency: 'JOD', symbol: 'د.ا', rate: 0.71 },
  'LB': { name: 'Lebanon', usWithholding: 30, incomeTax: 20, currency: 'LBP', symbol: 'ل.ل', rate: 89500 },
  'TR': { name: 'Turkey', usWithholding: 10, incomeTax: 27, currency: 'TRY', symbol: '₺', rate: 32.5 },
  'ZA': { name: 'South Africa', usWithholding: 0, incomeTax: 26, currency: 'ZAR', symbol: 'R', rate: 18.6 },
  'EG': { name: 'Egypt', usWithholding: 15, incomeTax: 22, currency: 'EGP', symbol: '£', rate: 48.5 },
  'MA': { name: 'Morocco', usWithholding: 10, incomeTax: 30, currency: 'MAD', symbol: 'د.م.', rate: 10.05 },
  'TN': { name: 'Tunisia', usWithholding: 15, incomeTax: 26, currency: 'TND', symbol: 'د.ت', rate: 3.12 },
  'NG': { name: 'Nigeria', usWithholding: 30, incomeTax: 24, currency: 'NGN', symbol: '₦', rate: 1550 },
  'KE': { name: 'Kenya', usWithholding: 30, incomeTax: 30, currency: 'KES', symbol: 'KSh', rate: 153 },
  'GH': { name: 'Ghana', usWithholding: 30, incomeTax: 25, currency: 'GHS', symbol: '₵', rate: 15.5 },
  'ET': { name: 'Ethiopia', usWithholding: 30, incomeTax: 35, currency: 'ETB', symbol: 'Br', rate: 57 },
  'TZ': { name: 'Tanzania', usWithholding: 30, incomeTax: 30, currency: 'TZS', symbol: 'TSh', rate: 2520 },
  'UG': { name: 'Uganda', usWithholding: 30, incomeTax: 30, currency: 'UGX', symbol: 'USh', rate: 3780 },
  'ZW': { name: 'Zimbabwe', usWithholding: 30, incomeTax: 40, currency: 'USD', symbol: '$', rate: 1 },
  'DZ': { name: 'Algeria', usWithholding: 30, incomeTax: 26, currency: 'DZD', symbol: 'د.ج', rate: 135 },
  'AO': { name: 'Angola', usWithholding: 30, incomeTax: 17, currency: 'AOA', symbol: 'Kz', rate: 830 },
  'BR': { name: 'Brazil', usWithholding: 15, incomeTax: 27, currency: 'BRL', symbol: 'R$', rate: 4.97 },
  'AR': { name: 'Argentina', usWithholding: 30, incomeTax: 35, currency: 'ARS', symbol: '$', rate: 875 },
  'CL': { name: 'Chile', usWithholding: 10, incomeTax: 25, currency: 'CLP', symbol: '$', rate: 955 },
  'CO': { name: 'Colombia', usWithholding: 30, incomeTax: 33, currency: 'COP', symbol: '$', rate: 3950 },
  'PE': { name: 'Peru', usWithholding: 30, incomeTax: 29, currency: 'PEN', symbol: 'S/', rate: 3.72 },
  'VE': { name: 'Venezuela', usWithholding: 15, incomeTax: 34, currency: 'VES', symbol: 'Bs', rate: 36.5 },
  'EC': { name: 'Ecuador', usWithholding: 30, incomeTax: 35, currency: 'USD', symbol: '$', rate: 1 },
  'UY': { name: 'Uruguay', usWithholding: 30, incomeTax: 25, currency: 'UYU', symbol: '$', rate: 39.2 },
  'PY': { name: 'Paraguay', usWithholding: 30, incomeTax: 10, currency: 'PYG', symbol: '₲', rate: 7350 },
  'BO': { name: 'Bolivia', usWithholding: 30, incomeTax: 13, currency: 'BOB', symbol: 'Bs', rate: 6.91 },
  'CR': { name: 'Costa Rica', usWithholding: 30, incomeTax: 25, currency: 'CRC', symbol: '₡', rate: 515 },
  'PA': { name: 'Panama', usWithholding: 30, incomeTax: 25, currency: 'USD', symbol: '$', rate: 1 },
  'GT': { name: 'Guatemala', usWithholding: 30, incomeTax: 25, currency: 'GTQ', symbol: 'Q', rate: 7.82 },
  'HN': { name: 'Honduras', usWithholding: 30, incomeTax: 25, currency: 'HNL', symbol: 'L', rate: 24.7 },
  'NI': { name: 'Nicaragua', usWithholding: 30, incomeTax: 30, currency: 'NIO', symbol: 'C$', rate: 36.7 },
  'SV': { name: 'El Salvador', usWithholding: 30, incomeTax: 25, currency: 'USD', symbol: '$', rate: 1 },
  'JM': { name: 'Jamaica', usWithholding: 12, incomeTax: 25, currency: 'JMD', symbol: 'J$', rate: 156 },
  'TT': { name: 'Trinidad and Tobago', usWithholding: 30, incomeTax: 25, currency: 'TTD', symbol: 'TT$', rate: 6.78 },
  'DO': { name: 'Dominican Republic', usWithholding: 30, incomeTax: 25, currency: 'DOP', symbol: 'RD$', rate: 58.5 },
  'PR': { name: 'Puerto Rico', usWithholding: 0, incomeTax: 24, currency: 'USD', symbol: '$', rate: 1 },
  'BB': { name: 'Barbados', usWithholding: 5, incomeTax: 28, currency: 'BBD', symbol: 'Bds$', rate: 2 },
  'BS': { name: 'Bahamas', usWithholding: 30, incomeTax: 0, currency: 'BSD', symbol: 'B$', rate: 1 },
};

function getFlag(code: string): string {
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
}

export default function DevExCalculator() {
  const [robux, setRobux] = useState('100000');
  const [country, setCountry] = useState('US');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const countries = useMemo(() => {
    const q = search.toLowerCase();
    return Object.entries(COUNTRY_TAX_DATA)
      .filter(([code, data]) => data.name.toLowerCase().includes(q) || code.toLowerCase().includes(q))
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [search]);

  const calc = useMemo(() => {
    const r = parseFloat(robux) || 0;
    const c = COUNTRY_TAX_DATA[country];
    const grossUSD = r * DEVEX_RATE;
    const usWithheldUSD = grossUSD * (c.usWithholding / 100);
    const afterUsUSD = grossUSD - usWithheldUSD;
    const localTaxUSD = afterUsUSD * (c.incomeTax / 100);
    const netUSD = afterUsUSD - localTaxUSD;
    
    // Convert to local currency
    const gross = grossUSD * c.rate;
    const usWithheld = usWithheldUSD * c.rate;
    const localTax = localTaxUSD * c.rate;
    const net = netUSD * c.rate;
    
    const totalRate = grossUSD > 0 ? ((grossUSD - netUSD) / grossUSD) * 100 : 0;
    const decimals = c.rate >= 100 ? 0 : 2;
    
    return { gross, usWithheld, localTax, net, netUSD, totalRate, decimals, ...c };
  }, [robux, country]);

  const data = COUNTRY_TAX_DATA[country];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">DevEx Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Estimate your Roblox payout after taxes</p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          
          {/* Robux Input */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Robux Amount</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R$</span>
              <input
                type="text"
                value={robux}
                onChange={(e) => setRobux(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-12 pr-4 py-3 text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                placeholder="100000"
              />
            </div>
          </div>

          {/* Country Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</label>
            <div className="relative mt-2">
              <button
                onClick={() => setOpen(!open)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 flex items-center justify-between hover:border-gray-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getFlag(country)}</span>
                  <span className="font-semibold text-gray-900">{data.name}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {countries.map(([code, d]) => (
                      <button
                        key={code}
                        onClick={() => { setCountry(code); setOpen(false); setSearch(''); }}
                        className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 ${code === country ? 'bg-green-50' : ''}`}
                      >
                        <span>{getFlag(code)}</span>
                        <span className="text-sm text-gray-900">{d.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Gross payout</span>
            <span className="font-semibold">{calc.symbol}{calc.gross.toLocaleString(undefined, { minimumFractionDigits: calc.decimals, maximumFractionDigits: calc.decimals })}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">US withholding ({calc.usWithholding}%)</span>
            <span className="text-red-500">-{calc.symbol}{calc.usWithheld.toLocaleString(undefined, { minimumFractionDigits: calc.decimals, maximumFractionDigits: calc.decimals })}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{data.name} tax ({calc.incomeTax}%)</span>
            <span className="text-red-500">-{calc.symbol}{calc.localTax.toLocaleString(undefined, { minimumFractionDigits: calc.decimals, maximumFractionDigits: calc.decimals })}</span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">You keep</p>
                <p className="text-xs text-gray-400">{calc.totalRate.toFixed(0)}% total tax</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {calc.symbol}{calc.net.toLocaleString(undefined, { minimumFractionDigits: calc.decimals, maximumFractionDigits: calc.decimals })}
                </p>
                {country !== 'US' && (
                  <p className="text-xs text-gray-400">
                    ${calc.netUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center">
          Estimates only. Consult a tax professional.
        </p>
      </div>
    </div>
  );
}
