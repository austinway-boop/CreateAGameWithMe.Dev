'use client';

import { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Coins, 
  Calculator, 
  ChevronDown,
  Wallet,
  Store,
  Globe,
  Check
} from 'lucide-react';

const DEVEX_RATE = 0.0035;

const CURRENCY_RATES: Record<string, { symbol: string; name: string; rate: number }> = {
  USD: { symbol: '$', name: 'US Dollar', rate: 0.0125 },
  EUR: { symbol: '€', name: 'Euro', rate: 0.0115 },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.0100 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', rate: 0.0170 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', rate: 0.0190 },
  JPY: { symbol: '¥', name: 'Japanese Yen', rate: 1.875 },
  KRW: { symbol: '₩', name: 'Korean Won', rate: 16.625 },
  BRL: { symbol: 'R$', name: 'Brazilian Real', rate: 0.0625 },
  MXN: { symbol: 'MX$', name: 'Mexican Peso', rate: 0.215 },
  INR: { symbol: '₹', name: 'Indian Rupee', rate: 1.04 },
  PHP: { symbol: '₱', name: 'Philippine Peso', rate: 0.70 },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', rate: 196.875 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', rate: 0.0168 },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', rate: 0.0975 },
  PLN: { symbol: 'zł', name: 'Polish Złoty', rate: 0.05 },
  TRY: { symbol: '₺', name: 'Turkish Lira', rate: 0.40 },
  ZAR: { symbol: 'R', name: 'South African Rand', rate: 0.225 },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', rate: 0.0205 },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', rate: 0.011 },
  SEK: { symbol: 'kr', name: 'Swedish Krona', rate: 0.13 },
};

const MARKETPLACE_FEES = {
  gamepass: { name: 'Game Passes', rate: 0.30 },
  devProduct: { name: 'Developer Products', rate: 0.30 },
  ugc: { name: 'UGC Items', rate: 0.30 },
  premium: { name: 'Premium Payouts', rate: 0.00 },
};

const PINK = '#ec4899';

function darken(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

type CalculatorTab = 'converter' | 'devex' | 'marketplace';

export default function ConverterPage() {
  const [amount, setAmount] = useState<string>('1000');
  const [currency, setCurrency] = useState<string>('USD');
  const [activeTab, setActiveTab] = useState<CalculatorTab>('converter');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [marketplaceType, setMarketplaceType] = useState<keyof typeof MARKETPLACE_FEES>('gamepass');

  const selectedCurrency = CURRENCY_RATES[currency];
  const numericAmount = parseFloat(amount) || 0;

  const calculations = useMemo(() => {
    const currencyRate = selectedCurrency.rate;
    const robux = numericAmount;
    const playerValue = robux * currencyRate;
    const devExValue = robux * DEVEX_RATE;
    const devExInCurrency = devExValue * (currencyRate / CURRENCY_RATES.USD.rate);
    
    return { robux, playerValue, devExValue, devExInCurrency };
  }, [numericAmount, selectedCurrency]);

  const marketplaceCalc = useMemo(() => {
    const fee = MARKETPLACE_FEES[marketplaceType];
    const gross = numericAmount;
    const feeAmount = Math.floor(gross * fee.rate);
    const net = gross - feeAmount;
    const netUsd = net * DEVEX_RATE;
    
    return { gross, feeRate: fee.rate, feeAmount, net, netUsd };
  }, [numericAmount, marketplaceType]);

  const formatNum = (value: number) => {
    if (['JPY', 'KRW', 'IDR'].includes(currency)) {
      return Math.round(value).toLocaleString();
    }
    return value.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: PINK, boxShadow: `0 3px 0 ${darken(PINK, 40)}` }}
            >
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Robux Calculator</h1>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back</a>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 flex">
          {[
            { id: 'converter', label: 'Convert', icon: ArrowLeftRight },
            { id: 'devex', label: 'DevEx', icon: Wallet },
            { id: 'marketplace', label: 'Fees', icon: Store },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CalculatorTab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-pink-500 text-pink-500' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Converter Tab */}
          {activeTab === 'converter' && (
            <>
              {/* Input Card */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
                <div className="flex gap-3">
                  {/* Amount Input */}
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Robux</div>
                    <div className="relative">
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 text-xl font-bold bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Currency */}
                  <div className="w-36">
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Currency</div>
                    <div className="relative">
                      <button
                        onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 flex items-center justify-between hover:border-pink-300"
                      >
                        <span className="font-bold text-gray-900">{currency}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showCurrencyDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-20">
                          {Object.entries(CURRENCY_RATES).map(([code, data]) => (
                            <button
                              key={code}
                              onClick={() => { setCurrency(code); setShowCurrencyDropdown(false); }}
                              className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 ${currency === code ? 'bg-pink-50' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 w-6">{data.symbol}</span>
                                <span className="font-medium text-gray-900">{code}</span>
                              </div>
                              {currency === code && <Check className="w-4 h-4 text-pink-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
                  <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Player Cost</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedCurrency.symbol}{formatNum(calculations.playerValue)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Purchase price</div>
                </div>
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
                  <div className="text-xs font-semibold text-green-500 uppercase mb-1">DevEx Value</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${calculations.devExValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Developer payout</div>
                </div>
              </div>

              {/* Quick Reference */}
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Rates</span>
                  <div className="flex gap-4">
                    <span className="text-gray-400">Player: <span className="text-gray-600 font-medium">{selectedCurrency.symbol}{selectedCurrency.rate}/R$</span></span>
                    <span className="text-gray-400">DevEx: <span className="text-green-600 font-medium">$0.0035/R$</span></span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* DevEx Tab */}
          {activeTab === 'devex' && (
            <>
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Robux to Cash Out</div>
                <div className="relative max-w-xs">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-xl font-bold bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="mt-5 p-4 bg-green-50 rounded-xl">
                  <div className="text-xs font-semibold text-green-600 uppercase mb-1">You Receive</div>
                  <div className="text-3xl font-bold text-green-600">${(numericAmount * DEVEX_RATE).toFixed(2)}</div>
                  {currency !== 'USD' && (
                    <div className="text-sm text-green-500 mt-1">
                      ≈ {selectedCurrency.symbol}{formatNum((numericAmount * DEVEX_RATE) * (selectedCurrency.rate / CURRENCY_RATES.USD.rate))} {currency}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Tiers */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-3">Quick Reference</div>
                <div className="grid grid-cols-2 gap-2">
                  {[30000, 100000, 500000, 1000000].map((robux) => (
                    <button
                      key={robux}
                      onClick={() => setAmount(robux.toString())}
                      className={`p-3 rounded-xl text-left transition-colors ${
                        numericAmount === robux ? 'bg-pink-50 border-2 border-pink-200' : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-bold text-gray-900">R${robux.toLocaleString()}</div>
                      <div className="text-xs text-green-600">${(robux * DEVEX_RATE).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-3">Requirements</div>
                <div className="space-y-2 text-sm text-gray-600">
                  {['30,000+ earned Robux', '13+ years old', 'Verified email', 'Good standing'].map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                      {req}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <>
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
                {/* Type Selector */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {Object.entries(MARKETPLACE_FEES).map(([key, data]) => (
                    <button
                      key={key}
                      onClick={() => setMarketplaceType(key as keyof typeof MARKETPLACE_FEES)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        marketplaceType === key
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {data.name}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Sale Price</div>
                <div className="relative max-w-xs mb-5">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-xl font-bold bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Breakdown */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gross</span>
                    <span className="font-semibold">R${marketplaceCalc.gross.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fee ({(marketplaceCalc.feeRate * 100)}%)</span>
                    <span className="font-semibold text-red-500">-R${marketplaceCalc.feeAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">You Keep</span>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">R${marketplaceCalc.net.toLocaleString()}</div>
                      <div className="text-sm text-green-600">${marketplaceCalc.netUsd.toFixed(2)} DevEx</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Overview */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-3">All Fees</div>
                <div className="space-y-2">
                  {Object.entries(MARKETPLACE_FEES).map(([key, data]) => (
                    <div key={key} className="flex justify-between items-center py-2">
                      <span className="text-gray-700">{data.name}</span>
                      <span className={`font-semibold ${data.rate === 0 ? 'text-green-500' : 'text-gray-500'}`}>
                        {data.rate === 0 ? 'Free' : `${(data.rate * 100)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Currency indicator */}
          <div className="flex justify-center pt-4">
            <button 
              onClick={() => setShowCurrencyDropdown(true)}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600"
            >
              <Globe className="w-4 h-4" />
              {selectedCurrency.name}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
