const express = require('express')
const router = express.Router()
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware')

// GET  /api/ledger             — paginated ledger entries (admin)
// POST /api/ledger/retail-sale — walk-in retail sale (admin)
// (Controllers implemented in Phase 5)

router.get('/',
    verifyToken, requireAdmin,
    (_req, res) => res.json({ message: 'GET /ledger — Phase 5' })
)

router.post('/retail-sale',
    verifyToken, requireAdmin,
    (_req, res) => res.json({ message: 'POST /ledger/retail-sale — Phase 5' })
)

module.exports = router
