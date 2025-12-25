// Prisma Client Export for legacy Sequelize-style imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

// Export Prisma client and models in a compatible format
// Note: The actual models are accessed via prisma.modelName (e.g., prisma.vipSession)
module.exports = {
  prisma,
  // For compatibility with Sequelize-style destructuring
  VipSession: prisma.vipSession,
  DancerCheckIn: prisma.dancerCheckIn,
  FinancialTransaction: prisma.financialTransaction,
  Shift: prisma.shift,
  CashDrawer: prisma.cashDrawer,
  User: prisma.user,
  Op: {}, // Sequelize operator - not used with Prisma
};
