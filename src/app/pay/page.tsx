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
      where: { id: params.orderId },
      include: {
        merchant: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    // If order exists, return it
    if (order) {
      return {
        amount: order.totalAmount,
        currency: order.currency,
        merchant: order.merchant.name,
        product: order.orderItems[0]?.product.name || 'Order',
        orderId: order.id,
        description: order.orderItems[0]?.product.description || '',
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

  // Create or find merchant
  let merchant = await prisma.merchant.findFirst({
    where: { name: orderData.merchant }
  });

  if (!merchant) {
    merchant = await prisma.merchant.create({
      data: {
        name: orderData.merchant,
        email: `contact@${orderData.merchant.toLowerCase().replace(/\s+/g, '')}.com`,
        walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb7'
      }
    });
  }

  // Create or find product
  let product = await prisma.product.findFirst({
    where: { 
      name: orderData.product,
      price: orderData.amount
    }
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        name: orderData.product,
        description: orderData.description,
        price: orderData.amount,
        currency: orderData.currency
      }
    });
  }

  // Create new order
  const order = await prisma.order.create({
    data: {
      merchantId: merchant.id,
      totalAmount: orderData.amount,
      currency: orderData.currency,
      status: 'PENDING',
      orderItems: {
        create: {
          productId: product.id,
          quantity: 1,
          price: orderData.amount
        }
      }
    },
    include: {
      merchant: true,
      orderItems: {
        include: {
          product: true
        }
      }
    }
  });

  return {
    amount: order.totalAmount,
    currency: order.currency,
    merchant: order.merchant.name,
    product: order.orderItems[0].product.name,
    orderId: order.id,
    description: order.orderItems[0].product.description || '',
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