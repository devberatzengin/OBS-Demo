import React, { useState, useEffect } from 'react';
import StudentService from '../services/StudentService';
import { 
  Trophy, 
  BookOpen, 
  Bell, 
  User as UserIcon, 
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData = await StudentService.getDashboardData();
        setData(dashboardData);
      } catch (err) {
        setError('Failed to fetch dashboard data. Make sure backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div style={styles.center}>
      <Loader2 className="animate-spin" size={40} color="var(--accent-student)" />
    </div>
  );

  if (error) return (
    <div style={styles.center}>
      <div className="glass-card" style={styles.errorCard}>
        <AlertCircle size={40} color="#f85149" />
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.welcomeText}>Welcome back, {data.fullName}</h1>
          <p style={styles.subtitle}>{data.departmentName} • {data.activeSemesterName}</p>
        </div>
        <div style={styles.headerStats}>
          <div className="glass-card" style={styles.headerStatItem}>
            <Trophy size={20} color="var(--accent-student)" />
            <span>GPA: {data.gpa.toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div className="glass-card" style={styles.statCard}>
          <UserIcon size={24} color="var(--accent-student)" />
          <div>
            <p style={styles.statLabel}>Advisor</p>
            <p style={styles.statValue}>{data.advisorName}</p>
          </div>
        </div>
        <div className="glass-card" style={styles.statCard}>
          <BookOpen size={24} color="var(--accent-student)" />
          <div>
            <p style={styles.statLabel}>Student Number</p>
            <p style={styles.statValue}>{data.studentNumber}</p>
          </div>
        </div>
        <div className="glass-card" style={styles.statCard}>
          <Calendar size={24} color="var(--accent-student)" />
          <div>
            <p style={styles.statLabel}>Active Semester</p>
            <p style={styles.statValue}>{data.activeSemesterName}</p>
          </div>
        </div>
      </div>

      <div style={styles.contentGrid}>
        {/* Left Column: Recent Notifications */}
        <div className="glass-card" style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <Bell size={20} color="var(--accent-student)" />
            <h2 style={styles.sectionTitle}>Recent Notifications</h2>
          </div>
          <div style={styles.notificationList}>
            {data.recentNotifications.length > 0 ? data.recentNotifications.map((notif, idx) => (
              <div key={idx} style={styles.notificationItem}>
                <p style={{ fontWeight: '700', color: 'white', marginBottom: '0.2rem', fontSize: '0.95rem' }}>{notif.title}</p>
                <p style={styles.notifMessage}>{notif.message}</p>
                <p style={styles.notifDate}>
                  {new Date(notif.timestamp).toLocaleDateString()} {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )) : (
              <p style={styles.emptyText}>No recent notifications</p>
            )}
          </div>
        </div>

        {/* Right Column: Current Courses */}
        <div className="glass-card" style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <BookOpen size={20} color="var(--accent-student)" />
            <h2 style={styles.sectionTitle}>Current Courses</h2>
          </div>
          <div style={styles.courseList}>
            {data.currentCourses.length > 0 ? data.currentCourses.map((course, idx) => (
              <div key={idx} style={styles.courseItem}>
                <div>
                  <p style={styles.courseCode}>{course.code}</p>
                  <p style={styles.courseName}>{course.name}</p>
                </div>
                <div style={styles.courseInfo}>
                  <span style={styles.aktsBadge}>{course.akts} AKTS</span>
                </div>
              </div>
            )) : (
              <p style={styles.emptyText}>No courses enrolled in this semester</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: '2rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  headerStats: {
    display: 'flex',
    gap: '1rem',
  },
  headerStatItem: {
    padding: '0.8rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    borderRadius: '12px',
    fontWeight: '700',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  statCard: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
  },
  statLabel: {
    color: 'var(--text-dim)',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '1.1rem',
    fontWeight: '700',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '2rem',
  },
  sectionCard: {
    padding: '1.8rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  notificationItem: {
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    borderLeft: '3px solid var(--accent-student)',
  },
  notifMessage: {
    fontSize: '0.9rem',
    lineHeight: '1.5',
  },
  notifDate: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    marginTop: '0.5rem',
  },
  courseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  courseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    transition: 'var(--transition)',
  },
  courseCode: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: 'var(--accent-student)',
  },
  courseName: {
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  aktsBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    background: 'rgba(35, 134, 54, 0.1)',
    color: 'var(--accent-student)',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
  },
  emptyText: {
    color: 'var(--text-dim)',
    textAlign: 'center',
    padding: '2rem 0',
  },
  errorCard: {
    padding: '3rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    maxWidth: '400px',
  }
};

export default StudentDashboard;
