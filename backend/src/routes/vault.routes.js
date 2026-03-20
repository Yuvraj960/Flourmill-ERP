const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { deposit, withdraw } = require('../controllers/vault.controller');

// All vault operations require authentication
router.use(verifyToken);

// POST /api/vault/deposit
router.post('/deposit', deposit);

// POST /api/vault/withdraw
router.post('/withdraw', withdraw);

module.exports = router;
