import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="main-content">
      <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--accent-admin)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Shield color="var(--accent-admin)" size={40} />
          <div>
            <h1 style={{ color: 'var(--accent-admin)' }}>System Control, {user?.username}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Full system access enabled (Phase 5 Incoming)</p>
          </div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
