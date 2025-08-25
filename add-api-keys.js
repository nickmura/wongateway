const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addApiKeysToExistingMerchants() {
  try {
    // Find all merchants without API keys
    const merchantsWithoutApiKey = await prisma.merchant.findMany({
      where: {
        apiKey: null
      }
    });

    console.log(`Found ${merchantsWithoutApiKey.length} merchants without API keys`);

    for (const merchant of merchantsWithoutApiKey) {
      // Generate a unique API key using Prisma's cuid
      const apiKey = require('crypto').randomBytes(12).toString('hex').substring(0, 12);
      
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { apiKey: apiKey }
      });
      
      console.log(`Updated merchant ${merchant.walletAddress} with API key: ${apiKey}`);
    }

    console.log('All merchants now have API keys');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addApiKeysToExistingMerchants();