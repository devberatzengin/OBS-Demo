import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users
} from 'lucide-react';
import AcademicianService from '../services/AcademicianService';
import { useNavigate } from 'react-router-dom';

const AcademicianSchedule = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await AcademicianService.getMySchedule();
        // Convert array to day-time map
        const map = {};
        data.forEach(item => {
          // Normalize day from MONDAY to Monday
          const dayName = item.dayOfWeek.charAt(0) + item.dayOfWeek.slice(1).toLowerCase();

          // Use only the hour part for slot mapping (e.g., 09:15 -> 09:00)
          const hourPart = item.startTime.substring(0, 2);
          const timeLabel = `${hourPart}:00`;

          // Calculate duration in hours
          const startH = parseInt(item.startTime.substring(0, 2));
          const endH = parseInt(item.endTime.substring(0, 2));
          const duration = endH - startH || 1; // Default to 1 hour if calculation fails

          if (!map[dayName]) map[dayName] = {};
          map[dayName][timeLabel] = {
            ...item,
            classroom: item.classroomName,
            displayTime: `${item.startTime.substring(0, 5)} - ${item.endTime.substring(0, 5)}`,
            duration: duration
          };
        });
        setSchedule(map);
      } catch (err) {
        console.error('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  // Calculate current time line position
  const getTimeLinePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // Schedule range 09:00 - 18:00
    if (hours < 9 || hours >= 18) return null;

    const offsetHours = hours - 9;
    const hourHeight = 140; // from styles
    const headerOffset = 60; // Approximate header height (Time/Monday etc)

    return headerOffset + (offsetHours * hourHeight) + (minutes / 60 * hourHeight);
  };

  const timeLinePos = getTimeLinePosition();
  const currentDayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-academician)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleArea}>
          <h1 style={styles.pageTitle}>Weekly Teaching Schedule</h1>
          <p style={styles.pageSubtitle}>Monitor your classes and classroom assignments.</p>
        </div>
        <div className="glass-card" style={styles.currentDay}>
          <CalendarIcon size={20} color="var(--accent-academician)" />
          <span style={styles.todayText}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="glass-card" style={styles.scheduleWrapper}>
        <div style={{ ...styles.gridMain, position: 'relative' }}>
          {/* Time Indicator Line */}
          {timeLinePos !== null && (
            <div style={{
              ...styles.timeIndicatorLine,
              top: `${timeLinePos}px`
            }}>
              <div style={styles.timeIndicatorDot} />
              <div style={styles.timeIndicatorTime}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}

          {/* Header Row */}
          <div style={styles.timeColHeader}>Time</div>
          {days.map(day => (
            <div key={day} style={{
              ...styles.dayColHeader,
              color: day === currentDayName ? 'var(--accent-academician)' : 'white'
            }}>
              {day}
            </div>
          ))}

          {/* Schedule Body */}
          {times.map((time, timeIdx) => (
            <React.Fragment key={time}>
              <div style={styles.timeLabel}>{time}</div>
              {days.map(day => {
                const session = schedule[day]?.[time];
                return (
                  <div key={`${day}-${time}`} style={{
                    ...styles.cell,
                    borderTop: timeIdx === 0 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                    background: day === currentDayName ? 'rgba(137, 87, 229, 0.1)' : 'transparent'
                  }}>
                    {session ? (
                      <div
                        style={{
                          ...styles.courseBlock,
                          height: `calc(${session.duration} * 140px - 1rem)`,
                          background: 'linear-gradient(165deg, rgba(137, 87, 229, 0.28) 0%, rgba(137, 87, 229, 0.12) 100%)',
                          border: '1px solid rgba(137, 87, 229, 0.4)',
                          borderLeft: '6px solid var(--accent-academician)',
                          justifyContent: 'flex-start',
                          padding: '1rem 1.2rem'
                        }}
                        onClick={() => navigate(`/academician/courses/${session.courseId}`)}
                      >
                        <div style={styles.courseHeader}>
                          <span style={{
                            ...styles.courseCode,
                            fontSize: session.duration > 1 ? '0.75rem' : '0.65rem',
                            padding: session.duration > 1 ? '0.2rem 0.5rem' : '0.15rem 0.4rem'
                          }}>{session.courseCode}</span>
                          <span style={styles.studentCount}>
                            <Users size={session.duration > 1 ? 12 : 10} />
                            {session.studentCount}
                          </span>
                        </div>
                        <h4 style={{
                          ...styles.courseName,
                          fontSize: session.duration > 1 ? '1.1rem' : '0.85rem',
                          margin: session.duration > 1 ? '0.4rem 0' : '0.2rem 0'
                        }}>{session.courseName}</h4>

                        <div style={{
                          display: 'flex',
                          flexDirection: session.duration > 1 ? 'column' : 'row',
                          gap: session.duration > 1 ? '0.4rem' : '0.8rem',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{
                            ...styles.courseMeta,
                            fontSize: session.duration > 1 ? '0.85rem' : '0.7rem',
                          }}>
                            <Clock size={session.duration > 1 ? 14 : 12} />
                            <span>{session.displayTime}</span>
                          </div>
                          <div style={{
                            ...styles.courseMeta,
                            fontSize: session.duration > 1 ? '0.85rem' : '0.7rem',
                          }}>
                            <MapPin size={session.duration > 1 ? 14 : 12} />
                            <span>{session.classroom}</span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' },
  titleArea: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  pageTitle: { fontSize: '2.5rem', fontWeight: '800', color: 'white' },
  pageSubtitle: { color: 'var(--text-dim)' },
  currentDay: { padding: '0.8rem 1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '700', color: 'white' },
  scheduleWrapper: {
    borderRadius: '32px',
    overflowX: 'auto',
    padding: '1.5rem',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)'
  },
  gridMain: {
    display: 'grid',
    gridTemplateColumns: '80px repeat(5, minmax(180px, 1fr))',
    gap: '0 1rem', // 0 row gap, 1rem column gap
    minWidth: '1000px'
  },
  timeColHeader: {
    color: 'var(--text-dim)',
    fontWeight: '700',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid var(--border-glass)',
    textAlign: 'center'
  },
  dayColHeader: {
    color: 'white',
    fontWeight: '800',
    fontSize: '1rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid var(--border-glass)',
    textAlign: 'center'
  },
  timeLabel: {
    height: '140px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'var(--text-dim)',
    fontWeight: '700',
    fontSize: '0.9rem',
    borderBottom: '1px solid rgba(255,255,255,0.03)'
  },
  cell: {
    height: '140px',
    padding: '0.5rem',
    position: 'relative',
    borderBottom: '1px solid rgba(255,255,255,0.03)'
  },
  courseBlock: {
    position: 'absolute',
    top: '0.5rem',
    left: '0.5rem',
    right: '0.5rem',
    zIndex: 10,
    borderRadius: '20px',
    backdropFilter: 'blur(16px)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    overflow: 'hidden'
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  courseCode: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: 'var(--accent-academician)',
    letterSpacing: '1px',
    background: 'rgba(137, 87, 229, 0.1)',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px'
  },
  studentCount: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontWeight: '600'
  },
  courseName: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'white',
    lineHeight: '1.3',
    margin: '0.5rem 0'
  },
  courseMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  timeIndicatorLine: {
    position: 'absolute',
    left: '0',
    right: '0',
    height: '2px',
    background: 'var(--accent-academician)',
    zIndex: 100,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 0 10px rgba(137, 87, 229, 0.5)'
  },
  timeIndicatorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'var(--accent-academician)',
    position: 'absolute',
    left: '74px',
    boxShadow: '0 0 15px var(--accent-academician)',
    animation: 'pulse 2s infinite'
  },
  timeIndicatorTime: {
    position: 'absolute',
    left: '10px',
    fontSize: '0.65rem',
    fontWeight: '800',
    color: 'var(--accent-academician)',
    background: 'rgba(0,0,0,0.8)',
    padding: '2px 4px',
    borderRadius: '4px',
    transform: 'translateY(-50%)',
    top: '50%'
  }
};

export default AcademicianSchedule;
