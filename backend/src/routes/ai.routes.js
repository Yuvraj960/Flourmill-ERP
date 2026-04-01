const express = require('express')
const axios = require('axios')
const router = express.Router()
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware')

const AI_BASE = process.env.AI_SERVICE_URL || 'http://localhost:8000'

// All AI proxy routes are admin-only
router.use(verifyToken, requireAdmin)

// ── Demand Forecasting (Phase 8) ──────────────────────────────────────────
router.get('/forecast', async (req, res, next) => {
    try {
        const { data } = await axios.get(`${AI_BASE}/forecast`)
        res.json(data)
    } catch (err) { next(err) }
})

router.post('/forecast/run', async (req, res, next) => {
    try {
        const { data } = await axios.post(`${AI_BASE}/forecast/run`)
        res.json(data)
    } catch (err) { next(err) }
})

// ── Smart Procurement (Phase 9) ───────────────────────────────────────────
router.get('/procurement', async (req, res, next) => {
    try {
        const { data } = await axios.get(`${AI_BASE}/procurement`)
        res.json(data)
    } catch (err) { next(err) }
})

// ── RAG Chat Assistant (Phase 11) ─────────────────────────────────────────
router.post('/chat', async (req, res, next) => {
    try {
        const { data } = await axios.post(`${AI_BASE}/chat`, req.body)
        res.json(data)
    } catch (err) { next(err) }
})

module.exports = router
