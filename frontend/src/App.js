import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Login from './pages/Login';
import StudentView from './pages/StudentView';
import InstructorView from './pages/InstructorView';
import TAView from './pages/TAView';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if user already logged in via cookie
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await api.get('/auth/me', { withCredentials: true });
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Login onLogin={setUser} />;

  if (user.role === 'student') return <StudentView user={user} onLogout={() => setUser(null)} />;
  if (user.role === 'teacher') return <InstructorView user={user} onLogout={() => setUser(null)} />;
  if (user.role === 'ta') return <TAView user={user} onLogout={() => setUser(null)} />;

  return <div>Unknown role</div>;
}
