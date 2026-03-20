/**
 * src/jobs/reportWorker.js
 *
 * Report Worker — upgraded to delegate to the full workers/reportWorker.js
 * implementation that includes:
 *   - Proper ledger aggregation with daily time-series
 *   - Chart rendering via chartjs-node-canvas (PNG CID attachments)
 *   - Styled HTML email template
 *   - Job progress events
 *   - UnrecoverableError for config failures
 *
 * This file is kept for backward-compatibility with server.js's import.
 */

'use strict';

const { reportWorker } = require('../workers/reportWorker');

/**
 * startReportWorker
 *
 * @param {import('ioredis').Redis} _connection — kept for signature compatibility
 *        (the actual connection is now the shared singleton in queues/connection.js)
 * @returns {import('bullmq').Worker}
 */
function startReportWorker(_connection) {
    // The worker is already instantiated as a singleton when the module is first
    // required. We just activate and return it here.
    console.log('[ReportWorker] Activated via jobs/reportWorker.js shim.');
    return reportWorker;
}

module.exports = { startReportWorker };
