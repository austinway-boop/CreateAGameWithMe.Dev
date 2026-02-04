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
  Coins
} from 'lucide-react';

// DevEx exchange rate (Robux to USD)
const DEVEX_RATE = 0.0035; // $0.0035 per Robux

// Comprehensive tax data by country
// - usWithholding: US withholding tax rate based on tax treaties
// - incomeTax: Approximate income tax rate for self-employment/freelance income
// - hasTreaty: Whether country has tax treaty with USA
// - notes: Additional info
interface CountryTaxData {
  name: string;
  usWithholding: number;
  incomeTax: number;
  hasTreaty: boolean;
  notes?: string;
}

const COUNTRY_TAX_DATA: { [key: string]: CountryTaxData } = {
  // North America
  'US': { name: 'United States', usWithholding: 0, incomeTax: 25, hasTreaty: true, notes: 'Federal + self-employment tax (~15.3% SE + ~10% federal)' },
  'CA': { name: 'Canada', usWithholding: 0, incomeTax: 30, hasTreaty: true, notes: 'Federal + provincial combined' },
  'MX': { name: 'Mexico', usWithholding: 10, incomeTax: 30, hasTreaty: true },
  
  // Europe
  'GB': { name: 'United Kingdom', usWithholding: 0, incomeTax: 20, hasTreaty: true, notes: 'Basic rate for self-employed' },
  'DE': { name: 'Germany', usWithholding: 0, incomeTax: 30, hasTreaty: true, notes: 'Income tax + solidarity surcharge' },
  'FR': { name: 'France', usWithholding: 0, incomeTax: 30, hasTreaty: true, notes: 'Income tax + social charges' },
  'IT': { name: 'Italy', usWithholding: 0, incomeTax: 35, hasTreaty: true, notes: 'IRPEF progressive rate' },
  'ES': { name: 'Spain', usWithholding: 0, incomeTax: 24, hasTreaty: true, notes: 'Autónomo rate' },
  'PT': { name: 'Portugal', usWithholding: 10, incomeTax: 25, hasTreaty: true },
  'NL': { name: 'Netherlands', usWithholding: 0, incomeTax: 37, hasTreaty: true, notes: 'Box 1 income' },
  'BE': { name: 'Belgium', usWithholding: 0, incomeTax: 40, hasTreaty: true, notes: 'High marginal rates' },
  'AT': { name: 'Austria', usWithholding: 0, incomeTax: 35, hasTreaty: true },
  'CH': { name: 'Switzerland', usWithholding: 0, incomeTax: 22, hasTreaty: true, notes: 'Canton-dependent' },
  'SE': { name: 'Sweden', usWithholding: 0, incomeTax: 32, hasTreaty: true, notes: 'Municipal + state tax' },
  'NO': { name: 'Norway', usWithholding: 0, incomeTax: 22, hasTreaty: true },
  'DK': { name: 'Denmark', usWithholding: 0, incomeTax: 38, hasTreaty: true, notes: 'High tax jurisdiction' },
  'FI': { name: 'Finland', usWithholding: 0, incomeTax: 30, hasTreaty: true },
  'IE': { name: 'Ireland', usWithholding: 0, incomeTax: 40, hasTreaty: true, notes: 'High marginal rate + USC + PRSI' },
  'PL': { name: 'Poland', usWithholding: 10, incomeTax: 12, hasTreaty: true, notes: 'Flat tax option available' },
  'CZ': { name: 'Czech Republic', usWithholding: 10, incomeTax: 15, hasTreaty: true },
  'HU': { name: 'Hungary', usWithholding: 0, incomeTax: 15, hasTreaty: true, notes: 'Flat tax rate' },
  'RO': { name: 'Romania', usWithholding: 10, incomeTax: 10, hasTreaty: true, notes: 'Flat tax' },
  'BG': { name: 'Bulgaria', usWithholding: 10, incomeTax: 10, hasTreaty: true, notes: 'Flat tax - lowest in EU' },
  'GR': { name: 'Greece', usWithholding: 0, incomeTax: 22, hasTreaty: true },
  'SK': { name: 'Slovakia', usWithholding: 10, incomeTax: 19, hasTreaty: true },
  'SI': { name: 'Slovenia', usWithholding: 5, incomeTax: 27, hasTreaty: true },
  'HR': { name: 'Croatia', usWithholding: 10, incomeTax: 20, hasTreaty: false },
  'RS': { name: 'Serbia', usWithholding: 30, incomeTax: 20, hasTreaty: false },
  'UA': { name: 'Ukraine', usWithholding: 10, incomeTax: 18, hasTreaty: true, notes: 'Plus 1.5% military levy' },
  'RU': { name: 'Russia', usWithholding: 0, incomeTax: 13, hasTreaty: true, notes: 'Flat tax for residents' },
  'LT': { name: 'Lithuania', usWithholding: 10, incomeTax: 15, hasTreaty: true },
  'LV': { name: 'Latvia', usWithholding: 10, incomeTax: 23, hasTreaty: true },
  'EE': { name: 'Estonia', usWithholding: 10, incomeTax: 20, hasTreaty: true },
  'IS': { name: 'Iceland', usWithholding: 5, incomeTax: 31, hasTreaty: true },
  'LU': { name: 'Luxembourg', usWithholding: 0, incomeTax: 25, hasTreaty: true },
  'MT': { name: 'Malta', usWithholding: 10, incomeTax: 25, hasTreaty: true },
  'CY': { name: 'Cyprus', usWithholding: 0, incomeTax: 20, hasTreaty: true, notes: 'Low tax jurisdiction' },
  
  // Asia Pacific
  'JP': { name: 'Japan', usWithholding: 0, incomeTax: 30, hasTreaty: true, notes: 'National + local + consumption' },
  'KR': { name: 'South Korea', usWithholding: 10, incomeTax: 24, hasTreaty: true },
  'CN': { name: 'China', usWithholding: 10, incomeTax: 30, hasTreaty: true, notes: 'Progressive rates' },
  'TW': { name: 'Taiwan', usWithholding: 30, incomeTax: 20, hasTreaty: false },
  'HK': { name: 'Hong Kong', usWithholding: 30, incomeTax: 15, hasTreaty: false, notes: 'Low tax jurisdiction' },
  'SG': { name: 'Singapore', usWithholding: 0, incomeTax: 15, hasTreaty: true, notes: 'Low tax jurisdiction' },
  'MY': { name: 'Malaysia', usWithholding: 30, incomeTax: 24, hasTreaty: false },
  'TH': { name: 'Thailand', usWithholding: 15, incomeTax: 25, hasTreaty: true },
  'VN': { name: 'Vietnam', usWithholding: 10, incomeTax: 20, hasTreaty: true },
  'PH': { name: 'Philippines', usWithholding: 25, incomeTax: 25, hasTreaty: true },
  'ID': { name: 'Indonesia', usWithholding: 15, incomeTax: 25, hasTreaty: true },
  'IN': { name: 'India', usWithholding: 15, incomeTax: 30, hasTreaty: true, notes: 'Plus surcharge and cess' },
  'PK': { name: 'Pakistan', usWithholding: 30, incomeTax: 25, hasTreaty: true },
  'BD': { name: 'Bangladesh', usWithholding: 10, incomeTax: 25, hasTreaty: true },
  'LK': { name: 'Sri Lanka', usWithholding: 10, incomeTax: 24, hasTreaty: true },
  'NP': { name: 'Nepal', usWithholding: 30, incomeTax: 25, hasTreaty: false },
  'AU': { name: 'Australia', usWithholding: 5, incomeTax: 32.5, hasTreaty: true, notes: 'Marginal rate for $45k-$120k' },
  'NZ': { name: 'New Zealand', usWithholding: 10, incomeTax: 30, hasTreaty: true },
  
  // Middle East
  'IL': { name: 'Israel', usWithholding: 10, incomeTax: 35, hasTreaty: true },
  'AE': { name: 'United Arab Emirates', usWithholding: 30, incomeTax: 0, hasTreaty: false, notes: 'No personal income tax' },
  'SA': { name: 'Saudi Arabia', usWithholding: 30, incomeTax: 0, hasTreaty: false, notes: 'No personal income tax' },
  'QA': { name: 'Qatar', usWithholding: 30, incomeTax: 0, hasTreaty: false, notes: 'No personal income tax' },
  'KW': { name: 'Kuwait', usWithholding: 30, incomeTax: 0, hasTreaty: false, notes: 'No personal income tax' },
  'BH': { name: 'Bahrain', usWithholding: 30, incomeTax: 0, hasTreaty: false, notes: 'No personal income tax' },
  'OM': { name: 'Oman', usWithholding: 30, incomeTax: 0, hasTreaty: false, notes: 'No personal income tax' },
  'JO': { name: 'Jordan', usWithholding: 30, incomeTax: 20, hasTreaty: false },
  'LB': { name: 'Lebanon', usWithholding: 30, incomeTax: 20, hasTreaty: false },
  'TR': { name: 'Turkey', usWithholding: 10, incomeTax: 27, hasTreaty: true },
  
  // Africa
  'ZA': { name: 'South Africa', usWithholding: 0, incomeTax: 26, hasTreaty: true, notes: 'Progressive rates' },
  'EG': { name: 'Egypt', usWithholding: 15, incomeTax: 22.5, hasTreaty: true },
  'MA': { name: 'Morocco', usWithholding: 10, incomeTax: 30, hasTreaty: true },
  'TN': { name: 'Tunisia', usWithholding: 15, incomeTax: 26, hasTreaty: true },
  'NG': { name: 'Nigeria', usWithholding: 30, incomeTax: 24, hasTreaty: false },
  'KE': { name: 'Kenya', usWithholding: 30, incomeTax: 30, hasTreaty: false },
  'GH': { name: 'Ghana', usWithholding: 30, incomeTax: 25, hasTreaty: false },
  'ET': { name: 'Ethiopia', usWithholding: 30, incomeTax: 35, hasTreaty: false },
  'TZ': { name: 'Tanzania', usWithholding: 30, incomeTax: 30, hasTreaty: false },
  'UG': { name: 'Uganda', usWithholding: 30, incomeTax: 30, hasTreaty: false },
  'ZW': { name: 'Zimbabwe', usWithholding: 30, incomeTax: 40, hasTreaty: false },
  'DZ': { name: 'Algeria', usWithholding: 30, incomeTax: 26, hasTreaty: false },
  'AO': { name: 'Angola', usWithholding: 30, incomeTax: 17, hasTreaty: false },
  
  // South America
  'BR': { name: 'Brazil', usWithholding: 15, incomeTax: 27.5, hasTreaty: false, notes: 'Highest bracket' },
  'AR': { name: 'Argentina', usWithholding: 30, incomeTax: 35, hasTreaty: false },
  'CL': { name: 'Chile', usWithholding: 10, incomeTax: 25, hasTreaty: true },
  'CO': { name: 'Colombia', usWithholding: 30, incomeTax: 33, hasTreaty: false },
  'PE': { name: 'Peru', usWithholding: 30, incomeTax: 29.5, hasTreaty: false },
  'VE': { name: 'Venezuela', usWithholding: 15, incomeTax: 34, hasTreaty: true },
  'EC': { name: 'Ecuador', usWithholding: 30, incomeTax: 35, hasTreaty: false },
  'UY': { name: 'Uruguay', usWithholding: 30, incomeTax: 25, hasTreaty: false },
  'PY': { name: 'Paraguay', usWithholding: 30, incomeTax: 10, hasTreaty: false, notes: 'Low tax jurisdiction' },
  'BO': { name: 'Bolivia', usWithholding: 30, incomeTax: 13, hasTreaty: false },
  
  // Central America & Caribbean
  'CR': { name: 'Costa Rica', usWithholding: 30, incomeTax: 25, hasTreaty: false },
  'PA': { name: 'Panama', usWithholding: 30, incomeTax: 25, hasTreaty: false, notes: 'Territorial tax system' },
  'GT': { name: 'Guatemala', usWithholding: 30, incomeTax: 25, hasTreaty: false },
  'HN': { name: 'Honduras', usWithholding: 30, incomeTax: 25, hasTreaty: false },
  'NI': { name: 'Nicaragua', usWithholding: 30, incomeTax: 30, hasTreaty: false },
  'SV': { name: 'El Salvador', usWithholding: 30, incomeTax: 25, hasTreaty: false },
  'JM': { name: 'Jamaica', usWithholding: 12.5, incomeTax: 25, hasTreaty: true },
  'TT': { name: 'Trinidad and Tobago', usWithholding: 30, incomeTax: 25, hasTreaty: true },
  'DO': { name: 'Dominican Republic', usWithholding: 30, incomeTax: 25, hasTreaty: false },
  'PR': { name: 'Puerto Rico', usWithholding: 0, incomeTax: 24, hasTreaty: true, notes: 'US Territory - separate tax system' },
  'CU': { name: 'Cuba', usWithholding: 30, incomeTax: 50, hasTreaty: false },
  'HT': { name: 'Haiti', usWithholding: 30, incomeTax: 30, hasTreaty: false },
  'BB': { name: 'Barbados', usWithholding: 5, incomeTax: 28.5, hasTreaty: true },
  'BS': { name: 'Bahamas', usWithholding: 30, incomeTax: 0, hasTreaty: false, notes: 'No personal income tax' },
};

// Colors matching the Duolingo style
const ORANGE = '#FF9600';
const GREEN = '#22c55e';

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
    const robux = parseFloat(robuxAmount) || 0;
    const country = COUNTRY_TAX_DATA[selectedCountry];
    const usWithholdingRate = country?.usWithholding || 30;
    const incomeTaxRate = country?.incomeTax || 25;
    
    // Step 1: Convert Robux to USD
    const grossUSD = robux * DEVEX_RATE;
    
    // Step 2: US Withholding Tax (taken at source by Roblox)
    const usWithholdingAmount = grossUSD * (usWithholdingRate / 100);
    const afterUSWithholding = grossUSD - usWithholdingAmount;
    
    // Step 3: Local Income Tax (on the amount received)
    // Note: In many countries, US withholding can be credited against local tax
    // For simplicity, we calculate on the gross and show both scenarios
    const localTaxOnGross = grossUSD * (incomeTaxRate / 100);
    const localTaxOnNet = afterUSWithholding * (incomeTaxRate / 100);
    
    // Scenario 1: No tax credit (pay both full taxes)
    const netNoCredit = afterUSWithholding - localTaxOnNet;
    
    // Scenario 2: With tax credit (US withholding credited against local tax)
    // You only pay the difference if local tax > US withholding
    const effectiveLocalTax = Math.max(0, localTaxOnGross - usWithholdingAmount);
    const netWithCredit = grossUSD - usWithholdingAmount - effectiveLocalTax;
    
    // Total tax rates
    const totalTaxRateNoCredit = ((grossUSD - netNoCredit) / grossUSD) * 100;
    const totalTaxRateWithCredit = ((grossUSD - netWithCredit) / grossUSD) * 100;
    
    return {
      robux,
      grossUSD,
      usWithholdingRate,
      usWithholdingAmount,
      afterUSWithholding,
      incomeTaxRate,
      localTaxOnGross,
      localTaxOnNet,
      effectiveLocalTax,
      netNoCredit,
      netWithCredit,
      totalTaxRateNoCredit,
      totalTaxRateWithCredit,
      hasTreaty: country?.hasTreaty || false,
      notes: country?.notes
    };
  }, [robuxAmount, selectedCountry]);

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
              Enter Robux Amount
            </h2>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                R$
              </span>
              <input
                type="text"
                value={robuxAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setRobuxAmount(value);
                }}
                className="w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                placeholder="100000"
              />
            </div>
            
            <p className="mt-2 text-xs text-gray-400 text-center">
              Rate: $0.0035 per Robux = <span className="font-semibold">${calculations.grossUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> gross
            </p>
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
                  <div className="text-left">
                    <span className="font-semibold text-gray-900">{selectedCountryData?.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {selectedCountryData?.hasTreaty && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                          US Treaty
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {selectedCountryData?.usWithholding}% US / {selectedCountryData?.incomeTax}% Local
                      </span>
                    </div>
                  </div>
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
                          <div className="text-left">
                            <span className="font-medium text-gray-900 text-sm">{data.name}</span>
                            {data.hasTreaty && (
                              <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded">
                                Treaty
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className={`font-bold ${
                            data.usWithholding === 0 ? 'text-green-600' : 
                            data.usWithholding <= 10 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {data.usWithholding}% US
                          </div>
                          <div className="text-gray-400">{data.incomeTax}% Local</div>
                        </div>
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
              Tax Breakdown
            </h2>

            <div className="space-y-3">
              {/* Gross Amount */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm text-gray-600">Gross DevEx Payout</span>
                <span className="font-bold text-gray-900">
                  ${calculations.grossUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* US Withholding Tax */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-700">US Withholding Tax</span>
                    <span className="px-1.5 py-0.5 bg-blue-200 text-blue-800 text-[10px] font-bold rounded">
                      {calculations.usWithholdingRate}%
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-500 mt-0.5">Withheld by Roblox at source</p>
                </div>
                <span className="font-bold text-blue-700">
                  -${calculations.usWithholdingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* After US Withholding */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100">
                <span className="text-sm text-gray-600">Amount You Receive</span>
                <span className="font-bold text-gray-900">
                  ${calculations.afterUSWithholding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Local Income Tax */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-orange-700">{selectedCountryData?.name} Income Tax</span>
                    <span className="px-1.5 py-0.5 bg-orange-200 text-orange-800 text-[10px] font-bold rounded">
                      {calculations.incomeTaxRate}%
                    </span>
                  </div>
                  <p className="text-[10px] text-orange-500 mt-0.5">Estimated local income tax</p>
                </div>
                <span className="font-bold text-orange-700">
                  -${calculations.localTaxOnNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-dashed border-gray-200 my-2" />

              {/* Net Payout */}
              <div 
                className="p-4 rounded-xl text-white"
                style={{ 
                  backgroundColor: GREEN,
                  boxShadow: `0 4px 0 ${darken(GREEN, 40)}`
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold">Estimated Net Payout</span>
                    <p className="text-[10px] text-green-100 mt-0.5">After all taxes</p>
                  </div>
                  <span className="text-2xl font-bold">
                    ${calculations.netNoCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Effective Tax Rate */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm text-gray-600">Effective Tax Rate</span>
                <span className="font-bold text-gray-900">
                  {calculations.totalTaxRateNoCredit.toFixed(1)}%
                </span>
              </div>

              {/* Tax Credit Scenario */}
              {calculations.hasTreaty && calculations.usWithholdingRate > 0 && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">With Foreign Tax Credit</span>
                  </div>
                  <p className="text-xs text-green-600 mb-2">
                    If your country allows US withholding as a tax credit, you may only pay the difference:
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Net with credit:</span>
                    <span className="font-bold text-green-700">
                      ${calculations.netWithCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-xs font-normal ml-1">({calculations.totalTaxRateWithCredit.toFixed(1)}% effective)</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {calculations.notes && (
                <p className="text-xs text-gray-500 text-center mt-2 italic">
                  Note: {calculations.notes}
                </p>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div 
            className="p-5 rounded-2xl bg-white"
            style={{ boxShadow: '0 4px 0 #e5e7eb' }}
          >
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
              Quick Summary
            </h2>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">You Earn</p>
                <p className="text-lg font-bold text-gray-900">R$ {calculations.robux.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50">
                <p className="text-xs text-red-500 mb-1">Total Tax</p>
                <p className="text-lg font-bold text-red-600">{calculations.totalTaxRateNoCredit.toFixed(0)}%</p>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <p className="text-xs text-green-500 mb-1">You Keep</p>
                <p className="text-lg font-bold text-green-600">${calculations.netNoCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
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
