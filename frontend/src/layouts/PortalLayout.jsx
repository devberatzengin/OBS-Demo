import React from 'react';
import Sidebar from '../components/Sidebar';

const PortalLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        {children}
      </div>
    </div>
  );
};

export default PortalLayout;
