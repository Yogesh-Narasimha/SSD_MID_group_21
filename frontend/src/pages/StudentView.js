import React, { useEffect, useState, useRef, useMemo } from 'react';
import { api, setAuthToken, API_URL } from '../services/api';
import { io } from 'socket.io-client';

export default function StudentView({ user, onLogout }) {
  setAuthToken(user.token);

  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('');
  const [text, setText] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const socketRef = useRef(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-200 to-purple-200 text-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-white/30 backdrop-blur-md rounded-b-2xl shadow-lg">
        <h1 className="text-2xl font-extrabold text-gray-900">
          🎓 Student - {user.username}
        </h1>
        <button
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl shadow-md hover:scale-105 transition-transform"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>
    </div>
  );
}
useEffect(() => {
  async function fetchLectures() {
    try {
      const res = await api.get('/api/lecture/active');
      setLectures(res.data || []);
    } catch (err) {
      console.error('Error fetching lectures', err);
    }
  }
  fetchLectures();
  const socket = io(API_URL);
  socket.on('lectures-updated', fetchLectures);
  return () => socket.disconnect();
}, []);
useEffect(() => {
  if (!selectedLecture) return;
  socketRef.current = io(API_URL);
  socketRef.current.emit('join', { lectureId: selectedLecture });
  socketRef.current.on('new-question', (q) =>
    setQuestions((prev) => (prev.find((x) => x._id === q._id) ? prev : [...prev, q]))
  );
  socketRef.current.on('update-question', (q) =>
    setQuestions((prev) => prev.map((x) => (x._id === q._id ? q : x)))
  );
  socketRef.current.on('delete-question', ({ id }) =>
    setQuestions((prev) => prev.filter((x) => x._id !== id))
  );
  socketRef.current.on('clarification', (q) =>
    setQuestions((prev) => prev.map((x) => (x._id === q._id ? q : x)))
  );
  socketRef.current.on('cleared', () => setQuestions([]));

  (async function loadQs() {
    try {
      const res = await api.get('/api/questions?lectureId=' + encodeURIComponent(selectedLecture));
      setQuestions(res.data || []);
    } catch (err) {
      console.error('Failed to load questions', err);
    }
  })();

  return () => {
    if (socketRef.current) socketRef.current.disconnect();
  };
}, [selectedLecture]);
async function postQuestion() {
  if (!text.trim()) return;
  try {
    await api.post('/api/questions', { lectureId: selectedLecture, text });
    setText('');
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to post question';
    alert(msg);
  }
}

function exitSession() {
  if (socketRef.current) socketRef.current.disconnect();
  setSelectedLecture(null);
  setQuestions([]);
  setShowExitConfirm(false);
}

const displayedQuestions = useMemo(() => {
  if (!filter) return questions;
  return questions.filter((q) => q.status === filter);
}, [questions, filter]);

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
{/* Lecture List */}
{!selectedLecture && (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Available Lectures</h2>
    {lectures.length === 0 && <p>No active sessions</p>}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {lectures.map((lec) => (
        <button
          key={lec._id}
          className="bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition"
          onClick={() => setSelectedLecture(lec.lectureId)}
        >
          <h3 className="font-bold">{lec.lectureId}</h3>
          <p className="text-sm text-gray-600">
            Started {new Date(lec.startedAt).toLocaleString()}
          </p>
        </button>
      ))}
    </div>
  </div>
)}
{/* Lecture Session */}
{selectedLecture && (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold">Lecture: {selectedLecture}</h2>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded-xl shadow-md hover:scale-105 transition"
        onClick={() => setShowExitConfirm(true)}
      >
        Exit Session
      </button>
    </div>
  </div>
)}
{/* Filter buttons */}
<div className="mb-4 flex gap-2 flex-wrap">
  {['', 'unanswered', 'important', 'answered'].map((f) => (
    <button
      key={f || 'all'}
      className={`px-4 py-2 rounded-xl ${
        filter === f ? 'bg-indigo-500 text-white' : 'bg-white shadow'
      } hover:scale-105 transition`}
      onClick={() => setFilter(f)}
    >
      {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
    </button>
  ))}
</div>

{/* Question form */}
<div className="mb-6 flex">
  <input
    className="flex-grow p-3 rounded-l-xl border focus:ring-2 focus:ring-indigo-400"
    placeholder="Type your question..."
    value={text}
    onChange={(e) => setText(e.target.value)}
  />
  <button
    className="px-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-r-xl shadow-md hover:scale-105 transition"
    onClick={postQuestion}
  >
    Ask
  </button>
</div>



