const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getWallet, deposit } = require('../controllers/walletController');

const router = express.Router();

// All routes below this middleware will require authentication
router.use(authMiddleware);

router.get('/', getWallet);
router.post('/deposit', deposit);

module.exports = router;