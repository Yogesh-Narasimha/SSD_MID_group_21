const Lecture = require('../models/Lecture');
const Question = require('../models/Question');
const { getIO } = require('../socket');

// Start lecture
async function startLecture(req, res) {
  try {
    const { lectureId } = req.body;
    if (!lectureId) return res.status(400).json({ message: 'lectureId required' });

    // End old active lecture if exists
    const existing = await Lecture.findOne({ instructor: req.user.username, active: true });
    if (existing) {
      existing.active = false;
      existing.endedAt = new Date();
      await existing.save();
    }

    const lec = new Lecture({
      lectureId,
      instructor: req.user.username,
      active: true,
      startedAt: new Date(),
    });
    await lec.save();

    const io = getIO();
    if (io) io.emit('lectures-updated');

    res.json(lec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// End lecture
async function endLecture(req, res) {
  try {
    const { lectureId } = req.body;
    const lec = await Lecture.findOne({ lectureId, instructor: req.user.username, active: true });
    if (!lec) return res.status(404).json({ message: 'Lecture not found' });

    lec.active = false;
    lec.endedAt = new Date();
    await lec.save();

    const io = getIO();
    if (io) io.emit('lectures-updated');

    res.json(lec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}



// My lectures (instructor: active + finished with questions)
async function getMyLectures(req, res) {
  try {
    const active = await Lecture.findOne({ instructor: req.user.username, active: true });
    const finished = await Lecture.find({ instructor: req.user.username, active: false }).sort({ endedAt: -1 });

    const finishedWithQs = await Promise.all(
      finished.map(async (lec) => {
        const qs = await Question.find({ lectureId: lec.lectureId }).sort({ timestamp: 1 });
        return { ...lec.toObject(), questions: qs };
      })
    );

    res.json({ active, finished: finishedWithQs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  startLecture,
  endLecture,
  getActiveLectures,
  getMyLectures,
};

// Active lectures (students use this)
async function getActiveLectures(req, res) {
  try {
    const active = await Lecture.find({ active: true }).sort({ startedAt: -1 });
    res.json(active);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
