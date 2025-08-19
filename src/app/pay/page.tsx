'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronRight, Info, Wallet, CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  useAccount, 
  useBalance,
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract 
} from 'wagmi';
import { parseUnits, formatUnits, erc20Abi, maxUint256 } from 'viem';

interface PaymentMethod {
  id: string;
  name: string;
  currency: string;
  available: number | string;
  icon?: string;
  Icon?: React.ElementType;
}

type PaymentStep = 'selection' | 'confirmation' | 'processing' | 'success';
type TransactionStatus = 'idle' | 'approving' | 'approved' | 'transferring' | 'completed' | 'error';

const KRW_TOKEN_ADDRESS = '0x865d6a906c2f5506729c7d0bc0f6Dc6a3Cbf433c' as `0x${string}`;
const MERCHANT_ADDRESS = '0x742d35cc6634c0532925a3b844bc9e7595f0beb7' as `0x${string}`; // Replace with actual merchant address

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<string>('krw');
  const [amount] = useState(99.00);
  const networkFee = 0.02;
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('selection');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [tokenAmount, setTokenAmount] = useState<bigint>(BigInt(0));
  
  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  
  // Fetch KRW token balance
  const { data: krwBalance } = useBalance({
    address,
    token: KRW_TOKEN_ADDRESS,
    chainId: chain?.id,
  });

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: KRW_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, MERCHANT_ADDRESS] : undefined,
    chainId: chain?.id,
  });

  // Calculate token amount when balance is available
  useEffect(() => {
    if (krwBalance) {
      const total = amount + networkFee;
      const tokenDecimals = krwBalance.decimals || 18;
      const calculatedAmount = parseUnits(total.toString(), tokenDecimals);
      setTokenAmount(calculatedAmount);
      console.log('Token amount calculated:', {
        total,
        decimals: tokenDecimals,
        tokenAmount: calculatedAmount.toString(),
        currentAllowance: currentAllowance?.toString(),
      });
    }
  }, [krwBalance, amount, networkFee, currentAllowance]);

  // Simulate approve transaction
  const { data: approveConfig } = useSimulateContract({
    address: KRW_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'approve',
    args: [MERCHANT_ADDRESS, tokenAmount],
    chainId: chain?.id,
    query: {
      enabled: Boolean(address && tokenAmount > BigInt(0) && (!currentAllowance || currentAllowance < tokenAmount)),
    },
  });

  // Simulate transfer transaction
  const { data: transferConfig } = useSimulateContract({
    address: KRW_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [MERCHANT_ADDRESS, tokenAmount],
    chainId: chain?.id,
    query: {
      enabled: Boolean(address && tokenAmount > BigInt(0) && currentAllowance && currentAllowance >= tokenAmount),
    },
  });

  // Write contract hooks
  const { 
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApproving,
    isError: isApproveError,
    error: approveError
  } = useWriteContract();

  const { 
    data: transferHash,
    writeContract: writeTransfer,
    isPending: isTransferring,
    isError: isTransferError,
    error: transferError
  } = useWriteContract();

  // Wait for transaction confirmations
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: approveHash,
      chainId: chain?.id,
    });
    
  const { isLoading: isTransferConfirming, isSuccess: isTransferConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: transferHash,
      chainId: chain?.id,
    });

  // Convert KRW balance to number
  const krwAvailable = krwBalance ? parseFloat(formatUnits(krwBalance.value, krwBalance.decimals)) : 0;
  const krwAvailableFormatted = !isNaN(krwAvailable) ? krwAvailable.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0';

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'krw',
      name: 'Korean Won (KRW)',
      currency: 'KRW',
      available: krwAvailableFormatted,
      icon: '/korean-won.svg'
    },
    {
      id: 'usdt',
      name: 'Tether USD (USDT)',
      currency: 'USDT',
      available: '0',
      Icon: DollarSign
    },
  ];

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
  const total = amount + networkFee;

  // Handle initial payment button click
  const handlePaymentClick = () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setPaymentStep('confirmation');
  };

  // Handle confirmation and start payment flow
  const handleConfirmPayment = async () => {
    if (!address || !krwBalance || tokenAmount === BigInt(0)) {
      console.error('Missing requirements:', { address, krwBalance, tokenAmount: tokenAmount.toString() });
      alert('Please ensure your wallet is connected and has KRW balance');
      return;
    }
    
    setPaymentStep('processing');
    
    try {
      const needsApproval = !currentAllowance || currentAllowance < tokenAmount;
      
      console.log('Payment flow starting:', {
        needsApproval,
        currentAllowance: currentAllowance?.toString(),
        requiredAmount: tokenAmount.toString(),
        approveConfig: approveConfig?.request,
        transferConfig: transferConfig?.request,
      });
      
      if (needsApproval) {
        setTxStatus('approving');
        if (approveConfig?.request) {
          console.log('Sending approve transaction...');
          await writeApprove(approveConfig.request);
        } else {
          // Fallback: try direct approval
          console.log('Using fallback approve...');
          await writeApprove({
            address: KRW_TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: 'approve',
            args: [MERCHANT_ADDRESS, tokenAmount],
            chainId: chain?.id,
          });
        }
      } else {
        // Already approved, go straight to transfer
        setTxStatus('transferring');
        if (transferConfig?.request) {
          console.log('Sending transfer transaction...');
          await writeTransfer(transferConfig.request);
        } else {
          // Fallback: try direct transfer
          console.log('Using fallback transfer...');
          await writeTransfer({
            address: KRW_TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [MERCHANT_ADDRESS, tokenAmount],
            chainId: chain?.id,
          });
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setTxStatus('error');
    }
  };

  // Handle approval confirmation
  useEffect(() => {
    if (isApproveConfirmed && txStatus === 'approving') {
      console.log('Approval confirmed, refetching allowance...');
      refetchAllowance().then(() => {
        setTxStatus('transferring');
        // Now initiate the transfer
        if (transferConfig?.request) {
          console.log('Sending transfer after approval...');
          writeTransfer(transferConfig.request);
        } else {
          // Fallback transfer
          writeTransfer({
            address: KRW_TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [MERCHANT_ADDRESS, tokenAmount],
            chainId: chain?.id,
          });
        }
      });
    }
  }, [isApproveConfirmed, txStatus, transferConfig, writeTransfer, tokenAmount, chain, refetchAllowance]);

  // Handle transfer confirmation
  useEffect(() => {
    if (isTransferConfirmed) {
      setTxStatus('completed');
      setPaymentStep('success');
    }
  }, [isTransferConfirmed]);

  // Log errors
  useEffect(() => {
    if (isApproveError && approveError) {
      console.error('Approve error:', approveError);
    }
    if (isTransferError && transferError) {
      console.error('Transfer error:', transferError);
    }
  }, [isApproveError, approveError, isTransferError, transferError]);

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
          
          {/* Selection Step */}
          {paymentStep === 'selection' && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-center text-3xl font-bold" style={{ color: 'white' }}>
                  Pay {amount.toFixed(2)} KRW
                </h1>
                <p className="text-center mt-2" style={{ color: 'white' }}>to The Hundreds</p>
                
                {isConnected && address && (
                  <p className="text-center text-xs mt-3" style={{ color: 'white' }}>
                    Connected: {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Pay with</h2>
                
                {isConnected && balance && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Native Balance</p>
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
                              {method.icon ? (
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <Image 
                                    src={method.icon} 
                                    alt={method.name} 
                                    width={18} 
                                    height={18} 
                                    style={{ filter: 'brightness(0) saturate(100%) invert(37%) sepia(93%) saturate(1103%) hue-rotate(202deg) brightness(96%) contrast(88%)' }}
                                  />
                                </div>
                              ) : (
                                IconComponent && <IconComponent className="w-5 h-5 text-blue-600" />
                              )}
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
                                {method.available} {method.currency}
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

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Network fee</span>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </div>
                      <span className="font-semibold text-black">{networkFee.toFixed(2)} KRW</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-black">Total</span>
                      <span className="text-black">
                        {total.toFixed(2)} {selectedPaymentMethod?.currency}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePaymentClick}
                  disabled={!isConnected}
                  className={`w-full mt-6 font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-lg ${
                    !isConnected 
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  style={{ color: 'white !important' }}
                >
                  {!isConnected ? 'Connect Wallet to Pay' : 'Continue to Payment'}
                </button>
              </div>
            </>
          )}

          {/* Confirmation Step */}
          {paymentStep === 'confirmation' && (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <h1 className="text-center text-2xl font-bold" style={{ color: 'white' }}>
                  Confirm Payment
                </h1>
                <p className="text-center mt-2 text-sm" style={{ color: 'white' }}>
                  Review your order details
                </p>
              </div>

              <div className="p-6">
                {/* Order Information */}
                <div className="mb-6">
                  <h3 className="font-semibold text-black mb-3">Order Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Merchant</span>
                      <span className="font-medium text-black">The Hundreds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product</span>
                      <span className="font-medium text-black">Premium Jacket</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium text-black">{amount.toFixed(2)} KRW</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-semibold text-black mb-3">Payment Method</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <Image 
                            src="/korean-won.svg" 
                            alt="KRW" 
                            width={18} 
                            height={18} 
                            style={{ filter: 'brightness(0) saturate(100%) invert(37%) sepia(93%) saturate(1103%) hue-rotate(202deg) brightness(96%) contrast(88%)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-black">Korean Won (KRW)</p>
                        <p className="text-sm text-gray-500">Balance: {krwAvailableFormatted} KRW</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="mb-6">
                  <h3 className="font-semibold text-black mb-3">Fee Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-black">{amount.toFixed(2)} KRW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network Fee</span>
                      <span className="font-medium text-black">{networkFee.toFixed(2)} KRW</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-semibold text-black">Total</span>
                      <span className="font-semibold text-black">{total.toFixed(2)} KRW</span>
                    </div>
                  </div>
                </div>

                {/* Debug Info */}
                {chain && (
                  <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
                    <p className="text-gray-600">Chain: {chain.name} (ID: {chain.id})</p>
                    <p className="text-gray-600">Token: {KRW_TOKEN_ADDRESS.slice(0, 10)}...</p>
                    <p className="text-gray-600">Allowance: {currentAllowance?.toString() || '0'}</p>
                  </div>
                )}

                {/* Instructions */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Payment Process:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Approve KRW token spending</li>
                        <li>Confirm the transfer transaction</li>
                        <li>Wait for blockchain confirmation</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setPaymentStep('selection')}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors text-white"
                    style={{ color: 'white !important' }}
                  >
                    <span style={{ color: 'white !important' }}>Pay Now</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Processing Step */}
          {paymentStep === 'processing' && (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <h1 className="text-center text-2xl font-bold" style={{ color: 'white' }}>
                  Processing Payment
                </h1>
                <p className="text-center mt-2 text-sm" style={{ color: 'white' }}>
                  Please confirm transactions in your wallet
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {/* Approval Step */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    {txStatus === 'approving' || isApproving ? (
                      <Clock className="w-6 h-6 text-yellow-500 animate-pulse" />
                    ) : txStatus === 'transferring' || txStatus === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-black">Token Approval</p>
                      <p className="text-sm text-gray-600">
                        {isApproving ? 'Waiting for wallet confirmation...' :
                         isApproveConfirming ? 'Transaction submitted, confirming...' :
                         (txStatus === 'transferring' || txStatus === 'completed') ? 'Approved successfully' :
                         'Allow KRW token spending'}
                      </p>
                      {approveHash && (
                        <p className="text-xs mt-1">
                          Tx: <a 
                            href={`https://kairos.kaiascan.io/tx/${approveHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {approveHash.slice(0, 10)}...
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Transfer Step */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    {txStatus === 'transferring' || isTransferring ? (
                      <Clock className="w-6 h-6 text-yellow-500 animate-pulse" />
                    ) : txStatus === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-black">Transfer Payment</p>
                      <p className="text-sm text-gray-600">
                        {isTransferring ? 'Waiting for wallet confirmation...' :
                         isTransferConfirming ? 'Transaction submitted, confirming...' :
                         txStatus === 'completed' ? 'Payment sent successfully' :
                         'Send KRW to merchant'}
                      </p>
                      {transferHash && (
                        <p className="text-xs mt-1">
                          Tx: <a 
                            href={`https://kairos.kaiascan.io/tx/${transferHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {transferHash.slice(0, 10)}...
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold">Transaction in Progress</p>
                      <p className="mt-1">
                        {txStatus === 'approving' && 'Please approve the transaction in your wallet...'}
                        {txStatus === 'transferring' && 'Please confirm the transfer in your wallet...'}
                        {txStatus === 'completed' && 'Payment completed successfully!'}
                        {txStatus === 'error' && 'Transaction failed. Please try again.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {(isApproveError || isTransferError) && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-900 font-semibold">Error Details:</p>
                    <p className="text-xs text-red-700 mt-1">
                      {approveError?.message || transferError?.message}
                    </p>
                  </div>
                )}

                {txStatus === 'error' && (
                  <button
                    onClick={() => {
                      setPaymentStep('confirmation');
                      setTxStatus('idle');
                    }}
                    className="w-full mt-6 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors"
                    style={{ color: 'white !important' }}
                  >
                    Try Again
                  </button>
                )}
              </div>
            </>
          )}

          {/* Success Step */}
          {paymentStep === 'success' && (
            <>
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
                <h1 className="text-center text-2xl font-bold" style={{ color: 'white' }}>
                  Payment Successful!
                </h1>
                <p className="text-center mt-2 text-sm" style={{ color: 'white' }}>
                  Your transaction has been confirmed
                </p>
              </div>

              <div className="p-6">
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-900 mb-2">Transaction Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Amount Paid</span>
                      <span className="font-medium text-green-900">{total.toFixed(2)} KRW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Merchant</span>
                      <span className="font-medium text-green-900">The Hundreds</span>
                    </div>
                    {transferHash && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Transaction Hash</span>
                        <a 
                          href={`https://kairos.kaiascan.io/tx/${transferHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-green-900 hover:text-green-700 underline"
                        >
                          {transferHash.slice(0, 8)}...{transferHash.slice(-6)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    Thank you for your purchase! You will receive a confirmation email shortly.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPaymentStep('selection');
                    setTxStatus('idle');
                  }}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors"
                  style={{ color: 'white !important' }}
                >
                  Make Another Payment
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}