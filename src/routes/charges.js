const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getCharges, createCharge, processCharge } = require('../controllers/chargeController');

const router = express.Router();

// All routes below this middleware will require authentication
router.use(authMiddleware);

router.get('/', getCharges);
router.post('/', createCharge);
router.post('/:chargeId/process', processCharge);

module.exports = router;