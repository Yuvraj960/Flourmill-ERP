'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ApiError = require('./utils/apiError');

// ── Bull Board (Queue Dashboard) ──────────────────────────────────────────────
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { ledgerQueue, reportQueue } = require('./queues');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const vaultRoutes = require('./routes/vault.routes');
const adminRoutes = require('./routes/admin.routes');
const salesRoutes = require('./routes/sales.routes');
const ledgerRoutes = require('./routes/ledger.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const aiRoutes = require('./routes/ai.routes');
const queueRoutes = require('./routes/queueRoutes');

// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// ── Bull Board setup ──────────────────────────────────────────────────────────
// Visual queue dashboard at /admin/queues
// In production: protect with adminAuth middleware.
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
    queues: [
        new BullMQAdapter(ledgerQueue),
        new BullMQAdapter(reportQueue),
    ],
    serverAdapter,
});

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Bull Board Route ──────────────────────────────────────────────────────────
app.use('/admin/queues', serverAdapter.getRouter());

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'MillStream ERP API',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
    });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/jobs', queueRoutes);   // Manual job triggers & queue status

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (process.env.NODE_ENV !== 'production') {
        console.error(`[Error] ${statusCode} — ${message}`);
        if (statusCode === 500) console.error(err.stack);
    }

    return res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV !== 'production' && statusCode === 500
            ? { stack: err.stack }
            : {}),
    });
});

module.exports = app;
