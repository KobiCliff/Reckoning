const express = require('express');
const authMiddleware = require('../middleware/auth');
const { createGoal, listGoals, getGoal, updateGoal, deleteGoal } = require('../controllers/goalController');

const router = express.Router();

// All routes below this middleware will require authentication
router.use(authMiddleware);

router.post('/', createGoal);
router.get('/', listGoals);
router.get('/:goalId', getGoal);
router.patch('/:goalId', updateGoal);
router.delete('/:goalId', deleteGoal);

module.exports = router;