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
