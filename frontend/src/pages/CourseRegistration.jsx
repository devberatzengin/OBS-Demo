import React, { useState, useEffect } from 'react';
import CourseService from '../services/CourseService';
import { 
  BookOpen, 
  CheckCircle, 
  Plus, 
  Minus, 
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';

const CourseRegistration = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [semesterName, setSemesterName] = useState('Loading...');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await CourseService.getAvailableCourses();
        setCourses(data);
        // Pre-select mandatory courses (FF) that are not yet registered
        const mandatoryToSelect = data.filter(c => c.mandatory && !c.registered);
        setSelectedCourses(mandatoryToSelect);
        setSemesterName('Current Active Semester');
      } catch (err) {
        setError('Failed to fetch courses. Backend might still be starting.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const toggleCourse = (course) => {
    if (course.registered) return; 

    if (selectedCourses.find(c => c.id === course.id)) {
      // Don't allow deselecting mandatory courses if they are mandatory
      if (course.mandatory) {
        alert("This course is mandatory because you failed it previously.");
        return;
      }
      setSelectedCourses(selectedCourses.filter(c => c.id !== course.id));
    } else {
      // Allow adding even if it exceeds limit (UI will handle validation)
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const handleRegister = async () => {
    const newCourses = selectedCourses.filter(c => !c.registered);
    if (newCourses.length === 0) return;
    
    setSubmitting(true);
    try {
      for (const course of newCourses) {
        await CourseService.registerCourse(course.id);
      }
      alert("Registration successful!");
      setSelectedCourses([]);
      // Refresh courses
      const data = await CourseService.getAvailableCourses();
      setCourses(data);
    } catch (err) {
      const msg = err.response?.data?.description || err.response?.data?.message || "Registration failed. Check AKTS limits or conflicts.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalRegisteredAkts = courses.filter(c => c.registered).reduce((sum, c) => sum + c.akts, 0);
  const totalSelectedAkts = selectedCourses.reduce((sum, c) => sum + c.akts, 0);
  const totalAkts = totalRegisteredAkts + totalSelectedAkts;

  if (loading) return (
    <div style={styles.center}>
      <Loader2 className="animate-spin" size={40} color="var(--accent-student)" />
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Course Registration</h1>
          <p style={styles.subtitle}>Select your courses for {semesterName}</p>
        </div>
        <div className="glass-card" style={{
          ...styles.aktsSummary,
          borderColor: totalAkts > 30 ? '#f85149' : 'var(--border-glass)',
          boxShadow: totalAkts > 30 ? '0 0 15px rgba(248, 81, 73, 0.2)' : 'none'
        }}>
          <div style={styles.aktsProgressBg}>
            <div style={{ 
              ...styles.aktsProgressFill, 
              width: `${Math.min((totalAkts / 30) * 100, 100)}%`,
              background: totalAkts > 30 ? '#f85149' : 'var(--accent-student)'
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Enrolled: {totalRegisteredAkts} | Selected: {totalSelectedAkts}
            </span>
            <span style={{...styles.aktsText, color: totalAkts > 30 ? '#f85149' : 'inherit'}}>{totalAkts} / 30 AKTS</span>
          </div>
        </div>
      </header>

      <div style={styles.contentGrid}>
        <div style={styles.courseGrid}>
          {courses.map((course) => {
            const isSelected = selectedCourses.find(c => c.id === course.id);
            const isRegistered = course.registered;
            const isMandatory = course.mandatory;
            
            return (
              <div 
                key={course.id} 
                className={`glass-card ${isMandatory && !isRegistered ? 'mandatory-pulse' : ''}`}
                onClick={() => !isRegistered && toggleCourse(course)}
                style={{ 
                  ...styles.courseCard,
                  borderColor: isRegistered ? (course.status === 'PENDING' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.05)') : (isSelected ? 'var(--accent-student)' : (isMandatory ? '#f59e0b50' : 'var(--border-glass)')),
                  background: isRegistered ? (course.status === 'PENDING' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(0,0,0,0.2)') : (isSelected ? 'rgba(35, 134, 54, 0.1)' : 'rgba(255, 255, 255, 0.02)'),
                  opacity: isRegistered ? 0.6 : 1,
                  cursor: isRegistered ? 'default' : 'pointer',
                  transform: isSelected && !isRegistered ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected && !isRegistered ? '0 0 20px rgba(35, 134, 54, 0.2)' : 'none'
                }}
              >
                <div style={styles.courseHeader}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ 
                        ...styles.courseCode, 
                        background: isRegistered ? 'rgba(255,255,255,0.05)' : (isMandatory ? 'rgba(245, 158, 11, 0.1)' : 'rgba(35, 134, 54, 0.1)'),
                        color: isRegistered ? 'var(--text-dim)' : (isMandatory ? '#f59e0b' : 'var(--accent-student)')
                    }}>{course.code}</span>
                    {isMandatory && !isRegistered && <span style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: '800' }}>REQUIRED (FAILED)</span>}
                  </div>
                  <span style={styles.aktsBadge}>{course.akts} AKTS</span>
                </div>
                <h3 style={{...styles.courseName, color: isRegistered ? 'var(--text-dim)' : 'inherit'}}>{course.name}</h3>
                <p style={{fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem'}}>{course.instructorName}</p>
                <div style={styles.courseFooter}>
                  <span style={styles.instructor}>{course.credits} Credits</span>
                  {isRegistered ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: course.status === 'PENDING' ? '#f59e0b' : '#10b981', fontSize: '0.7rem', fontWeight: '700' }}>
                      {course.status === 'PENDING' ? <AlertCircle size={16} /> : <CheckCircle size={16} />} 
                      {course.status === 'PENDING' ? 'PENDING' : 'ENROLLED'}
                    </div>
                  ) : (
                    <div style={{ ...styles.selectionIcon, background: isSelected ? 'var(--accent-student)' : 'rgba(255, 255, 255, 0.1)' }}>
                      {isSelected ? <Minus size={16} color="white" /> : <Plus size={16} color="white" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-card" style={styles.registrationPanel}>
          <div style={styles.panelHeader}>
            <CheckCircle size={20} color="var(--accent-student)" />
            <h2 style={styles.panelTitle}>Selected Courses</h2>
          </div>
          <div style={styles.selectedList}>
            {selectedCourses.length > 0 ? selectedCourses.map(course => (
              <div key={course.id} style={styles.selectedItem}>
                <span style={styles.selectedName}>{course.name}</span>
                <span style={styles.selectedAkts}>{course.akts} AKTS</span>
              </div>
            )) : (
              <div style={styles.emptyState}>
                <Info size={24} color="var(--text-dim)" />
                <p>No courses selected yet.</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleRegister}
            disabled={selectedCourses.length === 0 || totalAkts > 30 || submitting}
            style={{ 
              ...styles.registerBtn,
              background: totalAkts > 30 ? 'var(--bg-secondary)' : 'var(--accent-student)',
              opacity: (selectedCourses.length === 0 || totalAkts > 30 || submitting) ? 0.5 : 1,
              cursor: (selectedCourses.length === 0 || totalAkts > 30 || submitting) ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : (totalAkts > 30 ? "AKTS Limit Exceeded" : "Confirm Registration")}
          </button>
        </div>
      </div>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
  },
  subtitle: {
    color: 'var(--text-secondary)',
  },
  aktsSummary: {
    padding: '1rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    minWidth: '200px',
  },
  aktsProgressBg: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  aktsProgressFill: {
    height: '100%',
    background: 'var(--accent-student)',
    transition: 'width 0.3s ease',
  },
  aktsText: {
    fontSize: '0.9rem',
    fontWeight: '700',
    textAlign: 'right',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '2rem',
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  courseCard: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid var(--border-glass)',
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseCode: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: 'var(--accent-student)',
    background: 'rgba(35, 134, 54, 0.1)',
    padding: '0.3rem 0.6rem',
    borderRadius: '6px',
  },
  aktsBadge: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    fontWeight: '600',
  },
  courseName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    lineHeight: '1.3',
  },
  courseFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  instructor: {
    fontSize: '0.85rem',
    color: 'var(--text-dim)',
  },
  selectionIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  registrationPanel: {
    padding: '1.8rem',
    height: 'fit-content',
    position: 'sticky',
    top: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '1rem',
  },
  panelTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
  },
  selectedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  selectedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.8rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
  },
  selectedName: {
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  selectedAkts: {
    fontSize: '0.8rem',
    color: 'var(--accent-student)',
    fontWeight: '700',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '3rem 0',
    color: 'var(--text-dim)',
  },
  registerBtn: {
    width: '100%',
    padding: '1rem',
    background: 'var(--accent-student)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 0 20px rgba(35, 134, 54, 0.2)',
  }
};

export default CourseRegistration;
