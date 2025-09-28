import React, { useEffect, useState, useRef } from 'react';
import { api, setAuthToken, API_URL } from '../services/api';
import { io } from 'socket.io-client';

export default function TAView({ user, onLogout }) {
  setAuthToken(user.token);

  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [clarification, setClarification] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    async function fetchLectures() {
      try {
        const res = await api.get('/api/lecture/active');
        setLectures(res.data || []);
      } catch (err) {
        console.error('Failed to fetch lectures', err);
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

    (async function fetchQs() {
      try {
        const res = await api.get('/api/questions?lectureId=' + encodeURIComponent(selectedLecture));
        setQuestions(res.data || []);
      } catch (err) {
        console.error('Failed initial questions', err);
      }
    })();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [selectedLecture]);

  async function addClarification(id) {
    try {
      await api.patch('/api/questions/' + id, { clarification });
      setClarification('');
    } catch {
      alert('Failed to add clarification');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-emerald-500 to-teal-400 text-gray-900">
      <header className="flex justify-between items-center p-6 bg-white/20 backdrop-blur-md rounded-b-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">🧑‍💻 Teaching Assistant - {user.username}</h1>
        <button
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      {!selectedLecture && (
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Active Lectures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lectures.map((lec) => (
              <button
                key={lec._id}
                className="bg-white p-5 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                onClick={() => setSelectedLecture(lec.lectureId)}
              >
                <h3 className="text-lg font-bold">{lec.lectureId}</h3>
                <p className="text-sm text-gray-500">Started {new Date(lec.startedAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedLecture && (
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Lecture: {selectedLecture}</h2>
          <div className="grid gap-4">
            {questions.map((q) => (
              <div
                key={q._id}
                className="bg-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <p className="font-medium text-gray-800">{q.text}</p>
                <p className="text-sm text-gray-500">Status: {q.status}</p>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-grow border p-2 rounded-xl"
                    placeholder="Add clarification..."
                    value={clarification}
                    onChange={(e) => setClarification(e.target.value)}
                  />
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded-xl hover:scale-105 transition-transform"
                    onClick={() => addClarification(q._id)}
                  >
                    Save
                  </button>
                </div>
                {q.clarification && (
                  <p className="mt-2 text-sm text-green-700">Clarification: {q.clarification}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
