import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Function to notify WooCommerce that payment is confirmed
async function notifyWooCommercePayment(orderKey: string, transactionId: string) {
  console.log(orderKey, transactionId)
  try {
    const response = await fetch('http://kaia-commerce2.local/wp-admin/admin-ajax.php?action=krw_payment_confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_key: orderKey,
        transaction_id: transactionId
        
      })
    });

    const result = await response.json();
    console.log('WooCommerce payment notification result:', result);
    return true;
  } catch (error) {
    console.error('Failed to notify WooCommerce:', error);
    return false;
  }
}

// Function to mark Shopify order as paid
async function markShopifyOrderAsPaid(adminGraphqlApiId: string, shopDomain?: string) {
  const shopifyAccessToken = process.env.SHOPIFY_API_ACCESS_TOKEN;
  const fallbackShopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  
  if (!shopifyAccessToken) {
    console.error('SHOPIFY_API_ACCESS_TOKEN not found in environment variables');
    return false;
  }

  const domain = shopDomain || fallbackShopDomain;
  if (!domain) {
    console.error('Shop domain not provided and SHOPIFY_SHOP_DOMAIN not found in environment variables');
    return false;
  }

  const mutation = `
    mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
      orderMarkAsPaid(input: $input) {
        userErrors {
          field
          message
        }
        order {
          id
          name
          canMarkAsPaid
          displayFinancialStatus
          totalPrice
          totalOutstandingSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          transactions(first: 10) {
            id
            kind
            status
            amountSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            gateway
            createdAt
          }
        }
      }
    }
  `;

  const variables = {
    input: {
      id: adminGraphqlApiId
    }
  };

  try {
    const response = await fetch(`https://${domain}/admin/api/2025-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken,
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('Shopify GraphQL errors:', result.errors);
      return false;
    }

    if (result.data?.orderMarkAsPaid?.userErrors?.length > 0) {
      console.error('Shopify order mark as paid errors:', result.data.orderMarkAsPaid.userErrors);
      return false;
    }

    console.log('Successfully marked Shopify order as paid:', result.data?.orderMarkAsPaid?.order?.name);
    return true;
  } catch (error) {
    console.error('Failed to mark Shopify order as paid:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, transferHash, customerWallet } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status,
        transferHash: transferHash || null,
        customerWallet: customerWallet || null,
        paidAt: status === 'PAID' ? new Date() : undefined,
      }
    });

    // If this is a Shopify order being marked as paid, notify Shopify
    if (status === 'PAID' && order.type === 'SHOPIFY' && order.adminGraphqlApiId) {
      console.log('Marking Shopify order as paid:', order.adminGraphqlApiId);
      const shopifySuccess = await markShopifyOrderAsPaid(order.adminGraphqlApiId, order.shopDomain || undefined);
      
      if (!shopifySuccess) {
        console.warn('Failed to mark Shopify order as paid, but continuing with local update');
      }
    }

    // If this is a WooCommerce order being marked as paid, notify WooCommerce
    if (status === 'PAID' && order.type === 'WOOCOMMERCE' && transferHash) {
      console.log('Notifying WooCommerce of payment confirmation:', order.id);
      const wooCommerceSuccess = await notifyWooCommercePayment(order.id, transferHash);
      
      if (!wooCommerceSuccess) {
        console.warn('Failed to notify WooCommerce of payment, but continuing with local update');
      }
    }

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}