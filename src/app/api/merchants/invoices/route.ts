import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
console.log('Invoices route loaded - Prisma client created:', !!prisma, typeof prisma);

// Get merchant's invoices
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Fetch all orders for this merchant (all types)
    const invoices = await prisma.order.findMany({
      where: {
        merchantWallet: walletAddress.toLowerCase()
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productName,
      totalAmount,
      currency = 'KRW',
      customerEmail,
      description,
      merchantWallet
    } = body;

    if (!productName || !totalAmount || !merchantWallet) {
      return NextResponse.json({ 
        error: 'Product name, amount, and merchant wallet required' 
      }, { status: 400 });
    }

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { walletAddress: merchantWallet.toLowerCase() }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found. Please refresh the dashboard.' }, { status: 404 });
    }

    // Create the invoice/order
    const invoice = await prisma.order.create({
      data: {
        type: 'DIRECT',
        status: 'PENDING',
        merchantName: merchant.name,
        merchantWallet: merchantWallet.toLowerCase(),
        productName,
        totalAmount: parseFloat(totalAmount.toString()),
        currency,
        customerEmail: customerEmail || null,
        orderConfirmation: description || null,
      }
    });

    return NextResponse.json({
      ...invoice,
      paymentLink: `/pay?orderId=${invoice.id}`
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}