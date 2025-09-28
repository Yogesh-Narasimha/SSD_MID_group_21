const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  startLecture,
  endLecture,
  getActiveLectures,
  getMyLectures,
} = require('../controllers/lectureController');

// Routes
router.post('/start', authenticate, startLecture);
router.post('/end', authenticate, endLecture);
router.get('/active', getActiveLectures);
router.get('/mine', authenticate, getMyLectures);

module.exports = router;
