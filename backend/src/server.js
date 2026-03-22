require('dotenv').config();
const http = require('http');
const Redis = require('ioredis');
const app = require('./app');
const { startCronScheduler } = require('./jobs/cronScheduler');
const { startReportWorker } = require('./jobs/reportWorker');

const PORT = process.env.PORT || 5000;

// ── Redis connection ──────────────────────────────────────────────────────────
// Shared IORedis instance used by both BullMQ Queue and Worker
const redisConnection = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : null;

if (redisConnection) {
    redisConnection.on('connect', () => console.log('[Redis] Connected.'));
    redisConnection.on('error', (err) => console.error('[Redis] Error:', err.message));
}

// ── Start background jobs (only if Redis is configured) ──────────────────────
if (redisConnection) {
    startCronScheduler(redisConnection);
    startReportWorker(redisConnection);
    console.log('[Jobs] Cron scheduler and report worker initialized.');
} else {
    console.warn('[Jobs] REDIS_URL not set — background jobs (BullMQ) are disabled.');
}

// ── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`\n🌾 MillStream ERP API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('[Server] HTTP server closed.');
        if (redisConnection) redisConnection.quit();
        process.exit(0);
    });
});
