/**
 * src/reports/reportBuilder.js
 *
 * Builds a styled HTML email for the monthly financial report.
 * Charts are embedded as inline CID attachments (referenced by nodemailer).
 *
 * Returns:
 *   { html: string, attachments: Array } — ready to pass to nodemailer.sendMail()
 */

'use strict';

const { renderRevenueChart, renderThroughputChart } = require('./chartRenderer');

/**
 * Format a number as PKR currency.
 * @param {number} amount
 * @returns {string}
 */
function pkr(amount) {
    return `PKR ${Number(amount).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * Build the monthly report email.
 *
 * @param {object} opts
 * @param {string} opts.monthLabel              — e.g. "January 2026"
 * @param {number} opts.totalRevenue            — sum of processingFeePaid
 * @param {number} opts.totalWeightProcessed    — sum of weightKg for withdrawals
 * @param {number} opts.activeCustomers         — distinct customer count
 * @param {number} opts.totalTransactions       — total ledger row count
 * @param {Array}  opts.topCustomers            — [{ millId, fullName, weightKg, feePaid }]
 * @param {Array}  opts.dailyRevenue            — [{ date, revenue }]
 * @param {Array}  opts.throughput              — [{ material, depositedKg, processedKg }]
 * @param {object|null} opts.forecast           — { predictedWheatKg, predictedFlourKg, predictedRevenue }
 *
 * @returns {Promise<{ html: string, attachments: Array }>}
 */
async function buildReport(opts) {
    const {
        monthLabel,
        totalRevenue,
        totalWeightProcessed,
        activeCustomers,
        totalTransactions,
        topCustomers = [],
        dailyRevenue = [],
        throughput = [],
        forecast = null,
    } = opts;

    // ── Render charts ──────────────────────────────────────────────────────
    const [revenueImgBuf, throughputImgBuf] = await Promise.all([
        renderRevenueChart(dailyRevenue),
        renderThroughputChart(throughput),
    ]);

    const attachments = [
        {
            filename: 'revenue-trend.png',
            content: revenueImgBuf,
            cid: 'revenuechart@millstream',
            contentType: 'image/png',
        },
        {
            filename: 'throughput.png',
            content: throughputImgBuf,
            cid: 'throughputchart@millstream',
            contentType: 'image/png',
        },
    ];

    // ── Top Customers table rows ───────────────────────────────────────────
    const customerRows = topCustomers
        .map(
            (c, i) => `
            <tr style="background:${i % 2 === 0 ? '#F9FAFB' : '#FFFFFF'}">
                <td style="padding:10px 16px;border-bottom:1px solid #E5E7EB">${i + 1}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #E5E7EB;font-weight:600">${c.millId}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #E5E7EB">${c.fullName}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #E5E7EB;text-align:right">${parseFloat(c.weightKg).toFixed(2)} kg</td>
                <td style="padding:10px 16px;border-bottom:1px solid #E5E7EB;text-align:right;color:#059669">${pkr(c.feePaid)}</td>
            </tr>`
        )
        .join('');

    // ── AI Forecast section (optional) ────────────────────────────────────
    const forecastSection = forecast
        ? `
        <div style="margin-top:32px">
            <h2 style="font-size:18px;color:#1F2937;border-bottom:2px solid #E5E7EB;padding-bottom:8px">
                🤖 AI Forecast — Next Month
            </h2>
            <table style="width:100%;border-collapse:collapse;margin-top:12px">
                <thead>
                    <tr style="background:#EFF6FF">
                        <th style="padding:10px 16px;text-align:left;color:#3B82F6">Metric</th>
                        <th style="padding:10px 16px;text-align:right;color:#3B82F6">Predicted Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="padding:10px 16px;border-bottom:1px solid #E5E7EB">Wheat Required</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #E5E7EB">${parseFloat(forecast.predictedWheatKg).toFixed(0)} kg</td></tr>
                    <tr style="background:#F9FAFB"><td style="padding:10px 16px;border-bottom:1px solid #E5E7EB">Flour Demand</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #E5E7EB">${parseFloat(forecast.predictedFlourKg).toFixed(0)} kg</td></tr>
                    <tr><td style="padding:10px 16px">Expected Revenue</td><td style="padding:10px 16px;text-align:right;color:#059669;font-weight:700">${pkr(forecast.predictedRevenue)}</td></tr>
                </tbody>
            </table>
        </div>`
        : '';

    // ── Full HTML email ────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MillStream Monthly Report — ${monthLabel}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;color:#374151">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1E40AF,#4F46E5);padding:32px 40px;text-align:center">
        <h1 style="color:#FFFFFF;margin:0;font-size:26px;letter-spacing:1px">⚙️ MillStream ERP</h1>
        <p style="color:#BFDBFE;margin:8px 0 0;font-size:15px">Monthly Financial Report — <strong>${monthLabel}</strong></p>
    </div>

    <!-- Main Content -->
    <div style="max-width:680px;margin:0 auto;padding:32px 24px">

        <!-- KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:32px">
            <!-- Revenue -->
            <div style="background:#FFFFFF;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
                <p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">Total Revenue</p>
                <p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#059669">${pkr(totalRevenue)}</p>
            </div>
            <!-- Volume -->
            <div style="background:#FFFFFF;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
                <p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">Material Processed</p>
                <p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#4F46E5">${parseFloat(totalWeightProcessed).toFixed(1)} kg</p>
            </div>
            <!-- Active Customers -->
            <div style="background:#FFFFFF;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
                <p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">Active Customers</p>
                <p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#1F2937">${activeCustomers}</p>
            </div>
            <!-- Transactions -->
            <div style="background:#FFFFFF;border-radius:12px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
                <p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px">Total Transactions</p>
                <p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#1F2937">${totalTransactions}</p>
            </div>
        </div>

        <!-- Revenue Trend Chart -->
        <div style="background:#FFFFFF;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.08);margin-bottom:24px">
            <h2 style="font-size:16px;margin:0 0 16px;color:#1F2937">Revenue Trend</h2>
            <img src="cid:revenuechart@millstream" alt="Revenue Trend Chart" style="width:100%;max-width:600px;height:auto;display:block" />
        </div>

        <!-- Material Throughput Chart -->
        <div style="background:#FFFFFF;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.08);margin-bottom:24px">
            <h2 style="font-size:16px;margin:0 0 16px;color:#1F2937">Material Throughput</h2>
            <img src="cid:throughputchart@millstream" alt="Material Throughput Chart" style="width:100%;max-width:600px;height:auto;display:block" />
        </div>

        <!-- Top Customers -->
        ${topCustomers.length > 0 ? `
        <div style="background:#FFFFFF;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.08);margin-bottom:24px">
            <h2 style="font-size:16px;margin:0 0 16px;color:#1F2937">Top 5 Customers by Volume</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
                <thead>
                    <tr style="background:#F1F5F9">
                        <th style="padding:10px 16px;text-align:left;color:#6B7280">#</th>
                        <th style="padding:10px 16px;text-align:left;color:#6B7280">Mill ID</th>
                        <th style="padding:10px 16px;text-align:left;color:#6B7280">Name</th>
                        <th style="padding:10px 16px;text-align:right;color:#6B7280">Volume</th>
                        <th style="padding:10px 16px;text-align:right;color:#6B7280">Fee Paid</th>
                    </tr>
                </thead>
                <tbody>${customerRows}</tbody>
            </table>
        </div>` : ''}

        <!-- AI Forecast -->
        ${forecastSection}

    </div>

    <!-- Footer -->
    <div style="background:#1F2937;padding:20px 40px;text-align:center;margin-top:16px">
        <p style="color:#9CA3AF;font-size:12px;margin:0">
            This is an automated report generated by MillStream ERP on ${new Date().toUTCString()}.
            Do not reply to this email.
        </p>
        <p style="color:#6B7280;font-size:11px;margin:6px 0 0">© ${new Date().getFullYear()} MillStream ERP. All rights reserved.</p>
    </div>

</body>
</html>`;

    return { html, attachments };
}

module.exports = { buildReport };
