import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Extract vendor from first line item (they should all be the same vendor)
    const vendor = data.line_items?.[0]?.vendor || 'Unknown Vendor';
    // Extract product info from first line item
    const firstProduct = data.line_items?.[0] || {};
    
    // Extract required fields
    const extractedData = {
      id: data.id,
      confirmation_number: data.confirmation_number,
      contact_email: data.contact_email || data.email,
      total_price: data.current_total_price,
      currency_code: data.currency,
      order_status_url: data.order_status_url,
      financial_status: data.financial_status,
      fulfillment_status: data.fulfillment_status,
      vendor: vendor,
      product_name: firstProduct.title || 'Unknown Product',
      product_price: firstProduct.price || '0'
    };

    console.log('Shopify webhook - extracted data:', extractedData);

    // Check if order already exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: String(data.id) }
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
        id: String(data.id), // Convert to string without prefix
        type: 'SHOPIFY',
        status: data.financial_status === 'paid' ? 'PAID' : 'PENDING',
        totalAmount: parseFloat(extractedData.total_price),
        currency: extractedData.currency_code,
        merchantName: vendor,
        productName: extractedData.product_name,
        orderConfirmation: `${extractedData.confirmation_number}`,
        customerEmail: extractedData.contact_email,
        customerWallet: null,
        paymentMethod: 'shopify'
      }
    });

    console.log('Order created in database:', order.id);

    return NextResponse.json({ 
      message: 'Webhook received and order created',
      extracted: extractedData,
      orderId: order.id
    }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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