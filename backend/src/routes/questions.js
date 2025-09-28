const express = require('express'); const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

router.post('/', authenticate, authorizeRole('student'), questionController.createQuestion);




module.exports = router;