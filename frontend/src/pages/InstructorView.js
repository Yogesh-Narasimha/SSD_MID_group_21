// src/pages/InstructorView.js
import React, { useEffect, useState, useRef } from 'react';
import { api, setAuthToken, API_URL } from '../services/api';
import { io } from 'socket.io-client';

export default function InstructorView({ user, onLogout }) {
  // ensure auth token used by api
  setAuthToken(user.token);

  // state
  const [activeLecture, setActiveLecture] = useState(null);
  const [finishedLectures, setFinishedLectures] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('');
  const [finishedFilter, setFinishedFilter] = useState('');
  const [lectureInput, setLectureInput] = useState('');
  const [viewingFinished, setViewingFinished] = useState(null);
  const socketRef = useRef(null);

  // Fetch lectures (and listen for lecture updates)
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

  // Minimal UI placeholder for now
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
        <h2 className="font-semibold">Finished Lectures</h2>
        {finishedLectures.length === 0 ? (
          <p>No finished lectures yet.</p>
        ) : (
          <ul>
            {finishedLectures.map((f, i) => (
              <li key={i}>{f.lectureId}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
