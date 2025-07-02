import React from 'react';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import logo from '../assets/react.svg'; // Replace with your company logo path

export default function HeaderBar() {
  const { user, token } = useAuth();
  const username = user?.username || 'User';

  if (!token) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <header style={{
      width: '100%',
      height: '56px',
      background: 'linear-gradient(to right, #2563eb, #1e3a8a)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src={logo} alt="Company Logo" style={{ height: 32, width: 32 }} />
        <span style={{ fontWeight: 700, fontSize: '1.3rem', letterSpacing: 1 }}>360 DigiTMG</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontWeight: 500 }}>{username}</span>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
          title="Logout"
        >
          <LogoutIcon style={{ fontSize: 28, color: '#ff4d4f' }} />
        </button>
      </div>
    </header>
  );
}
