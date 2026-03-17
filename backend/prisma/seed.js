/**
 * prisma/seed.js
 *
 * Seeds the database with:
 *  1. An Admin user (credentials from .env)
 *  2. Default Inventory entries for all material types
 *
 * Run: node prisma/seed.js   (or via `npm run db:seed`)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌾 Seeding MillStream ERP database...\n');

    // ── 1. Admin user ──────────────────────────────────────────────────────────
    const adminPhone = process.env.ADMIN_PHONE || '03000000000';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword@123';
    const adminName = process.env.ADMIN_NAME || 'Mill Admin';

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
        where: { phone: adminPhone },
        update: { passwordHash, role: 'ADMIN' },
        create: {
            phone: adminPhone,
            passwordHash,
            role: 'ADMIN',
            profile: {
                create: {
                    fullName: adminName,
                    millId: 'ADM-0000',
                },
            },
        },
    });
    console.log(`✅ Admin user ready — phone: ${adminPhone} | millId: ADM-0000`);

    // ── 2. Default Inventory ───────────────────────────────────────────────────
    const inventoryItems = [
        { itemName: 'WHEAT', category: 'RAW_MATERIAL', currentStockKg: 0.0, reorderThresholdKg: 500 },
        { itemName: 'FLOUR', category: 'PROCESSED_GOOD', currentStockKg: 0.0, reorderThresholdKg: 200 },
        { itemName: 'BRAN', category: 'PROCESSED_GOOD', currentStockKg: 0.0, reorderThresholdKg: 100 },
        { itemName: 'SEMOLINA', category: 'PROCESSED_GOOD', currentStockKg: 0.0, reorderThresholdKg: 100 },
    ];

    for (const item of inventoryItems) {
        await prisma.inventory.upsert({
            where: { itemName: item.itemName },
            update: { reorderThresholdKg: item.reorderThresholdKg },
            create: item,
        });
        console.log(`✅ Inventory entry: ${item.itemName} (${item.category})`);
    }

    console.log('\n🎉 Seed complete. MillStream ERP is ready!\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
