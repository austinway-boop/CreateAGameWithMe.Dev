'use client';

import { useState, useMemo } from 'react';
import { Coins, ChevronDown, Check } from 'lucide-react';

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

export default function ConverterPage() {
  const [amount, setAmount] = useState<string>('1000');
  const [currency, setCurrency] = useState<string>('USD');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

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

  const formatNum = (value: number) => {
    if (['JPY', 'KRW', 'IDR'].includes(currency)) {
      return Math.round(value).toLocaleString();
    }
    return value.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-5">
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Robux Calculator</h1>
          <p className="text-gray-500 mt-1">Convert Robux to real currency</p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
          <div className="flex gap-4">
            {/* Amount Input */}
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-500 mb-2">Robux</div>
              <div className="relative">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-green-500" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 text-2xl font-bold bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Currency */}
            <div className="w-40">
              <div className="text-sm font-semibold text-gray-500 mb-2">Currency</div>
              <div className="relative">
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="w-full px-4 py-4 bg-gray-50 rounded-xl border-2 border-gray-200 flex items-center justify-between hover:border-pink-300 transition-colors"
                >
                  <span className="text-xl font-bold text-gray-900">{currency}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showCurrencyDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-64 overflow-y-auto z-20">
                    {Object.entries(CURRENCY_RATES).map(([code, data]) => (
                      <button
                        key={code}
                        onClick={() => { setCurrency(code); setShowCurrencyDropdown(false); }}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${currency === code ? 'bg-pink-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 w-8 text-lg">{data.symbol}</span>
                          <span className="font-semibold text-gray-900">{code}</span>
                        </div>
                        {currency === code && <Check className="w-5 h-5 text-pink-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
            <div className="text-sm font-semibold text-gray-400 uppercase mb-2">Player Cost</div>
            <div className="text-3xl font-bold text-gray-900">
              {selectedCurrency.symbol}{formatNum(calculations.playerValue)}
            </div>
            <div className="text-sm text-gray-400 mt-2">What players pay</div>
          </div>
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 0 #e5e7eb' }}>
            <div className="text-sm font-semibold text-green-500 uppercase mb-2">DevEx Payout</div>
            <div className="text-3xl font-bold text-green-600">
              {selectedCurrency.symbol}{formatNum(calculations.devExInCurrency)}
            </div>
            <div className="text-sm text-gray-400 mt-2">${calculations.devExValue.toFixed(2)} USD</div>
          </div>
        </div>

        {/* Rates */}
        <div className="flex justify-center gap-6 text-sm text-gray-400 pt-2">
          <span>Player: {selectedCurrency.symbol}{selectedCurrency.rate}/R$</span>
          <span>DevEx: $0.0035/R$</span>
        </div>
      </div>
    </div>
  );
}
