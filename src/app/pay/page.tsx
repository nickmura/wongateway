import PaymentClient from './PaymentClient';
import { prisma } from '@/lib/prisma';

interface PaymentPageProps {
  searchParams: Promise<{
    amount?: string;
    currency?: string;
    merchant?: string;
    product?: string;
    orderId?: string;
    description?: string;
    lang?: string;
  }>;
}

// Fetch payment data from database or create new order
async function fetchPaymentData(params: Awaited<PaymentPageProps['searchParams']>) {
  // If orderId is provided, try to fetch from database
  if (params.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId }
    });

    // If order exists, return it
    if (order) {
      // Add (Shopify) suffix if it's a Shopify order
      const merchantDisplay = order.type === 'SHOPIFY' 
        ? `${order.merchantName} (Shopify)`
        : order.merchantName;
      
      return {
        amount: order.totalAmount,
        currency: order.currency,
        merchant: merchantDisplay,
        product: order.productName,
        orderId: order.id,
        description: order.orderConfirmation || '',
        status: order.status,
        transferHash: order.transferHash,
        customerWallet: order.customerWallet,
        merchantWallet: order.merchantWallet,
        type: order.type as 'SHOPIFY' | 'WOOCOMMERCE' | 'DIRECT',
        storeName: order.merchantName, // Use original merchant name without suffix
      };
    }
  }

  // Otherwise, return demo data without creating a database entry
  const defaultData = {
    amount: 99.00,
    currency: 'KRW',
    merchant: 'The Hundreds',
    product: 'Premium Jacket',
    description: 'High-quality premium jacket'
  };

  const orderData = {
    amount: params.amount ? parseFloat(params.amount) : defaultData.amount,
    currency: params.currency || defaultData.currency,
    merchant: params.merchant || defaultData.merchant,
    product: params.product || defaultData.product,
    description: params.description || defaultData.description,
  };

  // Return demo data without creating database entry
  return {
    amount: orderData.amount,
    currency: orderData.currency,
    merchant: orderData.merchant,
    product: orderData.product,
    orderId: null, // No order ID for demo data
    description: orderData.description,
  };
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const resolvedSearchParams = await searchParams;
  const paymentData = await fetchPaymentData(resolvedSearchParams);
  const initialLang = resolvedSearchParams.lang === 'ko' ? 'ko' : 'en';

  return <PaymentClient paymentData={paymentData} initialLang={initialLang} />;
}

export async function generateMetadata({ searchParams }: PaymentPageProps) {
  const resolvedSearchParams = await searchParams;
  const paymentData = await fetchPaymentData(resolvedSearchParams);
  
  return {
    title: `Pay ${paymentData.amount} ${paymentData.currency} - ${paymentData.merchant}`,
    description: `Complete your payment of ${paymentData.amount} ${paymentData.currency} to ${paymentData.merchant} for ${paymentData.product}`,
  };
}