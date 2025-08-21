import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get or create merchant account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Find existing merchant or create new one
    let merchant = await prisma.merchant.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          name: `Merchant ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        }
      });
    }

    return NextResponse.json(merchant, { status: 200 });
  } catch (error) {
    console.error('Error in merchant auth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}