import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  FileText, 
  MessageSquare, 
  CheckSquare, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  ClipboardCheck
} from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'ACADEMICIAN':
        return [
          { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/academician' },
          { name: 'My Schedule', icon: <Calendar size={20} />, path: '/academician/schedule' },
          { name: 'Messages', icon: <MessageSquare size={20} />, path: '/academician/messages' },
          { name: 'To-Do List', icon: <CheckSquare size={20} />, path: '/academician/todo' },
          { name: 'Profile', icon: <UserIcon size={20} />, path: '/academician/profile' },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin' },
          { name: 'Users', icon: <UserIcon size={20} />, path: '/admin/users' },
          { name: 'Courses', icon: <BookOpen size={20} />, path: '/admin/courses' },
          { name: 'Messages', icon: <MessageSquare size={20} />, path: '/admin/messages' },
        ];
      case 'ADMINISTRATIVE':
        return [
          { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/administrative' },
          { name: 'Messages', icon: <MessageSquare size={20} />, path: '/administrative/messages' },
          { name: 'Profile', icon: <UserIcon size={20} />, path: '/administrative/profile' },
        ];
      default: // STUDENT
        return [
          { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/student' },
          { name: 'Course Registration', icon: <BookOpen size={20} />, path: '/student/registration' },
          { name: 'Weekly Schedule', icon: <Calendar size={20} />, path: '/student/schedule' },
          { name: 'Exam Calendar', icon: <FileText size={20} />, path: '/student/exams' },
          { name: 'Transcript', icon: <FileText size={20} />, path: '/student/transcript' },
          { name: 'Attendance', icon: <ClipboardCheck size={20} />, path: '/student/attendance' },
          { name: 'Messages', icon: <MessageSquare size={20} />, path: '/student/messages' },
          { name: 'To-Do List', icon: <CheckSquare size={20} />, path: '/student/todo' },
          { name: 'Profile', icon: <UserIcon size={20} />, path: '/student/profile' },
        ];
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'ACADEMICIAN': return 'var(--accent-academician)';
      case 'ADMINISTRATIVE': return 'var(--accent-admin)';
      case 'ADMIN': return '#f85149';
      default: return 'var(--accent-student)';
    }
  };

  const menuItems = getMenuItems();
  const accentColor = getRoleColor();

  return (
    <div className="glass-card" style={{
      ...styles.sidebar,
      width: collapsed ? '80px' : '260px',
    }}>
      <div style={styles.header}>
        {!collapsed && <span style={{ ...styles.logoText, color: accentColor }}>OBS PORTAL</span>}
        <button onClick={() => setCollapsed(!collapsed)} style={{...styles.toggleBtn, cursor: 'pointer', color: 'white'}}>
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div style={styles.profile}>
        <div style={{ ...styles.avatar, background: `${accentColor}1a` }}>
          <UserIcon size={collapsed ? 24 : 32} color={accentColor} />
        </div>
        {!collapsed && (
          <div style={styles.profileInfo}>
            <p style={styles.userName}>{user?.username}</p>
            <p style={styles.userRole}>{user?.role?.toLowerCase()}</p>
          </div>
        )}
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div 
              key={item.name}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                background: isActive ? `${accentColor}26` : 'transparent',
                color: isActive ? accentColor : 'var(--text-secondary)',
                justifyContent: collapsed ? 'center' : 'flex-start'
              }}
            >
              <div style={{ ...styles.navIcon, color: isActive ? accentColor : 'inherit' }}>
                {item.icon}
              </div>
              {!collapsed && <span>{item.name}</span>}
            </div>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <button onClick={logout} style={{
          ...styles.logoutBtn,
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    height: '100vh',
    position: 'sticky',
    top: 0,
    borderRadius: '0 24px 24px 0',
    borderLeft: 'none',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 100,
    padding: '1.5rem 0.8rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 0.5rem 2rem 0.5rem',
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--accent-student)',
  },
  toggleBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'var(--text-secondary)',
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 0.5rem',
    marginBottom: '2rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
  },
  avatar: {
    minWidth: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(35, 134, 54, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.95rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  navIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-glass)',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.8rem 1rem',
    background: 'transparent',
    color: '#f85149',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
  }
};

export default Sidebar;
