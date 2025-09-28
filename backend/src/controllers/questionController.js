const Question = require('../models/Question');
const Lecture = require('../models/Lecture');
const { getIO } = require('../socket');


const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


exports.createQuestion = async (req, res) => {
  try {
    const { text, lectureId } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Empty question' });
    }
    if (!lectureId) {
      return res.status(400).json({ message: 'lectureId required' });
    }

    const lecture = await Lecture.findOne({ lectureId, active: true });
    if (!lecture) {
      return res.status(400).json({ message: 'This lecture is not active.' });
    }

    const normalized = text.trim();

   
    const dup = await Question.findOne({
      lectureId,
      text: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') },
    });

    if (dup) {
      return res.status(400).json({ message: 'Same question has already been asked in this lecture' });
    }

   
    const authorName = req.user?.username || 'Anonymous';

    const q = new Question({
      text: normalized,
      author: authorName,
      lectureId,
      status: 'unanswered',
      timestamp: new Date(),
    });

    await q.save();

    const io = getIO();
    if (io) io.to(q.lectureId).emit('new-question', q);

    res.json(q);
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.listQuestions = async (req, res) => {
  try {
    const { status, lectureId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (lectureId) filter.lectureId = lectureId;

    const qs = await Question.find(filter).sort({ timestamp: 1 });
    res.json(qs);
  } catch (err) {
    console.error('Error listing questions:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;

    const q = await Question.findByIdAndUpdate(id, update, { new: true });
    if (!q) return res.status(404).json({ message: 'Not found' });

    const io = getIO();
    if (io) io.to(q.lectureId).emit('update-question', q);

    res.json(q);
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ error: err.message });
  }
};