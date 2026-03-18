const { PrismaClient } = require('@prisma/client');

// Singleton pattern — reuses the same PrismaClient instance across the app
// to avoid exhausting connection limits on Supabase's free tier.
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
