import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  ClipboardCheck, 
  GraduationCap, 
  Settings, 
  ChevronLeft,
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Save,
  Trash2,
  Edit2
} from 'lucide-react';
import AcademicianService from '../services/AcademicianService';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'students');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceData, setAnnounceData] = useState({ title: '', content: '' });
  const [statusModal, setStatusModal] = useState({ show: false, type: 'error', title: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, studentsData, examsData] = await Promise.all([
          AcademicianService.getMyCourses(),
          AcademicianService.getCourseStudents(courseId),
          AcademicianService.getCourseExams(courseId)
        ]);
        setCourse(coursesData.find(c => c.id === parseInt(courseId)));
        setStudents(studentsData);
        setExams(examsData);
      } catch (err) {
        console.error('Failed to load course detail data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const refreshStudents = async () => {
    try {
      const studentsData = await AcademicianService.getCourseStudents(courseId);
      setStudents(studentsData);
    } catch (err) { console.error('Failed to refresh students'); }
  };

  const filteredStudents = students.filter(s => 
    s.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentNumber?.includes(searchTerm)
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-academician)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerSection}>
        <button 
          onClick={() => navigate('/academician')}
          style={styles.backBtn}
          className="group"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.courseBadgeWrapper}>
              <span style={styles.courseBadge}>{course?.code}</span>
            </div>
            <h1 style={styles.pageTitle}>{course?.name || 'Course Management'}</h1>
            <p style={styles.pageSubtitle}>Manage your students, exams, and grades in one place.</p>
          </div>
          <div style={styles.headerActions}>
            <button 
              className="glass-card" 
              style={styles.settingsBtn}
              onClick={() => alert('Course Settings:\n1. Update Syllabus\n2. Change Quota\n3. Archive Course')}
            >
              <Settings size={20} />
            </button>
            <button 
              style={styles.actionBtn}
              className="btn-active-scale"
              onClick={() => setShowAnnounceModal(true)}
            >
              Post Announcement
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card" style={styles.tabsContainer}>
        {[
          { id: 'students', label: 'Students', icon: <Users size={18} /> },
          { id: 'exams', label: 'Exams', icon: <Calendar size={18} /> },
          { id: 'grading', label: 'Grading', icon: <GraduationCap size={18} /> },
          { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabBtn,
              background: activeTab === tab.id ? 'var(--accent-academician)' : 'transparent',
              color: activeTab === tab.id ? 'black' : 'var(--text-dim)',
              boxShadow: activeTab === tab.id ? '0 4px 15px rgba(137, 87, 229, 0.3)' : 'none'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'students' && (
          <StudentsTab filteredStudents={filteredStudents} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        )}
        {activeTab === 'exams' && <ExamsTab courseId={courseId} setStatusModal={setStatusModal} />}
        {activeTab === 'grading' && <GradingTab courseId={courseId} students={students} onSave={refreshStudents} setStatusModal={setStatusModal} />}
        {activeTab === 'attendance' && <AttendanceTab courseId={courseId} students={students} onSave={refreshStudents} setStatusModal={setStatusModal} />}
      </div>

      {/* Announcement Modal */}
      {showAnnounceModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Post Announcement</h3>
              <button onClick={() => setShowAnnounceModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <XCircle size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Announcement Title" 
                value={announceData.title}
                onChange={e => setAnnounceData({...announceData, title: e.target.value})}
                style={styles.modalInput}
              />
              <textarea 
                placeholder="Announcement Content..." 
                value={announceData.content}
                onChange={e => setAnnounceData({...announceData, content: e.target.value})}
                style={{ ...styles.modalInput, minHeight: '120px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={() => setShowAnnounceModal(false)}
                style={{ ...styles.actionBtn, background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
              >
                Cancel
              </button>
              <button 
                className="btn-active-scale"
                onClick={async (e) => {
                  if (announceData.title && announceData.content) {
                    const btn = e.currentTarget;
                    btn.disabled = true;
                    btn.innerText = 'Posting...';
                    try {
                      await AcademicianService.postAnnouncement(courseId, announceData);
                      setStatusModal({ show: true, type: 'success', title: 'Posted', message: 'Announcement posted successfully!' });
                      setShowAnnounceModal(false);
                      setAnnounceData({ title: '', content: '' });
                    } catch (err) { 
                      setStatusModal({ show: true, type: 'error', title: 'Error', message: 'Failed to post announcement' }); 
                    } finally {
                      btn.disabled = false;
                      btn.innerText = 'Post';
                    }
                  }
                }}
                style={{ ...styles.actionBtn, background: 'var(--accent-academician)', color: 'black' }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Status Modal */}
      {statusModal.show && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              {statusModal.type === 'success' ? (
                <CheckCircle2 size={60} color="#10b981" style={{ margin: '0 auto' }} />
              ) : (
                <AlertCircle size={60} color="#f85149" style={{ margin: '0 auto' }} />
              )}
            </div>
            <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '1rem' }}>{statusModal.title}</h3>
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '2rem' }}>{statusModal.message}</p>
            <button 
              onClick={() => setStatusModal({ ...statusModal, show: false })}
              style={{ ...styles.submitBtn, marginTop: 0, background: statusModal.type === 'success' ? '#10b981' : 'rgba(248, 81, 73, 0.1)', color: statusModal.type === 'success' ? 'white' : '#f85149', border: statusModal.type === 'success' ? 'none' : '1px solid #f85149' }}
            >
              Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- TAB COMPONENTS --- */

const StudentsTab = ({ filteredStudents, searchTerm, setSearchTerm }) => (
  <div style={styles.tabInner}>
    <div style={styles.contentHeader}>
      <div style={styles.searchWrapper}>
        <Search size={18} style={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>
      <div style={styles.countText}>
        Showing <span style={{ color: 'white', fontWeight: '700' }}>{filteredStudents.length}</span> students
      </div>
    </div>

    <div style={styles.studentGrid}>
      {filteredStudents.map((student) => (
        <div key={student.studentNumber} className="glass-card" style={styles.studentCard}>
          <div style={styles.cardHeader}>
            <div style={styles.avatar}>{student.firstName?.[0]}{student.lastName?.[0]}</div>
            <div>
              <h4 style={styles.studentName}>{student.firstName} {student.lastName}</h4>
              <p style={styles.studentId}>#{student.studentNumber}</p>
            </div>
            <button style={styles.moreBtn}><MoreVertical size={16} /></button>
          </div>
          <div style={styles.cardStats}>
            <div style={styles.statLine}>
              <span style={styles.statLabel}>Attendance</span>
              <span style={styles.statVal}>{Math.round(student.attendanceRate)}%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${student.attendanceRate}%`, background: 'var(--accent-academician)' }} />
            </div>
            <div style={{ ...styles.statLine, marginTop: '1rem' }}>
              <span style={styles.statLabel}>GPA</span>
              <span style={{ ...styles.statVal, color: '#10b981' }}>{student.gpa || '0.00'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ExamsTab = ({ courseId }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExam, setNewExam] = useState({ examType: 'MIDTERM', examDate: '', ratio: 40, classroomId: 1 });
  const [editingExamId, setEditingExamId] = useState(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await AcademicianService.getCourseExams(courseId);
        setExams(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchExams();
  }, [courseId]);

  const handleSaveExam = async () => {
    try {
      const payload = { 
        ...newExam, 
        examDate: newExam.examDate.includes('T') ? newExam.examDate : newExam.examDate + 'T09:00:00' 
      };
      if (editingExamId) {
        await AcademicianService.updateExam(editingExamId, payload);
      } else {
        await AcademicianService.createExam(courseId, payload);
      }
      setShowAdd(false);
      setEditingExamId(null);
      // Fetch exams again
      const data = await AcademicianService.getCourseExams(courseId);
      setExams(data);
    } catch (err) { alert('Failed to save exam'); }
  };

  const handleEditClick = (exam) => {
    setEditingExamId(exam.id);
    setNewExam({
      examType: exam.examType,
      examDate: exam.examDate ? exam.examDate.split('T')[0] : '',
      ratio: exam.ratio || 40,
      classroomId: exam.classroom?.id || 1
    });
    setShowAdd(true);
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await AcademicianService.deleteExam(examId);
      setExams(exams.filter(e => e.id !== examId));
    } catch (err) {
      alert('Failed to delete exam');
    }
  };

  return (
    <div className="glass-card" style={styles.moduleCard}>
      <div style={styles.moduleHeader}>
        <div>
          <h3 style={styles.moduleTitle}>Exams Management</h3>
          <p style={styles.moduleSubtitle}>Schedule and manage exams for this course.</p>
        </div>
        <button className="btn-active-scale" style={styles.actionBtn} onClick={() => {
          setEditingExamId(null);
          setNewExam({ examType: 'MIDTERM', examDate: '', ratio: 40, classroomId: 1 });
          setShowAdd(!showAdd);
        }}>
          <Plus size={18} /> Add Exam
        </button>
      </div>

      {showAdd && (
        <div className="glass-card" style={styles.formCard}>
          <div style={styles.formGrid}>
            <select style={styles.input} value={newExam.examType} onChange={e => setNewExam({...newExam, examType: e.target.value})}>
              <option value="MIDTERM">Midterm</option>
              <option value="FINAL">Final</option>
              <option value="QUIZ">Quiz</option>
            </select>
            <input type="date" style={styles.input} value={newExam.examDate} onChange={e => setNewExam({...newExam, examDate: e.target.value})} />
            <input type="number" placeholder="Ratio (%)" style={styles.input} value={newExam.ratio || ''} onChange={e => setNewExam({...newExam, ratio: parseInt(e.target.value)})} />
            <input type="number" placeholder="Classroom ID" style={styles.input} value={newExam.classroomId || ''} onChange={e => setNewExam({...newExam, classroomId: parseInt(e.target.value)})} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-active-scale" style={styles.saveBtn} onClick={handleSaveExam}><Save size={18} /> {editingExamId ? 'Update Exam' : 'Save Exam'}</button>
            <button style={{ ...styles.saveBtn, background: 'rgba(255,255,255,0.05)', color: 'white' }} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={styles.examList}>
        {Array.isArray(exams) && exams.length > 0 ? exams.map(exam => (
          <div key={exam.id} style={styles.examItem} className="glass-card">
            <div style={styles.examInfoMain}>
              <div style={styles.examIcon}><Calendar size={20} /></div>
              <div>
                <h4 style={styles.examType}>{exam.examType}</h4>
                <p style={styles.examDate}>{exam.examDate ? new Date(exam.examDate).toLocaleDateString() : 'No Date'}</p>
              </div>
            </div>
            <div style={styles.examMeta}>
              <div style={styles.metaBadge}><Clock size={14} /> {exam.examDate ? new Date(exam.examDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00'}</div>
              <div style={styles.metaBadge}><MapPin size={14} /> {exam.classroom?.code || 'TBA'}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              <button 
                style={{...styles.moreBtn, color: 'var(--accent-academician)'}} 
                onClick={() => handleEditClick(exam)}
              >
                <Edit2 size={16} />
              </button>
              <button 
                style={{...styles.moreBtn, color: '#f85149'}} 
                onClick={() => handleDeleteExam(exam.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )) : (
          <div style={styles.emptyStateMod}>
            <Calendar size={64} color="var(--text-dim)" />
            <p>No exams scheduled yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GradingTab = ({ courseId, students, onSave }) => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await AcademicianService.getCourseExams(courseId);
        setExams(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchExams();
  }, [courseId]);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedExam) {
        setGrades({});
        return;
      }
      try {
        const data = await AcademicianService.getExamGrades(selectedExam.id);
        const gradeMap = {};
        data.forEach(g => {
          gradeMap[g.studentId] = g.score;
        });
        setGrades(gradeMap);
      } catch (err) { console.error(err); }
    };
    fetchGrades();
  }, [selectedExam]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedExam) return;
    setSubmitting(true);
    try {
      const payload = { grades: Object.entries(grades).map(([sid, score]) => ({ studentId: parseInt(sid), score: parseFloat(score) })) };
      await AcademicianService.enterGrades(selectedExam.id, payload);
      setStatusModal({ show: true, type: 'success', title: 'Success', message: 'Grades saved successfully!' });
      if (onSave) onSave();
    } catch (err) { 
      const msg = err.response?.data?.message || 'Failed to save grades';
      setStatusModal({ show: true, type: 'error', title: 'Error', message: msg }); 
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={styles.moduleCard}>
      <div style={styles.moduleHeader}>
        <div>
          <h3 style={styles.moduleTitle}>Grading Center</h3>
          <p style={styles.moduleSubtitle}>Select an exam to enter student scores.</p>
        </div>
        <select style={styles.selectInput} onChange={e => setSelectedExam(exams.find(x => x.id === parseInt(e.target.value)))}>
          <option value="">Select Exam</option>
          {Array.isArray(exams) && exams.map(ex => <option key={ex.id} value={ex.id}>{ex.examType} - {ex.examDate ? new Date(ex.examDate).toLocaleDateString() : 'No Date'}</option>)}
        </select>
      </div>

      {selectedExam ? (
        <div style={styles.gradeGrid}>
          {Array.isArray(students) && students.map(s => (
            <div key={s.id} style={styles.gradeItem} className="glass-card">
              <div style={styles.studentInfoSmall}>
                <div style={styles.avatarSmall}>{s.firstName?.[0]}{s.lastName?.[0]}</div>
                <p style={styles.studentNameSmall}>{s.firstName} {s.lastName}</p>
              </div>
              <input 
                type="number" 
                placeholder="Score" 
                style={styles.scoreInput} 
                value={grades[s.id] !== undefined ? grades[s.id] : ''}
                onChange={e => setGrades({...grades, [s.id]: e.target.value})} 
              />
            </div>
          ))}
          <button 
            style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }} 
            className="btn-active-scale"
            disabled={submitting} 
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting...' : 'Submit All Grades'}
          </button>
        </div>
      ) : (
        <div style={styles.emptyStateMod}>
          <GraduationCap size={64} color="var(--text-dim)" />
          <p>Select an exam to start grading</p>
        </div>
      )}
    </div>
  );
};

const AttendanceTab = ({ courseId, students, onSave }) => {
  const [attendance, setAttendance] = useState({});
  const [isWithinWindow, setIsWithinWindow] = useState(false); // Default false for security
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await AcademicianService.getCourseSchedule(courseId);
        setSchedule(data);
        checkWindow(data);
      } catch (err) { 
        console.error("Schedule load error:", err);
        setIsWithinWindow(false); 
      }
    };

    const checkWindow = (scheduleData) => {
      const now = new Date();
      const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const currentDay = days[now.getDay()];
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      let valid = false;
      if (scheduleData && scheduleData.length > 0) {
        scheduleData.forEach(s => {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          const startMins = sh * 60 + sm;
          const endMins = eh * 60 + em + 120;
          
          if (s.dayOfWeek === currentDay) {
            if (currentTime >= startMins && currentTime <= endMins) {
                valid = true;
            }
          }
        });
      }
      setIsWithinWindow(valid);
    };

    loadSchedule();
    const interval = setInterval(() => {
      if (schedule.length > 0) checkWindow(schedule);
      else loadSchedule();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [courseId, schedule.length]);

  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        const data = await AcademicianService.getTodayAttendance(courseId);
        const map = {};
        data.forEach(att => {
          map[att.studentId] = att.present;
        });
        setAttendance(map);
      } catch (err) { console.error("Failed to fetch today attendance", err); }
    };
    fetchTodayAttendance();
  }, [courseId]);

  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const attendanceList = students.map(s => ({ 
        studentId: s.id, 
        present: !!attendance[s.id] 
      }));
      const payload = { 
        attendanceDate: new Date().toISOString().split('T')[0], 
        attendance: attendanceList 
      };
      await AcademicianService.recordAttendance(courseId, payload);
      setStatusModal({ show: true, type: 'success', title: 'Success', message: 'Attendance recorded successfully!' });
      if (onSave) onSave();
    } catch (err) { 
      console.error('Failed to save attendance');
      const msg = err.response?.data?.message || 'Failed to save attendance';
      setStatusModal({ show: true, type: 'error', title: 'Access Denied', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={styles.moduleCard}>
      <div style={styles.moduleHeader}>
        <div>
          <h3 style={styles.moduleTitle}>Daily Attendance</h3>
          <p style={styles.moduleSubtitle}>Mark presence for {new Date().toLocaleDateString()}</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={!isWithinWindow || submitting}
          className="btn-active-scale"
          style={{ 
            ...styles.actionBtn, 
            background: isWithinWindow ? '#10b981' : 'rgba(248, 81, 73, 0.1)', 
            color: isWithinWindow ? 'black' : '#f85149',
            border: isWithinWindow ? 'none' : '1px solid #f85149',
            cursor: isWithinWindow && !submitting ? 'pointer' : 'not-allowed',
            opacity: submitting ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          <span>{submitting ? 'Saving...' : (isWithinWindow ? 'Save Attendance' : 'Attendance Locked')}</span>
        </button>
        {!isWithinWindow && (
          <p style={{ position: 'absolute', right: '1.5rem', bottom: '-1.5rem', color: '#f85149', fontSize: '0.8rem', fontWeight: '500' }}>
            * Sadece ders saatlerinde ve sonraki 2 saat içinde kaydedilebilir.
          </p>
        )}
      </div>
      <div style={styles.attendanceGrid}>
        {Array.isArray(students) && students.map(s => (
          <div 
            key={s.id} 
            className="glass-card" 
            style={{ ...styles.attCard, borderColor: attendance[s.id] ? '#10b98150' : 'var(--border-glass)' }}
            onClick={() => setAttendance({...attendance, [s.id]: !attendance[s.id]})}
          >
            <div style={styles.studentInfoSmall}>
              <div style={{ ...styles.avatarSmall, background: attendance[s.id] ? '#10b98120' : 'rgba(255,255,255,0.05)' }}>{s.firstName?.[0]}{s.lastName?.[0]}</div>
              <p style={{ ...styles.studentNameSmall, color: attendance[s.id] ? 'white' : 'var(--text-dim)' }}>{s.firstName} {s.lastName}</p>
            </div>
            {attendance[s.id] ? <CheckCircle2 size={20} color="#10b981" /> : <XCircle size={20} color="var(--text-dim)" />}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  headerSection: { marginBottom: '2.5rem' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' },
  headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  courseBadgeWrapper: { marginBottom: '0.5rem' },
  courseBadge: { background: 'rgba(137, 87, 229, 0.15)', color: 'var(--accent-academician)', fontSize: '0.7rem', fontWeight: '800', padding: '0.3rem 0.8rem', borderRadius: '100px', textTransform: 'uppercase' },
  pageTitle: { fontSize: '2.5rem', fontWeight: '800', color: 'white' },
  pageSubtitle: { color: 'var(--text-dim)', marginTop: '0.5rem' },
  headerActions: { display: 'flex', gap: '1rem' },
  settingsBtn: { padding: '0.8rem', borderRadius: '16px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' },
  actionBtn: { background: 'var(--accent-academician)', color: 'black', padding: '0.8rem 1.5rem', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  tabsContainer: { display: 'flex', gap: '0.5rem', padding: '0.4rem', borderRadius: '20px', width: 'fit-content', marginBottom: '2.5rem' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.5rem', borderRadius: '16px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.3s ease' },
  tabInner: { animation: 'fadeIn 0.5s ease-out' },
  contentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  searchWrapper: { position: 'relative', width: '380px' },
  searchIcon: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' },
  searchInput: { width: '100%', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '0.9rem 1rem 0.9rem 3rem', color: 'white', fontSize: '0.95rem', outline: 'none' },
  countText: { color: 'var(--text-dim)', fontSize: '0.9rem' },
  studentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
  studentCard: { padding: '1.5rem', borderRadius: '24px', position: 'relative' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  avatar: { width: '48px', height: '48px', background: 'rgba(137, 87, 229, 0.1)', color: 'var(--accent-academician)', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800' },
  studentName: { color: 'white', fontSize: '1.1rem', fontWeight: '700' },
  studentId: { color: 'var(--text-dim)', fontSize: '0.8rem' },
  moreBtn: { marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' },
  cardStats: { marginTop: '1.5rem' },
  statLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  statLabel: { fontSize: '0.85rem', color: 'var(--text-dim)' },
  statVal: { fontSize: '0.9rem', color: 'white', fontWeight: '700' },
  progressBar: { height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '100px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '100px' },
  moduleCard: { padding: '2rem', borderRadius: '32px' },
  moduleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' },
  moduleTitle: { fontSize: '1.8rem', fontWeight: '800', color: 'white' },
  moduleSubtitle: { color: 'var(--text-dim)', marginTop: '0.4rem' },
  formCard: { padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0.8rem', color: 'white', outline: 'none' },
  saveBtn: { background: '#10b981', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  examList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  examItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', borderRadius: '20px' },
  examInfoMain: { display: 'flex', alignItems: 'center', gap: '1.2rem' },
  examIcon: { width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  examType: { fontSize: '1.1rem', fontWeight: '700', color: 'white' },
  examDate: { fontSize: '0.85rem', color: 'var(--text-dim)' },
  examMeta: { display: 'flex', gap: '1rem' },
  metaBadge: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '10px' },
  selectInput: { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', color: 'white', padding: '0.8rem 1.2rem', borderRadius: '14px', outline: 'none' },
  gradeGrid: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  gradeItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderRadius: '20px' },
  studentInfoSmall: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatarSmall: { width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-dim)' },
  studentNameSmall: { fontSize: '0.95rem', fontWeight: '700', color: 'white' },
  scoreInput: { width: '100px', textAlign: 'center', background: 'rgba(137, 87, 229, 0.05)', border: '1px solid rgba(137, 87, 229, 0.2)', color: 'white', padding: '0.6rem', borderRadius: '12px', outline: 'none', fontWeight: '700' },
  submitBtn: { width: '100%', marginTop: '2rem', padding: '1.2rem', background: 'var(--accent-academician)', color: 'black', fontWeight: '800', borderRadius: '18px', border: 'none', cursor: 'pointer' },
  emptyStateMod: { textAlign: 'center', padding: '5rem 0', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  attendanceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' },
  attCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid transparent' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '28px', background: 'rgba(20, 20, 20, 0.95)', border: '1px solid rgba(137, 87, 229, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' },
  modalInput: { width: '100%', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '1.2rem', color: 'white', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' }
};

export default CourseDetail;
