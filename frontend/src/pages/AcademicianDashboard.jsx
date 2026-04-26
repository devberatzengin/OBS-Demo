import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  Calendar,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import AcademicianService from '../services/AcademicianService';
import { useNavigate } from 'react-router-dom';

const AcademicianDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, pendingData] = await Promise.all([
          AcademicianService.getMyCourses(),
          AcademicianService.getPendingEnrollments()
        ]);
        setCourses(coursesData);
        setPendingEnrollments(pendingData);
      } catch (err) {
        console.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Active Courses', value: courses.length, icon: <BookOpen size={24} />, color: 'var(--accent-academician)' },
    { label: 'Total Students', value: courses.reduce((acc, c) => acc + (c.studentCount || 0), 0), icon: <Users size={24} />, color: '#10b981' },
    { label: 'Pending Approvals', value: pendingEnrollments.length, icon: <ClipboardCheck size={24} />, color: '#f59e0b' },
    { label: 'Weekly Hours', value: courses.length * 3, icon: <Clock size={24} />, color: '#8b5cf6' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-academician)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Welcome Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.welcomeText}>Welcome Back,</h1>
          <h2 style={styles.userName}>{user?.firstName} {user?.lastName}</h2>
        </div>
        <div style={styles.dateInfo}>
          <p style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="glass-card" 
            style={{ ...styles.statCard, cursor: stat.label === 'Total Students' ? 'pointer' : 'default' }}
            onClick={() => stat.label === 'Total Students' && navigate('/academician/students')}
          >
            <div style={styles.statHeader}>
              <div style={{ ...styles.statIconWrapper, background: `${stat.color}1a`, color: stat.color }}>
                {stat.icon}
              </div>
              <TrendingUp size={16} color="var(--text-dim)" />
            </div>
            <p style={styles.statLabel}>{stat.label}</p>
            <h3 style={styles.statValue}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div style={styles.mainGrid}>
        {/* Active Courses Section */}
        <div style={styles.leftSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <BookOpen size={20} color="var(--accent-academician)" />
              Active Courses
            </h3>
            <button 
              style={styles.viewAllBtn}
              onClick={() => navigate('/academician/schedule')}
            >
              View All
            </button>
          </div>
          <div style={styles.courseList}>
            {courses.length > 0 ? courses.map((course) => (
              <div 
                key={course.id}
                onClick={() => navigate(`/academician/courses/${course.id}`)}
                className="glass-card"
                style={styles.courseCard}
              >
                <div style={styles.courseMainInfo}>
                  <div>
                    <span style={styles.courseCode}>{course.code}</span>
                    <h4 style={styles.courseName}>{course.name}</h4>
                    <div style={styles.courseMeta}>
                      <div style={styles.metaItem}>
                        <Users size={14} />
                        <span>{course.studentCount} Students</span>
                      </div>
                      <div style={styles.metaItem}>
                        <Calendar size={14} />
                        <span>{course.schedule || 'Weekly Schedule'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="arrow-badge" style={styles.arrowBadge}>
                    <ArrowRight size={20} color="var(--accent-academician)" />
                  </div>
                </div>
              </div>
            )) : (
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                No active courses found.
              </div>
            )}
          </div>

          {/* Announcements Section */}
          <div style={{ ...styles.sectionHeader, marginTop: '2rem' }}>
            <h3 style={styles.sectionTitle}>
              <AlertCircle size={20} color="var(--accent-academician)" />
              Recent Announcements
            </h3>
            <button 
              style={styles.viewAllBtn}
              onClick={() => navigate('/academician/schedule')}
            >
              View All
            </button>
          </div>
          <div style={styles.announcementList}>
            {[
              { id: 1, title: 'Midterm Grade Entry Deadline', date: '2026-05-15', type: 'System' },
              { id: 2, title: 'Department Meeting: Curriculum Review', date: '2026-04-30', type: 'Academic' }
            ].map((ann) => (
              <div key={ann.id} className="glass-card" style={styles.announcementCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={styles.annType}>{ann.type}</span>
                    <h4 style={styles.annTitle}>{ann.title}</h4>
                  </div>
                  <span style={styles.annDate}>{ann.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Section */}
        <div style={styles.rightSection}>
          {/* Pending Enrollments Warning */}
          {pendingEnrollments.length > 0 && (
            <div className="glass-card" style={styles.alertCard}>
              <div style={styles.alertContent}>
                <div style={styles.alertHeader}>
                  <AlertCircle size={24} color="#f59e0b" />
                  <span style={styles.alertBadge}>ACTION REQUIRED</span>
                </div>
                <h3 style={styles.alertTitle}>{pendingEnrollments.length} Enrollment Requests</h3>
                <p style={styles.alertDesc}>Students are waiting for your approval as an advisor.</p>
                <button 
                  onClick={() => navigate('/academician/advisees')}
                  style={styles.alertBtn}
                >
                  Review Requests
                </button>
              </div>
              <div style={styles.alertBgIcon}>
                <ClipboardCheck size={140} color="#f59e0b" style={{ opacity: 0.1 }} />
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="glass-card" style={styles.quickLinksCard}>
            <h3 style={styles.quickTitle}>Management Quick Links</h3>
            <div style={styles.linkList}>
              {[
                { label: 'Enter Grades', onClick: () => courses.length > 0 ? navigate(`/academician/courses/${courses[0].id}?tab=grading`) : alert('No courses found'), icon: <GraduationCap size={18} /> },
                { label: 'Daily Attendance', onClick: () => courses.length > 0 ? navigate(`/academician/courses/${courses[0].id}?tab=attendance`) : alert('No courses found'), icon: <ClipboardCheck size={18} /> },
                { label: 'Weekly Schedule', onClick: () => navigate('/academician/schedule'), icon: <Calendar size={18} /> },
                { label: 'Office Hours', onClick: () => alert('Office hours management coming soon!'), icon: <Clock size={18} /> }
              ].map((link) => (
                <button 
                  key={link.label} 
                  onClick={link.onClick}
                  style={styles.linkBtn} 
                  className="group"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ color: 'var(--accent-academician)' }}>{link.icon}</div>
                    <span>{link.label}</span>
                  </div>
                  <ArrowRight size={16} style={styles.linkArrow} className="link-arrow" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '1rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '2.5rem',
  },
  welcomeText: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: 'white',
    marginBottom: '0.2rem',
  },
  userName: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'var(--accent-academician)',
  },
  dateInfo: {
    textAlign: 'right',
  },
  dateText: {
    color: 'var(--text-dim)',
    fontSize: '0.9rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  statCard: {
    padding: '1.5rem',
    borderRadius: '24px',
    transition: 'all 0.3s ease',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  statIconWrapper: {
    padding: '0.8rem',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    color: 'var(--text-dim)',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '0.2rem',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'white',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
  },
  viewAllBtn: {
    color: 'var(--accent-academician)',
    fontSize: '0.85rem',
    fontWeight: '600',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  courseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  courseCard: {
    padding: '1.25rem',
    borderRadius: '20px',
    borderLeft: '4px solid var(--accent-academician)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, background 0.2s ease',
  },
  courseMainInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseCode: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--accent-academician)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  courseName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'white',
    marginTop: '0.2rem',
  },
  courseMeta: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '0.8rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-dim)',
  },
  arrowBadge: {
    width: '44px',
    height: '44px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.3s ease',
  },
  announcementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  announcementCard: {
    padding: '1.2rem',
    borderRadius: '20px',
  },
  annType: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: 'var(--accent-academician)',
    background: 'rgba(137, 87, 229, 0.1)',
    padding: '0.2rem 0.6rem',
    borderRadius: '100px',
    textTransform: 'uppercase',
  },
  annTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    marginTop: '0.5rem',
  },
  annDate: {
    fontSize: '0.8rem',
    color: 'var(--text-dim)',
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  alertCard: {
    padding: '1.5rem',
    borderRadius: '32px',
    background: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  alertContent: {
    position: 'relative',
    zIndex: 1,
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    marginBottom: '1rem',
  },
  alertBadge: {
    fontSize: '0.65rem',
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: '1px',
  },
  alertTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'white',
    marginBottom: '0.5rem',
  },
  alertDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-dim)',
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  },
  alertBtn: {
    width: '100%',
    padding: '1rem',
    background: '#f59e0b',
    color: 'black',
    fontWeight: '800',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  alertBgIcon: {
    position: 'absolute',
    right: '-20px',
    bottom: '-20px',
  },
  quickLinksCard: {
    padding: '1.5rem',
    borderRadius: '32px',
  },
  quickTitle: {
    fontSize: '1rem',
    fontWeight: '800',
    color: 'white',
    marginBottom: '1.5rem',
  },
  linkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  linkBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: '14px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  linkArrow: {
    opacity: 0,
    transition: 'all 0.2s ease',
  }
};

export default AcademicianDashboard;

