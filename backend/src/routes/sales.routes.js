const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const { walkinSale } = require('../controllers/sales.controller');

// Walk-in sales are an admin/operator action
router.use(verifyToken, requireAdmin);

// POST /api/sales/walkin
router.post('/walkin', walkinSale);

module.exports = router;
