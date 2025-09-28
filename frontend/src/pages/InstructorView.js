// src/pages/InstructorView.js
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

  // lecture lifecycle
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

  // question management
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
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Instructor — {user.username}</h1>
        <button onClick={onLogout} className="px-3 py-2 rounded bg-red-400 text-white">Logout</button>
      </header>

      <section className="mb-4">
        <h2 className="font-semibold">Start New Lecture</h2>
        <div className="flex gap-2 mt-2">
          <input
            placeholder="Lecture ID"
            value={lectureInput}
            onChange={(e) => setLectureInput(e.target.value)}
            className="border p-2 rounded"
          />
          <button onClick={startLecture} className="px-3 py-2 rounded bg-blue-500 text-white">Start</button>
        </div>
      </section>

      <section className="mb-4">
        <h2 className="font-semibold">Active Lecture</h2>
        <div>{activeLecture ? activeLecture.lectureId : 'No active lecture'}</div>
      </section>

      <section>
        <h2 className="font-semibold">Questions (live)</h2>
        <div>{displayedQuestions.length} question(s) — filter: {filter || 'all'}</div>
      </section>
    </div>
  );
}
