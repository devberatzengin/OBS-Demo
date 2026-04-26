import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Book, 
  Calendar, 
  Shield, 
  Award,
  Camera,
  Edit2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StudentService from '../services/StudentService';
import AcademicianService from '../services/AcademicianService';
import AdministrativeService from '../services/AdministrativeService';

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let data;
        if (user.role === 'ACADEMICIAN') {
          data = await AcademicianService.getProfile();
        } else if (user.role === 'ADMIN' || user.role === 'ADMINISTRATIVE') {
          data = await AdministrativeService.getProfile();
        } else {
          data = await StudentService.getProfile();
        }
        setProfileData(data);
        setEditFormData({
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || ''
        });
      } catch (err) {
        setError('Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user.role === 'ACADEMICIAN') {
        await AcademicianService.updateProfile(editFormData);
      } else if (user.role === 'ADMIN' || user.role === 'ADMINISTRATIVE') {
        await AdministrativeService.updateProfile(editFormData);
      } else {
        await StudentService.updateProfile(editFormData);
      }
      setProfileData(prev => ({ ...prev, ...editFormData }));
      setIsEditModalOpen(false);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getAccent = () => {
    if (user.role === 'ACADEMICIAN') return 'var(--accent-academician)';
    if (user.role === 'ADMIN' || user.role === 'ADMINISTRATIVE') return 'var(--accent-admin)';
    return 'var(--accent-student)';
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Loader2 className="animate-spin" size={40} color={getAccent()} />
    </div>
  );

  if (error) return <div style={{ textAlign: 'center', padding: '2rem', color: '#f85149' }}>{error}</div>;

  const isStaff = user.role === 'ADMIN' || user.role === 'ADMINISTRATIVE';

  return (
    <div style={styles.container}>
      {/* Cover & Profile Picture */}
      <div style={styles.coverSection}>
        <div style={{
          ...styles.cover,
          background: `linear-gradient(135deg, ${getAccent()}, #161b22)`
        }}>
          <div style={styles.coverOverlay}></div>
        </div>
        <div style={styles.profileHeader}>
          <div style={styles.avatarWrapper}>
            <div style={styles.avatar}>
              <User size={80} color={getAccent()} />
            </div>
            <button style={{
              ...styles.cameraBtn,
              background: getAccent()
            }}>
              <Camera size={20} />
            </button>
          </div>
          <div style={styles.nameSection}>
            <h1 style={styles.fullName}>{profileData.fullName}</h1>
            <p style={styles.deptInfo}>
              {profileData.departmentName} {isStaff ? (profileData.position || 'Administrative') : (user.role === 'ACADEMICIAN' ? (profileData.title || 'Academician') : 'Student')}
            </p>
          </div>
        </div>
        <button 
          className="glass-card" 
          style={styles.editBtn}
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit2 size={18} /> Edit Profile
        </button>
      </div>

      <div style={styles.grid}>
        {/* Left Column: Contact */}
        <div style={styles.leftCol}>
          <div className="glass-card" style={styles.card}>
            <h3 style={styles.cardTitle}>
              <Shield size={20} color={getAccent()} /> Contact Details
            </h3>
            <div style={styles.infoList}>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}><Mail size={18} /></div>
                <div>
                  <p style={styles.infoLabel}>Email Address</p>
                  <p style={styles.infoValue}>{profileData.email || 'N/A'}</p>
                </div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}><Phone size={18} /></div>
                <div>
                  <p style={styles.infoLabel}>Phone Number</p>
                  <p style={styles.infoValue}>{profileData.phoneNumber || 'N/A'}</p>
                </div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}><MapPin size={18} /></div>
                <div>
                  <p style={styles.infoLabel}>Address</p>
                  <p style={styles.infoValue}>{profileData.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Academic / Staff Info */}
        <div style={styles.rightCol}>
          <div className="glass-card" style={styles.card}>
            <h3 style={styles.cardTitle}>
              <Award size={20} color={getAccent()} /> 
              {isStaff ? 'Staff Information' : (user.role === 'ACADEMICIAN' ? 'Professional Status' : 'Academic Status')}
            </h3>
            <div style={styles.academicGrid}>
              {!isStaff && user.role === 'STUDENT' && (
                <div style={styles.academicBox}>
                  <p style={styles.infoLabel}>Faculty</p>
                  <div style={styles.boxContent}>
                    <Book size={20} color={getAccent()} />
                    <span style={styles.boxValue}>{profileData.facultyName}</span>
                  </div>
                </div>
              )}
              <div style={styles.academicBox}>
                <p style={styles.infoLabel}>Department</p>
                <div style={styles.boxContent}>
                  <User size={20} color={getAccent()} />
                  <span style={styles.boxValue}>{profileData.departmentName}</span>
                </div>
              </div>
              
              {isStaff ? (
                <>
                  <div style={styles.academicBox}>
                    <p style={styles.infoLabel}>Staff Number</p>
                    <div style={styles.boxContent}>
                      <Shield size={20} color={getAccent()} />
                      <span style={styles.boxValue}>{profileData.staffNumber}</span>
                    </div>
                  </div>
                  <div style={styles.academicBox}>
                    <p style={styles.infoLabel}>Position</p>
                    <div style={styles.boxContent}>
                      <Award size={20} color={getAccent()} />
                      <span style={styles.boxValue}>{profileData.position || 'Authorized Personnel'}</span>
                    </div>
                  </div>
                </>
              ) : (
                user.role === 'ACADEMICIAN' ? (
                  <div style={styles.academicBox}>
                    <p style={styles.infoLabel}>Academic Title</p>
                    <div style={styles.boxContent}>
                      <Award size={20} color={getAccent()} />
                      <span style={styles.boxValue}>{profileData.title}</span>
                    </div>
                  </div>
                ) : (
                  <div style={styles.academicBox}>
                    <p style={styles.infoLabel}>Advisor</p>
                    <div style={styles.boxContent}>
                      <Award size={20} color={getAccent()} />
                      <span style={styles.boxValue}>{profileData.advisorName}</span>
                    </div>
                  </div>
                )
              )}

              {!isStaff && user.role === 'STUDENT' && (
                <div style={styles.academicBox}>
                  <p style={styles.infoLabel}>Registration</p>
                  <div style={styles.boxContent}>
                    <Calendar size={20} color={getAccent()} />
                    <span style={styles.boxValue}>{profileData.registrationDate ? new Date(profileData.registrationDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              )}
              {!isStaff && user.role === 'ACADEMICIAN' && (
                <div style={styles.academicBox}>
                  <p style={styles.infoLabel}>Office Number</p>
                  <div style={styles.boxContent}>
                    <MapPin size={20} color={getAccent()} />
                    <span style={styles.boxValue}>{profileData.office || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card" style={{
            ...styles.badgeCard,
            background: `rgba(${isStaff ? '250, 204, 21' : (user.role === 'ACADEMICIAN' ? '137, 87, 229' : '35, 134, 54')}, 0.05)`,
            borderColor: `rgba(${isStaff ? '250, 204, 21' : (user.role === 'ACADEMICIAN' ? '137, 87, 229' : '35, 134, 54')}, 0.1)`
          }}>
            <div style={styles.badgeInfo}>
              <h3 style={styles.badgeTitle}>
                {isStaff ? 'Administrative Badge' : (user.role === 'ACADEMICIAN' ? 'Academician Badge' : 'Student Badge')}
              </h3>
              <p style={styles.badgeSub}>Official identification of the university</p>
            </div>
            <div style={{
              ...styles.badgeId,
              color: `rgba(${isStaff ? '250, 204, 21' : (user.role === 'ACADEMICIAN' ? '137, 87, 229' : '35, 134, 54')}, 0.3)`
            }}>
              {isStaff ? profileData.staffNumber : (user.role === 'ACADEMICIAN' ? profileData.office : profileData.studentNumber)}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Profile</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  style={styles.input}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  style={styles.input}
                  placeholder="+90 5xx xxx xxxx"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Address</label>
                <textarea
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  style={styles.textArea}
                  placeholder="Your address..."
                  rows="3"
                />
              </div>

              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{
                    ...styles.saveBtn,
                    background: getAccent()
                  }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem'
  },
  coverSection: {
    position: 'relative',
    marginBottom: '6rem'
  },
  cover: {
    height: '240px',
    background: 'linear-gradient(135deg, var(--accent-student), #161b22)',
    borderRadius: '32px',
    position: 'relative',
    overflow: 'hidden'
  },
  coverOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(2px)'
  },
  profileHeader: {
    position: 'absolute',
    bottom: '-50px',
    left: '40px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2rem'
  },
  avatarWrapper: {
    position: 'relative'
  },
  avatar: {
    width: '160px',
    height: '160px',
    background: 'var(--bg-primary)',
    border: '8px solid var(--bg-primary)',
    borderRadius: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'var(--shadow-main)'
  },
  cameraBtn: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    background: 'var(--accent-student)',
    color: 'white',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(35, 134, 54, 0.4)'
  },
  nameSection: {
    marginBottom: '1rem'
  },
  fullName: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: 'white'
  },
  deptInfo: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    fontWeight: '500'
  },
  editBtn: {
    position: 'absolute',
    bottom: '1rem',
    right: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.8rem 1.5rem',
    borderRadius: '16px',
    color: 'white',
    fontSize: '0.9rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '2rem'
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  card: {
    padding: '2rem'
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem'
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  infoIcon: {
    width: '40px',
    height: '40px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'var(--text-dim)'
  },
  infoLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.2rem'
  },
  infoValue: {
    fontSize: '0.95rem',
    color: 'white',
    fontWeight: '600'
  },
  academicGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem'
  },
  academicBox: {
    background: 'rgba(255,255,255,0.02)',
    padding: '1.2rem',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  boxContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    marginTop: '0.5rem'
  },
  boxValue: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: 'white'
  },
  badgeCard: {
    padding: '2rem',
    background: 'rgba(35, 134, 54, 0.05)',
    borderColor: 'rgba(35, 134, 54, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badgeTitle: {
    fontSize: '1.2rem',
    fontWeight: '800'
  },
  badgeSub: {
    fontSize: '0.85rem',
    color: 'var(--text-dim)'
  },
  badgeId: {
    fontSize: '2.5rem',
    fontWeight: '900',
    color: 'rgba(35, 134, 54, 0.3)',
    fontStyle: 'italic',
    letterSpacing: '-2px'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    padding: '2.5rem',
    position: 'relative'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '800'
  },
  closeBtn: {
    background: 'none',
    color: 'var(--text-secondary)',
    fontSize: '1.5rem',
    padding: '0.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '1rem',
    color: 'white',
    fontSize: '1rem',
    outline: 'none',
    transition: 'var(--transition)'
  },
  textArea: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '1rem',
    color: 'white',
    fontSize: '1rem',
    outline: 'none',
    resize: 'none',
    transition: 'var(--transition)'
  },
  modalFooter: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
  },
  cancelBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    color: 'white'
  },
  saveBtn: {
    flex: 2,
    color: 'white'
  }
};

export default Profile;
