'use client';

import { useState } from 'react';
import { ChevronRight, Info, DollarSign, Coins, Zap, Wallet } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

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
  
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: hash, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'krw',
      name: 'Korean Won (KRW)',
      currency: 'KRW',
      available: 205.50,
      Icon: DollarSign
    },

  ];

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
  const total = amount + networkFee;

  const handlePayment = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (selectedMethod === 'eth') {
      // For ETH payments, use sendTransaction
      const ethAmount = total / 2500; // Convert USD to ETH (example rate)
      sendTransaction({ 
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7', // Example recipient
        value: parseEther(ethAmount.toString()),
      });
    } else {
      // For token payments, would need token contract interaction
      console.log('Token payment:', selectedPaymentMethod);
      alert(`Token payments coming soon for ${selectedPaymentMethod?.currency}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Wallet Connection Bar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-black" />
            <span className="font-semibold text-black">Kaia Commerce</span>
          </div>
          <ConnectButton />
        </div>
      </div>

      {/* Payment Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-center text-3xl font-bold" style={{ color: 'white' }}>
              Pay {amount.toFixed(2)} USD
            </h1>
            <p className="text-center mt-2" style={{ color: 'white' }}>to The Hundreds</p>
            
            {/* Show connected address */}
            {isConnected && address && (
              <p className="text-center text-xs mt-3" style={{ color: 'white' }}>
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </div>

          {/* Payment Methods */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Pay with</h2>
            
            {/* Show wallet balance if connected */}
            {isConnected && balance && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="font-semibold text-black">
                  {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                </p>
              </div>
            )}
            
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
                          <p className="font-semibold text-black">{method.name}</p>
                          <p className="text-sm text-gray-500">
                            {method.currency}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="font-semibold text-black">
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
                  <span className="font-semibold text-black">${networkFee.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-black">Total</span>
                  <span className="text-black">
                    {total.toFixed(2)} {selectedPaymentMethod?.currency} • ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Status */}
            {hash && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">
                  Transaction Hash: {hash.slice(0, 10)}...
                </p>
                {isConfirming && <p className="text-sm text-blue-500">Waiting for confirmation...</p>}
                {isConfirmed && <p className="text-sm text-green-600">Transaction confirmed!</p>}
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!isConnected || isConfirming}
              className={`w-full mt-6 font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-lg ${
                !isConnected 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : isConfirming
                  ? 'bg-yellow-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {!isConnected 
                ? 'Connect Wallet to Pay' 
                : isConfirming 
                ? 'Processing...' 
                : 'Pay now'}
            </button>

            {/* Security Notice */}
            <p className="text-center text-xs text-gray-500 mt-4">
              Secured by blockchain • Powered by Kaia Commerce
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}