'use client';

import { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  DollarSign, 
  Coins, 
  Calculator, 
  Info,
  ChevronDown,
  Percent,
  TrendingUp,
  Store,
  Wallet,
  Globe
} from 'lucide-react';

// DevEx rate: Robux → USD for developers
const DEVEX_RATE = 0.0035; // $0.0035 per Robux

// Player purchase rates by currency (how much 1 Robux costs to buy)
const CURRENCY_RATES: Record<string, { symbol: string; name: string; rate: number; code: string }> = {
  USD: { symbol: '$', name: 'US Dollar', rate: 0.0125, code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', rate: 0.0115, code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.0100, code: 'GBP' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', rate: 0.0170, code: 'CAD' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', rate: 0.0190, code: 'AUD' },
  JPY: { symbol: '¥', name: 'Japanese Yen', rate: 1.875, code: 'JPY' },
  KRW: { symbol: '₩', name: 'South Korean Won', rate: 16.625, code: 'KRW' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', rate: 0.0625, code: 'BRL' },
  MXN: { symbol: 'MX$', name: 'Mexican Peso', rate: 0.215, code: 'MXN' },
  INR: { symbol: '₹', name: 'Indian Rupee', rate: 1.04, code: 'INR' },
  PHP: { symbol: '₱', name: 'Philippine Peso', rate: 0.70, code: 'PHP' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', rate: 196.875, code: 'IDR' },
  THB: { symbol: '฿', name: 'Thai Baht', rate: 0.4375, code: 'THB' },
  VND: { symbol: '₫', name: 'Vietnamese Dong', rate: 312.5, code: 'VND' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', rate: 0.0168, code: 'SGD' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', rate: 0.0975, code: 'HKD' },
  TWD: { symbol: 'NT$', name: 'Taiwan Dollar', rate: 0.40, code: 'TWD' },
  PLN: { symbol: 'zł', name: 'Polish Złoty', rate: 0.05, code: 'PLN' },
  TRY: { symbol: '₺', name: 'Turkish Lira', rate: 0.40, code: 'TRY' },
  RUB: { symbol: '₽', name: 'Russian Ruble', rate: 1.125, code: 'RUB' },
  ZAR: { symbol: 'R', name: 'South African Rand', rate: 0.225, code: 'ZAR' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', rate: 0.046, code: 'AED' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', rate: 0.047, code: 'SAR' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', rate: 0.0205, code: 'NZD' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', rate: 0.011, code: 'CHF' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', rate: 0.13, code: 'SEK' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', rate: 0.135, code: 'NOK' },
  DKK: { symbol: 'kr', name: 'Danish Krone', rate: 0.086, code: 'DKK' },
  CLP: { symbol: 'CLP$', name: 'Chilean Peso', rate: 11.625, code: 'CLP' },
  COP: { symbol: 'COL$', name: 'Colombian Peso', rate: 50.0, code: 'COP' },
  PEN: { symbol: 'S/', name: 'Peruvian Sol', rate: 0.0465, code: 'PEN' },
  ARS: { symbol: 'ARS$', name: 'Argentine Peso', rate: 10.75, code: 'ARS' },
};

// Marketplace fee rates
const MARKETPLACE_FEES = {
  ugc: { name: 'UGC Items', rate: 0.30, description: 'User-generated content items' },
  gamepass: { name: 'Game Passes', rate: 0.30, description: 'One-time purchases in games' },
  devProduct: { name: 'Developer Products', rate: 0.30, description: 'Consumable items in games' },
  premium: { name: 'Premium Payouts', rate: 0.00, description: 'No fee for premium engagement' },
  groupFunds: { name: 'Group Payouts', rate: 0.00, description: 'No additional fee' },
};

const PINK = '#ec4899';
const ORANGE = '#FF9600';
const GRAY = '#e5e7eb';

function darken(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

type ConversionMode = 'robuxToUsd' | 'usdToRobux';
type CalculatorTab = 'converter' | 'devex' | 'marketplace';

export default function ConverterPage() {
  const [amount, setAmount] = useState<string>('1000');
  const [currency, setCurrency] = useState<string>('USD');
  const [mode, setMode] = useState<ConversionMode>('robuxToUsd');
  const [activeTab, setActiveTab] = useState<CalculatorTab>('converter');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [marketplaceType, setMarketplaceType] = useState<keyof typeof MARKETPLACE_FEES>('gamepass');

  const selectedCurrency = CURRENCY_RATES[currency];
  const numericAmount = parseFloat(amount) || 0;

  const calculations = useMemo(() => {
    const currencyRate = selectedCurrency.rate;
    
    if (mode === 'robuxToUsd') {
      // Converting Robux to currency
      const robux = numericAmount;
      const playerPurchaseValue = robux * currencyRate;
      const devExValue = robux * DEVEX_RATE;
      const devExValueInCurrency = devExValue * (currencyRate / CURRENCY_RATES.USD.rate);
      
      return {
        robux,
        playerPurchaseValue,
        devExValue,
        devExValueInCurrency,
        devExRate: DEVEX_RATE,
      };
    } else {
      // Converting currency to Robux
      const currencyAmount = numericAmount;
      const robuxFromPurchase = Math.floor(currencyAmount / currencyRate);
      const robuxFromDevEx = Math.floor((currencyAmount * (CURRENCY_RATES.USD.rate / currencyRate)) / DEVEX_RATE);
      
      return {
        currencyAmount,
        robuxFromPurchase,
        robuxFromDevEx,
        devExRate: DEVEX_RATE,
      };
    }
  }, [numericAmount, mode, selectedCurrency]);

  const marketplaceCalc = useMemo(() => {
    const fee = MARKETPLACE_FEES[marketplaceType];
    const grossRobux = numericAmount;
    const feeAmount = Math.floor(grossRobux * fee.rate);
    const netRobux = grossRobux - feeAmount;
    const netUsd = netRobux * DEVEX_RATE;
    const netCurrency = netUsd * (selectedCurrency.rate / CURRENCY_RATES.USD.rate);
    
    return {
      grossRobux,
      feeRate: fee.rate,
      feeAmount,
      netRobux,
      netUsd,
      netCurrency,
    };
  }, [numericAmount, marketplaceType, selectedCurrency]);

  const formatCurrency = (value: number, showDecimals = true) => {
    if (currency === 'JPY' || currency === 'KRW' || currency === 'VND' || currency === 'IDR' || currency === 'CLP' || currency === 'COP') {
      return Math.round(value).toLocaleString();
    }
    return showDecimals ? value.toFixed(2) : Math.round(value).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: PINK,
                boxShadow: `0 3px 0 ${darken(PINK, 40)}`
              }}
            >
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Robux Calculator</h1>
              <p className="text-xs text-gray-500">Convert, calculate & compare</p>
            </div>
          </div>
          <a 
            href="/"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Back to App
          </a>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'converter', label: 'Converter', icon: ArrowLeftRight },
              { id: 'devex', label: 'DevEx', icon: Wallet },
              { id: 'marketplace', label: 'Marketplace Fees', icon: Store },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CalculatorTab)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors
                  ${activeTab === tab.id 
                    ? 'border-pink-500 text-pink-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'}
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Converter Tab */}
          {activeTab === 'converter' && (
            <div className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex justify-center">
                <div className="inline-flex bg-white rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setMode('robuxToUsd')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      mode === 'robuxToUsd' 
                        ? 'bg-pink-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Robux → {currency}
                  </button>
                  <button
                    onClick={() => setMode('usdToRobux')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      mode === 'usdToRobux' 
                        ? 'bg-pink-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {currency} → Robux
                  </button>
                </div>
              </div>

              {/* Main Converter Card */}
              <div 
                className="bg-white rounded-2xl p-6"
                style={{ boxShadow: '0 4px 0 #e5e7eb' }}
              >
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  {/* Input */}
                  <div className="flex-1 w-full">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                      {mode === 'robuxToUsd' ? 'Robux Amount' : `${currency} Amount`}
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {mode === 'robuxToUsd' ? (
                          <Coins className="w-5 h-5 text-green-500" />
                        ) : (
                          <span className="text-lg font-bold text-gray-400">{selectedCurrency.symbol}</span>
                        )}
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 text-2xl font-bold text-gray-900 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:outline-none transition-colors"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Swap Button */}
                  <button
                    onClick={() => setMode(mode === 'robuxToUsd' ? 'usdToRobux' : 'robuxToUsd')}
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeftRight className="w-5 h-5 text-gray-600" />
                  </button>

                  {/* Currency Selector */}
                  <div className="flex-1 w-full">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                      Currency
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                        className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-gray-200 flex items-center justify-between hover:border-pink-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-pink-500" />
                          <div className="text-left">
                            <div className="font-bold text-gray-900">{currency}</div>
                            <div className="text-xs text-gray-500">{selectedCurrency.name}</div>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showCurrencyDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-10">
                          {Object.entries(CURRENCY_RATES).map(([code, data]) => (
                            <button
                              key={code}
                              onClick={() => {
                                setCurrency(code);
                                setShowCurrencyDropdown(false);
                              }}
                              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                                currency === code ? 'bg-pink-50' : ''
                              }`}
                            >
                              <span className="text-lg font-bold text-gray-400 w-8">{data.symbol}</span>
                              <div className="text-left flex-1">
                                <div className="font-semibold text-gray-900">{code}</div>
                                <div className="text-xs text-gray-500">{data.name}</div>
                              </div>
                              {currency === code && (
                                <div className="w-2 h-2 rounded-full bg-pink-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Player Purchase Value */}
                <div 
                  className="bg-white rounded-2xl p-5"
                  style={{ boxShadow: '0 4px 0 #e5e7eb' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Player Purchase Value</h3>
                      <p className="text-xs text-gray-500">What players pay to buy Robux</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {mode === 'robuxToUsd' ? (
                      <>{selectedCurrency.symbol}{formatCurrency(calculations.playerPurchaseValue)}</>
                    ) : (
                      <><span className="text-green-500">R$</span>{calculations.robuxFromPurchase?.toLocaleString()}</>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Rate: {selectedCurrency.symbol}{selectedCurrency.rate} per Robux
                  </p>
                </div>

                {/* DevEx Value */}
                <div 
                  className="bg-white rounded-2xl p-5"
                  style={{ boxShadow: '0 4px 0 #e5e7eb' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">DevEx Value</h3>
                      <p className="text-xs text-gray-500">Developer Exchange payout</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {mode === 'robuxToUsd' ? (
                      <>
                        ${calculations.devExValue?.toFixed(2)}
                        {currency !== 'USD' && (
                          <span className="text-lg text-gray-400 ml-2">
                            ({selectedCurrency.symbol}{formatCurrency(calculations.devExValueInCurrency || 0)})
                          </span>
                        )}
                      </>
                    ) : (
                      <><span className="text-green-500">R$</span>{calculations.robuxFromDevEx?.toLocaleString()}</>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Rate: $0.0035 per Robux
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Note:</strong> Player purchase rates vary by country and payment method. 
                  DevEx rate is $0.0035/Robux (requires 30,000+ Robux minimum and program eligibility).
                  Rates shown are approximate and may vary.
                </div>
              </div>
            </div>
          )}

          {/* DevEx Tab */}
          {activeTab === 'devex' && (
            <div className="space-y-6">
              <div 
                className="bg-white rounded-2xl p-6"
                style={{ boxShadow: '0 4px 0 #e5e7eb' }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2">Developer Exchange (DevEx)</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Calculate how much USD you can earn by cashing out your Robux through DevEx.
                </p>

                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    Robux to Cash Out
                  </label>
                  <div className="relative max-w-md">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-xl font-bold text-gray-900 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">DevEx Rate</div>
                    <div className="text-2xl font-bold text-gray-900">$0.0035</div>
                    <div className="text-xs text-gray-400">per Robux</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-xs font-semibold text-green-600 uppercase mb-1">You Receive</div>
                    <div className="text-2xl font-bold text-green-600">${(numericAmount * DEVEX_RATE).toFixed(2)}</div>
                    <div className="text-xs text-green-500">USD</div>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-4">
                    <div className="text-xs font-semibold text-pink-600 uppercase mb-1">In {currency}</div>
                    <div className="text-2xl font-bold text-pink-600">
                      {selectedCurrency.symbol}{formatCurrency((numericAmount * DEVEX_RATE) * (selectedCurrency.rate / CURRENCY_RATES.USD.rate))}
                    </div>
                    <div className="text-xs text-pink-500">{selectedCurrency.name}</div>
                  </div>
                </div>
              </div>

              {/* DevEx Requirements */}
              <div 
                className="bg-white rounded-2xl p-6"
                style={{ boxShadow: '0 4px 0 #e5e7eb' }}
              >
                <h3 className="font-bold text-gray-900 mb-4">DevEx Requirements</h3>
                <ul className="space-y-3">
                  {[
                    'Minimum 30,000 Robux earned (not purchased)',
                    'Must be 13+ years old',
                    'Verified email address',
                    'Valid DevEx portal account',
                    'Account in good standing',
                    'No recent ToS violations',
                  ].map((req, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-pink-500 text-xs font-bold">{i + 1}</span>
                      </div>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* DevEx Tiers */}
              <div 
                className="bg-white rounded-2xl p-6"
                style={{ boxShadow: '0 4px 0 #e5e7eb' }}
              >
                <h3 className="font-bold text-gray-900 mb-4">Cash Out Tiers</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-semibold text-gray-500">Robux</th>
                        <th className="text-right py-2 font-semibold text-gray-500">USD Payout</th>
                        <th className="text-right py-2 font-semibold text-gray-500">{currency !== 'USD' ? currency : ''}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[30000, 50000, 100000, 250000, 500000, 1000000, 5000000, 10000000].map((robux) => (
                        <tr key={robux} className="border-b border-gray-100">
                          <td className="py-3 font-semibold text-gray-900">
                            <span className="text-green-500">R$</span>{robux.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-gray-600">
                            ${(robux * DEVEX_RATE).toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-gray-400">
                            {currency !== 'USD' && (
                              <>{selectedCurrency.symbol}{formatCurrency((robux * DEVEX_RATE) * (selectedCurrency.rate / CURRENCY_RATES.USD.rate))}</>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div 
                className="bg-white rounded-2xl p-6"
                style={{ boxShadow: '0 4px 0 #e5e7eb' }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2">Marketplace Fee Calculator</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Calculate your earnings after Roblox marketplace fees.
                </p>

                {/* Sale Type */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                    Sale Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(MARKETPLACE_FEES).map(([key, data]) => (
                      <button
                        key={key}
                        onClick={() => setMarketplaceType(key as keyof typeof MARKETPLACE_FEES)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          marketplaceType === key
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={marketplaceType === key ? { boxShadow: `0 3px 0 ${darken(PINK, 40)}` } : {}}
                      >
                        {data.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sale Amount */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    Sale Price (Robux)
                  </label>
                  <div className="relative max-w-md">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-xl font-bold text-gray-900 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <span className="text-gray-600">Gross Sale</span>
                    <span className="font-bold text-gray-900">
                      <span className="text-green-500">R$</span>{marketplaceCalc.grossRobux.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Marketplace Fee ({(marketplaceCalc.feeRate * 100).toFixed(0)}%)
                    </span>
                    <span className="font-bold text-red-500">
                      -R${marketplaceCalc.feeAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <span className="text-gray-900 font-semibold">Net Robux</span>
                    <span className="font-bold text-xl text-gray-900">
                      <span className="text-green-500">R$</span>{marketplaceCalc.netRobux.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">DevEx Value</span>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${marketplaceCalc.netUsd.toFixed(2)}</div>
                      {currency !== 'USD' && (
                        <div className="text-sm text-gray-400">
                          {selectedCurrency.symbol}{formatCurrency(marketplaceCalc.netCurrency)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Summary */}
              <div 
                className="bg-white rounded-2xl p-6"
                style={{ boxShadow: '0 4px 0 #e5e7eb' }}
              >
                <h3 className="font-bold text-gray-900 mb-4">Marketplace Fee Summary</h3>
                <div className="space-y-3">
                  {Object.entries(MARKETPLACE_FEES).map(([key, data]) => (
                    <div 
                      key={key} 
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        marketplaceType === key ? 'bg-pink-50' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{data.name}</div>
                        <div className="text-xs text-gray-500">{data.description}</div>
                      </div>
                      <div className={`font-bold ${data.rate === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                        {data.rate === 0 ? 'No Fee' : `${(data.rate * 100).toFixed(0)}% Fee`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings Example */}
              <div className="bg-orange-50 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <strong>Example:</strong> If you sell a Game Pass for R$1,000, Roblox takes a 30% fee (R$300), 
                  leaving you with R$700. Through DevEx, that's worth $2.45 USD.
                </div>
              </div>
            </div>
          )}

          {/* Currency Quick Switch */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-400">
              <Globe className="w-4 h-4" />
              <span>Current: {selectedCurrency.name} ({currency})</span>
              <button
                onClick={() => setShowCurrencyDropdown(true)}
                className="text-pink-500 hover:text-pink-600 font-semibold"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-400">
          <p>Rates are approximate and may vary. Not affiliated with Roblox Corporation.</p>
          <p className="mt-1">Last updated: February 2026</p>
        </div>
      </footer>
    </div>
  );
}
