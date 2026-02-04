'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const DEVEX_RATE = 0.0035;

interface CountryTaxData {
  name: string;
  usWithholding: number;
  incomeTax: number;
}

const COUNTRY_TAX_DATA: { [key: string]: CountryTaxData } = {
  'US': { name: 'United States', usWithholding: 0, incomeTax: 25 },
  'CA': { name: 'Canada', usWithholding: 0, incomeTax: 30 },
  'MX': { name: 'Mexico', usWithholding: 10, incomeTax: 30 },
  'GB': { name: 'United Kingdom', usWithholding: 0, incomeTax: 20 },
  'DE': { name: 'Germany', usWithholding: 0, incomeTax: 30 },
  'FR': { name: 'France', usWithholding: 0, incomeTax: 30 },
  'IT': { name: 'Italy', usWithholding: 0, incomeTax: 35 },
  'ES': { name: 'Spain', usWithholding: 0, incomeTax: 24 },
  'PT': { name: 'Portugal', usWithholding: 10, incomeTax: 25 },
  'NL': { name: 'Netherlands', usWithholding: 0, incomeTax: 37 },
  'BE': { name: 'Belgium', usWithholding: 0, incomeTax: 40 },
  'AT': { name: 'Austria', usWithholding: 0, incomeTax: 35 },
  'CH': { name: 'Switzerland', usWithholding: 0, incomeTax: 22 },
  'SE': { name: 'Sweden', usWithholding: 0, incomeTax: 32 },
  'NO': { name: 'Norway', usWithholding: 0, incomeTax: 22 },
  'DK': { name: 'Denmark', usWithholding: 0, incomeTax: 38 },
  'FI': { name: 'Finland', usWithholding: 0, incomeTax: 30 },
  'IE': { name: 'Ireland', usWithholding: 0, incomeTax: 40 },
  'PL': { name: 'Poland', usWithholding: 10, incomeTax: 12 },
  'CZ': { name: 'Czech Republic', usWithholding: 10, incomeTax: 15 },
  'HU': { name: 'Hungary', usWithholding: 0, incomeTax: 15 },
  'RO': { name: 'Romania', usWithholding: 10, incomeTax: 10 },
  'BG': { name: 'Bulgaria', usWithholding: 10, incomeTax: 10 },
  'GR': { name: 'Greece', usWithholding: 0, incomeTax: 22 },
  'SK': { name: 'Slovakia', usWithholding: 10, incomeTax: 19 },
  'SI': { name: 'Slovenia', usWithholding: 5, incomeTax: 27 },
  'HR': { name: 'Croatia', usWithholding: 10, incomeTax: 20 },
  'RS': { name: 'Serbia', usWithholding: 30, incomeTax: 20 },
  'UA': { name: 'Ukraine', usWithholding: 10, incomeTax: 18 },
  'RU': { name: 'Russia', usWithholding: 0, incomeTax: 13 },
  'LT': { name: 'Lithuania', usWithholding: 10, incomeTax: 15 },
  'LV': { name: 'Latvia', usWithholding: 10, incomeTax: 23 },
  'EE': { name: 'Estonia', usWithholding: 10, incomeTax: 20 },
  'IS': { name: 'Iceland', usWithholding: 5, incomeTax: 31 },
  'LU': { name: 'Luxembourg', usWithholding: 0, incomeTax: 25 },
  'MT': { name: 'Malta', usWithholding: 10, incomeTax: 25 },
  'CY': { name: 'Cyprus', usWithholding: 0, incomeTax: 20 },
  'JP': { name: 'Japan', usWithholding: 0, incomeTax: 30 },
  'KR': { name: 'South Korea', usWithholding: 10, incomeTax: 24 },
  'CN': { name: 'China', usWithholding: 10, incomeTax: 30 },
  'TW': { name: 'Taiwan', usWithholding: 30, incomeTax: 20 },
  'HK': { name: 'Hong Kong', usWithholding: 30, incomeTax: 15 },
  'SG': { name: 'Singapore', usWithholding: 0, incomeTax: 15 },
  'MY': { name: 'Malaysia', usWithholding: 30, incomeTax: 24 },
  'TH': { name: 'Thailand', usWithholding: 15, incomeTax: 25 },
  'VN': { name: 'Vietnam', usWithholding: 10, incomeTax: 20 },
  'PH': { name: 'Philippines', usWithholding: 25, incomeTax: 25 },
  'ID': { name: 'Indonesia', usWithholding: 15, incomeTax: 25 },
  'IN': { name: 'India', usWithholding: 15, incomeTax: 30 },
  'PK': { name: 'Pakistan', usWithholding: 30, incomeTax: 25 },
  'BD': { name: 'Bangladesh', usWithholding: 10, incomeTax: 25 },
  'LK': { name: 'Sri Lanka', usWithholding: 10, incomeTax: 24 },
  'NP': { name: 'Nepal', usWithholding: 30, incomeTax: 25 },
  'AU': { name: 'Australia', usWithholding: 5, incomeTax: 32 },
  'NZ': { name: 'New Zealand', usWithholding: 10, incomeTax: 30 },
  'IL': { name: 'Israel', usWithholding: 10, incomeTax: 35 },
  'AE': { name: 'United Arab Emirates', usWithholding: 30, incomeTax: 0 },
  'SA': { name: 'Saudi Arabia', usWithholding: 30, incomeTax: 0 },
  'QA': { name: 'Qatar', usWithholding: 30, incomeTax: 0 },
  'KW': { name: 'Kuwait', usWithholding: 30, incomeTax: 0 },
  'BH': { name: 'Bahrain', usWithholding: 30, incomeTax: 0 },
  'OM': { name: 'Oman', usWithholding: 30, incomeTax: 0 },
  'JO': { name: 'Jordan', usWithholding: 30, incomeTax: 20 },
  'LB': { name: 'Lebanon', usWithholding: 30, incomeTax: 20 },
  'TR': { name: 'Turkey', usWithholding: 10, incomeTax: 27 },
  'ZA': { name: 'South Africa', usWithholding: 0, incomeTax: 26 },
  'EG': { name: 'Egypt', usWithholding: 15, incomeTax: 22 },
  'MA': { name: 'Morocco', usWithholding: 10, incomeTax: 30 },
  'TN': { name: 'Tunisia', usWithholding: 15, incomeTax: 26 },
  'NG': { name: 'Nigeria', usWithholding: 30, incomeTax: 24 },
  'KE': { name: 'Kenya', usWithholding: 30, incomeTax: 30 },
  'GH': { name: 'Ghana', usWithholding: 30, incomeTax: 25 },
  'ET': { name: 'Ethiopia', usWithholding: 30, incomeTax: 35 },
  'TZ': { name: 'Tanzania', usWithholding: 30, incomeTax: 30 },
  'UG': { name: 'Uganda', usWithholding: 30, incomeTax: 30 },
  'ZW': { name: 'Zimbabwe', usWithholding: 30, incomeTax: 40 },
  'DZ': { name: 'Algeria', usWithholding: 30, incomeTax: 26 },
  'AO': { name: 'Angola', usWithholding: 30, incomeTax: 17 },
  'BR': { name: 'Brazil', usWithholding: 15, incomeTax: 27 },
  'AR': { name: 'Argentina', usWithholding: 30, incomeTax: 35 },
  'CL': { name: 'Chile', usWithholding: 10, incomeTax: 25 },
  'CO': { name: 'Colombia', usWithholding: 30, incomeTax: 33 },
  'PE': { name: 'Peru', usWithholding: 30, incomeTax: 29 },
  'VE': { name: 'Venezuela', usWithholding: 15, incomeTax: 34 },
  'EC': { name: 'Ecuador', usWithholding: 30, incomeTax: 35 },
  'UY': { name: 'Uruguay', usWithholding: 30, incomeTax: 25 },
  'PY': { name: 'Paraguay', usWithholding: 30, incomeTax: 10 },
  'BO': { name: 'Bolivia', usWithholding: 30, incomeTax: 13 },
  'CR': { name: 'Costa Rica', usWithholding: 30, incomeTax: 25 },
  'PA': { name: 'Panama', usWithholding: 30, incomeTax: 25 },
  'GT': { name: 'Guatemala', usWithholding: 30, incomeTax: 25 },
  'HN': { name: 'Honduras', usWithholding: 30, incomeTax: 25 },
  'NI': { name: 'Nicaragua', usWithholding: 30, incomeTax: 30 },
  'SV': { name: 'El Salvador', usWithholding: 30, incomeTax: 25 },
  'JM': { name: 'Jamaica', usWithholding: 12, incomeTax: 25 },
  'TT': { name: 'Trinidad and Tobago', usWithholding: 30, incomeTax: 25 },
  'DO': { name: 'Dominican Republic', usWithholding: 30, incomeTax: 25 },
  'PR': { name: 'Puerto Rico', usWithholding: 0, incomeTax: 24 },
  'BB': { name: 'Barbados', usWithholding: 5, incomeTax: 28 },
  'BS': { name: 'Bahamas', usWithholding: 30, incomeTax: 0 },
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
    const gross = r * DEVEX_RATE;
    const usWithheld = gross * (c.usWithholding / 100);
    const afterUs = gross - usWithheld;
    const localTax = afterUs * (c.incomeTax / 100);
    const net = afterUs - localTax;
    const totalRate = gross > 0 ? ((gross - net) / gross) * 100 : 0;
    return { gross, usWithheld, afterUs, localTax, net, totalRate, ...c };
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
            <span className="font-semibold">${calc.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">US withholding ({calc.usWithholding}%)</span>
            <span className="text-red-500">-${calc.usWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{data.name} tax ({calc.incomeTax}%)</span>
            <span className="text-red-500">-${calc.localTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">You keep</p>
                <p className="text-xs text-gray-400">{calc.totalRate.toFixed(0)}% total tax</p>
              </div>
              <p className="text-3xl font-bold text-green-600">
                ${calc.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
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
