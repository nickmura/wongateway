import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import crypto from 'crypto';

// WooCommerce webhook verification (uncomment if needed)
// function verifyWooCommerceWebhook(data: string, signature: string, secret: string): boolean {
//   const hmac = crypto.createHmac('sha256', secret);
//   hmac.update(data, 'utf8');
//   const hash = hmac.digest('base64');
//   return hash === signature;
// }

// Handle WooCommerce webhook POST requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);

    // Get the single merchant from database (there should only be one)
    const merchant = await prisma.merchant.findFirst();
    
    if (!merchant) {
      console.error('No merchant found in database');
      return NextResponse.json({ 
        error: 'No merchant configured' 
      }, { status: 500 });
    }
    // Extract required fields from WooCommerce webhook payload
    const extractedData = {
      basic_id: data.order_id,
      order_key_id: data.order_key,
      contact_email: data.email,
      store_name: data.store_name,
      total_price: data.total,
      currency_code: data.currency_code,
      product_name: data.product_name,
      merchant_wallet: merchant.walletAddress
    };

    console.log('WooCommerce webhook - extracted data:', extractedData);

    // Check if order already exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: String(extractedData.order_key_id) }
    });

    if (existingOrder) {
      console.log('Order already exists:', existingOrder.id);
      return NextResponse.json({ 
        message: 'Order already exists',
        orderId: existingOrder.id,
        orderConfirmation: existingOrder.orderConfirmation
      }, { status: 200 });
    }

    // Insert into database
    const order = await prisma.order.create({
      data: {
        id: String(extractedData.order_key_id),
        type: 'WOOCOMMERCE',
        status: 'PENDING',
        totalAmount: parseFloat(extractedData.total_price),
        currency: extractedData.currency_code,
        merchantName: extractedData.store_name,
        merchantWallet: merchant.walletAddress,
        productName: extractedData.product_name,
        orderConfirmation: String(extractedData.basic_id),
        customerEmail: extractedData.contact_email,
        customerWallet: null,
        paymentMethod: 'woocommerce',
        adminGraphqlApiId: null,
        shopDomain: null
      }
    });

    console.log('WooCommerce order created in database:', order.id);

    return NextResponse.json({ 
      message: 'Webhook received and order created',
      extracted: extractedData,
      orderId: order.id
    }, { status: 200 });

  } catch (error) {
    console.error('WooCommerce webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}