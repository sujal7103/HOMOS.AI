/**
 * Script to reset user credits
 * Run: node scripts/reset-credits.js
 */

const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function resetCredits() {
  try {
    // Delete all usage records to reset credits
    const result = await prisma.usage.deleteMany({});
    console.log(`✅ Reset complete! Deleted ${result.count} usage records.`);
    console.log('You now have 5 free credits again!');
  } catch (error) {
    console.error('❌ Error resetting credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetCredits();
