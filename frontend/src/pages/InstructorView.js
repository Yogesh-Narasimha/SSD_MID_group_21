import React, { useEffect, useState, useRef } from 'react';
import { api, setAuthToken, API_URL } from '../services/api';
import { io } from 'socket.io-client';

export default function InstructorView({ user, onLogout }) {
  setAuthToken(user.token);

  const [activeLecture, setActiveLecture] = useState(null);
  const [finishedLectures, setFinishedLectures] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('');
  const [finishedFilter, setFinishedFilter] = useState('');
  const [lectureInput, setLectureInput] = useState('');
  const [viewingFinished, setViewingFinished] = useState(null);
  const socketRef = useRef(null);

  // Fetch lectures
  useEffect(() => {
    async function fetchLectures() {
      try {
        const res = await api.get('/api/lecture/mine');
        setActiveLecture(res.data.active || null);
        setFinishedLectures(res.data.finished || []);
      } catch (err) {
        console.error('Failed to fetch lectures', err);
      }
    }
    fetchLectures();

    const socket = io(API_URL);
    socket.on('update-lecture', fetchLectures);
    return () => socket.disconnect();
  }, []);

  // Join active lecture
  useEffect(() => {
    if (!activeLecture) return;
    const socket = io(API_URL);
    socketRef.current = socket;

    socket.emit('join', { lectureId: activeLecture.lectureId });

    socket.on('new-question', (q) =>
      setQuestions((prev) => (prev.find((x) => x._id === q._id) ? prev : [...prev, q]))
    );
    socket.on('update-question', (q) =>
      setQuestions((prev) => prev.map((x) => (x._id === q._id ? q : x)))
    );
    socket.on('delete-question', ({ id }) =>
      setQuestions((prev) => prev.filter((x) => x._id !== id))
    );
    socket.on('clarification', (q) =>
      setQuestions((prev) => prev.map((x) => (x._id === q._id ? q : x)))
    );
    socket.on('cleared', () => setQuestions([]));

    (async function fetchQs() {
      try {
        const res = await api.get('/api/questions?lectureId=' + encodeURIComponent(activeLecture.lectureId));
        setQuestions(res.data || []);
      } catch (err) {
        console.error('Failed to fetch questions', err);
      }
    })();

    return () => socket.disconnect();
  }, [activeLecture]);

  async function startLecture() {
    if (!lectureInput.trim()) return alert('Enter lectureId');
    try {
      if (activeLecture) {
        await api.post('/api/lecture/end', { lectureId: activeLecture.lectureId });
        setFinishedLectures((prev) => [...prev, { ...activeLecture, questions }]);
        setActiveLecture(null);
        setQuestions([]);
      }

      const res = await api.post('/api/lecture/start', { lectureId: lectureInput.trim() });
      setActiveLecture(res.data);
      setQuestions([]);
      setLectureInput('');
    } catch {
      alert('Failed to start lecture');
    }
  }

  async function endLecture() {
    try {
      await api.post('/api/lecture/end', { lectureId: activeLecture.lectureId });
      setFinishedLectures((prev) => [...prev, { ...activeLecture, questions }]);
      setActiveLecture(null);
      setQuestions([]);
    } catch {
      alert('Failed to end lecture');
    }
  }

  async function clearLecture() {
    try {
      await api.delete('/api/questions?lectureId=' + encodeURIComponent(activeLecture.lectureId));
      setQuestions([]);
    } catch {
      alert('Failed to clear lecture');
    }
  }

  async function updateQuestion(id, updateObj) {
    try {
      await api.patch('/api/questions/' + id, updateObj);
    } catch {
      alert('Failed to update');
    }
  }

  async function deleteQuestion(id) {
    try {
      await api.delete('/api/questions/' + id);
    } catch {
      alert('Failed to delete');
    }
  }

  const displayedQuestions = !filter ? questions : questions.filter((q) => q.status === filter);

  const displayedFinishedQuestions = !finishedFilter
    ? viewingFinished?.questions || []
    : (viewingFinished?.questions || []).filter((q) => q.status === finishedFilter);

  function statusBadge(status) {
    switch (status) {
      case 'answered':
        return 'bg-green-100 text-green-700';
      case 'important':
        return 'bg-yellow-100 text-yellow-700';
      case 'unanswered':
      default:
        return 'bg-red-100 text-red-700';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-200 text-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-white/40 backdrop-blur-md shadow-lg rounded-b-2xl">
        <h1 className="text-2xl font-extrabold text-gray-900">📖 Instructor - {user.username}</h1>
        <button
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-md hover:scale-105 transition"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      <div className="p-6">
        {/* Start lecture */}
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-lg mb-6">
          <h3 className="font-bold text-lg mb-3">Start New Lecture</h3>
          <div className="flex gap-3">
            <input
              className="flex-grow p-3 rounded-xl border focus:ring-2 focus:ring-indigo-400"
              placeholder="Lecture ID"
              value={lectureInput}
              onChange={(e) => setLectureInput(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-md hover:scale-105 transition"
              onClick={startLecture}
            >
              Start
            </button>
          </div>
        </div>

        {/* Active lecture */}
        {activeLecture && !viewingFinished && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Active Lecture: {activeLecture.lectureId}</h3>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg shadow hover:scale-105"
                  onClick={endLecture}
                >
                  End
                </button>
                <button
                  className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg shadow hover:scale-105"
                  onClick={clearLecture}
                >
                  Clear Qs
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="mb-4">
              <label className="font-semibold mr-2">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border p-2 rounded-xl shadow-sm"
              >
                <option value="">All</option>
                <option value="unanswered">Unanswered</option>
                <option value="important">Important</option>
                <option value="answered">Answered</option>
              </select>
            </div>

            {/* Questions */}
            <div className="grid md:grid-cols-2 gap-4">
              {displayedQuestions.map((q) => (
                <div
                  key={q._id}
                  className="bg-white/50 backdrop-blur p-5 rounded-2xl shadow-lg hover:shadow-xl transition"
                >
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span className="font-semibold">{q.author}</span>
                    <span>{new Date(q.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="font-medium text-lg mb-2">{q.text}</p>
                  <span className={`inline-block px-3 py-1 text-xs rounded-full ${statusBadge(q.status)}`}>
                    {q.status}
                  </span>
                  {q.clarification && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <strong>TA Clarification:</strong> {q.clarification}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      className="px-3 py-1 rounded-lg bg-green-500 text-white shadow hover:scale-105"
                      onClick={() => updateQuestion(q._id, { status: 'answered' })}
                    >
                      Mark Answered
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg bg-yellow-500 text-white shadow hover:scale-105"
                      onClick={() => updateQuestion(q._id, { status: 'important' })}
                    >
                      Mark Important
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg bg-red-500 text-white shadow hover:scale-105"
                      onClick={() => deleteQuestion(q._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Finished lectures */}
        {!viewingFinished && (
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-3">Finished Lectures</h3>
            {finishedLectures.length === 0 && <p>No finished lectures yet.</p>}
            {finishedLectures.map((lec, idx) => (
              <div
                key={idx}
                className="bg-white/50 backdrop-blur p-4 rounded-xl shadow flex justify-between items-center mb-3"
              >
                <h4 className="font-semibold">{lec.lectureId}</h4>
                <button
                  className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow hover:scale-105"
                  onClick={() => {
                    setFinishedFilter('');
                    setViewingFinished(lec);
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Viewing finished lecture */}
        {viewingFinished && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Finished Lecture: {viewingFinished.lectureId}</h3>
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded-lg shadow hover:scale-105"
                onClick={() => setViewingFinished(null)}
              >
                Back
              </button>
            </div>
            <div className="mb-4">
              <label className="font-semibold mr-2">Filter:</label>
              <select
                value={finishedFilter}
                onChange={(e) => setFinishedFilter(e.target.value)}
                className="border p-2 rounded-xl shadow-sm"
              >
                <option value="">All</option>
                <option value="unanswered">Unanswered</option>
                <option value="important">Important</option>
                <option value="answered">Answered</option>
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {displayedFinishedQuestions.map((q) => (
                <div
                  key={q._id}
                  className="bg-white/40 backdrop-blur p-5 rounded-2xl shadow-lg hover:shadow-xl transition"
                >
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span className="font-semibold">{q.author}</span>
                    <span>{new Date(q.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="font-medium text-lg mb-2">{q.text}</p>
                  <span className={`inline-block px-3 py-1 text-xs rounded-full ${statusBadge(q.status)}`}>
                    {q.status}
                  </span>
                  {q.clarification && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <strong>TA Clarification:</strong> {q.clarification}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
