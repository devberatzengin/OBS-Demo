import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Calendar, MessageSquare, ClipboardList, 
  TrendingUp, Plus, Building2, MapPin, CheckCircle2, AlertCircle, 
  Loader2, ChevronRight, Activity, Globe, ShieldCheck, GraduationCap,
  Clock, Edit3, Trash2, ArrowRight, Layout, Save, X
} from 'lucide-react';
import AdministrativeService from '../services/AdministrativeService';

const AdministrativeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const [selectedSemester, setSelectedSemester] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [newSemester, setNewSemester] = useState({
    name: '',
    startDate: '',
    endDate: '',
    examStartDate: '',
    examEndDate: '',
    makeupExamStartDate: '',
    makeupExamEndDate: '',
    registrationStartDate: '',
    registrationEndDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facData, deptData, semData, statsData] = await Promise.all([
        AdministrativeService.getFaculties(),
        AdministrativeService.getDepartments(),
        AdministrativeService.getSemesters(),
        AdministrativeService.getStats()
      ]);
      setFaculties(facData);
      setDepartments(deptData);
      setSemesters(semData);
      console.log('Semesters raw data:', JSON.stringify(semData, null, 2));
      setStats(statsData);

      // Default to active semester if none selected
      if (!selectedSemester) {
        const active = semData.find(s => s.active || s.isActive);
        if (active) setSelectedSemester(active);
        else if (semData.length > 0) setSelectedSemester(semData[0]);
      } else {
        // Refresh selected semester data
        const updated = semData.find(s => s.id === selectedSemester.id);
        if (updated) setSelectedSemester(updated);
      }
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    try {
      await AdministrativeService.createSemester(newSemester);
      setShowSemesterModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert('Failed to create semester');
    }
  };

  const resetForm = () => {
    setNewSemester({
      name: '',
      startDate: '',
      endDate: '',
      examStartDate: '',
      examEndDate: '',
      makeupExamStartDate: '',
      makeupExamEndDate: '',
      registrationStartDate: '',
      registrationEndDate: ''
    });
  };

  const handleActivateSemester = async (id) => {
    try {
      await AdministrativeService.activateSemester(id);
      fetchData();
    } catch (err) {
      alert('Failed to activate semester');
    }
  };

  const startEditing = () => {
    setEditData({ ...selectedSemester });
    setIsEditing(true);
  };

  const handleUpdateSemester = async () => {
    try {
      await AdministrativeService.updateSemester(selectedSemester.id, editData);
      setIsEditing(false);
      fetchData();
    } catch (err) {
      alert('Failed to update semester');
    }
  };

  if (loading && !stats) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loaderWrapper}>
          <Loader2 className="animate-spin" size={64} color="var(--accent-admin)" />
          <div style={styles.loaderPulse}></div>
        </div>
        <p style={styles.loadingText}>Synchronizing Portal Data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTitleSection}>
          <div style={styles.badge}>Staff Portal v2.6</div>
          <h1 style={styles.title}>Administrative Dashboard</h1>
          <p style={styles.subtitle}>
            <Activity size={14} style={{ marginRight: 6 }} />
            {stats?.unitName || 'University Management'} • <span style={{ color: 'var(--accent-admin)' }}>Authorized Personnel</span>
          </p>
        </div>
        <div style={styles.tabs}>
          {['overview', 'infrastructure', 'calendar'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                ...styles.tab, 
                color: activeTab === tab ? 'white' : 'var(--text-dim)',
                background: activeTab === tab ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                borderColor: activeTab === tab ? 'var(--accent-admin)' : 'transparent'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'overview' && (
        <div style={styles.mainContent}>
          <div style={styles.statsGrid}>
            <StatCard label="Total Students" value={stats?.studentCount || 0} icon={<Users />} color="#facc15" trend="+2.4%" />
            <StatCard label="Academicians" value={stats?.academicianCount || 0} icon={<GraduationCap />} color="#fbbf24" trend="+0.8%" trendDir="up" />
            <StatCard label="Active Units" value={stats?.departmentCount || 0} icon={<Building2 />} color="#f59e0b" trend="Stable" />
            <StatCard label="Current Period" value={stats?.activeSemesterName?.split(' ')[1] || 'None'} icon={<Calendar />} color="#d97706" subtext={stats?.activeSemesterName?.split(' ')[0]} />
          </div>

          <div style={styles.contentGrid}>
            <div className="glass-card" style={styles.panel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>Operations Control</h2>
                <ShieldCheck size={20} color="var(--accent-admin)" opacity={0.6} />
              </div>
              <div style={styles.actionGrid}>
                <ActionButton 
                  icon={<Calendar size={20} />} 
                  label="Plan Semester" 
                  onClick={() => setActiveTab('calendar')} 
                  description="Define academic cycle dates"
                />
                <ActionButton 
                  icon={<Globe size={20} />} 
                  label="Infrastructure" 
                  onClick={() => setActiveTab('infrastructure')} 
                  description="Manage units & departments"
                />
                <ActionButton 
                  icon={<ClipboardList size={20} />} 
                  label="Student Records" 
                  description="Access encrypted profiles"
                />
                <ActionButton 
                  icon={<MessageSquare size={20} />} 
                  label="Broadcast" 
                  description="Send system notifications"
                />
              </div>
            </div>

            <div className="glass-card" style={styles.panel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>Timeline & Status</h2>
                <Activity size={20} color="var(--accent-admin)" opacity={0.6} />
              </div>
              <div style={styles.statusList}>
                {semesters.filter(s => s.active || s.isActive).map(s => (
                  <div key={s.id} style={styles.statusCard}>
                    <div style={styles.statusIconWrapper}>
                      <CheckCircle2 color="#facc15" size={24} />
                    </div>
                    <div>
                      <p style={styles.statusName}>{s.name} Active</p>
                      <div style={styles.dateBadge}>
                        {s.startDate || '---'} — {s.endDate || '---'}
                      </div>
                    </div>
                  </div>
                ))}
                {semesters.filter(s => s.active || s.isActive).length === 0 && (
                  <div style={styles.emptyStatus}>
                    <AlertCircle color="#f85149" size={32} />
                    <p style={styles.statusName}>No Active Semester</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Initialize the next academic period to begin.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'infrastructure' && (
        <div style={styles.infraSection}>
          <div className="glass-card" style={styles.infraPanel}>
            <h2 style={styles.panelTitle}>Faculty Catalog</h2>
            <div style={styles.scrollList}>
              {faculties.map(f => (
                <div key={f.id} style={styles.infraItem}>
                  <div style={styles.infraIcon}>
                    <Building2 size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.infraName}>{f.name}</p>
                    <p style={styles.infraSub}>{departments.filter(d => d.facultyName === f.name).length} Departments</p>
                  </div>
                  <ChevronRight size={18} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card" style={styles.infraPanel}>
            <h2 style={styles.panelTitle}>Department Records</h2>
            <div style={styles.scrollList}>
              {departments.map(d => (
                <div key={d.id} style={styles.infraItem}>
                  <div style={{ ...styles.infraIcon, background: 'rgba(250, 204, 21, 0.05)', color: '#facc15' }}>
                    <MapPin size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.infraName}>{d.name}</p>
                    <p style={styles.infraSub}>{d.facultyName}</p>
                  </div>
                  <div style={styles.tag}>Department</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div style={styles.calendarLayout}>
          <div style={styles.calendarSidebar}>
            <div className="glass-card" style={styles.periodControl}>
              <h3 style={styles.sidebarTitle}>Academic Periods</h3>
              <button style={styles.createBtn} onClick={() => setShowSemesterModal(true)}>
                <Plus size={16} /> New Semester
              </button>
              <div style={styles.semList}>
                {[...semesters]
                  .sort((a, b) => {
                    const aActive = a.active || a.isActive;
                    const bActive = b.active || b.isActive;
                    if (aActive === bActive) return 0;
                    return aActive ? -1 : 1;
                  })
                  .map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => { setSelectedSemester(s); setIsEditing(false); }}
                    style={{ 
                      ...styles.semItem, 
                      borderColor: selectedSemester?.id === s.id ? 'var(--accent-admin)' : 'transparent',
                      background: selectedSemester?.id === s.id ? 'rgba(250, 204, 21, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      transform: selectedSemester?.id === s.id ? 'translateX(5px)' : 'none'
                    }}
                  >
                    <div style={styles.semItemHeader}>
                      <span style={styles.semName}>{s.name}</span>
                      {(s.active || s.isActive) === true && (
                        <div style={styles.activePulseBadge}>
                          <div style={styles.pulseDot} />
                          ACTIVE
                        </div>
                      )}
                    </div>
                    {(s.active || s.isActive) !== true && (
                      <button onClick={(e) => { e.stopPropagation(); handleActivateSemester(s.id); }} style={styles.miniBtn}>
                        Set Active
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.kanbanBoard}>
            {selectedSemester ? (
              <React.Fragment>
                <div style={styles.kanbanHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={styles.kanbanTitle}>
                      {isEditing ? (
                        <input 
                          value={editData.name} 
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          style={styles.inlineInput}
                        />
                      ) : selectedSemester.name}
                    </h2>
                    {selectedSemester.isActive && <span style={styles.liveIndicator}>Live Sync</span>}
                  </div>
                  <div style={styles.kanbanActions}>
                    {isEditing ? (
                      <>
                        <button style={styles.cancelAction} onClick={() => setIsEditing(false)}><X size={16} /> Cancel</button>
                        <button style={styles.saveAction} onClick={handleUpdateSemester}><Save size={16} /> Save Changes</button>
                      </>
                    ) : (
                      <button style={styles.editAction} onClick={startEditing}><Edit3 size={16} /> Edit Timeline</button>
                    )}
                  </div>
                </div>
                
                <div style={styles.kanbanGrid}>
                  <KanbanColumn title="Semester Period" icon={<Calendar />} color="#facc15">
                    <KanbanCard 
                      label="Academic Term" 
                      start={isEditing ? editData.startDate : selectedSemester.startDate} 
                      end={isEditing ? editData.endDate : selectedSemester.endDate} 
                      status={getPeriodStatus(selectedSemester.startDate, selectedSemester.endDate)}
                      onUpdate={(s, e) => isEditing && setEditData({...editData, startDate: s, endDate: e})}
                      editable={isEditing}
                    />
                  </KanbanColumn>

                  <KanbanColumn title="Registration" icon={<Edit3 />} color="#fbbf24">
                    <KanbanCard 
                      label="Course Selection" 
                      start={isEditing ? editData.registrationStartDate : selectedSemester.registrationStartDate} 
                      end={isEditing ? editData.registrationEndDate : selectedSemester.registrationEndDate} 
                      status={getPeriodStatus(selectedSemester.registrationStartDate, selectedSemester.registrationEndDate)}
                      onUpdate={(s, e) => isEditing && setEditData({...editData, registrationStartDate: s, registrationEndDate: e})}
                      editable={isEditing}
                    />
                  </KanbanColumn>

                  <KanbanColumn title="Examination" icon={<ClipboardList />} color="#f59e0b">
                    <KanbanCard 
                      label="Final Exams" 
                      start={isEditing ? editData.examStartDate : selectedSemester.examStartDate} 
                      end={isEditing ? editData.examEndDate : selectedSemester.examEndDate} 
                      status={getPeriodStatus(selectedSemester.examStartDate, selectedSemester.examEndDate)}
                      onUpdate={(s, e) => isEditing && setEditData({...editData, examStartDate: s, examEndDate: e})}
                      editable={isEditing}
                    />
                    <KanbanCard 
                      label="Makeup Exams" 
                      start={isEditing ? editData.makeupExamStartDate : selectedSemester.makeupExamStartDate} 
                      end={isEditing ? editData.makeupExamEndDate : selectedSemester.makeupExamEndDate} 
                      status={getPeriodStatus(selectedSemester.makeupExamStartDate, selectedSemester.makeupExamEndDate)}
                      onUpdate={(s, e) => isEditing && setEditData({...editData, makeupExamStartDate: s, makeupExamEndDate: e})}
                      editable={isEditing}
                    />
                  </KanbanColumn>
                </div>
              </React.Fragment>
            ) : (
              <div style={styles.emptyKanban}>
                <Layout size={64} opacity={0.1} />
                <p>Select a semester from the sidebar to manage its timeline.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Modal */}
      {showSemesterModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>New Academic Cycle</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Define all critical dates for the upcoming semester.</p>
            </div>
            <form onSubmit={handleCreateSemester} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Semester Name</label>
                <input 
                  required
                  value={newSemester.name}
                  onChange={e => setNewSemester({...newSemester, name: e.target.value})}
                  placeholder="e.g. 2024-2025 Fall"
                  style={styles.input}
                />
              </div>

              <div style={styles.formSection}>
                <h4 style={styles.sectionTitle}>1. Academic Term</h4>
                <div style={styles.inputGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Start Date</label>
                    <input type="date" required value={newSemester.startDate} onChange={e => setNewSemester({...newSemester, startDate: e.target.value})} style={styles.input} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>End Date</label>
                    <input type="date" required value={newSemester.endDate} onChange={e => setNewSemester({...newSemester, endDate: e.target.value})} style={styles.input} />
                  </div>
                </div>
              </div>

              <div style={styles.formSection}>
                <h4 style={styles.sectionTitle}>2. Course Registration</h4>
                <div style={styles.inputGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Opens At</label>
                    <input type="date" required value={newSemester.registrationStartDate} onChange={e => setNewSemester({...newSemester, registrationStartDate: e.target.value})} style={styles.input} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Closes At</label>
                    <input type="date" required value={newSemester.registrationEndDate} onChange={e => setNewSemester({...newSemester, registrationEndDate: e.target.value})} style={styles.input} />
                  </div>
                </div>
              </div>

              <div style={styles.formSection}>
                <h4 style={styles.sectionTitle}>3. Examination Windows</h4>
                <div style={styles.inputGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Finals Start</label>
                    <input type="date" required value={newSemester.examStartDate} onChange={e => setNewSemester({...newSemester, examStartDate: e.target.value})} style={styles.input} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Finals End</label>
                    <input type="date" required value={newSemester.examEndDate} onChange={e => setNewSemester({...newSemester, examEndDate: e.target.value})} style={styles.input} />
                  </div>
                </div>
                <div style={{ ...styles.inputGrid, marginTop: '1rem' }}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Makeup Start</label>
                    <input type="date" required value={newSemester.makeupExamStartDate} onChange={e => setNewSemester({...newSemester, makeupExamStartDate: e.target.value})} style={styles.input} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Makeup End</label>
                    <input type="date" required value={newSemester.makeupExamEndDate} onChange={e => setNewSemester({...newSemester, makeupExamEndDate: e.target.value})} style={styles.input} />
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowSemesterModal(false)} style={styles.cancelBtn}>Discard</button>
                <button type="submit" style={styles.saveBtn}>Initialize Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const KanbanColumn = ({ title, icon, color, children }) => (
  <div style={styles.kanbanColumn}>
    <div style={styles.columnHeader}>
      <div style={{ ...styles.columnIcon, background: `${color}15`, color }}>{icon}</div>
      <h3 style={styles.columnTitle}>{title}</h3>
    </div>
    <div style={styles.columnContent}>
      {children}
    </div>
  </div>
);

const KanbanCard = ({ label, start, end, status, onUpdate, editable }) => (
  <div style={{ 
    ...styles.kanbanCard, 
    borderColor: editable ? 'rgba(250, 204, 21, 0.3)' : 'var(--border-glass)',
    background: editable ? 'rgba(250, 204, 21, 0.05)' : 'rgba(255, 255, 255, 0.03)'
  }}>
    <div style={styles.cardTop}>
      <p style={styles.cardLabel}>{label}</p>
      {!editable && <div style={{ ...styles.statusDot, background: status === 'Active' ? '#22c55e' : status === 'Past' ? '#94a3b8' : '#facc15' }} />}
    </div>
    <div style={styles.cardDates}>
      {editable ? (
        <div style={styles.editRow}>
          <input type="date" value={start || ''} onChange={(e) => onUpdate(e.target.value, end)} style={styles.miniInput} />
          <ArrowRight size={12} opacity={0.3} />
          <input type="date" value={end || ''} onChange={(e) => onUpdate(start, e.target.value)} style={styles.miniInput} />
        </div>
      ) : (
        <>
          <div style={styles.dateRow}>
            <Clock size={12} />
            <span>{start || 'TBD'}</span>
          </div>
          <ArrowRight size={12} opacity={0.3} />
          <div style={styles.dateRow}>
            <Clock size={12} />
            <span>{end || 'TBD'}</span>
          </div>
        </>
      )}
    </div>
    {!editable && (
      <div style={{ ...styles.cardStatus, color: status === 'Active' ? '#22c55e' : 'var(--text-dim)' }}>
        {status}
      </div>
    )}
  </div>
);

const getPeriodStatus = (start, end) => {
  if (!start || !end) return 'Planned';
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now < s) return 'Upcoming';
  if (now > e) return 'Past';
  return 'Active';
};

const StatCard = ({ label, value, icon, color, trend }) => (
  <div className="glass-card" style={styles.statCard}>
    <div style={{ ...styles.statIcon, background: `${color}15`, color }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <p style={styles.statLabel}>{label}</p>
      <h3 style={styles.statValue}>{value}</h3>
    </div>
    {trend && <div style={styles.trendBadge}>{trend}</div>}
  </div>
);

const ActionButton = ({ icon, label, description, onClick }) => (
  <button style={styles.actionBtn} onClick={onClick}>
    <div style={styles.actionIconWrapper}>{icon}</div>
    <div>
      <p style={styles.actionLabel}>{label}</p>
      <p style={styles.actionDesc}>{description}</p>
    </div>
    <ChevronRight size={16} style={styles.actionChevron} />
  </button>
);

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' },
  loaderWrapper: { position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  loaderPulse: { position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-admin)', opacity: 0.1, animation: 'pulse 2s infinite' },
  loadingText: { color: 'var(--text-secondary)', fontWeight: '600' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleSection: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  badge: { width: 'fit-content', padding: '0.2rem 0.8rem', background: 'rgba(250, 204, 21, 0.1)', color: 'var(--accent-admin)', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800' },
  title: { fontSize: '2.5rem', fontWeight: '900', color: 'white' },
  subtitle: { color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', fontSize: '0.95rem' },
  tabs: { display: 'flex', gap: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem', borderRadius: '14px' },
  tab: { border: '1px solid transparent', borderRadius: '10px', padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' },
  mainContent: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' },
  statCard: { padding: '1.8rem', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' },
  statIcon: { width: '50px', height: '50px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: '1.8rem', fontWeight: '900', color: 'white', margin: 0 },
  trendBadge: { position: 'absolute', top: '1.2rem', right: '1.2rem', fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '6px', fontWeight: '700' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' },
  panel: { padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'white' },
  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  actionBtn: { padding: '1.2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' },
  actionIconWrapper: { width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(250, 204, 21, 0.1)', color: 'var(--accent-admin)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontWeight: '700', color: 'white', fontSize: '0.9rem' },
  actionDesc: { fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' },
  actionChevron: { position: 'absolute', right: '1rem', opacity: 0.3 },
  statusList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  statusCard: { padding: '1.2rem', background: 'rgba(250, 204, 21, 0.03)', borderRadius: '16px', border: '1px solid rgba(250, 204, 21, 0.1)', display: 'flex', alignItems: 'center', gap: '1.2rem' },
  statusIconWrapper: { padding: '0.5rem', background: 'rgba(250, 204, 21, 0.1)', borderRadius: '10px' },
  statusName: { fontWeight: '800', fontSize: '1rem', color: 'white' },
  dateBadge: { marginTop: '4px', fontSize: '0.75rem', color: 'var(--accent-admin)', fontWeight: '700' },
  emptyStatus: { padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  infraSection: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
  infraPanel: { padding: '1.5rem', height: '550px', display: 'flex', flexDirection: 'column' },
  scrollList: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  infraItem: { padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' },
  infraIcon: { width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-admin)' },
  infraName: { fontWeight: '700', color: 'white', fontSize: '0.95rem' },
  infraSub: { fontSize: '0.75rem', color: 'var(--text-dim)' },
  tag: { padding: '0.2rem 0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: '700' },
  calendarLayout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' },
  calendarSidebar: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  periodControl: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  sidebarTitle: { fontSize: '1.1rem', fontWeight: '800', color: 'white' },
  createBtn: { background: 'var(--accent-admin)', color: 'black', fontWeight: '800', padding: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', cursor: 'pointer' },
  semList: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  semItem: { padding: '1.2rem', borderRadius: '14px', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
  semItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  semName: { fontWeight: '700', color: 'white', fontSize: '0.95rem' },
  activePulseBadge: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'var(--accent-admin)', fontWeight: '900', letterSpacing: '0.5px' },
  pulseDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-admin)', animation: 'pulse 1.5s infinite' },
  miniBtn: { marginTop: '0.8rem', background: 'rgba(250, 204, 21, 0.1)', border: '1px solid var(--accent-admin)', color: 'var(--accent-admin)', fontSize: '0.7rem', padding: '0.4rem 0.8rem', fontWeight: '800', borderRadius: '6px' },
  kanbanBoard: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  kanbanHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kanbanTitle: { fontSize: '1.8rem', fontWeight: '900', color: 'white' },
  liveIndicator: { background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800' },
  kanbanActions: { display: 'flex', gap: '1rem' },
  editAction: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700' },
  saveAction: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#22c55e', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700' },
  cancelAction: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '700' },
  inlineInput: { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--accent-admin)', borderRadius: '8px', color: 'white', padding: '0.4rem 0.8rem', fontSize: '1.5rem', fontWeight: '900', width: 'auto' },
  kanbanGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' },
  kanbanColumn: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  columnHeader: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  columnIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  columnTitle: { fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)' },
  columnContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kanbanCard: { padding: '1.5rem', border: '1px solid var(--border-glass)', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '1.2rem', transition: 'all 0.3s ease' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontWeight: '700', color: 'white', fontSize: '1rem' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%' },
  cardDates: { display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-dim)' },
  dateRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' },
  editRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' },
  miniInput: { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.4rem', color: 'white', fontSize: '0.8rem', width: '110px' },
  cardStatus: { fontSize: '0.75rem', fontWeight: '800', textAlign: 'right', letterSpacing: '0.5px' },
  emptyKanban: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '450px', gap: '1rem', color: 'var(--text-dim)', textAlign: 'center' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { width: '100%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { marginBottom: '1.5rem' },
  modalTitle: { fontSize: '1.6rem', fontWeight: '900', color: 'white' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  formSection: { background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' },
  sectionTitle: { fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-admin)', marginBottom: '1rem', textTransform: 'uppercase' },
  label: { fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '0.4rem', display: 'block' },
  input: { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '0.8rem', color: 'white', width: '100%' },
  inputGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem' },
  cancelBtn: { background: 'transparent', color: 'var(--text-dim)', fontWeight: '700' },
  saveBtn: { background: 'var(--accent-admin)', color: 'black', fontWeight: '900', padding: '0.8rem 1.5rem' }
};

export default AdministrativeDashboard;
