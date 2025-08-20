import PaymentClient from './PaymentClient';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface PaymentPageProps {
  searchParams: Promise<{
    amount?: string;
    currency?: string;
    merchant?: string;
    product?: string;
    orderId?: string;
    description?: string;
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
      return {
        amount: order.totalAmount,
        currency: order.currency,
        merchant: order.merchantName,
        product: order.productName,
        orderId: order.id,
        description: order.productDescription || '',
      };
    }
  }

  // Otherwise, create a new order from URL parameters
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

  // Create new order with simplified schema
  const order = await prisma.order.create({
    data: {
      merchantName: orderData.merchant,
      productName: orderData.product,
      productDescription: orderData.description,
      totalAmount: orderData.amount,
      currency: orderData.currency,
      status: 'PENDING'
    }
  });

  return {
    amount: order.totalAmount,
    currency: order.currency,
    merchant: order.merchantName,
    product: order.productName,
    orderId: order.id,
    description: order.productDescription || '',
  };
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const resolvedSearchParams = await searchParams;
  const paymentData = await fetchPaymentData(resolvedSearchParams);

  return <PaymentClient paymentData={paymentData} />;
}

export async function generateMetadata({ searchParams }: PaymentPageProps) {
  const resolvedSearchParams = await searchParams;
  const paymentData = await fetchPaymentData(resolvedSearchParams);
  
  return {
    title: `Pay ${paymentData.amount} ${paymentData.currency} - ${paymentData.merchant}`,
    description: `Complete your payment of ${paymentData.amount} ${paymentData.currency} to ${paymentData.merchant} for ${paymentData.product}`,
  };
}