const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
    listCustomers,
    getCustomer,
    resetCustomerPassword,
    listInventory,
    updateInventory,
    getLedger,
} = require('../controllers/admin.controller');

// All admin routes require a valid JWT AND admin role
router.use(verifyToken, requireAdmin);

// ── Customers ─────────────────────────────────────
// GET  /api/admin/customers?page=1&limit=20&search=JOH
router.get('/customers', listCustomers);
// GET  /api/admin/customers/:id
router.get('/customers/:id', getCustomer);
// POST /api/admin/customers/:id/reset-password
router.post('/customers/:id/reset-password', resetCustomerPassword);

// ── Inventory ─────────────────────────────────────
// GET   /api/admin/inventory
router.get('/inventory', listInventory);
// PATCH /api/admin/inventory/:id
router.patch('/inventory/:id', updateInventory);

// ── Ledger ────────────────────────────────────────
// GET /api/admin/ledger?type=WITHDRAWAL&from=2025-01-01&to=2025-12-31
router.get('/ledger', getLedger);

module.exports = router;
