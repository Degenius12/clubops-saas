const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactionTypes() {
  try {
    // Find existing transactions
    const transactions = await prisma.financialTransaction.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        transactionType: true,
        category: true,
        amount: true,
        createdAt: true
      }
    });

    console.log('Existing transactions:');
    console.log(JSON.stringify(transactions, null, 2));

    if (transactions.length === 0) {
      console.log('\nNo transactions found. Let me check the constraint directly...');

      // Try to get constraint info from database
      const result = await prisma.$queryRaw`
        SELECT conname, pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint
        WHERE conname LIKE '%transaction_type_check%';
      `;

      console.log('\nConstraint definition:');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionTypes();
