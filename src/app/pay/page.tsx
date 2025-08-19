'use client';

import { useState } from 'react';
import { ChevronRight, Info, DollarSign, Coins, Zap } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  currency: string;
  available: number;
  Icon: React.ElementType;
}

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<string>('usdc');
  const [amount] = useState(99.00);
  const networkFee = 0.02;

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'usdc',
      name: 'USDC',
      currency: 'USDC',
      available: 205.50,
      Icon: DollarSign
    },
    {
      id: 'usdt',
      name: 'USDT',
      currency: 'USDT',
      available: 150.25,
      Icon: Coins
    },
    {
      id: 'eth',
      name: 'Ethereum',
      currency: 'ETH',
      available: 0.082,
      Icon: Zap
    }
  ];

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
  const total = amount + networkFee;

  const handlePayment = () => {
    console.log('Processing payment with:', selectedPaymentMethod);
    alert(`Processing payment of ${total} ${selectedPaymentMethod?.currency}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white">
              <Zap className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-center text-3xl font-bold">
            Pay {amount.toFixed(2)} USD
          </h1>
          <p className="text-center text-blue-100 mt-2">to The Hundreds</p>
        </div>

        {/* Payment Methods */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Pay with</h2>
          
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const IconComponent = method.Icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{method.name}</p>
                        <p className="text-sm text-gray-500">
                          {method.currency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(method.available * (method.currency === 'ETH' ? 2500 : 1)).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">Available</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fee Breakdown */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Network fee</span>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </div>
                <span className="font-semibold">${networkFee.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>
                  {total.toFixed(2)} {selectedPaymentMethod?.currency} • ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
          >
            Pay now
          </button>

          {/* Security Notice */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Secured by blockchain • Powered by Kaia Commerce
          </p>
        </div>
      </div>
    </div>
  );
}