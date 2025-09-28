const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, required: true },
  lectureId: { type: String, required: true },
  status: { type: String, default: 'unanswered' }, // unanswered | answered | important
  clarification: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Question', QuestionSchema);
