const mongoose = require('mongoose');

const LectureSchema = new mongoose.Schema({
  lectureId: { type: String, required: true },
  instructor: { type: String, required: true },
  active: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

module.exports = mongoose.model('Lecture', LectureSchema);