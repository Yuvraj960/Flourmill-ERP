const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { generateMillId } = require('../utils/generateMillId');

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { fullName, phone, password }
 *
 * 1. Validates inputs
 * 2. Checks phone uniqueness
 * 3. Generates mill_id
 * 4. Hashes password with bcrypt
 * 5. Creates User + CustomerProfile in a transaction
 * 6. Returns JWT + millId
 */
async function register(req, res, next) {
    try {
        const { fullName, phone, password } = req.body;

        // ── Validate ─────────────────────────
        if (!fullName || !phone || !password) {
            throw new ApiError(400, 'fullName, phone, and password are required.');
        }
        if (password.length < 8) {
            throw new ApiError(400, 'Password must be at least 8 characters.');
        }
        const phoneClean = phone.replace(/\s/g, '');
        if (!/^\d{7,15}$/.test(phoneClean)) {
            throw new ApiError(400, 'Phone must be 7–15 digits (no spaces).');
        }

        // ── Uniqueness check ─────────────────
        const existing = await prisma.user.findUnique({ where: { phone: phoneClean } });
        if (existing) {
            throw new ApiError(409, 'A customer with this phone number already exists.');
        }

        // ── Generate mill_id ─────────────────
        const millId = generateMillId(fullName, phoneClean);

        // Ensure generated mill_id doesn't collide (extremely rare but safe)
        const millIdExists = await prisma.customerProfile.findUnique({ where: { millId } });
        if (millIdExists) {
            throw new ApiError(409, `Generated Mill ID "${millId}" already exists. Please use a slightly different name.`);
        }

        // ── Hash password ────────────────────
        const passwordHash = await bcrypt.hash(password, 12);

        // ── Persist in a transaction ─────────
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    phone: phoneClean,
                    passwordHash,
                    role: 'CUSTOMER',
                    profile: {
                        create: {
                            fullName: fullName.trim(),
                            millId,
                        },
                    },
                },
                include: { profile: true },
            });
            return user;
        });

        // ── Issue JWT ────────────────────────
        const token = jwt.sign(
            { userId: result.id, role: result.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.status(201).json({
            message: 'Registration successful.',
            millId: result.profile.millId,
            token,
        });
    } catch (err) {
        next(err);
    }
}

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { phone, password }
 */
async function login(req, res, next) {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            throw new ApiError(400, 'phone and password are required.');
        }
        const phoneClean = phone.replace(/\s/g, '');

        // Find user
        const user = await prisma.user.findUnique({
            where: { phone: phoneClean },
            include: { profile: true },
        });

        if (!user) {
            throw new ApiError(401, 'Invalid phone number or password.');
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new ApiError(401, 'Invalid phone number or password.');
        }

        // Issue JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return res.status(200).json({
            message: 'Login successful.',
            millId: user.profile?.millId || null,
            role: user.role,
            token,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, login };
