import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, GraduationCap, School, 
  Search, Filter, Plus, Loader2, CheckCircle2, 
  AlertCircle, ChevronRight, User as UserIcon, Mail, Lock, 
  Hash, Briefcase, Building2, Layout, Trash2,
  Edit3, Activity, PieChart, Database, BookOpen,
  MapPin, X, Save, ArrowRight
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AdministrativeService from '../services/AdministrativeService';

const AdminPortal = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/users')) setActiveTab('users');
    else if (path.includes('/courses')) setActiveTab('courses');
    else if (path.includes('/infra')) setActiveTab('infra');
    else setActiveTab('overview');
  }, [location]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Data State
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState({ students: [], academicians: [], administratives: [] });
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activities, setActivities] = useState([]);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('STUDENT');
  const [courseDeptFilter, setCourseDeptFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('user'); // user, course
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    role: 'STUDENT',
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    studentNumber: '',
    staffNumber: '',
    departmentId: '',
    academicTitle: '',
    position: '',
    // Course fields
    code: '',
    name: '',
    akts: 0,
    credits: 0,
    semesterLevel: 1,
    instructorId: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        AdministrativeService.getStats(),
        AdministrativeService.getAllStudents(),
        AdministrativeService.getAllAcademicians(),
        AdministrativeService.getAllAdministratives(),
        AdministrativeService.getAllCourses(),
        AdministrativeService.getFaculties(),
        AdministrativeService.getDepartments(),
        AdministrativeService.getLogs()
      ]);

      const [sRes, stRes, acRes, adRes, cRes, fRes, dRes, lRes] = results;

      if (sRes.status === 'fulfilled') setStats(sRes.value);
      
      setUsers({
        students: stRes.status === 'fulfilled' ? stRes.value : [],
        academicians: acRes.status === 'fulfilled' ? acRes.value : [],
        administratives: adRes.status === 'fulfilled' ? adRes.value : []
      });

      if (cRes.status === 'fulfilled') setCourses(cRes.value);
      if (fRes.status === 'fulfilled') setFaculties(fRes.value);
      if (dRes.status === 'fulfilled') setDepartments(dRes.value);
      if (lRes.status === 'fulfilled') setActivities(lRes.value);

      const failedAny = results.some(r => r.status === 'rejected');
      if (failedAny) {
        console.warn('Some data failed to sync');
        // Optional: set a non-blocking error message
      }

    } catch (err) {
      console.error('Data sync failed', err);
      setError('Critical system error. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (modalType === 'user') {
        if (editingItem) {
          // Update Logic
          if (formData.role === 'STUDENT') await AdministrativeService.updateStudent(editingItem.id, formData);
          else if (formData.role === 'ACADEMICIAN') await AdministrativeService.updateAcademician(editingItem.id, formData);
          else if (formData.role === 'ADMINISTRATIVE') await AdministrativeService.updateAdministrative(editingItem.id, formData);
        } else {
          // Create Logic
          if (formData.role === 'STUDENT') await AdministrativeService.registerStudent(formData);
          else if (formData.role === 'ACADEMICIAN') await AdministrativeService.registerAcademician(formData);
          else if (formData.role === 'ADMINISTRATIVE') await AdministrativeService.registerAdministrative(formData);
        }
      } else if (modalType === 'course') {
        if (editingItem) await AdministrativeService.updateCourse(editingItem.id, formData);
        else await AdministrativeService.createCourse(formData);
      }
      
      setSuccess(`${modalType} ${editingItem ? 'updated' : 'created'} successfully!`);
      setTimeout(() => {
        setShowModal(false);
        fetchAllData();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.description || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure? This action is permanent.')) return;
    try {
      if (type === 'user') await AdministrativeService.deleteUser(id);
      else if (type === 'course') await AdministrativeService.deleteCourse(id);
      fetchAllData();
    } catch (err) {
      alert('Deletion failed');
    }
  };

  const getFilteredCourses = () => {
    let filtered = courses;
    if (courseDeptFilter !== 'ALL') {
      filtered = filtered.filter(c => c.departmentId === courseDeptFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

   const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setError('');
    setSuccess('');
    
    if (item) {
      // Data normalization for form
      const normalizedData = { ...item, password: '' };
      if (item.department) normalizedData.departmentId = item.department.id;
      if (item.advisor) normalizedData.advisorId = item.advisor.id;
      if (item.instructor) normalizedData.instructorId = item.instructor.id;
      
      setFormData({ ...formData, ...normalizedData });
    } else {
      setFormData({
        role: type === 'user' ? (userRoleFilter || 'STUDENT') : '',
        username: '', password: '', email: '', firstName: '', lastName: '',
        studentNumber: '', staffNumber: '', departmentId: '', academicTitle: '', position: '',
        code: '', name: '', akts: 5, credits: 3, semesterLevel: 1, instructorId: ''
      });
    }
    setShowModal(true);
  };

  if (loading && !stats) {
    return (
      <div style={styles.loaderContainer}>
        <Loader2 className="animate-spin" size={48} color="#f85149" />
        <p style={styles.loaderText}>Establishing Secure Connection...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Main Content Area */}
      <div style={styles.main}>
        <header style={styles.header}>
           <div>
             <h2 style={styles.pageTitle}>{activeTab === 'infra' ? 'Infrastructure' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Control</h2>
             <p style={styles.pageSubtitle}>Real-time system state monitoring and management</p>
           </div>
           <div style={styles.headerActions}>
              {(activeTab === 'users' || activeTab === 'courses') && (
                <button style={styles.primaryBtn} onClick={() => openModal(activeTab === 'courses' ? 'course' : 'user')}>
                  <Plus size={18} /> Add New {activeTab === 'courses' ? 'Course' : 'User'}
                </button>
              )}
           </div>
        </header>

        {activeTab === 'overview' && (
          <div style={styles.dashboard}>
             <div style={styles.statsGrid}>
                 <StatCard label="Total Students" value={stats?.studentCount} icon={<GraduationCap />} color="#238636" />
                 <StatCard label="Academicians" value={stats?.academicianCount} icon={<School />} color="#8957e5" />
                 <StatCard label="Staff Personnel" value={stats?.administrativeCount} icon={<Shield />} color="#d29922" />
                 <StatCard label="Active Courses" value={stats?.courseCount} icon={<BookOpen />} color="#1f6feb" />
             </div>

             <div style={styles.contentGrid}>
                <div className="glass-card" style={styles.largePanel}>
                   <h3 style={styles.panelHeader}>System Activity</h3>
                   <div style={styles.activityList}>
                      {activities.length > 0 ? activities.map((activity) => (
                         <div key={activity.id} style={styles.activityItem}>
                            <div style={{
                               ...styles.activityIcon,
                               color: activity.action.includes('REGISTERED') ? '#238636' : '#1f6feb',
                               background: activity.action.includes('REGISTERED') ? 'rgba(35, 134, 54, 0.1)' : 'rgba(31, 111, 235, 0.1)'
                            }}>
                               {activity.action.includes('REGISTERED') ? <UserPlus size={16} /> : <BookOpen size={16} />}
                            </div>
                            <div style={{ flex: 1 }}>
                               <div style={styles.activityTitle}>{activity.action.replace(/_/g, ' ')}</div>
                               <div style={styles.activityDesc}>{activity.details}</div>
                            </div>
                            <div style={styles.activityTime}>
                               {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                         </div>
                      )) : (
                         <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>
                            No recent activity recorded
                         </div>
                      )}




                   </div>
                </div>
                <div className="glass-card" style={styles.smallPanel}>
                   <h3 style={styles.panelHeader}>Unit Distribution</h3>
                   <div style={styles.unitStats}>
                      <div style={styles.unitRow}><span>Faculties</span> <strong>{faculties.length}</strong></div>
                      <div style={styles.unitRow}><span>Departments</span> <strong>{departments.length}</strong></div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={styles.tableSection}>
             <div style={styles.userHeader}>
                <div style={styles.roleTabs}>
                   {[
                      { id: 'STUDENT', label: 'Students', color: '#238636', icon: <GraduationCap size={16}/> },
                      { id: 'ACADEMICIAN', label: 'Academicians', color: '#8957e5', icon: <School size={16}/> },
                      { id: 'ADMINISTRATIVE', label: 'Staff Personnel', color: '#d29922', icon: <Shield size={16}/> }
                   ].map(role => (
                      <button 
                         key={role.id}
                         onClick={() => setUserRoleFilter(role.id)}
                         style={{
                            ...styles.roleTab,
                            background: userRoleFilter === role.id ? `${role.color}20` : 'rgba(255,255,255,0.02)',
                            color: userRoleFilter === role.id ? role.color : 'var(--text-dim)',
                            borderColor: userRoleFilter === role.id ? role.color : 'transparent'
                         }}
                      >
                         {role.icon} {role.label}
                         <span style={{ 
                            ...styles.countBadge, 
                            background: userRoleFilter === role.id ? role.color : 'rgba(255,255,255,0.1)' 
                         }}>
                            {role.id === 'STUDENT' ? users.students.length : 
                             role.id === 'ACADEMICIAN' ? users.academicians.length : users.administratives.length}
                         </span>
                      </button>
                   ))}
                </div>
                <div style={styles.searchWrapper}>
                   <Search size={18} />
                   <input 
                    placeholder={`Search ${userRoleFilter.toLowerCase()}s...`} 
                    style={styles.searchInput} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
             </div>

             <div className="glass-card" style={styles.tableContainer}>
                <table style={styles.table}>
                   <thead>
                      <tr>
                         <th>Identity</th>
                         <th>Identifier</th>
                         <th>{userRoleFilter === 'ADMINISTRATIVE' ? 'Position' : 'Department'}</th>
                         <th>Contact</th>
                         <th>Actions</th>
                      </tr>
                   </thead>
                   <tbody>
                      {getFilteredUsers().map(user => {
                        const roleColor = userRoleFilter === 'STUDENT' ? '#238636' : 
                                        userRoleFilter === 'ACADEMICIAN' ? '#8957e5' : '#d29922';
                        return (
                          <tr key={user.id}>
                             <td>
                                <div style={styles.userInfo}>
                                   <div style={{ ...styles.avatar, background: `${roleColor}15`, color: roleColor }}>
                                      {user.firstName[0]}{user.lastName[0]}
                                   </div>
                                   <div>
                                      <div style={styles.userName}>{user.firstName} {user.lastName}</div>
                                      <div style={styles.userUsername}>@{user.username}</div>
                                   </div>
                                </div>
                             </td>
                             <td><span style={{ ...styles.idBadge, border: `1px solid ${roleColor}30` }}>{user.studentNumber || user.staffNumber}</span></td>
                             <td>
                                <div style={styles.deptInfo}>
                                   {userRoleFilter === 'ADMINISTRATIVE' ? user.position : 
                                    departments.find(d => d.id === user.departmentId)?.name || 'General'}
                                </div>
                             </td>
                             <td>{user.email}</td>
                             <td>
                                <div style={styles.actionGroup}>
                                   <button onClick={() => openModal('user', { ...user, role: userRoleFilter })} style={styles.iconBtn}><Edit3 size={16} /></button>
                                   <button onClick={() => handleDelete('user', user.id)} style={{ ...styles.iconBtn, color: '#f85149' }}><Trash2 size={16} /></button>
                                </div>
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div style={styles.tableSection}>
             <div style={styles.userHeader}>
                <div style={styles.roleTabs}>
                   <button 
                      onClick={() => setCourseDeptFilter('ALL')}
                      style={{
                         ...styles.roleTab,
                         background: courseDeptFilter === 'ALL' ? 'rgba(31, 111, 235, 0.2)' : 'rgba(255,255,255,0.02)',
                         color: courseDeptFilter === 'ALL' ? '#1f6feb' : 'var(--text-dim)',
                         borderColor: courseDeptFilter === 'ALL' ? '#1f6feb' : 'transparent'
                      }}
                   >
                      All Departments
                      <span style={{ ...styles.countBadge, background: courseDeptFilter === 'ALL' ? '#1f6feb' : 'rgba(255,255,255,0.1)' }}>
                         {courses.length}
                      </span>
                   </button>
                   {departments.map(dept => (
                      <button 
                         key={dept.id}
                         onClick={() => setCourseDeptFilter(dept.id)}
                         style={{
                            ...styles.roleTab,
                            background: courseDeptFilter === dept.id ? 'rgba(31, 111, 235, 0.2)' : 'rgba(255,255,255,0.02)',
                            color: courseDeptFilter === dept.id ? '#1f6feb' : 'var(--text-dim)',
                            borderColor: courseDeptFilter === dept.id ? '#1f6feb' : 'transparent'
                         }}
                      >
                         {dept.name}
                         <span style={{ ...styles.countBadge, background: courseDeptFilter === dept.id ? '#1f6feb' : 'rgba(255,255,255,0.1)' }}>
                            {courses.filter(c => c.departmentId === dept.id).length}
                         </span>
                      </button>
                   ))}
                </div>
                <div style={styles.searchWrapper}>
                   <Search size={18} />
                   <input 
                    placeholder="Search courses..." 
                    style={styles.searchInput} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
             </div>

             <div className="glass-card" style={styles.tableContainer}>
                <table style={styles.table}>
                   <thead>
                      <tr>
                         <th>Code</th>
                         <th>Course Name</th>
                         <th>Department</th>
                         <th>Credits / AKTS</th>
                         <th>Instructor</th>
                         <th>Actions</th>
                      </tr>
                   </thead>
                   <tbody>
                      {getFilteredCourses().map(course => (
                        <tr key={course.id}>
                           <td><span style={styles.codeBadge}>{course.code}</span></td>
                           <td>
                              <div style={styles.userName}>{course.name}</div>
                              <div style={styles.userUsername}>Semester {course.semesterLevel}</div>
                           </td>
                           <td>
                              <div style={styles.deptInfo}>{course.departmentName}</div>
                           </td>
                           <td>
                              <div style={styles.creditInfo}>
                                 <span style={styles.mainCredit}>{course.credits}</span>
                                 <span style={styles.slash}>/</span>
                                 <span style={styles.aktsText}>{course.akts} AKTS</span>
                              </div>
                           </td>
                           <td>
                              <div style={styles.instructorInfo}>
                                 <UserIcon size={14} style={{marginRight: '6px', opacity: 0.6}} />
                                 {course.instructorName || 'Not Assigned'}
                              </div>
                           </td>
                           <td>
                              <div style={styles.actionGroup}>
                                 <button onClick={() => openModal('course', course)} style={styles.iconBtn}><Edit3 size={16} /></button>
                                 <button onClick={() => handleDelete('course', course.id)} style={{ ...styles.iconBtn, color: '#f85149' }}><Trash2 size={16} /></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'infra' && (
           <div style={styles.infraGrid}>
              <div className="glass-card" style={styles.infraPanel}>
                 <h3 style={styles.panelHeader}>Faculties</h3>
                 <div style={styles.itemList}>
                    {faculties.map(f => (
                      <div key={f.id} style={styles.itemCard}>
                         <Building2 size={18} color="#f85149" />
                         <span>{f.name}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="glass-card" style={styles.infraPanel}>
                 <h3 style={styles.panelHeader}>Departments</h3>
                 <div style={styles.itemList}>
                    {departments.map(d => (
                      <div key={d.id} style={styles.itemCard}>
                         <MapPin size={18} color="#238636" />
                         <div>
                            <div>{d.name}</div>
                            <div style={styles.subText}>{d.facultyName}</div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Unified CRUD Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
           <div className="glass-card" style={styles.modal}>
              <div style={styles.modalHeader}>
                 <h3 style={styles.modalTitle}>{editingItem ? 'Edit' : 'Create'} {modalType === 'user' ? formData.role : 'Course'}</h3>
                 <button onClick={() => setShowModal(false)} style={styles.closeBtn}><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateOrUpdate} style={styles.form}>
                 {error && <div style={styles.error}><AlertCircle size={18} /> {error}</div>}
                 {success && <div style={styles.success}><CheckCircle2 size={18} /> {success}</div>}

                 <div style={styles.modalScroll}>
                    {modalType === 'user' ? (
                      <>
                        <div style={styles.inputGrid}>
                           <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} icon={<UserIcon size={16}/>} />
                           <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} icon={<UserIcon size={16}/>} />
                        </div>
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} icon={<Mail size={16}/>} />
                        <Input label="Username" name="username" value={formData.username} onChange={handleInputChange} icon={<UserIcon size={16}/>} disabled={!!editingItem} />
                        <Input label={editingItem ? "New Password (Optional)" : "Password"} name="password" type="password" value={formData.password} onChange={handleInputChange} icon={<Lock size={16}/>} />
                        
                        <div style={styles.inputGrid}>
                           {formData.role === 'STUDENT' && <Input label="Student ID" name="studentNumber" value={formData.studentNumber} onChange={handleInputChange} icon={<Hash size={16}/>} />}
                           {formData.role !== 'STUDENT' && <Input label="Staff ID" name="staffNumber" value={formData.staffNumber} onChange={handleInputChange} icon={<Hash size={16}/>} />}
                           
                           {formData.role === 'ADMINISTRATIVE' ? (
                              <Input label="Position" name="position" value={formData.position} onChange={handleInputChange} icon={<Briefcase size={16}/>} />
                           ) : (
                              <div style={styles.inputGroup}>
                                 <label style={styles.label}>Department</label>
                                 <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} style={styles.select}>
                                    <option value="">Select Dept</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                 </select>
                              </div>
                           )}
                        </div>
                        {formData.role === 'ACADEMICIAN' && <Input label="Academic Title" name="academicTitle" value={formData.academicTitle} onChange={handleInputChange} icon={<Briefcase size={16}/>} />}
                      </>
                    ) : (
                      <>
                        <div style={styles.inputGrid}>
                           <Input label="Course Code" name="code" value={formData.code} onChange={handleInputChange} icon={<Hash size={16}/>} />
                           <Input label="AKTS" name="akts" type="number" value={formData.akts} onChange={handleInputChange} icon={<Activity size={16}/>} />
                        </div>
                        <Input label="Course Name" name="name" value={formData.name} onChange={handleInputChange} icon={<BookOpen size={16}/>} />
                        <div style={styles.inputGrid}>
                           <Input label="Credits" name="credits" type="number" value={formData.credits} onChange={handleInputChange} icon={<Database size={16}/>} />
                           <Input label="Semester" name="semesterLevel" type="number" value={formData.semesterLevel} onChange={handleInputChange} icon={<Layout size={16}/>} />
                        </div>
                        <div style={styles.inputGrid}>
                           <div style={styles.inputGroup}>
                              <label style={styles.label}>Department</label>
                              <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} style={styles.select}>
                                 <option value="">Select Dept</option>
                                 {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                           </div>
                           <div style={styles.inputGroup}>
                              <label style={styles.label}>Instructor</label>
                              <select name="instructorId" value={formData.instructorId} onChange={handleInputChange} style={styles.select}>
                                 <option value="">Select Instructor</option>
                                 {users.academicians.map(a => (
                                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.staffNumber})</option>
                                 ))}
                              </select>
                           </div>
                        </div>
                      </>
                    )}
                 </div>

                 <div style={styles.modalFooter}>
                    <button type="submit" disabled={submitting} style={styles.saveBtn}>
                       {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                       {editingItem ? 'Save Changes' : 'Create Record'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );

  function getFilteredUsers() {
     const list = userRoleFilter === 'STUDENT' ? users.students :
                  userRoleFilter === 'ACADEMICIAN' ? users.academicians : users.administratives;
     
     if (!searchQuery) return list;
     return list.filter(u => 
        u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.studentNumber && u.studentNumber.includes(searchQuery)) ||
        (u.staffNumber && u.staffNumber.includes(searchQuery))
     );
  }
};

// Sub-components
const StatCard = ({ label, value, icon, color }) => (
  <div className="glass-card" style={styles.statCard}>
    <div style={{ ...styles.statIcon, background: `${color}15`, color }}>{icon}</div>
    <div>
       <div style={styles.statLabel}>{label}</div>
       <div style={styles.statValue}>{value || 0}</div>
    </div>
  </div>
);

const ActivityItem = ({ icon, title, desc, time }) => (
  <div style={styles.activityItem}>
     <div style={styles.activityIcon}>{icon}</div>
     <div style={{ flex: 1 }}>
        <div style={styles.activityTitle}>{title}</div>
        <div style={styles.activityDesc}>{desc}</div>
     </div>
     <div style={styles.activityTime}>{time}</div>
  </div>
);

const Input = ({ label, icon, ...props }) => (
  <div style={styles.inputGroup}>
    <label style={styles.label}>{label}</label>
    <div style={styles.inputWrapper}>
      <div style={styles.inputIcon}>{icon}</div>
      <input style={styles.input} {...props} />
    </div>
  </div>
);

const styles = {
  container: { width: '100%' },
  loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' },
  loaderText: { color: 'var(--text-secondary)', fontWeight: '600' },
  main: { display: 'flex', flexDirection: 'column', gap: '3rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: '2rem', fontWeight: '900', color: 'white' },
  pageSubtitle: { color: 'var(--text-dim)', fontSize: '1rem' },
  primaryBtn: { background: '#f85149', color: 'white', border: 'none', borderRadius: '10px', padding: '0.8rem 1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', transition: 'all 0.3s ease' },
  dashboard: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' },
  statCard: { padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem' },
  statIcon: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '800', textTransform: 'uppercase' },
  statValue: { fontSize: '1.5rem', fontWeight: '900', color: 'white' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' },
  largePanel: { padding: '2rem' },
  smallPanel: { padding: '2rem' },
  panelHeader: { fontSize: '1.1rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  activityItem: { display: 'flex', gap: '1.2rem', alignItems: 'flex-start' },
  activityIcon: { width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-dim)' },
  activityTitle: { fontWeight: '700', color: 'white', fontSize: '0.9rem' },
  activityDesc: { fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' },
  activityTime: { fontSize: '0.7rem', color: 'var(--text-dim)' },
  unitStats: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  unitRow: { display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: '0.95rem' },
  tableSection: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  userHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' },
  roleTabs: { display: 'flex', gap: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '14px', border: '1px solid var(--border-glass)' },
  roleTab: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: '700', fontSize: '0.9rem' },
  countBadge: { padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', color: 'white', fontWeight: '800' },
  filterBar: { display: 'flex', gap: '1.5rem' },
  searchWrapper: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0 1.2rem', color: 'var(--text-dim)' },
  searchInput: { background: 'none', border: 'none', padding: '0.9rem', color: 'white', fontSize: '0.95rem', width: '100%', outline: 'none' },
  roleFilter: { background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0 1.5rem', fontWeight: '700', outline: 'none' },
  tableContainer: { padding: '1rem', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: { width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', fontSize: '0.8rem' },
  userName: { fontWeight: '700', color: 'white' },
  userUsername: { fontSize: '0.75rem', color: 'var(--text-dim)' },
  idBadge: { background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700' },
  deptInfo: { fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' },
  creditInfo: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  mainCredit: { fontSize: '1rem', fontWeight: '800', color: '#1f6feb' },
  slash: { opacity: 0.3, fontWeight: '300' },
  aktsText: { fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px' },
  instructorInfo: { display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'white', opacity: 0.9, fontWeight: '500' },
  actionGroup: { display: 'flex', gap: '0.5rem' },
  iconBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: 'white', transition: 'all 0.2s ease' },
  codeBadge: { background: 'rgba(31, 111, 235, 0.1)', color: '#1f6feb', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '900' },
  instructorBadge: { fontSize: '0.85rem', color: 'var(--text-dim)' },
  infraGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' },
  infraPanel: { padding: '2rem', minHeight: '500px', display: 'flex', flexDirection: 'column' },
  itemList: { display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' },
  itemCard: { padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem', color: 'white', fontWeight: '600' },
  subText: { fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { width: '500px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxHeight: '90vh' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: '1.5rem', fontWeight: '900', color: 'white' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' },
  modalScroll: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '10px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dim)', marginLeft: '4px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '1rem', color: 'var(--text-dim)' },
  input: { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0.8rem 1rem 0.8rem 2.8rem', color: 'white', fontSize: '0.95rem', outline: 'none' },
  inputGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  select: { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0.8rem', color: 'white', outline: 'none' },
  modalFooter: { marginTop: '1rem' },
  saveBtn: { width: '100%', background: '#f85149', color: 'white', border: 'none', borderRadius: '12px', padding: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', cursor: 'pointer' },
  error: { background: 'rgba(248, 81, 73, 0.1)', border: '1px solid #f85149', color: '#f85149', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' },
  success: { background: 'rgba(35, 134, 54, 0.1)', border: '1px solid #238636', color: '#238636', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' }
};

export default AdminPortal;

