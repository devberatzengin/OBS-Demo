import React, { useState } from 'react';
import { 
  Plus, 
  BookOpen, 
  Clock, 
  Users, 
  ChevronLeft,
  Save,
  Info,
  Calendar,
  Layers,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AcademicianService from '../services/AcademicianService';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState({
    name: '',
    code: '',
    credits: 0,
    akts: 0,
    capacity: 30,
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await AcademicianService.createCourse(courseData);
      alert('Course created successfully!');
      navigate('/academician');
    } catch (err) {
      alert('Failed to create course');
    }
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={() => navigate('/academician')}
        style={styles.backBtn}
      >
        <ChevronLeft size={16} />
        Back to Dashboard
      </button>

      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Create New Course</h1>
        <p style={styles.pageSubtitle}>Open a new course for the current academic semester.</p>
      </div>

      <div className="glass-card" style={styles.formCard}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Course Name</label>
              <div style={styles.inputWrapper}>
                <BookOpen size={18} style={styles.inputIcon} />
                <input 
                  required
                  placeholder="e.g. Advanced Algorithms"
                  style={styles.input}
                  value={courseData.name}
                  onChange={(e) => setCourseData({...courseData, name: e.target.value})}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Course Code</label>
              <div style={styles.inputWrapper}>
                <Layers size={18} style={styles.inputIcon} />
                <input 
                  required
                  placeholder="e.g. CS302"
                  style={styles.input}
                  value={courseData.code}
                  onChange={(e) => setCourseData({...courseData, code: e.target.value})}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Local Credits</label>
              <div style={styles.inputWrapper}>
                <Plus size={18} style={styles.inputIcon} />
                <input 
                  required
                  type="number"
                  style={styles.input}
                  value={courseData.credits}
                  onChange={(e) => setCourseData({...courseData, credits: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>AKTS</label>
              <div style={styles.inputWrapper}>
                <TrendingUp size={18} style={styles.inputIcon} />
                <input 
                  required
                  type="number"
                  style={styles.input}
                  value={courseData.akts}
                  onChange={(e) => setCourseData({...courseData, akts: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Max Capacity</label>
              <div style={styles.inputWrapper}>
                <Users size={18} style={styles.inputIcon} />
                <input 
                  required
                  type="number"
                  style={styles.input}
                  value={courseData.capacity}
                  onChange={(e) => setCourseData({...courseData, capacity: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Course Description</label>
            <textarea 
              style={styles.textarea}
              placeholder="Provide a brief overview of the course curriculum..."
              value={courseData.description}
              onChange={(e) => setCourseData({...courseData, description: e.target.value})}
            />
          </div>

          <div style={styles.footer}>
            <div style={styles.infoBox}>
              <Info size={20} color="var(--accent-academician)" />
              <p style={styles.infoText}>New courses require final approval from the department head before appearing in the catalog.</p>
            </div>
            <button type="submit" style={styles.submitBtn}>
              <Save size={18} />
              Open Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.5rem' },
  header: { marginBottom: '2.5rem' },
  pageTitle: { fontSize: '2.5rem', fontWeight: '800', color: 'white' },
  pageSubtitle: { color: 'var(--text-dim)', marginTop: '0.5rem' },
  formCard: { padding: '2.5rem', borderRadius: '32px' },
  form: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  label: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-dim)', marginLeft: '0.4rem' },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' },
  input: { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '1rem 1rem 1rem 3.2rem', color: 'white', outline: 'none', transition: 'all 0.3s ease' },
  textarea: { width: '100%', minHeight: '120px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '1.2rem', color: 'white', outline: 'none', resize: 'vertical' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', gap: '2rem' },
  infoBox: { display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, padding: '1.2rem', borderRadius: '20px', background: 'rgba(137, 87, 229, 0.05)', border: '1px solid rgba(137, 87, 229, 0.1)' },
  infoText: { fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.5' },
  submitBtn: { background: 'var(--accent-academician)', color: 'black', padding: '1.2rem 2.5rem', borderRadius: '20px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', whiteSpace: 'nowrap' }
};

export default CreateCourse;
