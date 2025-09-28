const express = require('express'); const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');
router.get('/', authenticate, questionController.listQuestions);
router.post('/', authenticate, authorizeRole('student'), questionController.createQuestion);
router.patch('/:id', authenticate, authorizeRole('teacher'), questionController.updateQuestion);



module.exports = router;