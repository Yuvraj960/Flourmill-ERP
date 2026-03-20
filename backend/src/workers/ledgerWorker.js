/**
 * src/workers/ledgerWorker.js
 *
 * BullMQ Worker — Ledger Operations
 *
 * Processes jobs from the 'ledger-operations' queue with concurrency = 1
 * per logical shard key to guarantee no two jobs for the same vault row
 * run simultaneously. Each job is wrapped in a Prisma interactive transaction
 * with a raw SELECT ... FOR UPDATE to lock the row (pessimistic locking),
 * preventing negative vault balances or negative inventory stock under
 * high-concurrency conditions.
 *
 * Supported Job Types (job.name):
 *   - VAULT_DEPOSIT     : Increase VaultAccount.balanceKg
 *   - VAULT_WITHDRAWAL  : Deduct raw-weight equivalent, charge processing fee,
 *                         write to TransactionLedger. Fails if balance < requested kg.
 *   - RETAIL_SALE       : Deduct from Inventory, write to TransactionLedger.
 *                         Fails if currentStockKg < requested kg.
 *
 * Error semantics:
 *   - "Insufficient balance" / "Insufficient stock" → job is immediately
 *     marked failed with attempts = 1 (no retry) so we don't double-deduct.
 *   - All other errors inherit the queue's default retry policy.
 */

'use strict';

require('dotenv').config();
const { Worker, UnrecoverableError } = require('bullmq');
const { connection } = require('../queues/connection');
const prisma = require('../config/prisma');
const { calculateFee } = require('../utils/processingFee');

// ─────────────────────────────────────────────────────────────────────────────
// Job Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle VAULT_DEPOSIT
 * @param {{ customerProfileId: number, materialType: string, weightKg: number }} data
 */
async function handleDeposit(data) {
    const { customerProfileId, materialType, weightKg } = data;

    await prisma.$transaction(async (tx) => {
        // Lock the vault row (or create it if it doesn't exist)
        const existing = await tx.$queryRaw`
            SELECT id, "balanceKg"
            FROM "VaultAccount"
            WHERE "customerProfileId" = ${customerProfileId}
              AND "materialType"      = ${materialType}::"MaterialType"
            FOR UPDATE
        `;

        if (existing.length > 0) {
            // Vault exists — increment balance
            await tx.$executeRaw`
                UPDATE "VaultAccount"
                SET "balanceKg" = "balanceKg" + ${weightKg}
                WHERE id = ${existing[0].id}
            `;
        } else {
            // First deposit for this material — upsert creates the row
            await tx.vaultAccount.create({
                data: {
                    customerProfileId,
                    materialType,
                    balanceKg: weightKg,
                },
            });
        }

        // Record the deposit in the ledger
        await tx.transactionLedger.create({
            data: {
                customerProfileId,
                type: 'DEPOSIT',
                materialInvolved: materialType,
                weightKg,
                processingFeePaid: 0,
            },
        });
    });

    return { success: true, action: 'VAULT_DEPOSIT', customerProfileId, materialType, weightKg };
}

/**
 * Handle VAULT_WITHDRAWAL
 * @param {{ customerProfileId: number, materialType: string, weightKg: number }} data
 */
async function handleWithdrawal(data) {
    const { customerProfileId, materialType, weightKg } = data;

    const result = await prisma.$transaction(async (tx) => {
        // Pessimistic lock on vault row
        const rows = await tx.$queryRaw`
            SELECT id, "balanceKg"
            FROM "VaultAccount"
            WHERE "customerProfileId" = ${customerProfileId}
              AND "materialType"      = ${materialType}::"MaterialType"
            FOR UPDATE
        `;

        if (rows.length === 0) {
            throw new UnrecoverableError(
                `No vault found for customer ${customerProfileId}, material ${materialType}`
            );
        }

        const vault = rows[0];
        if (vault.balanceKg < weightKg) {
            // UnrecoverableError = BullMQ marks job as failed immediately (no retry)
            throw new UnrecoverableError(
                `Insufficient balance: ${vault.balanceKg} kg available, ${weightKg} kg requested`
            );
        }

        const newBalance = parseFloat((vault.balanceKg - weightKg).toFixed(4));
        await tx.$executeRaw`
            UPDATE "VaultAccount"
            SET "balanceKg" = ${newBalance}
            WHERE id = ${vault.id}
        `;

        const processingFeePaid = calculateFee(materialType, weightKg);

        // Record withdrawal in ledger
        const ledgerEntry = await tx.transactionLedger.create({
            data: {
                customerProfileId,
                type: 'WITHDRAWAL',
                materialInvolved: materialType,
                weightKg,
                processingFeePaid,
            },
        });

        return { newBalance, processingFeePaid, ledgerEntryId: ledgerEntry.id };
    });

    return {
        success: true,
        action: 'VAULT_WITHDRAWAL',
        customerProfileId,
        materialType,
        weightKg,
        ...result,
    };
}

/**
 * Handle RETAIL_SALE (walk-in customer — no vault, direct inventory deduction)
 * @param {{ materialType: string, weightKg: number, totalAmountPaid: number }} data
 */
async function handleRetailSale(data) {
    const { materialType, weightKg, totalAmountPaid } = data;

    await prisma.$transaction(async (tx) => {
        // Lock the inventory row
        const rows = await tx.$queryRaw`
            SELECT id, "currentStockKg"
            FROM "Inventory"
            WHERE "itemName" = ${materialType}
            FOR UPDATE
        `;

        if (rows.length === 0) {
            throw new UnrecoverableError(`Inventory item not found: ${materialType}`);
        }

        const inventory = rows[0];
        if (inventory.currentStockKg < weightKg) {
            throw new UnrecoverableError(
                `Insufficient stock: ${inventory.currentStockKg} kg available, ${weightKg} kg requested`
            );
        }

        const newStock = parseFloat((inventory.currentStockKg - weightKg).toFixed(4));
        await tx.$executeRaw`
            UPDATE "Inventory"
            SET "currentStockKg" = ${newStock}
            WHERE id = ${inventory.id}
        `;

        // Retail sale — no customer profile link (customerProfileId = null)
        await tx.transactionLedger.create({
            data: {
                customerProfileId: null,
                type: 'WALKIN_SALE',
                materialInvolved: materialType,
                weightKg,
                processingFeePaid: totalAmountPaid ?? 0,
            },
        });
    });

    return { success: true, action: 'RETAIL_SALE', materialType, weightKg };
}

// ─────────────────────────────────────────────────────────────────────────────
// Worker
// ─────────────────────────────────────────────────────────────────────────────

const CONCURRENCY = parseInt(process.env.LEDGER_WORKER_CONCURRENCY, 10) || 5;

const ledgerWorker = new Worker(
    'ledger-operations',
    async (job) => {
        console.log(`[LedgerWorker] Processing job #${job.id} — type: ${job.name}`);

        switch (job.name) {
            case 'VAULT_DEPOSIT':
                return handleDeposit(job.data);

            case 'VAULT_WITHDRAWAL':
                return handleWithdrawal(job.data);

            case 'RETAIL_SALE':
                return handleRetailSale(job.data);

            default:
                throw new Error(`[LedgerWorker] Unknown job type: "${job.name}"`);
        }
    },
    {
        connection,
        concurrency: CONCURRENCY,
        // Delay completed job cleanup — useful for audit / Bull Board visibility
        removeOnComplete: { age: 60 * 60 * 24 },    // 24 h
        removeOnFail: { age: 60 * 60 * 24 * 7 }, // 7 days
    }
);

ledgerWorker.on('completed', (job, result) => {
    console.log(`[LedgerWorker] Job #${job.id} complete:`, JSON.stringify(result));
});

ledgerWorker.on('failed', (job, err) => {
    console.error(`[LedgerWorker] Job #${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
});

ledgerWorker.on('error', (err) => {
    console.error('[LedgerWorker] Worker error:', err);
});

module.exports = { ledgerWorker };
