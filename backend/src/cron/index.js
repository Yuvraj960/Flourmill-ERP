/**
 * src/cron/index.js
 *
 * Cron initialization entry point.
 * Import and start all scheduled jobs here.
 * Called once from src/server.js on startup.
 */

'use strict';

const { startMonthlyCron } = require('./monthlyCron');

function initAllCrons() {
    console.log('[Cron] Initializing scheduled jobs...');
    startMonthlyCron();
    console.log('[Cron] All scheduled jobs initialized.');
}

module.exports = { initAllCrons };
