import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  TrendingUp,
  Mail,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import AcademicianService from '../services/AcademicianService';
import { useNavigate } from 'react-router-dom';

const MyStudents = () => {
  const navigate = useNavigate();
  const [groupedStudents, setGroupedStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await AcademicianService.getAllStudents();
        setGroupedStudents(data);
        // Initially expand all
        const initialExpanded = {};
        Object.keys(data).forEach(course => {
          initialExpanded[course] = true;
        });
        setExpandedCourses(initialExpanded);
      } catch (err) {
        console.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleCourse = (course) => {
    setExpandedCourses(prev => ({
      ...prev,
      [course]: !prev[course]
    }));
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-academician)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Students</h1>
          <p style={styles.subtitle}>All students enrolled in your courses, grouped by course.</p>
        </div>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.groupsContainer}>
        {Object.entries(groupedStudents).map(([courseName, students]) => {
          const filteredStudents = students.filter(s => 
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.studentNumber.includes(searchTerm)
          );

          if (searchTerm && filteredStudents.length === 0) return null;

          return (
            <div key={courseName} className="glass-card" style={styles.courseGroup}>
              <div 
                style={styles.groupHeader} 
                onClick={() => toggleCourse(courseName)}
              >
                <div style={styles.groupInfo}>
                  <div style={styles.courseBadge}>COURSE</div>
                  <h3 style={styles.courseName}>{courseName}</h3>
                  <span style={styles.studentCount}>
                    <Users size={14} /> {students.length} Students
                  </span>
                </div>
                {expandedCourses[courseName] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {expandedCourses[courseName] && (
                <div style={styles.studentGrid}>
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="student-card-inner" style={styles.studentCard}>
                      <div style={styles.cardTop}>
                        <div style={styles.avatar}>
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div style={styles.nameSection}>
                          <h4 style={styles.studentName}>{student.firstName} {student.lastName}</h4>
                          <p style={styles.studentId}>#{student.studentNumber}</p>
                        </div>
                        <button style={styles.moreBtn}><MoreVertical size={16} /></button>
                      </div>
                      
                      <div style={styles.cardStats}>
                        <div style={styles.statBox}>
                          <span style={styles.statLabel}>Attendance</span>
                          <div style={styles.statProgress}>
                            <div style={{ ...styles.progressFill, width: `${student.attendanceRate}%` }} />
                          </div>
                          <span style={styles.statVal}>{Math.round(student.attendanceRate)}%</span>
                        </div>
                        <div style={styles.statBox}>
                          <span style={styles.statLabel}>GPA</span>
                          <span style={{ ...styles.statVal, color: '#10b981' }}>{student.gpa?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      <div style={styles.cardFooter}>
                        <span style={styles.deptName}>{student.departmentName}</span>
                        <button style={styles.contactBtn} title="Send Message">
                          <Mail size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    marginBottom: '2rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3rem',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: 'white',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--text-dim)',
    fontSize: '1rem',
  },
  searchWrapper: {
    position: 'relative',
    flex: '1',
    maxWidth: '400px',
  },
  searchIcon: {
    position: 'absolute',
    left: '1.2rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-dim)',
  },
  searchInput: {
    width: '100%',
    padding: '1rem 1rem 1rem 3.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  groupsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  courseGroup: {
    padding: '0',
    overflow: 'hidden',
    borderRadius: '24px',
  },
  groupHeader: {
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.02)',
    transition: 'background 0.2s',
  },
  groupInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  courseBadge: {
    fontSize: '0.65rem',
    fontWeight: '900',
    color: 'var(--accent-academician)',
    background: 'rgba(137, 87, 229, 0.1)',
    padding: '0.3rem 0.7rem',
    borderRadius: '8px',
    letterSpacing: '1px',
  },
  courseName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'white',
  },
  studentCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-dim)',
    background: 'rgba(255,255,255,0.05)',
    padding: '0.3rem 0.8rem',
    borderRadius: '100px',
  },
  studentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    padding: '2rem',
    background: 'rgba(0,0,0,0.1)',
  },
  studentCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '20px',
    padding: '1.25rem',
    transition: 'transform 0.2s ease',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.25rem',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'var(--accent-academician)',
    color: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1.1rem',
  },
  nameSection: {
    flex: 1,
  },
  studentName: {
    color: 'white',
    fontWeight: '600',
    fontSize: '1rem',
  },
  studentId: {
    color: 'var(--text-dim)',
    fontSize: '0.8rem',
  },
  moreBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    padding: '0.5rem',
  },
  cardStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.25rem',
    padding: '1rem',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '14px',
  },
  statBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    fontWeight: '500',
    width: '70px',
  },
  statProgress: {
    flex: 1,
    height: '6px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '100px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent-academician)',
    borderRadius: '100px',
  },
  statVal: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'white',
    minWidth: '35px',
    textAlign: 'right',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.5rem',
  },
  deptName: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    maxWidth: '150px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  contactBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
};

export default MyStudents;
