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

  // Fetch lectures (listen for lecture updates)
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

  // Join active lecture and handle question events
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

    // initial fetch of questions for this lecture
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

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Instructor — {user.username}</h1>
        <button onClick={onLogout} className="px-3 py-2 rounded bg-red-400 text-white">Logout</button>
      </header>

      <section className="mb-4">
        <h2 className="font-semibold">Active Lecture</h2>
        <div>{activeLecture ? activeLecture.lectureId : 'No active lecture'}</div>
      </section>

      <section>
        <h2 className="font-semibold">Questions (live)</h2>
        <p>{questions.length} question(s) loaded</p>
      </section>
    </div>
  );
}
