import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  BookOpen
} from 'lucide-react';
import StudentService from '../services/StudentService';

const WeeklySchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await StudentService.getWeeklySchedule();
        setSchedule(data);
      } catch (err) {
        setError('Failed to load weekly schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const getDaySchedule = (day) => {
    return schedule.filter(item => item.dayOfWeek === day.toUpperCase()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner}></div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Weekly Schedule</h1>
        <p style={styles.subtitle}>Your academic timetable for the current semester</p>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <Calendar size={20} /> {error}
        </div>
      )}

      <div style={styles.scheduleGrid}>
        {days.map((day) => {
          const dayLessons = getDaySchedule(day);
          
          return (
            <div key={day} style={styles.dayColumn}>
              <div style={styles.dayHeader}>
                <span style={styles.dayName}>{day}</span>
              </div>
              
              <div style={styles.lessonList}>
                {dayLessons.length > 0 ? (
                  dayLessons.map((lesson, idx) => (
                    <div key={idx} className="glass-card" style={styles.lessonCard}>
                      <div style={styles.lessonTop}>
                        <div style={styles.lessonIcon}><BookOpen size={16} /></div>
                        <span style={styles.courseCode}>{lesson.courseCode}</span>
                      </div>
                      
                      <h3 style={styles.courseName}>{lesson.courseName}</h3>
                      
                      <div style={styles.details}>
                        <div style={styles.detailItem}><Clock size={14} /> {lesson.startTime} - {lesson.endTime}</div>
                        <div style={styles.detailItem}><MapPin size={14} /> {lesson.classroomCode || 'TBA'}</div>
                        <div style={styles.detailItem}><User size={14} /> {lesson.instructorName}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyDay}>
                    <Calendar size={32} style={{opacity: 0.2}} />
                    <p style={styles.emptyText}>No classes</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '3rem'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: 'var(--text-secondary)'
  },
  errorBox: {
    background: 'rgba(248, 81, 73, 0.1)',
    color: '#f85149',
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    border: '1px solid rgba(248, 81, 73, 0.2)'
  },
  scheduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '1.5rem',
    minHeight: '600px'
  },
  dayColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  dayHeader: {
    background: 'rgba(35, 134, 54, 0.1)',
    padding: '0.8rem',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid rgba(35, 134, 54, 0.2)'
  },
  dayName: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--accent-student)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  lessonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1
  },
  lessonCard: {
    padding: '1.2rem',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    cursor: 'default'
  },
  lessonTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  lessonIcon: {
    width: '32px',
    height: '32px',
    background: 'rgba(35, 134, 54, 0.15)',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'var(--accent-student)'
  },
  courseCode: {
    fontSize: '0.7rem',
    fontWeight: '800',
    background: 'rgba(255,255,255,0.05)',
    padding: '0.2rem 0.6rem',
    borderRadius: '100px',
    color: 'var(--text-secondary)'
  },
  courseName: {
    fontSize: '0.95rem',
    fontWeight: '700',
    lineHeight: '1.3'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: 'var(--text-dim)'
  },
  emptyDay: {
    flex: 1,
    border: '2px dashed var(--border-glass)',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-dim)'
  },
  emptyText: {
    fontSize: '0.75rem'
  }
};

export default WeeklySchedule;
