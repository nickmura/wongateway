import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import crypto from 'crypto';

// Shopify webhook verification
// function verifyShopifyWebhook(data: string, signature: string, secret: string): boolean {
//   const hmac = crypto.createHmac('sha256', secret);
//   hmac.update(data, 'utf8');
//   const hash = hmac.digest('base64');
//   return hash === signature;
// }

// Handle Shopify webhook POST requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);

    console.log('Shopify webhook received:', data);

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Commented out complex webhook handlers - uncomment if needed:

// // Handle order creation from Shopify
// async function handleOrderCreate(orderData: any, shopDomain: string | null) {
//   try {
//     console.log('Processing order creation:', orderData.id);

//     // Find or create merchant based on shop domain
//     let merchant = await prisma.merchant.findFirst({
//       where: { 
//         OR: [
//           { name: shopDomain || 'Shopify Store' },
//           { email: { contains: shopDomain || '' } }
//         ]
//       }
//     });

//     if (!merchant) {
//       merchant = await prisma.merchant.create({
//         data: {
//           name: shopDomain || 'Shopify Store',
//           email: `admin@${shopDomain || 'shop'}.myshopify.com`,
//           walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb7'
//         }
//       });
//     }

//     // Create products for line items
//     const productPromises = orderData.line_items.map(async (item: any) => {
//       let product = await prisma.product.findFirst({
//         where: { 
//           name: item.title,
//           price: parseFloat(item.price)
//         }
//       });

//       if (!product) {
//         product = await prisma.product.create({
//           data: {
//             name: item.title,
//             description: item.title,
//             price: parseFloat(item.price),
//             currency: orderData.currency || 'USD',
//             imageUrl: item.image?.src
//           }
//         });
//       }

//       return { product, quantity: item.quantity, price: parseFloat(item.price) };
//     });

//     const productItems = await Promise.all(productPromises);

//     // Create order in our database
//     const order = await prisma.order.create({
//       data: {
//         id: `shopify_${orderData.id}`, // Prefix to avoid conflicts
//         merchantId: merchant.id,
//         totalAmount: parseFloat(orderData.total_price),
//         currency: orderData.currency || 'USD',
//         status: orderData.financial_status === 'paid' ? 'PAID' : 'PENDING',
//         customerEmail: orderData.customer?.email,
//         customerWallet: null,
//         orderItems: {
//           create: productItems.map(item => ({
//             productId: item.product.id,
//             quantity: item.quantity,
//             price: item.price
//           }))
//         }
//       }
//     });

//     console.log('Order created successfully:', order.id);

//     return NextResponse.json({ 
//       message: 'Order created successfully',
//       orderId: order.id 
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Error creating order:', error);
//     return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
//   }
// }