const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

// ─── GET /api/customer/me ─────────────────────────────────────────────────────
/**
 * Returns the logged-in customer's profile (millId, name, join date).
 */
async function getMe(req, res, next) {
    try {
        const profile = await prisma.customerProfile.findUnique({
            where: { userId: req.user.userId },
            include: {
                user: { select: { phone: true, role: true, createdAt: true } },
            },
        });

        if (!profile) throw new ApiError(404, 'Customer profile not found.');

        return res.status(200).json({
            millId: profile.millId,
            fullName: profile.fullName,
            phone: profile.user.phone,
            role: profile.user.role,
            memberSince: profile.user.createdAt,
        });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/customer/me/vaults ──────────────────────────────────────────────
/**
 * Returns all vault accounts for the logged-in customer with current balances.
 */
async function getMyVaults(req, res, next) {
    try {
        const profile = await prisma.customerProfile.findUnique({
            where: { userId: req.user.userId },
        });
        if (!profile) throw new ApiError(404, 'Customer profile not found.');

        const vaults = await prisma.vaultAccount.findMany({
            where: { customerProfileId: profile.id },
            orderBy: { materialType: 'asc' },
        });

        return res.status(200).json({ vaults });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/customer/me/transactions ────────────────────────────────────────
/**
 * Returns paginated transaction history for the logged-in customer.
 * Query params: ?page=1&limit=20
 */
async function getMyTransactions(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const profile = await prisma.customerProfile.findUnique({
            where: { userId: req.user.userId },
        });
        if (!profile) throw new ApiError(404, 'Customer profile not found.');

        const [total, transactions] = await Promise.all([
            prisma.transactionLedger.count({
                where: { customerProfileId: profile.id },
            }),
            prisma.transactionLedger.findMany({
                where: { customerProfileId: profile.id },
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        return res.status(200).json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            transactions,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { getMe, getMyVaults, getMyTransactions };
