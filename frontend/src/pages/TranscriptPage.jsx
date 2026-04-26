import React, { useState, useEffect } from 'react';
import TranscriptService from '../services/TranscriptService';
import {
  FileText,
  Trophy,
  Award,
  Hash,
  Loader2,
  ChevronDown,
  ChevronUp,
  History,
  GraduationCap
} from 'lucide-react';

const TranscriptPage = () => {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSemesters, setExpandedSemesters] = useState({});

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const data = await TranscriptService.getTranscript();
        setTranscript(data);

        // Find current semester to expand it
        const current = data.semesters.find(s => s.active);
        if (current) {
          setExpandedSemesters({ [current.semesterName]: true });
        } else if (data.semesters.length > 0) {
          setExpandedSemesters({ [data.semesters[0].semesterName]: true });
        }
      } catch (err) {
        setError('Failed to fetch transcript data.');
      } finally {
        setLoading(false);
      }
    };
    fetchTranscript();
  }, []);

  const toggleSemester = (name) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  if (loading) return (
    <div style={styles.center}>
      <Loader2 className="animate-spin" size={40} color="var(--accent-student)" />
    </div>
  );

  if (error) return <div style={styles.center}><p style={{ color: '#f85149' }}>{error}</p></div>;

  const currentSemester = transcript.semesters.find(s => s.active);
  const pastSemesters = transcript.semesters.filter(s => !s.active);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTitleSection}>
          <div style={styles.badge}>Academic Record</div>
          <h1 style={styles.title}>Official Transcript</h1>
          <p style={styles.subtitle}>Verified digital record of {transcript.studentName}</p>
        </div>

        <div className="glass-card" style={styles.gpaCard}>
          <div style={styles.gpaIconWrapper}>
            <Trophy size={24} color="var(--accent-student)" />
          </div>
          <div>
            <p style={styles.gpaLabel}>Cumulative GPA</p>
            <p style={styles.gpaValue}>{transcript.cumulativeGpa?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <div className="glass-card" style={styles.statItem}>
          <Hash size={20} color="var(--accent-student)" />
          <div style={styles.statInfo}>
            <span style={styles.statLabelMini}>Total Credits</span>
            <span style={styles.statValueMini}>{transcript.semesters.reduce((acc, s) => acc + s.courses.reduce((cAcc, c) => cAcc + (c.credits || 0), 0), 0)}</span>
          </div>
        </div>
        <div className="glass-card" style={styles.statItem}>
          <Award size={20} color="var(--accent-student)" />
          <div style={styles.statInfo}>
            <span style={styles.statLabelMini}>Total AKTS</span>
            <span style={styles.statValueMini}>{transcript.semesters.reduce((acc, s) => acc + s.courses.reduce((cAcc, c) => cAcc + (c.akts || 0), 0), 0)}</span>
          </div>
        </div>
        <div className="glass-card" style={styles.statItem}>
          <GraduationCap size={20} color="var(--accent-student)" />
          <div style={styles.statInfo}>
            <span style={styles.statLabelMini}>Department</span>
            <span style={styles.statValueMini}>{transcript.departmentName}</span>
          </div>
        </div>
      </div>

      {/* Current Semester Section */}
      {currentSemester && (
        <section style={styles.section}>
          <div style={styles.sectionHeaderLine}>
            <div style={styles.sectionTitleWrapper}>
              <div style={styles.pulseDot} />
              <h2 style={styles.sectionTitle}>Current Term</h2>
            </div>
            <div style={styles.divider} />
          </div>

          <div className="glass-card" style={{ ...styles.semesterCard, ...styles.currentCard }}>
            <div style={styles.semesterHeader} onClick={() => toggleSemester(currentSemester.semesterName)}>
              <div style={styles.semesterInfo}>
                <FileText size={20} color="var(--accent-student)" />
                <div>
                  <h3 style={styles.semesterName}>{currentSemester.semesterName}</h3>
                  <span style={styles.currentBadge}>In Progress</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={styles.semGpaWrapper}>
                  <span style={styles.semGpaLabel}>Term GPA</span>
                  <span style={styles.semGpaValue}>{currentSemester.semesterGpa.toFixed(2)}</span>
                </div>
                {expandedSemesters[currentSemester.semesterName] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {expandedSemesters[currentSemester.semesterName] && (
              <div style={styles.courseTableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Code</th>
                      <th style={styles.th}>Course Name</th>
                      <th style={styles.th}>Credit</th>
                      <th style={styles.th}>AKTS</th>
                      <th style={styles.th}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSemester.courses.map((course, cIdx) => (
                      <tr key={cIdx} style={styles.tr}>
                        <td style={styles.tdCode}>{course.courseCode}</td>
                        <td style={styles.tdName}>{course.courseName}</td>
                        <td style={styles.td}>{course.credits}</td>
                        <td style={styles.td}>{course.akts}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.gradeBadge,
                            color: course.grade.startsWith('F') ? '#f85149' : 'var(--accent-student)',
                            background: course.grade.startsWith('F') ? 'rgba(248, 81, 73, 0.1)' : 'rgba(35, 134, 54, 0.1)'
                          }}>
                            {course.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Past Semesters Section */}
      {pastSemesters.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeaderLine}>
            <div style={styles.sectionTitleWrapper}>
              <History size={20} color="var(--text-dim)" />
              <h2 style={{ ...styles.sectionTitle, color: 'var(--text-dim)' }}>Past Academic History</h2>
            </div>
            <div style={styles.divider} />
          </div>

          <div style={styles.semesterList}>
            {pastSemesters.map((sem, idx) => (
              <div key={idx} className="glass-card" style={styles.semesterCard}>
                <div style={styles.semesterHeader} onClick={() => toggleSemester(sem.semesterName)}>
                  <div style={styles.semesterInfo}>
                    <FileText size={20} color="rgba(255,255,255,0.3)" />
                    <h3 style={styles.semesterName}>{sem.semesterName}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={styles.semGpaWrapper}>
                      <span style={styles.semGpaLabel}>Term GPA</span>
                      <span style={{ ...styles.semGpaValue, color: 'white' }}>{sem.semesterGpa.toFixed(2)}</span>
                    </div>
                    {expandedSemesters[sem.semesterName] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {expandedSemesters[sem.semesterName] && (
                  <div style={styles.courseTableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Code</th>
                          <th style={styles.th}>Course Name</th>
                          <th style={styles.th}>Credit</th>
                          <th style={styles.th}>AKTS</th>
                          <th style={styles.th}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.courses.map((course, cIdx) => (
                          <tr key={cIdx} style={styles.tr}>
                            <td style={styles.tdCode}>{course.courseCode}</td>
                            <td style={styles.tdName}>{course.courseName}</td>
                            <td style={styles.td}>{course.credits}</td>
                            <td style={styles.td}>{course.akts}</td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.gradeBadge,
                                color: course.grade.startsWith('F') ? '#f85149' : 'var(--accent-student)',
                                background: course.grade.startsWith('F') ? 'rgba(248, 81, 73, 0.1)' : 'rgba(35, 134, 54, 0.1)'
                              }}>
                                {course.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3rem',
    paddingBottom: '4rem'
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
    alignItems: 'flex-start',
  },
  badge: {
    background: 'rgba(35, 134, 54, 0.1)',
    color: 'var(--accent-student)',
    padding: '0.4rem 1rem',
    borderRadius: '100px',
    fontSize: '0.75rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    width: 'fit-content',
    marginBottom: '0.8rem'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    letterSpacing: '-1px'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.1rem'
  },
  gpaCard: {
    padding: '1.2rem 2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    borderRadius: '24px',
    border: '1px solid var(--accent-student)',
    boxShadow: '0 0 30px rgba(35, 134, 54, 0.05)',
  },
  gpaIconWrapper: {
    background: 'rgba(35, 134, 54, 0.1)',
    padding: '0.8rem',
    borderRadius: '16px'
  },
  gpaLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: '0.5px'
  },
  gpaValue: {
    fontSize: '1.8rem',
    fontWeight: '900',
    color: 'var(--accent-student)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  },
  statItem: {
    padding: '1.2rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
    borderRadius: '20px',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  statLabelMini: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  statValueMini: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'white'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  sectionHeaderLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  sectionTitleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    whiteSpace: 'nowrap'
  },
  sectionTitle: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'white'
  },
  divider: {
    flex: 1,
    height: '1px',
    background: 'linear-gradient(90deg, var(--border-glass), transparent)'
  },
  pulseDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--accent-student)',
    boxShadow: '0 0 10px var(--accent-student)',
    animation: 'pulse 2s infinite'
  },
  semesterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  semesterCard: {
    padding: '0',
    overflow: 'hidden',
    transition: 'var(--transition)',
    '&:hover': {
      borderColor: 'rgba(255,255,255,0.1)'
    }
  },
  currentCard: {
    borderColor: 'rgba(35, 134, 54, 0.3)',
    background: 'rgba(35, 134, 54, 0.02)'
  },
  semesterHeader: {
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.01)'
  },
  semesterInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
  },
  semesterName: {
    fontSize: '1.2rem',
    fontWeight: '700',
  },
  currentBadge: {
    fontSize: '0.65rem',
    fontWeight: '900',
    color: 'var(--accent-student)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  semGpaWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  semGpaLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  semGpaValue: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: 'var(--accent-student)'
  },
  courseTableWrapper: {
    padding: '0 2rem 2rem 2rem',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '1rem',
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    fontWeight: '800',
    borderBottom: '1px solid var(--border-glass)',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    '&:hover': {
      background: 'rgba(255,255,255,0.01)'
    }
  },
  td: {
    padding: '1.2rem 1rem',
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.8)'
  },
  tdCode: {
    padding: '1.2rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '800',
    color: 'var(--accent-student)',
  },
  tdName: {
    padding: '1.2rem 1rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white'
  },
  gradeBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '900',
  }
};

export default TranscriptPage;

