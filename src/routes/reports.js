const express = require('express');
const authMiddleware = require('../middleware/auth');
const { submitReport, getReports, getAllReports } = require('../controllers/reportController');

const router = express.Router();

// All routes below this middleware will require authentication
router.use(authMiddleware);

router.post('/:goalId/report', submitReport);
router.get('/:goalId/reports', getReports);
router.get('/', getAllReports);

module.exports = router;