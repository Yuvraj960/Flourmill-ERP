const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

// ─── POST /api/sales/walkin ────────────────────────────────────────────────────
/**
 * Walk-in retail sale — no vault involved. Cash-for-goods exchange.
 * Body: { materialType: 'FLOUR' | 'BRAN' | 'SEMOLINA', weightKg, cashReceived }
 *
 * Steps:
 *  1. Validate inputs
 *  2. Check Inventory has sufficient stock
 *  3. In a transaction: deduct Inventory, log WALKIN_SALE (customerProfileId null)
 */
async function walkinSale(req, res, next) {
    try {
        const { materialType, weightKg, cashReceived } = req.body;

        if (!materialType || weightKg == null || cashReceived == null) {
            throw new ApiError(400, 'materialType, weightKg, and cashReceived are required.');
        }
        const weight = parseFloat(weightKg);
        const cash = parseFloat(cashReceived);
        if (isNaN(weight) || weight <= 0) throw new ApiError(400, 'weightKg must be a positive number.');
        if (isNaN(cash) || cash <= 0) throw new ApiError(400, 'cashReceived must be a positive number.');

        const SELLABLE = ['FLOUR', 'BRAN', 'SEMOLINA'];
        if (!SELLABLE.includes(materialType)) {
            throw new ApiError(400, `Walk-in sales only support processed goods: ${SELLABLE.join(', ')}.`);
        }

        // Check processed goods inventory
        const inventory = await prisma.inventory.findUnique({
            where: { itemName: materialType },
        });
        if (!inventory || inventory.currentStockKg < weight) {
            throw new ApiError(422,
                `Insufficient stock. Available: ${inventory?.currentStockKg ?? 0}kg of ${materialType}, ` +
                `Requested: ${weight}kg.`
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            // Deduct from inventory
            const updated = await tx.inventory.update({
                where: { itemName: materialType },
                data: { currentStockKg: { decrement: weight } },
            });

            // Log as WALKIN_SALE with no customer (customerProfileId: null)
            const ledgerEntry = await tx.transactionLedger.create({
                data: {
                    customerProfileId: null,
                    type: 'WALKIN_SALE',
                    materialInvolved: materialType,
                    weightKg: weight,
                    processingFeePaid: cash, // cash received recorded in fee field for revenue tracking
                },
            });

            return { updated, ledgerEntry };
        });

        return res.status(200).json({
            message: `Walk-in sale recorded. ${weight}kg of ${materialType} sold.`,
            cashReceived: cash,
            remainingStock: result.updated.currentStockKg,
            ledgerEntryId: result.ledgerEntry.id,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { walkinSale };
