const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { calculateFee } = require('../utils/processingFee');

// ─── POST /api/vault/deposit ───────────────────────────────────────────────────
/**
 * Customer deposits raw materials into their vault.
 * Body: { materialType: 'WHEAT' | 'BRAN' | 'SEMOLINA', weightKg: number }
 *
 * Steps:
 *  1. Validate inputs
 *  2. Resolve customer profile
 *  3. Upsert VaultAccount (create if first deposit for this material)
 *  4. Increment balanceKg
 *  5. Increment Inventory.currentStockKg (mill received this material)
 *  6. Log TransactionLedger (type: DEPOSIT, fee: 0)
 */
async function deposit(req, res, next) {
    try {
        const { materialType, weightKg } = req.body;

        if (!materialType || weightKg == null) {
            throw new ApiError(400, 'materialType and weightKg are required.');
        }
        const weight = parseFloat(weightKg);
        if (isNaN(weight) || weight <= 0) {
            throw new ApiError(400, 'weightKg must be a positive number.');
        }

        const VALID_RAW = ['WHEAT', 'BRAN', 'SEMOLINA'];
        if (!VALID_RAW.includes(materialType)) {
            throw new ApiError(400, `materialType must be one of: ${VALID_RAW.join(', ')}. FLOUR is an output — deposit raw materials only.`);
        }

        // Resolve customer profile
        let profile;
        if (req.user.role === 'ADMIN' && req.body.customerId) {
            profile = await prisma.customerProfile.findUnique({
                where: { id: parseInt(req.body.customerId) },
            });
        } else {
            profile = await prisma.customerProfile.findUnique({
                where: { userId: req.user.userId },
            });
        }
        if (!profile) throw new ApiError(404, 'Customer profile not found.');

        // Run everything in a single DB transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Upsert VaultAccount and increment balance
            const vault = await tx.vaultAccount.upsert({
                where: {
                    customerProfileId_materialType: {
                        customerProfileId: profile.id,
                        materialType,
                    },
                },
                update: { balanceKg: { increment: weight } },
                create: {
                    customerProfileId: profile.id,
                    materialType,
                    balanceKg: weight,
                },
            });

            // 2. Increment Inventory stock (mill received raw material from customer)
            await tx.inventory.upsert({
                where: { itemName: materialType },
                update: { currentStockKg: { increment: weight } },
                create: {
                    itemName: materialType,
                    category: 'RAW_MATERIAL',
                    currentStockKg: weight,
                    reorderThresholdKg: 500, // sensible default; admin can update later
                },
            });

            // 3. Log the deposit in the ledger
            const ledgerEntry = await tx.transactionLedger.create({
                data: {
                    customerProfileId: profile.id,
                    type: 'DEPOSIT',
                    materialInvolved: materialType,
                    weightKg: weight,
                    processingFeePaid: 0,
                },
            });

            return { vault, ledgerEntry };
        });

        return res.status(200).json({
            message: `Deposit successful. ${weight}kg of ${materialType} added to your vault.`,
            updatedBalance: result.vault.balanceKg,
            materialType,
            ledgerEntryId: result.ledgerEntry.id,
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/vault/withdraw ──────────────────────────────────────────────────
/**
 * Customer withdraws processed goods from the mill.
 * Body: {
 *   materialType:      'WHEAT',   <- raw material vault to deduct from
 *   weightKg:          number,    <- raw weight equivalent to consume
 *   processedGoodType: 'FLOUR'    <- what the customer receives back
 * }
 *
 * Steps:
 *  1. Validate inputs
 *  2. Check VaultAccount has sufficient raw balance
 *  3. Calculate processing fee
 *  4. In a DB transaction:
 *     a. Decrement VaultAccount.balanceKg (raw material consumed)
 *     b. Decrement Inventory for the processed good (mill dispatches it)
 *     c. Log TransactionLedger (type: WITHDRAWAL, fee recorded)
 */
async function withdraw(req, res, next) {
    try {
        const { materialType, weightKg, processedGoodType } = req.body;

        if (!materialType || weightKg == null || !processedGoodType) {
            throw new ApiError(400, 'materialType, weightKg, and processedGoodType are required.');
        }
        const weight = parseFloat(weightKg);
        if (isNaN(weight) || weight <= 0) {
            throw new ApiError(400, 'weightKg must be a positive number.');
        }

        const VALID_PROCESSED = ['FLOUR', 'BRAN', 'SEMOLINA'];
        if (!VALID_PROCESSED.includes(processedGoodType)) {
            throw new ApiError(400, `processedGoodType must be one of: ${VALID_PROCESSED.join(', ')}.`);
        }

        // Resolve customer profile
        let profile;
        if (req.user.role === 'ADMIN' && req.body.customerId) {
            profile = await prisma.customerProfile.findUnique({
                where: { id: parseInt(req.body.customerId) },
            });
        } else {
            profile = await prisma.customerProfile.findUnique({
                where: { userId: req.user.userId },
            });
        }
        if (!profile) throw new ApiError(404, 'Customer profile not found.');

        // Check existing vault balance for the raw material
        const vault = await prisma.vaultAccount.findUnique({
            where: {
                customerProfileId_materialType: {
                    customerProfileId: profile.id,
                    materialType,
                },
            },
        });

        if (!vault || vault.balanceKg < weight) {
            throw new ApiError(400,
                `Insufficient vault balance. ` +
                `Available: ${vault?.balanceKg ?? 0}kg of ${materialType}, ` +
                `Requested: ${weight}kg.`
            );
        }

        // Calculate processing fee
        const fee = calculateFee(processedGoodType, weight);

        // Atomic DB transaction
        const result = await prisma.$transaction(async (tx) => {
            // a. Deduct raw material from vault
            const updatedVault = await tx.vaultAccount.update({
                where: {
                    customerProfileId_materialType: {
                        customerProfileId: profile.id,
                        materialType,
                    },
                },
                data: { balanceKg: { decrement: weight } },
            });

            // b. Deduct processed goods from mill inventory
            //    (mill is dispatching the finished product)
            const processedInventory = await tx.inventory.findUnique({
                where: { itemName: processedGoodType },
            });
            if (!processedInventory || processedInventory.currentStockKg < weight) {
                // Throw inside transaction — will auto-rollback
                throw new ApiError(422,
                    `Mill processed goods stock is insufficient. ` +
                    `Available: ${processedInventory?.currentStockKg ?? 0}kg of ${processedGoodType}.`
                );
            }
            await tx.inventory.update({
                where: { itemName: processedGoodType },
                data: { currentStockKg: { decrement: weight } },
            });

            // c. Log the withdrawal in the ledger
            const ledgerEntry = await tx.transactionLedger.create({
                data: {
                    customerProfileId: profile.id,
                    type: 'WITHDRAWAL',
                    materialInvolved: processedGoodType,
                    weightKg: weight,
                    processingFeePaid: fee,
                },
            });

            return { updatedVault, ledgerEntry };
        });

        return res.status(200).json({
            message: `Withdrawal successful. ${weight}kg of ${processedGoodType} dispatched.`,
            rawMaterialUsed: `${weight}kg of ${materialType}`,
            remainingBalance: result.updatedVault.balanceKg,
            processedGood: processedGoodType,
            processingFeePaid: fee,
            ledgerEntryId: result.ledgerEntry.id,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { deposit, withdraw };
