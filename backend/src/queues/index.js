/**
 * src/queues/index.js
 *
 * BullMQ Queue definitions for MillStream ERP.
 *
 * Queues:
 *   - ledgerQueue  ('ledger-operations') : Atomic vault and inventory operations.
 *                  Runs via a dedicated Worker process to prevent negative stock
 *                  during high-concurrency requests.
 *
 *   - reportQueue  ('monthly-report')    : Monthly financial report generation +
 *                  email dispatch. Triggered by the cron job on the 1st of each month.
 */

'use strict';

const { Queue } = require('bullmq');
const { connection } = require('./connection');

// ─── Ledger Operations Queue ──────────────────────────────────────────────────
// Default job options: 3 attempts with exponential back-off.
// Failed overdraft/stock jobs do NOT retry (worker overrides this per job-type).
const ledgerQueue = new Queue('ledger-operations', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000, // 1 s, 2 s, 4 s
        },
        removeOnComplete: { age: 60 * 60 * 24 },    // keep 24 h
        removeOnFail: { age: 60 * 60 * 24 * 7 }, // keep 7 days for audit
    },
});

// ─── Monthly Report Queue ─────────────────────────────────────────────────────
// Report jobs are heavyweight — only 1 attempt; do not duplicate on failure.
const reportQueue = new Queue('monthly-report', {
    connection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 5000, // 5 s
        },
        removeOnComplete: { age: 60 * 60 * 24 * 30 }, // keep 30 days
        removeOnFail: { age: 60 * 60 * 24 * 30 },
    },
});

module.exports = { ledgerQueue, reportQueue };
