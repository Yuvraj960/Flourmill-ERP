/**
 * src/cron/monthlyCron.js
 *
 * Monthly Report Cron Job.
 *
 * Schedule: '0 0 1 * *'  →  Midnight on the 1st of every month (UTC)
 *
 * On trigger:
 *   - Calculates the previous month (the one that just ended)
 *   - Enqueues a 'monthly-report' job in BullMQ with the target month as payload
 *   - The heavy work (aggregation, chart rendering, email send) happens
 *     entirely inside the reportWorker process — NOT on the API thread.
 */

'use strict';

const cron = require('node-cron');
const { reportQueue } = require('../queues');

// Run at 00:00 on the 1st of every month (UTC)
const MONTHLY_SCHEDULE = '0 0 1 * *';

function startMonthlyCron() {
    const task = cron.schedule(
        MONTHLY_SCHEDULE,
        async () => {
            // Calculate the previous month (the month that just ended)
            const now = new Date();
            const targetMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

            console.log(
                `[MonthlyCron] Fired at ${now.toISOString()} — enqueueing report for ${targetMonth.toISOString()}`
            );

            try {
                const job = await reportQueue.add(
                    'GENERATE_MONTHLY_REPORT',
                    { targetMonth: targetMonth.toISOString() },
                    {
                        // Deduplicate: do not enqueue a second report if the first already exists
                        jobId: `monthly-report-${targetMonth.getUTCFullYear()}-${targetMonth.getUTCMonth() + 1}`,
                    }
                );

                console.log(`[MonthlyCron] Successfully enqueued report job #${job.id}`);
            } catch (err) {
                console.error('[MonthlyCron] Failed to enqueue report job:', err.message);
            }
        },
        {
            scheduled: true,
            timezone: 'UTC',
        }
    );

    console.log('[MonthlyCron] Scheduled — fires at midnight UTC on the 1st of each month.');
    return task;
}

module.exports = { startMonthlyCron };
