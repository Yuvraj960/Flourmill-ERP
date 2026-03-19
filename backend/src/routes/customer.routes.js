const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getMe, getMyVaults, getMyTransactions } = require('../controllers/customer.controller');

// All customer routes require a valid JWT
router.use(verifyToken);

// GET /api/customer/me
router.get('/me', getMe);

// GET /api/customer/me/vaults
router.get('/me/vaults', getMyVaults);

// GET /api/customer/me/transactions
router.get('/me/transactions', getMyTransactions);

module.exports = router;
