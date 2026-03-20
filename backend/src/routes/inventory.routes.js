const express = require('express')
const router = express.Router()
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware')

// All inventory routes require admin
router.use(verifyToken, requireAdmin)

// GET  /api/inventory          — list all items
// POST /api/inventory          — create item
// GET  /api/inventory/low-stock — items below threshold
// PUT  /api/inventory/:id      — update item
// DELETE /api/inventory/:id    — delete item
// (Controllers implemented in Phase 4)

router.get('/', (_req, res) => res.json({ message: 'GET /inventory — Phase 4' }))
router.get('/low-stock', (_req, res) => res.json({ message: 'GET /inventory/low-stock — Phase 4' }))
router.post('/', (_req, res) => res.json({ message: 'POST /inventory — Phase 4' }))
router.put('/:id', (_req, res) => res.json({ message: `PUT /inventory/${_req.params.id} — Phase 4` }))
router.delete('/:id', (_req, res) => res.json({ message: `DELETE /inventory/${_req.params.id} — Phase 4` }))

module.exports = router
