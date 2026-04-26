import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Search, 
  ArrowRight,
  ClipboardCheck,
  TrendingUp,
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import AcademicianService from '../services/AcademicianService';
import { useNavigate } from 'react-router-dom';

const Advisees = () => {
  const navigate = useNavigate();
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [advisees, setAdvisees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pending, performance] = await Promise.all([
          AcademicianService.getPendingEnrollments(),
          AcademicianService.getAdviseePerformance()
        ]);
        setPendingEnrollments(pending);
        setAdvisees(performance);
      } catch (err) {
        console.error('Failed to load advisee data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (enrollmentId) => {
    try {
      await AcademicianService.approveEnrollment(enrollmentId);
      setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
    } catch (err) { alert('Approval failed'); }
  };

  const handleReject = async (enrollmentId) => {
    try {
      await AcademicianService.rejectEnrollment(enrollmentId);
      setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
    } catch (err) { alert('Rejection failed'); }
  };

  const filteredAdvisees = advisees.filter(a => 
    a.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-academician)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Advising Center</h1>
        <p style={styles.pageSubtitle}>Review enrollment requests and monitor student performance.</p>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.leftCol}>
          {/* Pending Approvals */}
          <div className="glass-card" style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={styles.iconTitle}>
                <ClipboardCheck size={20} color="var(--accent-academician)" />
                <h3 style={styles.sectionTitle}>Pending Enrollments</h3>
              </div>
              <span style={styles.badge}>{pendingEnrollments.length} New</span>
            </div>

            <div style={styles.list}>
              {pendingEnrollments.length > 0 ? pendingEnrollments.map((req) => (
                <div key={req.id} style={styles.listItem} className="glass-card">
                  <div style={styles.studentInfo}>
                    <div style={styles.avatar}>{req.studentName?.[0]}</div>
                    <div>
                      <h4 style={styles.studentName}>{req.studentName}</h4>
                      <p style={styles.courseName}>{req.courseName} ({req.courseCode})</p>
                    </div>
                  </div>
                  <div style={styles.actions}>
                    <button onClick={() => handleApprove(req.id)} style={styles.approveBtn}><CheckCircle2 size={18} /></button>
                    <button onClick={() => handleReject(req.id)} style={styles.rejectBtn}><XCircle size={18} /></button>
                  </div>
                </div>
              )) : (
                <div style={styles.emptyState}>
                  <CheckCircle2 size={40} color="#10b981" style={{ opacity: 0.3 }} />
                  <p>All enrollments are up to date!</p>
                </div>
              )}
            </div>
          </div>

          {/* Advisee List */}
          <div className="glass-card" style={{ ...styles.sectionCard, marginTop: '2rem' }}>
            <div style={styles.sectionHeader}>
              <div style={styles.iconTitle}>
                <Users size={20} color="var(--accent-academician)" />
                <h3 style={styles.sectionTitle}>Your Advisees</h3>
              </div>
              <div style={styles.searchBox}>
                <Search size={16} />
                <input 
                  placeholder="Search students..." 
                  style={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.adviseeGrid}>
              {filteredAdvisees.map((student) => (
                <div key={student.id} className="glass-card" style={styles.adviseeCard}>
                  <div style={styles.adviseeMain}>
                    <div style={styles.adviseeAvatar}>{student.firstName[0]}{student.lastName[0]}</div>
                    <div>
                      <h4 style={styles.adviseeName}>{student.firstName} {student.lastName}</h4>
                      <p style={styles.adviseeGpa}>GPA: <span style={{ color: '#10b981' }}>{student.gpa || '0.00'}</span></p>
                    </div>
                  </div>
                  <button 
                    style={styles.msgBtn}
                    onClick={() => navigate('/academician/messages')}
                  >
                    <MessageSquare size={16} />
                    Message
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.rightCol}>
          <div className="glass-card" style={styles.statsCard}>
            <h3 style={styles.statsTitle}>Overview</h3>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Success Rate</div>
              <div style={styles.statValue}>84%</div>
              <div style={styles.statBar}><div style={{ ...styles.statFill, width: '84%', background: '#10b981' }} /></div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Avg Attendance</div>
              <div style={styles.statValue}>92%</div>
              <div style={styles.statBar}><div style={{ ...styles.statFill, width: '92%', background: 'var(--accent-academician)' }} /></div>
            </div>
          </div>

          <div className="glass-card" style={styles.alertBox}>
            <AlertCircle size={20} color="#f59e0b" />
            <p style={styles.alertText}>3 students have a GPA below 2.0. Consider reaching out.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '2.5rem' },
  pageTitle: { fontSize: '2.5rem', fontWeight: '800', color: 'white' },
  pageSubtitle: { color: 'var(--text-dim)', marginTop: '0.5rem' },
  mainGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' },
  sectionCard: { padding: '1.5rem', borderRadius: '32px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  iconTitle: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: '700', color: 'white' },
  badge: { background: 'rgba(137, 87, 229, 0.1)', color: 'var(--accent-academician)', padding: '0.2rem 0.8rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '800' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  listItem: { padding: '1rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  studentInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: { width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800' },
  studentName: { fontSize: '1rem', fontWeight: '700', color: 'white' },
  courseName: { fontSize: '0.8rem', color: 'var(--text-dim)' },
  actions: { display: 'flex', gap: '0.5rem' },
  approveBtn: { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer' },
  rejectBtn: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '12px', color: 'var(--text-dim)' },
  searchInput: { background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem' },
  adviseeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' },
  adviseeCard: { padding: '1.2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  adviseeMain: { display: 'flex', alignItems: 'center', gap: '1rem' },
  adviseeAvatar: { width: '44px', height: '44px', background: 'rgba(137, 87, 229, 0.1)', color: 'var(--accent-academician)', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800' },
  adviseeName: { fontSize: '1rem', fontWeight: '700', color: 'white' },
  adviseeGpa: { fontSize: '0.8rem', color: 'var(--text-dim)' },
  msgBtn: { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', color: 'white', padding: '0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' },
  statsCard: { padding: '1.5rem', borderRadius: '32px' },
  statsTitle: { fontSize: '1.1rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem' },
  statItem: { marginBottom: '1.5rem' },
  statLabel: { fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.4rem' },
  statValue: { fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' },
  statBar: { height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: '100px' },
  alertBox: { marginTop: '1.5rem', padding: '1.2rem', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', display: 'flex', gap: '0.8rem', alignItems: 'center' },
  alertText: { fontSize: '0.85rem', color: '#f59e0b', lineHeight: '1.4' }
};

export default Advisees;
