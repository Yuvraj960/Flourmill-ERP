/**
 * src/routes/queueRoutes.js
 *
 * REST API endpoints for interacting with BullMQ queues.
 * Allows admin to:
 *   - Trigger a monthly report generation on demand (POST /api/jobs/trigger-report)
 *   - Enqueue vault/ledger operations via HTTP (POST /api/jobs/ledger)
 *   - Check queue stats (GET /api/jobs/stats)
 *
 * These endpoints REQUIRE admin authentication (adminAuth middleware).
 * In a running system, normal vault/ledger operations should be enqueued
 * directly from the vault/sales controllers — these routes are for testing
 * and admin manual triggers.
 */

'use strict';

const { Router } = require('express');
const { ledgerQueue, reportQueue } = require('../queues');

const router = Router();

// ── Admin auth guard (lightweight inline) ──────────────────────────────────
// Full auth middleware (Agent 1) should be swapped in before production.
function adminOnly(req, res, next) {
    const token = req.headers['x-admin-secret'];
    if (token && token === process.env.ADMIN_API_SECRET) return next();
    // If no secret configured (dev mode), allow with warning
    if (!process.env.ADMIN_API_SECRET) {
        console.warn('[QueueRoutes] ADMIN_API_SECRET not set — endpoint is unprotected!');
        return next();
    }
    return res.status(403).json({ success: false, error: 'Forbidden' });
}

// ── POST /api/jobs/trigger-report ─────────────────────────────────────────
// Manually trigger a monthly report for any target month.
// Body: { targetMonth: "2026-01-01T00:00:00.000Z" }  (defaults to last month)
router.post('/trigger-report', adminOnly, async (req, res, next) => {
    try {
        const now = new Date();
        const defaultMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        const targetMonth = req.body.targetMonth || defaultMonth.toISOString();

        const year = new Date(targetMonth).getUTCFullYear();
        const month = new Date(targetMonth).getUTCMonth() + 1;

        const job = await reportQueue.add(
            'GENERATE_MONTHLY_REPORT',
            { targetMonth },
            {
                jobId: `manual-report-${year}-${month}-${Date.now()}`,
            }
        );

        return res.status(202).json({
            success: true,
            message: 'Report job enqueued successfully.',
            jobId: job.id,
            targetMonth,
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/jobs/ledger ──────────────────────────────────────────────────
// Enqueue a ledger operation. Body: { type, payload }
// type: VAULT_DEPOSIT | VAULT_WITHDRAWAL | RETAIL_SALE
// This is the HTTP bridge — vault/sales controllers call this in production.
router.post('/ledger', adminOnly, async (req, res, next) => {
    try {
        const { type, payload } = req.body;

        const VALID_TYPES = ['VAULT_DEPOSIT', 'VAULT_WITHDRAWAL', 'RETAIL_SALE'];
        if (!type || !VALID_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Invalid job type. Must be one of: ${VALID_TYPES.join(', ')}`,
            });
        }

        if (!payload || typeof payload !== 'object') {
            return res.status(400).json({ success: false, error: 'payload object is required.' });
        }

        // Override retries for stock/balance failures (UnrecoverableError handles this)
        const job = await ledgerQueue.add(type, payload);

        return res.status(202).json({
            success: true,
            message: `Ledger job enqueued.`,
            jobId: job.id,
            type,
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/jobs/stats ────────────────────────────────────────────────────
// Returns current queue counts for the dashboard.
router.get('/stats', adminOnly, async (_req, res, next) => {
    try {
        const [ledgerCounts, reportCounts] = await Promise.all([
            ledgerQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
            reportQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
        ]);

        return res.json({
            success: true,
            queues: {
                'ledger-operations': ledgerCounts,
                'monthly-report': reportCounts,
            },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
