'use client';

import { useState, useMemo } from 'react';
import { 
  Calculator, 
  Globe, 
  DollarSign, 
  Percent, 
  Info,
  ChevronDown,
  Search,
  ArrowRight,
  Coins
} from 'lucide-react';

// DevEx exchange rate (Robux to USD)
const DEVEX_RATE = 0.0035; // $0.0035 per Robux

// Tax withholding rates by country (based on US tax treaties)
// Source: IRS tax treaty tables for royalties/services
const COUNTRY_TAX_DATA: { [key: string]: { name: string; rate: number; hasTreaty: boolean; notes?: string } } = {
  // North America
  'US': { name: 'United States', rate: 0, hasTreaty: true, notes: 'No withholding for US residents' },
  'CA': { name: 'Canada', rate: 0, hasTreaty: true, notes: 'Tax treaty eliminates withholding' },
  'MX': { name: 'Mexico', rate: 10, hasTreaty: true },
  
  // Europe
  'GB': { name: 'United Kingdom', rate: 0, hasTreaty: true },
  'DE': { name: 'Germany', rate: 0, hasTreaty: true },
  'FR': { name: 'France', rate: 0, hasTreaty: true },
  'IT': { name: 'Italy', rate: 0, hasTreaty: true },
  'ES': { name: 'Spain', rate: 0, hasTreaty: true },
  'PT': { name: 'Portugal', rate: 10, hasTreaty: true },
  'NL': { name: 'Netherlands', rate: 0, hasTreaty: true },
  'BE': { name: 'Belgium', rate: 0, hasTreaty: true },
  'AT': { name: 'Austria', rate: 0, hasTreaty: true },
  'CH': { name: 'Switzerland', rate: 0, hasTreaty: true },
  'SE': { name: 'Sweden', rate: 0, hasTreaty: true },
  'NO': { name: 'Norway', rate: 0, hasTreaty: true },
  'DK': { name: 'Denmark', rate: 0, hasTreaty: true },
  'FI': { name: 'Finland', rate: 0, hasTreaty: true },
  'IE': { name: 'Ireland', rate: 0, hasTreaty: true },
  'PL': { name: 'Poland', rate: 10, hasTreaty: true },
  'CZ': { name: 'Czech Republic', rate: 10, hasTreaty: true },
  'HU': { name: 'Hungary', rate: 0, hasTreaty: true },
  'RO': { name: 'Romania', rate: 10, hasTreaty: true },
  'BG': { name: 'Bulgaria', rate: 10, hasTreaty: true },
  'GR': { name: 'Greece', rate: 0, hasTreaty: true },
  'SK': { name: 'Slovakia', rate: 10, hasTreaty: true },
  'SI': { name: 'Slovenia', rate: 5, hasTreaty: true },
  'HR': { name: 'Croatia', rate: 10, hasTreaty: false },
  'RS': { name: 'Serbia', rate: 30, hasTreaty: false },
  'UA': { name: 'Ukraine', rate: 10, hasTreaty: true },
  'RU': { name: 'Russia', rate: 0, hasTreaty: true },
  'LT': { name: 'Lithuania', rate: 10, hasTreaty: true },
  'LV': { name: 'Latvia', rate: 10, hasTreaty: true },
  'EE': { name: 'Estonia', rate: 10, hasTreaty: true },
  'IS': { name: 'Iceland', rate: 5, hasTreaty: true },
  'LU': { name: 'Luxembourg', rate: 0, hasTreaty: true },
  'MT': { name: 'Malta', rate: 10, hasTreaty: true },
  'CY': { name: 'Cyprus', rate: 0, hasTreaty: true },
  
  // Asia Pacific
  'JP': { name: 'Japan', rate: 0, hasTreaty: true },
  'KR': { name: 'South Korea', rate: 10, hasTreaty: true },
  'CN': { name: 'China', rate: 10, hasTreaty: true },
  'TW': { name: 'Taiwan', rate: 30, hasTreaty: false },
  'HK': { name: 'Hong Kong', rate: 30, hasTreaty: false },
  'SG': { name: 'Singapore', rate: 0, hasTreaty: true },
  'MY': { name: 'Malaysia', rate: 30, hasTreaty: false },
  'TH': { name: 'Thailand', rate: 15, hasTreaty: true },
  'VN': { name: 'Vietnam', rate: 10, hasTreaty: true },
  'PH': { name: 'Philippines', rate: 25, hasTreaty: true },
  'ID': { name: 'Indonesia', rate: 15, hasTreaty: true },
  'IN': { name: 'India', rate: 15, hasTreaty: true },
  'PK': { name: 'Pakistan', rate: 30, hasTreaty: true },
  'BD': { name: 'Bangladesh', rate: 10, hasTreaty: true },
  'LK': { name: 'Sri Lanka', rate: 10, hasTreaty: true },
  'NP': { name: 'Nepal', rate: 30, hasTreaty: false },
  'AU': { name: 'Australia', rate: 5, hasTreaty: true },
  'NZ': { name: 'New Zealand', rate: 10, hasTreaty: true },
  
  // Middle East
  'IL': { name: 'Israel', rate: 10, hasTreaty: true },
  'AE': { name: 'United Arab Emirates', rate: 30, hasTreaty: false },
  'SA': { name: 'Saudi Arabia', rate: 30, hasTreaty: false },
  'QA': { name: 'Qatar', rate: 30, hasTreaty: false },
  'KW': { name: 'Kuwait', rate: 30, hasTreaty: false },
  'BH': { name: 'Bahrain', rate: 30, hasTreaty: false },
  'OM': { name: 'Oman', rate: 30, hasTreaty: false },
  'JO': { name: 'Jordan', rate: 30, hasTreaty: false },
  'LB': { name: 'Lebanon', rate: 30, hasTreaty: false },
  'TR': { name: 'Turkey', rate: 10, hasTreaty: true },
  
  // Africa
  'ZA': { name: 'South Africa', rate: 0, hasTreaty: true },
  'EG': { name: 'Egypt', rate: 15, hasTreaty: true },
  'MA': { name: 'Morocco', rate: 10, hasTreaty: true },
  'TN': { name: 'Tunisia', rate: 15, hasTreaty: true },
  'NG': { name: 'Nigeria', rate: 30, hasTreaty: false },
  'KE': { name: 'Kenya', rate: 30, hasTreaty: false },
  'GH': { name: 'Ghana', rate: 30, hasTreaty: false },
  'ET': { name: 'Ethiopia', rate: 30, hasTreaty: false },
  'TZ': { name: 'Tanzania', rate: 30, hasTreaty: false },
  'UG': { name: 'Uganda', rate: 30, hasTreaty: false },
  'ZW': { name: 'Zimbabwe', rate: 30, hasTreaty: false },
  'DZ': { name: 'Algeria', rate: 30, hasTreaty: false },
  'AO': { name: 'Angola', rate: 30, hasTreaty: false },
  
  // South America
  'BR': { name: 'Brazil', rate: 15, hasTreaty: false },
  'AR': { name: 'Argentina', rate: 30, hasTreaty: false },
  'CL': { name: 'Chile', rate: 10, hasTreaty: true },
  'CO': { name: 'Colombia', rate: 30, hasTreaty: false },
  'PE': { name: 'Peru', rate: 30, hasTreaty: false },
  'VE': { name: 'Venezuela', rate: 15, hasTreaty: true },
  'EC': { name: 'Ecuador', rate: 30, hasTreaty: false },
  'UY': { name: 'Uruguay', rate: 30, hasTreaty: false },
  'PY': { name: 'Paraguay', rate: 30, hasTreaty: false },
  'BO': { name: 'Bolivia', rate: 30, hasTreaty: false },
  
  // Central America & Caribbean
  'CR': { name: 'Costa Rica', rate: 30, hasTreaty: false },
  'PA': { name: 'Panama', rate: 30, hasTreaty: false },
  'GT': { name: 'Guatemala', rate: 30, hasTreaty: false },
  'HN': { name: 'Honduras', rate: 30, hasTreaty: false },
  'NI': { name: 'Nicaragua', rate: 30, hasTreaty: false },
  'SV': { name: 'El Salvador', rate: 30, hasTreaty: false },
  'JM': { name: 'Jamaica', rate: 12.5, hasTreaty: true },
  'TT': { name: 'Trinidad and Tobago', rate: 30, hasTreaty: true },
  'DO': { name: 'Dominican Republic', rate: 30, hasTreaty: false },
  'PR': { name: 'Puerto Rico', rate: 0, hasTreaty: true, notes: 'US Territory' },
  'CU': { name: 'Cuba', rate: 30, hasTreaty: false },
  'HT': { name: 'Haiti', rate: 30, hasTreaty: false },
  'BB': { name: 'Barbados', rate: 5, hasTreaty: true },
  'BS': { name: 'Bahamas', rate: 30, hasTreaty: false },
};

// Colors matching the Duolingo style
const PINK = '#ec4899';
const ORANGE = '#FF9600';
const GREEN = '#22c55e';
const GRAY = '#e5e7eb';

function darken(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function DevExCalculator() {
  const [robuxAmount, setRobuxAmount] = useState<string>('100000');
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'robux' | 'usd'>('robux');

  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return Object.entries(COUNTRY_TAX_DATA)
      .filter(([code, data]) => 
        data.name.toLowerCase().includes(query) || 
        code.toLowerCase().includes(query)
      )
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [searchQuery]);

  const calculations = useMemo(() => {
    const amount = parseFloat(robuxAmount) || 0;
    const country = COUNTRY_TAX_DATA[selectedCountry];
    const taxRate = country?.rate || 30;
    
    let robux: number;
    let grossUSD: number;
    
    if (inputMode === 'robux') {
      robux = amount;
      grossUSD = amount * DEVEX_RATE;
    } else {
      grossUSD = amount;
      robux = amount / DEVEX_RATE;
    }
    
    const withheld = grossUSD * (taxRate / 100);
    const netPayout = grossUSD - withheld;
    
    return {
      robux,
      grossUSD,
      taxRate,
      withheld,
      netPayout,
      hasTreaty: country?.hasTreaty || false,
      notes: country?.notes
    };
  }, [robuxAmount, selectedCountry, inputMode]);

  const selectedCountryData = COUNTRY_TAX_DATA[selectedCountry];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              backgroundColor: GREEN,
              boxShadow: `0 3px 0 ${darken(GREEN, 40)}`
            }}
          >
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">DevEx Payout Calculator</h1>
            <p className="text-xs text-gray-500">Estimate your Roblox Developer Exchange earnings</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Info Card */}
          <div 
            className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-100"
          >
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">How DevEx Works</p>
                <p className="text-blue-600">
                  Roblox pays developers at a rate of <span className="font-bold">${DEVEX_RATE}</span> per Robux. 
                  Tax withholding depends on your country&apos;s tax treaty status with the United States.
                </p>
              </div>
            </div>
          </div>

          {/* Input Card */}
          <div 
            className="p-5 rounded-2xl bg-white"
            style={{ boxShadow: '0 4px 0 #e5e7eb' }}
          >
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Enter Amount
            </h2>
            
            {/* Toggle Input Mode */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('robux')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                  inputMode === 'robux' 
                    ? 'text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={inputMode === 'robux' ? {
                  backgroundColor: ORANGE,
                  boxShadow: `0 3px 0 ${darken(ORANGE, 40)}`
                } : {}}
              >
                Robux (R$)
              </button>
              <button
                onClick={() => setInputMode('usd')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                  inputMode === 'usd' 
                    ? 'text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={inputMode === 'usd' ? {
                  backgroundColor: ORANGE,
                  boxShadow: `0 3px 0 ${darken(ORANGE, 40)}`
                } : {}}
              >
                USD ($)
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                {inputMode === 'robux' ? 'R$' : '$'}
              </span>
              <input
                type="text"
                value={robuxAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setRobuxAmount(value);
                }}
                className="w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                placeholder={inputMode === 'robux' ? '100000' : '350'}
              />
            </div>
          </div>

          {/* Country Selector */}
          <div 
            className="p-5 rounded-2xl bg-white"
            style={{ boxShadow: '0 4px 0 #e5e7eb' }}
          >
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Select Your Country
            </h2>
            
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-4 rounded-xl border-2 border-gray-200 flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCountryFlag(selectedCountry)}</span>
                  <span className="font-semibold text-gray-900">{selectedCountryData?.name}</span>
                  {selectedCountryData?.hasTreaty && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      Tax Treaty
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search countries..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredCountries.map(([code, data]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setSelectedCountry(code);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                          code === selectedCountry ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getCountryFlag(code)}</span>
                          <span className="font-medium text-gray-900 text-sm">{data.name}</span>
                        </div>
                        <span className={`text-sm font-bold ${
                          data.rate === 0 ? 'text-green-600' : 
                          data.rate <= 10 ? 'text-yellow-600' : 
                          data.rate <= 20 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {data.rate}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div 
            className="p-5 rounded-2xl bg-white"
            style={{ boxShadow: '0 4px 0 #e5e7eb' }}
          >
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Your Estimated Payout
            </h2>

            <div className="space-y-4">
              {/* Conversion Row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="text-sm text-gray-600">
                  <span className="font-bold text-gray-900">R$ {calculations.robux.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="mx-2">→</span>
                  <span className="font-bold text-gray-900">${calculations.grossUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <span className="text-xs text-gray-400">Gross</span>
              </div>

              {/* Tax Withholding */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    Tax Withholding ({calculations.taxRate}%)
                  </span>
                </div>
                <span className="font-bold text-red-600">
                  -${calculations.withheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-dashed border-gray-200" />

              {/* Net Payout */}
              <div 
                className="p-4 rounded-xl text-white"
                style={{ 
                  backgroundColor: GREEN,
                  boxShadow: `0 4px 0 ${darken(GREEN, 40)}`
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Net Payout</span>
                  <span className="text-2xl font-bold">
                    ${calculations.netPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {calculations.notes && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  {calculations.notes}
                </p>
              )}
            </div>
          </div>

          {/* Quick Reference Table */}
          <div 
            className="p-5 rounded-2xl bg-white"
            style={{ boxShadow: '0 4px 0 #e5e7eb' }}
          >
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
              Tax Rate Quick Reference
            </h2>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-green-700 font-medium">0% - Treaty Countries</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-yellow-700 font-medium">5-10% - Partial Treaty</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-orange-700 font-medium">11-20% - Limited Treaty</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-red-700 font-medium">30% - No Treaty</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center px-4">
            This calculator provides estimates only. Actual payouts may vary based on your specific tax situation, 
            completed tax forms (W-8BEN), and Roblox&apos;s current DevEx rates. Consult a tax professional for advice.
          </p>

        </div>
      </main>
    </div>
  );
}

// Helper function to get country flag emoji from country code
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
