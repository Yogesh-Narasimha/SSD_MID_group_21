
import React, { useState } from 'react';
import { api } from '../services/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [role, setRole] = useState('student');

  async function submit(e) {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        await api.post('/auth/signup', { username, password, role });
        alert('Signup successful — please login now.');
        setMode('login');
        return;
      }

      const res = await api.post('/auth/login', { username, password });
      // backend sets HttpOnly cookie automatically
      onLogin(res.data.user); 
    } catch (err) {
      console.error('Login error', err);
      alert(err.response?.data?.message || 'Error during auth');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-indigo-200 to-purple-200">
      <div className="bg-white/30 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-center text-blue-900 mb-6 drop-shadow-sm">
          VidyaVichar
        </h1>

        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full p-3 rounded-xl bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            className="w-full p-3 rounded-xl bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">
                Role:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="ta">TA</option>
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-md hover:scale-105 transition-transform duration-300"
            >
              {mode === 'login' ? 'Login' : 'Signup'}
            </button>

            <button
              type="button"
              className="px-4 py-3 rounded-xl border border-gray-300 bg-white/40 text-blue-900 hover:bg-white/60 transition-colors"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Signup' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
