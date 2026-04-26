import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Loader2,
  BookOpen
} from 'lucide-react';
import StudentService from '../services/StudentService';

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await StudentService.getAttendance();
        setAttendance(data);
      } catch (err) {
        setError('Failed to fetch attendance data');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) return (
    <div style={styles.center}>
      <Loader2 className="animate-spin" size={40} color="var(--accent-student)" />
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Attendance Report</h1>
          <p style={styles.subtitle}>Track your class participation and limits</p>
        </div>
      </header>

      <div style={styles.grid}>
        {attendance.map((item, idx) => {
          const percentage = item.attendancePercentage;
          const isCritical = item.isLimitExceeded;

          return (
            <div key={idx} className="glass-card" style={{
              ...styles.card,
              borderLeft: `4px solid ${isCritical ? '#f85149' : 'var(--accent-student)'}`
            }}>
              <div style={styles.cardHeader}>
                <div style={styles.courseInfo}>
                  <BookOpen size={20} color="var(--accent-student)" />
                  <h3 style={styles.courseName}>{item.courseName}</h3>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  background: isCritical ? 'rgba(248, 81, 73, 0.1)' : 'rgba(35, 134, 54, 0.1)',
                  color: isCritical ? '#f85149' : 'var(--accent-student)'
                }}>
                  {isCritical ? 'Critical' : 'Good'}
                </span>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statBox}>
                  <p style={styles.statLabel}>Present</p>
                  <p style={styles.statValue}>{item.presentHours}</p>
                </div>
                <div style={styles.statBox}>
                  <p style={styles.statLabel}>Absent</p>
                  <p style={{...styles.statValue, color: isCritical ? '#f85149' : 'inherit'}}>{item.absentHours}</p>
                </div>
                <div style={styles.statBox}>
                  <p style={styles.statLabel}>Attendance %</p>
                  <p style={styles.statValue}>{Math.round(percentage)}%</p>
                </div>
              </div>

              <div style={styles.progressBarBg}>
                <div style={{
                  ...styles.progressBarFill,
                  width: `${percentage}%`,
                  background: isCritical ? '#f85149' : 'var(--accent-student)'
                }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {attendance.length === 0 && (
        <div style={styles.emptyState}>
          <ClipboardCheck size={48} color="var(--text-dim)" />
          <p>No attendance records found for this semester.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  },
  header: {
    marginBottom: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
  },
  subtitle: {
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
  },
  courseName: {
    fontSize: '1.1rem',
    fontWeight: '700',
  },
  statusBadge: {
    padding: '0.3rem 0.8rem',
    borderRadius: '100px',
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    textAlign: 'center',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    marginBottom: '0.3rem',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '1.2rem',
    fontWeight: '800',
  },
  progressBarBg: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.4s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '5rem',
    color: 'var(--text-dim)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  }
};

export default AttendancePage;
