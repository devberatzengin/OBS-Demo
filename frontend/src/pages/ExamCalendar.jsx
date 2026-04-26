import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  AlertCircle,
  FileText,
  BadgeCheck,
  Timer
} from 'lucide-react';
import StudentService from '../services/StudentService';

const ExamCalendar = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseDate = (dateVal) => {
    if (!dateVal) return new Date();
    if (Array.isArray(dateVal)) {
      // LocalDateTime as array [year, month, day, hour, minute]
      return new Date(dateVal[0], dateVal[1] - 1, dateVal[2], dateVal[3] || 0, dateVal[4] || 0);
    }
    return new Date(dateVal);
  };

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await StudentService.getExamCalendar();
        setExams(data);
      } catch (err) {
        setError('Failed to load exam calendar');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner}></div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Exam Calendar</h1>
        <p style={styles.subtitle}>Upcoming midterms, finals, and makeup exams</p>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {exams.length > 0 ? (
        <div style={styles.examsList}>
          {exams.sort((a, b) => new Date(a.examDate) - new Date(b.examDate)).map((exam, idx) => (
            <div key={idx} className="glass-card" style={styles.examCard}>
              <div style={styles.dateBadge}>
                <span style={styles.dateDay}>{new Date(exam.examDate).getDate()}</span>
                <span style={styles.dateMonth}>
                  {new Date(exam.examDate).toLocaleString('default', { month: 'short' })}
                </span>
              </div>

              <div style={styles.examInfo}>
                <div style={styles.examTypeRow}>
                  <span style={{
                    ...styles.typeBadge,
                    background: exam.examType === 'FINAL' ? 'rgba(137, 87, 229, 0.2)' : 'rgba(35, 134, 54, 0.2)',
                    color: exam.examType === 'FINAL' ? 'var(--accent-academician)' : 'var(--accent-student)'
                  }}>
                    {exam.examType}
                  </span>
                  <span style={styles.courseCode}>{exam.courseCode}</span>
                </div>
                <h3 style={styles.courseName}>{exam.courseName}</h3>
              </div>

              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <Clock size={16} color="var(--accent-student)" />
                  <span>{new Date(exam.examDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={styles.detailItem}>
                  <MapPin size={16} color="var(--accent-student)" />
                  <span>{exam.classroomCode || 'TBA'}</span>
                </div>
              </div>

              <div style={styles.examAction}>
                <Timer size={24} style={styles.timerIcon} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <BadgeCheck size={64} color="var(--accent-student)" style={{opacity: 0.3}} />
          <h2 style={styles.emptyTitle}>All Clear!</h2>
          <p style={styles.emptySub}>No upcoming exams found in your schedule.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255,255,255,0.1)',
    borderTopColor: 'var(--accent-student)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  container: {
    padding: '2rem',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '4rem'
  },
  title: {
    fontSize: '3rem',
    fontWeight: '800',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.1rem'
  },
  errorBox: {
    background: 'rgba(248, 81, 73, 0.1)',
    color: '#f85149',
    padding: '1.2rem',
    borderRadius: '16px',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    border: '1px solid rgba(248, 81, 73, 0.2)'
  },
  examsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  examCard: {
    padding: '1.5rem 2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '2.5rem',
    borderRadius: '28px',
    transition: 'var(--transition)'
  },
  dateBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    padding: '1rem',
    borderRadius: '20px',
    minWidth: '90px'
  },
  dateDay: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: 'var(--accent-student)'
  },
  dateMonth: {
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
    letterSpacing: '1px'
  },
  examInfo: {
    flex: 1
  },
  examTypeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    marginBottom: '0.5rem'
  },
  typeBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    padding: '0.3rem 0.8rem',
    borderRadius: '100px',
    letterSpacing: '0.5px'
  },
  courseCode: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    fontWeight: '600'
  },
  courseName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'white'
  },
  detailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    minWidth: '180px'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  examAction: {
    color: 'var(--text-dim)',
    opacity: 0.3
  },
  timerIcon: {
    transition: 'var(--transition)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '6rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    border: '2px dashed var(--border-glass)',
    borderRadius: '40px'
  },
  emptyTitle: {
    fontSize: '2rem',
    fontWeight: '800'
  },
  emptySub: {
    color: 'var(--text-dim)',
    fontSize: '1rem'
  }
};

export default ExamCalendar;
