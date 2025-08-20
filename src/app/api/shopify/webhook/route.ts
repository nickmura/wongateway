import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Shopify webhook verification
function verifyShopifyWebhook(data: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data, 'utf8');
  const hash = hmac.digest('base64');
  return hash === signature;
}

// Handle Shopify webhook POST requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');
    const topic = request.headers.get('x-shopify-topic');
    const shopDomain = request.headers.get('x-shopify-shop-domain');

    console.log('Shopify webhook received:', {
      topic,
      shopDomain,
      hasSignature: !!signature,
      bodyLength: body.length
    });

    // Verify webhook signature (in production, you should verify this)
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyShopifyWebhook(body, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);

    // Handle different webhook topics
    switch (topic) {
      case 'orders/create':
        return handleOrderCreate(data, shopDomain);
      
      case 'orders/updated':
        return handleOrderUpdate(data, shopDomain);
      
      case 'orders/paid':
        return handleOrderPaid(data, shopDomain);
      
      case 'orders/cancelled':
        return handleOrderCancelled(data, shopDomain);
      
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
        return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle order creation from Shopify
async function handleOrderCreate(orderData: any, shopDomain: string | null) {
  try {
    console.log('Processing order creation:', orderData.id);

    // Find or create merchant based on shop domain
    let merchant = await prisma.merchant.findFirst({
      where: { 
        OR: [
          { name: shopDomain || 'Shopify Store' },
          { email: { contains: shopDomain || '' } }
        ]
      }
    });

    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          name: shopDomain || 'Shopify Store',
          email: `admin@${shopDomain || 'shop'}.myshopify.com`,
          walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb7'
        }
      });
    }

    // Create products for line items
    const productPromises = orderData.line_items.map(async (item: any) => {
      let product = await prisma.product.findFirst({
        where: { 
          name: item.title,
          price: parseFloat(item.price)
        }
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            name: item.title,
            description: item.title,
            price: parseFloat(item.price),
            currency: orderData.currency || 'USD',
            imageUrl: item.image?.src
          }
        });
      }

      return { product, quantity: item.quantity, price: parseFloat(item.price) };
    });

    const productItems = await Promise.all(productPromises);

    // Create order in our database
    const order = await prisma.order.create({
      data: {
        id: `shopify_${orderData.id}`, // Prefix to avoid conflicts
        merchantId: merchant.id,
        totalAmount: parseFloat(orderData.total_price),
        currency: orderData.currency || 'USD',
        status: orderData.financial_status === 'paid' ? 'PAID' : 'PENDING',
        customerEmail: orderData.customer?.email,
        customerWallet: null,
        orderItems: {
          create: productItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    console.log('Order created successfully:', order.id);

    return NextResponse.json({ 
      message: 'Order created successfully',
      orderId: order.id 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// Handle order updates
async function handleOrderUpdate(orderData: any, shopDomain: string | null) {
  try {
    const orderId = `shopify_${orderData.id}`;
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        totalAmount: parseFloat(orderData.total_price),
        status: orderData.financial_status === 'paid' ? 'PAID' : 
                orderData.cancelled_at ? 'CANCELLED' : 'PENDING',
        customerEmail: orderData.customer?.email,
        updatedAt: new Date()
      }
    });

    console.log('Order updated successfully:', order.id);

    return NextResponse.json({ 
      message: 'Order updated successfully',
      orderId: order.id 
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// Handle order payment
async function handleOrderPaid(orderData: any, shopDomain: string | null) {
  try {
    const orderId = `shopify_${orderData.id}`;
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        status: 'CONFIRMED',
        amount: parseFloat(orderData.total_price),
        currency: orderData.currency || 'USD',
        networkFee: 0,
        confirmedAt: new Date()
      }
    });

    console.log('Order marked as paid:', order.id);

    return NextResponse.json({ 
      message: 'Order marked as paid',
      orderId: order.id 
    });

  } catch (error) {
    console.error('Error marking order as paid:', error);
    return NextResponse.json({ error: 'Failed to mark order as paid' }, { status: 500 });
  }
}

// Handle order cancellation
async function handleOrderCancelled(orderData: any, shopDomain: string | null) {
  try {
    const orderId = `shopify_${orderData.id}`;
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    console.log('Order cancelled:', order.id);

    return NextResponse.json({ 
      message: 'Order cancelled',
      orderId: order.id 
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}