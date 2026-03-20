/**
 * src/queues/connection.js
 *
 * Shared IORedis connection for all BullMQ queues and workers.
 * Uses the REDIS_URL env var which should be an Upstash TLS URL:
 *   rediss://:password@endpoint:6380
 *
 * maxRetriesPerRequest must be null for BullMQ compatibility.
 */

'use strict';

require('dotenv').config();
const { default: IORedis } = require('ioredis');

function createRedisConnection() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set.');
    }

    const connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: null, // Required by BullMQ — do not remove
        enableReadyCheck: false,    // Needed for Upstash TLS connections
        tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    });

    connection.on('connect', () => console.log('[Redis] Connected successfully.'));
    connection.on('error', (err) => console.error('[Redis] Connection error:', err.message));

    return connection;
}

// Export a single shared connection instance (singleton)
const connection = createRedisConnection();

module.exports = { connection };
