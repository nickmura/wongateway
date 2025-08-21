'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronRight, Info, Wallet, CheckCircle, Clock, AlertCircle, DollarSign, Languages } from 'lucide-react';
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
  disabled?: boolean;
}

interface PaymentData {
  amount: number;
  currency: string;
  merchant: string;
  product: string;
  orderId: string | null;
  description?: string;
}

type PaymentStep = 'selection' | 'confirmation' | 'processing' | 'success';
type TransactionStatus = 'idle' | 'approving' | 'approved' | 'transferring' | 'completed' | 'error';

const KRW_TOKEN_ADDRESS = '0x865d6a906c2f5506729c7d0bc0f6Dc6a3Cbf433c' as `0x${string}`;
const MERCHANT_ADDRESS = '0x742d35cc6634c0532925a3b844bc9e7595f0beb7' as `0x${string}`;

interface PaymentClientProps {
  paymentData: PaymentData;
  initialLang?: 'en' | 'ko';
}

export default function PaymentClient({ paymentData, initialLang = 'en' }: PaymentClientProps) {
  const [language, setLanguage] = useState<'en' | 'ko'>(initialLang);
  const [selectedMethod, setSelectedMethod] = useState<string>('krw');
  const networkFee = 0.02;

  const content = {
    en: {
      selection: {
        title: 'Secure Payment',
        subtitle: 'Choose your payment method',
        orderInfo: 'Order Information',
        merchant: 'Merchant',
        product: 'Product',
        amount: 'Amount',
        paymentMethod: 'Payment Method',
        selectMethod: 'Select a payment method',
        balance: 'Balance',
        networkFee: 'Network fee',
        total: 'Total',
        payNow: 'Pay Now',
        connectWallet: 'Please connect your wallet first'
      },
      confirmation: {
        title: 'Confirm Payment',
        subtitle: 'Review your order details',
        orderInfo: 'Order Information',
        orderId: 'Order ID',
        confirmation: 'Confirmation',
        merchant: 'Merchant',
        product: 'Product',
        amount: 'Amount',
        paymentMethod: 'Payment Method',
        subtotal: 'Subtotal',
        networkFee: 'Network Fee',
        total: 'Total',
        insufficientBalance: 'Insufficient balance',
        required: 'Required',
        available: 'Available',
        processTitle: 'Payment Process:',
        processSteps: [
          'Approve KRW token spending',
          'Confirm the transfer transaction',
          'Wait for blockchain confirmation'
        ],
        back: 'Back',
        payNow: 'Pay Now'
      },
      processing: {
        title: 'Processing Payment',
        subtitle: 'Please confirm transactions in your wallet',
        approvalTitle: 'Token Approval',
        transferTitle: 'Transfer Payment',
        approvalStates: {
          waiting: 'Waiting for wallet confirmation...',
          submitted: 'Transaction submitted, confirming...',
          approved: 'Approved successfully',
          pending: 'Allow KRW token spending'
        },
        transferStates: {
          waiting: 'Waiting for wallet confirmation...',
          submitted: 'Transaction submitted, confirming...',
          completed: 'Payment sent successfully',
          pending: 'Send KRW to merchant'
        },
        statusTitle: 'Transaction in Progress',
        statusMessages: {
          approving: 'Please approve the transaction in your wallet...',
          transferring: 'Please confirm the transfer in your wallet...',
          completed: 'Payment completed successfully!',
          error: 'Transaction failed. Please try again.'
        },
        errorDetails: 'Error Details:',
        tryAgain: 'Try Again'
      },
      success: {
        title: 'Payment Successful!',
        subtitle: 'Your transaction has been confirmed',
        transactionDetails: 'Transaction Details',
        orderId: 'Order ID',
        amountPaid: 'Amount Paid',
        merchant: 'Merchant',
        transactionHash: 'Transaction Hash',
        thankYou: 'Thank you for your purchase! You will receive a confirmation email shortly.',
        makeAnother: 'Make Another Payment'
      }
    },
    ko: {
      selection: {
        title: '안전한 결제',
        subtitle: '결제 수단을 선택하세요',
        orderInfo: '주문 정보',
        merchant: '판매자',
        product: '상품',
        amount: '금액',
        paymentMethod: '결제 수단',
        selectMethod: '결제 수단을 선택하세요',
        balance: '잔액',
        networkFee: '네트워크 수수료',
        total: '총액',
        payNow: '지금 결제',
        connectWallet: '먼저 지갑을 연결해주세요'
      },
      confirmation: {
        title: '결제 확인',
        subtitle: '주문 내역을 확인하세요',
        orderInfo: '주문 정보',
        orderId: '주문 ID',
        confirmation: '확인 번호',
        merchant: '판매자',
        product: '상품',
        amount: '금액',
        paymentMethod: '결제 수단',
        subtotal: '소계',
        networkFee: '네트워크 수수료',
        total: '총액',
        insufficientBalance: '잔액 부족',
        required: '필요',
        available: '사용 가능',
        processTitle: '결제 과정:',
        processSteps: [
          'KRW 토큰 사용 승인',
          '전송 거래 확인',
          '블록체인 확인 대기'
        ],
        back: '뒤로',
        payNow: '지금 결제'
      },
      processing: {
        title: '결제 처리 중',
        subtitle: '지갑에서 거래를 확인해주세요',
        approvalTitle: '토큰 승인',
        transferTitle: '결제 전송',
        approvalStates: {
          waiting: '지갑 확인을 기다리는 중...',
          submitted: '거래가 제출되었습니다. 확인 중...',
          approved: '성공적으로 승인되었습니다',
          pending: 'KRW 토큰 사용을 허용하세요'
        },
        transferStates: {
          waiting: '지갑 확인을 기다리는 중...',
          submitted: '거래가 제출되었습니다. 확인 중...',
          completed: '결제가 성공적으로 전송되었습니다',
          pending: '판매자에게 KRW를 전송하세요'
        },
        statusTitle: '거래 진행 중',
        statusMessages: {
          approving: '지갑에서 거래를 승인해주세요...',
          transferring: '지갑에서 전송을 확인해주세요...',
          completed: '결제가 성공적으로 완료되었습니다!',
          error: '거래가 실패했습니다. 다시 시도해주세요.'
        },
        errorDetails: '오류 세부사항:',
        tryAgain: '다시 시도'
      },
      success: {
        title: '결제 성공!',
        subtitle: '거래가 확인되었습니다',
        transactionDetails: '거래 세부사항',
        orderId: '주문 ID',
        amountPaid: '결제 금액',
        merchant: '판매자',
        transactionHash: '거래 해시',
        thankYou: '구매해 주셔서 감사합니다! 곧 확인 이메일을 받으실 것입니다.',
        makeAnother: '다른 결제하기'
      }
    }
  };

  const t = content[language];
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('selection');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [tokenAmount, setTokenAmount] = useState<bigint>(BigInt(0));
  
  // Debug log
  console.log('PaymentData received:', paymentData);
  
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
      const total = paymentData.amount + networkFee;
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
  }, [krwBalance, paymentData.amount, networkFee, currentAllowance]);

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
      Icon: DollarSign,
      disabled: true
    },
  ];

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
  const total = paymentData.amount + networkFee;
  
  // Check if user has sufficient balance
  const hasInsufficientBalance = krwBalance ? 
    Number(formatUnits(krwBalance.value, krwBalance.decimals)) < total : 
    false;

  // Handle initial payment button click
  const handlePaymentClick = () => {
    if (!isConnected) {
      alert(t.selection.connectWallet);
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
    if (isTransferConfirmed && transferHash) {
      setTxStatus('completed');
      
      // Update order status to PAID only if we have an orderId
      if (paymentData.orderId) {
        fetch('/api/orders/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: paymentData.orderId,
            status: 'PAID',
            transferHash: transferHash
          })
        })
        .then(res => res.json())
        .then(data => {
          console.log('Order status updated:', data);
          setPaymentStep('success');
        })
        .catch(error => {
          console.error('Failed to update order status:', error);
          setPaymentStep('success'); // Still show success to user
        });
      } else {
        // For demo payments without order ID, just proceed to success
        setPaymentStep('success');
      }
    }
  }, [isTransferConfirmed, transferHash, paymentData.orderId]);

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
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
                {/* Language Toggle */}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
                  className="absolute top-4 right-4 flex items-center space-x-1 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Languages className="w-4 h-4" />
                  <span className="text-sm font-medium">{language === 'en' ? 'KO' : 'EN'}</span>
                </button>
                
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-center text-3xl font-bold" style={{ color: 'white' }}>
                  {language === 'ko' ? '결제' : 'Pay'} {paymentData.amount.toLocaleString()} {paymentData.currency}
                </h1>
                <p className="text-center mt-2" style={{ color: 'white' }}>
                  {language === 'ko' ? '판매자' : 'to'} {paymentData.merchant}
                </p>
                
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
                    const isDisabled = method.disabled;
                    return (
                      <button
                        key={method.id}
                        onClick={() => !isDisabled && setSelectedMethod(method.id)}
                        disabled={isDisabled}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          isDisabled
                            ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                            : selectedMethod === method.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isDisabled ? 'bg-gray-200' : 'bg-blue-100'
                            }`}>
                              {method.icon ? (
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <Image 
                                    src={method.icon} 
                                    alt={method.name} 
                                    width={18} 
                                    height={18} 
                                    style={{ 
                                      filter: isDisabled 
                                        ? 'brightness(0) saturate(100%) invert(60%)' 
                                        : 'brightness(0) saturate(100%) invert(37%) sepia(93%) saturate(1103%) hue-rotate(202deg) brightness(96%) contrast(88%)'
                                    }}
                                  />
                                </div>
                              ) : (
                                IconComponent && <IconComponent className={`w-5 h-5 ${
                                  isDisabled ? 'text-gray-400' : 'text-blue-600'
                                }`} />
                              )}
                            </div>
                            <div className="text-left">
                              <p className={`font-semibold ${isDisabled ? 'text-gray-400' : 'text-black'}`}>
                                {method.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {method.currency}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              {!isDisabled && (
                                <>
                                  <p className="font-semibold text-black">
                                    {method.available} {method.currency}
                                  </p>
                                  <p className="text-sm text-gray-500">Available</p>
                                </>
                              )}
                            </div>
                            <ChevronRight className={`w-5 h-5 ${isDisabled ? 'text-gray-300' : 'text-gray-400'}`} />
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
                      <span className="font-semibold text-black">{networkFee.toFixed(2)} {paymentData.currency}</span>
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
                    {paymentData.orderId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID</span>
                        <span className="font-medium text-black">{paymentData.orderId}</span>
                      </div>
                    )}
                    {paymentData.description && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confirmation</span>
                        <span className="font-medium text-black">{paymentData.description}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Merchant</span>
                      <span className="font-medium text-black">{paymentData.merchant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product</span>
                      <span className="font-medium text-black">{paymentData.product}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium text-black">{paymentData.amount.toFixed(2)} {paymentData.currency}</span>
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
                      <span className="font-medium text-black">{paymentData.amount.toFixed(2)} {paymentData.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network Fee</span>
                      <span className="font-medium text-black">{networkFee.toFixed(2)} {paymentData.currency}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-semibold text-black">Total</span>
                      <span className="font-semibold text-black">{total.toFixed(2)} {paymentData.currency}</span>
                    </div>
                    {hasInsufficientBalance && (
                      <div className="mt-3 p-3 bg-red-100 rounded-lg">
                        <p className="text-red-700 text-sm font-medium">
                          ⚠️ Insufficient balance
                        </p>
                        <p className="text-red-600 text-xs mt-1">
                          Required: {total.toFixed(2)} {paymentData.currency} | 
                          Available: {krwAvailableFormatted} {paymentData.currency}
                        </p>
                      </div>
                    )}
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
                    disabled={hasInsufficientBalance}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors text-white ${
                      hasInsufficientBalance 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    style={{ color: 'white !important' }}
                  >
                    <span style={{ color: 'white !important' }}>
                      {hasInsufficientBalance ? 
                        (language === 'ko' ? '잔액 부족' : 'Insufficient Balance') : 
                        (language === 'ko' ? '지금 결제' : 'Pay Now')}
                    </span>
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
                    {paymentData.orderId && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Order ID</span>
                        <span className="font-medium text-green-900">{paymentData.orderId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-green-700">Amount Paid</span>
                      <span className="font-medium text-green-900">{total.toFixed(2)} {paymentData.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Merchant</span>
                      <span className="font-medium text-green-900">{paymentData.merchant}</span>
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