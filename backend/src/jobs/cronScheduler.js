/**
 * src/jobs/cronScheduler.js
 *
 * Monthly Report Cron — upgraded to use the full cron/monthlyCron.js
 * implementation (which in turn uses the proper reportQueue from queues/index.js).
 *
 * This file is kept for backward-compatibility with server.js's import.
 * It simply delegates to the canonical implementation.
 */

'use strict';

const { startMonthlyCron } = require('../cron/monthlyCron');

/**
 * startCronScheduler
 *
 * @param {import('ioredis').Redis} _connection — kept for signature compatibility
 *        (the actual connection is now the shared singleton in queues/connection.js)
 */
function startCronScheduler(_connection) {
    return startMonthlyCron();
}

module.exports = { startCronScheduler };
