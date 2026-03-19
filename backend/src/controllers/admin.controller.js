const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

// ─── GET /api/admin/customers ──────────────────────────────────────────────────
async function listCustomers(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const where = search
            ? {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { millId: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};

        const [total, customers] = await Promise.all([
            prisma.customerProfile.count({ where }),
            prisma.customerProfile.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: { select: { phone: true, createdAt: true, role: true } },
                    vaults: true,
                },
                orderBy: { fullName: 'asc' },
            }),
        ]);

        return res.status(200).json({ page, limit, total, customers });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/admin/customers/:id ─────────────────────────────────────────────
async function getCustomer(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const profile = await prisma.customerProfile.findUnique({
            where: { id },
            include: {
                user: { select: { phone: true, createdAt: true, role: true } },
                vaults: true,
                transactions: { orderBy: { timestamp: 'desc' }, take: 50 },
            },
        });

        if (!profile) throw new ApiError(404, `Customer with ID ${id} not found.`);

        return res.status(200).json({ customer: profile });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/admin/customers/:id/reset-password ─────────────────────────────
/**
 * Admin sets a new password for a customer — bcrypt hashed, never plaintext.
 * This achieves the operational goal of admin "recovery" without storing plaintext.
 * Body: { newPassword }
 */
async function resetCustomerPassword(req, res, next) {
    try {
        const profileId = parseInt(req.params.id);
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            throw new ApiError(400, 'newPassword must be at least 8 characters.');
        }

        const profile = await prisma.customerProfile.findUnique({
            where: { id: profileId },
            include: { user: true },
        });
        if (!profile) throw new ApiError(404, `Customer with ID ${profileId} not found.`);

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: profile.userId },
            data: { passwordHash },
        });

        return res.status(200).json({
            message: `Password reset successfully for customer ${profile.millId}.`,
            millId: profile.millId,
        });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/admin/inventory ──────────────────────────────────────────────────
async function listInventory(req, res, next) {
    try {
        const inventory = await prisma.inventory.findMany({
            orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
        });

        // Flag items below reorder threshold
        const enriched = inventory.map((item) => ({
            ...item,
            belowReorder: item.currentStockKg < item.reorderThresholdKg,
        }));

        return res.status(200).json({ inventory: enriched });
    } catch (err) {
        next(err);
    }
}

// ─── PATCH /api/admin/inventory/:id ───────────────────────────────────────────
async function updateInventory(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const { currentStockKg, reorderThresholdKg } = req.body;

        const data = {};
        if (currentStockKg != null) data.currentStockKg = parseFloat(currentStockKg);
        if (reorderThresholdKg != null) data.reorderThresholdKg = parseFloat(reorderThresholdKg);

        if (Object.keys(data).length === 0) {
            throw new ApiError(400, 'Provide at least one field to update: currentStockKg or reorderThresholdKg.');
        }

        const item = await prisma.inventory.update({
            where: { id },
            data,
        });

        return res.status(200).json({ message: 'Inventory updated.', item });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/admin/ledger ─────────────────────────────────────────────────────
/**
 * Full transaction ledger with optional filters.
 * Query: ?type=DEPOSIT|WITHDRAWAL|WALKIN_SALE, ?from=ISO_DATE, ?to=ISO_DATE
 */
async function getLedger(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const skip = (page - 1) * limit;

        const where = {};
        if (req.query.type) where.type = req.query.type;
        if (req.query.from || req.query.to) {
            where.timestamp = {};
            if (req.query.from) where.timestamp.gte = new Date(req.query.from);
            if (req.query.to) where.timestamp.lte = new Date(req.query.to);
        }

        const [total, entries] = await Promise.all([
            prisma.transactionLedger.count({ where }),
            prisma.transactionLedger.findMany({
                where,
                skip,
                take: limit,
                orderBy: { timestamp: 'desc' },
                include: {
                    customerProfile: { select: { millId: true, fullName: true } },
                },
            }),
        ]);

        // Aggregate totals for response
        const totals = await prisma.transactionLedger.aggregate({
            where,
            _sum: { weightKg: true, processingFeePaid: true },
            _count: true,
        });

        return res.status(200).json({
            page, limit, total,
            totalPages: Math.ceil(total / limit),
            aggregates: {
                totalWeightKg: totals._sum.weightKg,
                totalFees: totals._sum.processingFeePaid,
                transactionCount: totals._count,
            },
            entries,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listCustomers,
    getCustomer,
    resetCustomerPassword,
    listInventory,
    updateInventory,
    getLedger,
};
