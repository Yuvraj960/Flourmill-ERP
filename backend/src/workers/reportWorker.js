/**
 * src/workers/reportWorker.js
 *
 * BullMQ Worker — Monthly Report Generation
 *
 * Processes jobs from the 'monthly-report' queue.
 * Each job payload: { targetMonth: ISO string (1st of the month) }
 *
 * Steps:
 *   1. Query TransactionLedger for the target month's data
 *   2. Aggregate KPIs: revenue, volume, active customers, top clients
 *   3. Build daily revenue time-series and material throughput arrays
 *   4. Fetch latest AI_Forecasts row for next month
 *   5. Call buildReport() to generate HTML + chart PNG attachments
 *   6. Send email via Nodemailer
 */

'use strict';

require('dotenv').config();
const { Worker, UnrecoverableError } = require('bullmq');
const nodemailer = require('nodemailer');
const { connection } = require('../queues/connection');
const prisma = require('../config/prisma');
const { buildReport } = require('../reports/reportBuilder');

// ─────────────────────────────────────────────────────────────────────────────
// Nodemailer Transport (SMTP — works with Gmail, SendGrid, Mailgun, etc.)
// ─────────────────────────────────────────────────────────────────────────────

function createTransport() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        throw new UnrecoverableError(
            '[ReportWorker] SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are not set.'
        );
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10) || 587,
        secure: parseInt(SMTP_PORT, 10) === 465, // true for port 465 (TLS)
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Aggregation Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse the target month and return its start/end Date boundaries.
 * @param {string} targetMonthISO  e.g. "2026-01-01T00:00:00.000Z"
 * @returns {{ start: Date, end: Date, label: string }}
 */
function getMonthBoundaries(targetMonthISO) {
    const start = new Date(targetMonthISO);
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1); // first moment of next month

    const label = start.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

    return { start, end, label };
}

/**
 * Aggregate transaction ledger data for the given month.
 *
 * @param {Date} start
 * @param {Date} end
 * @returns {Promise<object>} aggregated data
 */
async function aggregateLedger(start, end) {
    const rows = await prisma.transactionLedger.findMany({
        where: { timestamp: { gte: start, lt: end } },
        include: { customerProfile: { select: { millId: true, fullName: true } } },
        orderBy: { timestamp: 'asc' },
    });

    // ── KPIs ──────────────────────────────────────────────────────────────
    let totalRevenue = 0;
    let totalWeightProcessed = 0;
    const customerSet = new Set();
    const customerVolume = {}; // millId → { fullName, weightKg, feePaid }
    const dailyMap = {};       // "YYYY-MM-DD" → revenue
    const materialDeposited = {};  // materialType → kg
    const materialProcessed = {};  // materialType → kg

    for (const row of rows) {
        totalRevenue += row.processingFeePaid;

        if (row.type === 'WITHDRAWAL' || row.type === 'WALKIN_SALE') {
            totalWeightProcessed += row.weightKg;

            // material throughput — processed
            materialProcessed[row.materialInvolved] =
                (materialProcessed[row.materialInvolved] || 0) + row.weightKg;
        }

        if (row.type === 'DEPOSIT') {
            materialDeposited[row.materialInvolved] =
                (materialDeposited[row.materialInvolved] || 0) + row.weightKg;
        }

        // daily revenue
        const dateKey = row.timestamp.toISOString().slice(0, 10);
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + row.processingFeePaid;

        // customer tracking
        if (row.customerProfile) {
            const { millId, fullName } = row.customerProfile;
            customerSet.add(millId);

            if (!customerVolume[millId]) {
                customerVolume[millId] = { millId, fullName, weightKg: 0, feePaid: 0 };
            }
            customerVolume[millId].weightKg += row.weightKg;
            customerVolume[millId].feePaid += row.processingFeePaid;
        }
    }

    // ── Top 5 customers ───────────────────────────────────────────────────
    const topCustomers = Object.values(customerVolume)
        .sort((a, b) => b.weightKg - a.weightKg)
        .slice(0, 5);

    // ── Daily revenue series ───────────────────────────────────────────────
    const dailyRevenue = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

    // ── Material throughput ────────────────────────────────────────────────
    const allMaterials = new Set([
        ...Object.keys(materialDeposited),
        ...Object.keys(materialProcessed),
    ]);
    const throughput = Array.from(allMaterials).map((material) => ({
        material,
        depositedKg: materialDeposited[material] || 0,
        processedKg: materialProcessed[material] || 0,
    }));

    return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalWeightProcessed: parseFloat(totalWeightProcessed.toFixed(2)),
        activeCustomers: customerSet.size,
        totalTransactions: rows.length,
        topCustomers,
        dailyRevenue,
        throughput,
    };
}

/**
 * Fetch the most recent AI forecast entry.
 * @returns {Promise<object|null>}
 */
async function fetchLatestForecast() {
    return prisma.AI_Forecasts.findFirst({
        orderBy: { generatedAt: 'desc' },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Worker
// ─────────────────────────────────────────────────────────────────────────────

const reportWorker = new Worker(
    'monthly-report',
    async (job) => {
        const { targetMonth } = job.data;

        if (!targetMonth) {
            throw new UnrecoverableError('[ReportWorker] Job data missing required field: targetMonth');
        }

        console.log(`[ReportWorker] Starting report for month: ${targetMonth}`);

        // 1. Boundaries
        const { start, end, label } = getMonthBoundaries(targetMonth);

        // 2. Aggregate ledger data
        await job.updateProgress(10);
        const ledgerData = await aggregateLedger(start, end);

        // 3. AI forecast
        await job.updateProgress(40);
        const forecast = await fetchLatestForecast();

        // 4. Build HTML email + chart attachments
        await job.updateProgress(60);
        const { html, attachments } = await buildReport({
            monthLabel: label,
            totalRevenue: ledgerData.totalRevenue,
            totalWeightProcessed: ledgerData.totalWeightProcessed,
            activeCustomers: ledgerData.activeCustomers,
            totalTransactions: ledgerData.totalTransactions,
            topCustomers: ledgerData.topCustomers,
            dailyRevenue: ledgerData.dailyRevenue,
            throughput: ledgerData.throughput,
            forecast,
        });

        // 5. Send email
        await job.updateProgress(85);
        const transport = createTransport();
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            throw new UnrecoverableError('[ReportWorker] ADMIN_EMAIL environment variable is not set.');
        }

        const mailOptions = {
            from: `"MillStream ERP 🏭" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `📊 MillStream Monthly Report — ${label}`,
            html,
            attachments,
        };

        const info = await transport.sendMail(mailOptions);
        await job.updateProgress(100);

        console.log(`[ReportWorker] Report emailed successfully. MessageId: ${info.messageId}`);

        return {
            success: true,
            month: label,
            messageId: info.messageId,
            kpis: {
                totalRevenue: ledgerData.totalRevenue,
                totalWeightProcessed: ledgerData.totalWeightProcessed,
                activeCustomers: ledgerData.activeCustomers,
                totalTransactions: ledgerData.totalTransactions,
            },
        };
    },
    {
        connection,
        concurrency: 1, // Report generation is CPU-heavy — keep it serial
        removeOnComplete: { age: 60 * 60 * 24 * 30 },
        removeOnFail: { age: 60 * 60 * 24 * 30 },
    }
);

reportWorker.on('progress', (job, progress) => {
    console.log(`[ReportWorker] Job #${job.id} — ${progress}% complete`);
});

reportWorker.on('completed', (job, result) => {
    console.log(`[ReportWorker] Job #${job.id} completed. Month: ${result.month}`);
});

reportWorker.on('failed', (job, err) => {
    console.error(`[ReportWorker] Job #${job?.id} failed: ${err.message}`);
});

reportWorker.on('error', (err) => {
    console.error('[ReportWorker] Worker error:', err);
});

module.exports = { reportWorker };
