import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  Circle, 
  Calendar, 
  Flag,
  Tag,
  AlertCircle,
  MoreVertical,
  Loader2,
  X,
  Edit2
} from 'lucide-react';
import TodoService from '../services/TodoService';

const ToDoList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, COMPLETED

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'ACADEMIC',
    dueDate: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);



  const toggleTask = async (id) => {
    try {
      await TodoService.toggleTodo(id);
      setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
    } catch (err) {
      console.error('Failed to toggle task');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await TodoService.deleteTodo(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      console.error('Failed to delete task');
    }
  };

  const openAddModal = () => {
    setCurrentTask({
      title: '',
      description: '',
      priority: 'MEDIUM',
      category: 'ACADEMIC',
      dueDate: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setCurrentTask(task);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const taskToSave = {
        ...currentTask,
        dueDate: currentTask.dueDate ? (currentTask.dueDate.includes('T') ? currentTask.dueDate : `${currentTask.dueDate}T00:00:00`) : null
      };

      if (isEditing) {
        const updated = await TodoService.updateTodo(currentTask.id, taskToSave);
        setTasks(tasks.map(t => t.id === updated.id ? {
          ...updated,
          dueDate: updated.dueDate ? updated.dueDate.split('T')[0] : ''
        } : t));
      } else {
        const added = await TodoService.addTodo(taskToSave);
        setTasks([...tasks, {
          ...added,
          dueDate: added.dueDate ? added.dueDate.split('T')[0] : ''
        }]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save task');
      alert("Failed to save task. Please check the fields.");
    }
  };

  const fetchTodos = async () => {
    try {
      const data = await TodoService.getTodos();
      // Format dates for input
      const formatted = data.map(t => ({
        ...t,
        dueDate: t.dueDate ? t.dueDate.split('T')[0] : ''
      }));
      setTasks(formatted);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'ACTIVE') return !t.completed;
    if (filter === 'COMPLETED') return t.completed;
    return true;
  });

  if (loading) return (
    <div style={styles.center}>
      <Loader2 className="animate-spin" size={40} color="var(--accent-student)" />
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>To-Do List</h1>
          <p style={styles.subtitle}>Stay organized and track your academic progress</p>
        </div>
        <div className="glass-card" style={styles.progressCard}>
          <div style={styles.progressInfo}>
            <p style={styles.progressLabel}>Progress</p>
            <p style={styles.progressValue}>
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}% Complete
            </p>
          </div>
          <CheckCircle size={32} color="var(--accent-student)" />
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', borderRadius: '12px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={styles.controls}>
        <div style={styles.filters}>
          {['ALL', 'ACTIVE', 'COMPLETED'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                background: filter === f ? 'var(--accent-student)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? 'white' : 'var(--text-dim)'
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={openAddModal} className="btn-primary" style={styles.addBtnMain}>
          <Plus size={20} /> New Task
        </button>
      </div>

      <div style={styles.taskList}>
        {filteredTasks.map((task) => (
          <div 
            key={task.id}
            className="glass-card"
            style={{
              ...styles.taskCard,
              opacity: task.completed ? 0.6 : 1,
              borderColor: task.completed ? 'transparent' : 'var(--border-glass)'
            }}
          >
            <div style={styles.taskMain}>
              <button 
                onClick={() => toggleTask(task.id)}
                style={styles.toggleBtn}
              >
                {task.completed ? 
                  <CheckCircle size={28} color="var(--accent-student)" /> : 
                  <Circle size={28} color="var(--text-dim)" />
                }
              </button>
              
              <div style={styles.taskContent}>
                <h3 style={{
                  ...styles.taskText,
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? 'var(--text-dim)' : 'var(--text-primary)'
                }}>
                  {task.title}
                </h3>
                {task.description && <p style={styles.taskDesc}>{task.description}</p>}
                <div style={styles.taskMeta}>
                  <div style={styles.metaItem}><Calendar size={14} /> {task.dueDate || 'No Date'}</div>
                  <div style={styles.metaItem}><Tag size={14} /> {task.category}</div>
                  <div style={{
                    ...styles.metaItem,
                    color: task.priority === 'CRITICAL' ? '#ff4d4d' : 
                           task.priority === 'HIGH' ? '#ff9f43' : 
                           task.priority === 'MEDIUM' ? '#54a0ff' : '#a29bfe',
                    background: task.priority === 'CRITICAL' ? 'rgba(255, 77, 77, 0.1)' : 'transparent',
                    padding: task.priority === 'CRITICAL' ? '2px 8px' : '0',
                    borderRadius: '4px'
                  }}>
                    <Flag size={14} fill={task.priority === 'CRITICAL' ? '#ff4d4d' : 'transparent'} /> 
                    {task.priority}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.taskActions}>
              <button onClick={() => openEditModal(task)} style={styles.actionBtn}>
                <Edit2 size={18} />
              </button>
              <button onClick={() => deleteTask(task.id)} style={{...styles.actionBtn, color: '#f85149'}}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div style={styles.emptyState}>
          <AlertCircle size={48} color="var(--text-dim)" />
          <h3 style={styles.emptyTitle}>No tasks found</h3>
          <p style={styles.emptySub}>Add a task or change your filter.</p>
        </div>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>{isEditing ? 'Edit Task' : 'Add New Task'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}><X /></button>
            </div>
            <form onSubmit={handleSaveTask} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label>Title</label>
                <input 
                  type="text" 
                  required
                  value={currentTask.title}
                  onChange={e => setCurrentTask({...currentTask, title: e.target.value})}
                  placeholder="What needs to be done?"
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  value={currentTask.description}
                  onChange={e => setCurrentTask({...currentTask, description: e.target.value})}
                  placeholder="Details..."
                  style={styles.modalTextarea}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Priority</label>
                  <select 
                    value={currentTask.priority}
                    onChange={e => setCurrentTask({...currentTask, priority: e.target.value})}
                    style={styles.modalSelect}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label>Category</label>
                  <select 
                    value={currentTask.category}
                    onChange={e => setCurrentTask({...currentTask, category: e.target.value})}
                    style={styles.modalSelect}
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="EXAM">Exam</option>
                    <option value="MEETING">Meeting</option>
                    <option value="PERSONAL">Personal</option>
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label>Due Date</label>
                <input 
                  type="date" 
                  value={currentTask.dueDate || ''}
                  onChange={e => setCurrentTask({...currentTask, dueDate: e.target.value})}
                  style={styles.modalInput}
                />
              </div>
              <button type="submit" className="btn-primary" style={styles.saveBtn}>
                {isEditing ? 'Update Task' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem'
  },
  progressCard: {
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    borderRadius: '20px'
  },
  progressInfo: {
    textAlign: 'right'
  },
  progressLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--accent-student)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  progressValue: {
    fontSize: '1.1rem',
    fontWeight: '700'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem'
  },
  filters: {
    display: 'flex',
    gap: '0.5rem',
    background: 'rgba(255,255,255,0.03)',
    padding: '0.4rem',
    borderRadius: '12px'
  },
  filterBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer'
  },
  addBtnMain: {
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.8rem 1.5rem',
    fontWeight: '700'
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  taskCard: {
    padding: '1.2rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '24px',
    transition: 'var(--transition)'
  },
  taskMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flex: 1
  },
  toggleBtn: {
    background: 'transparent',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer'
  },
  taskContent: {
    flex: 1
  },
  taskText: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '0.4rem'
  },
  taskDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-dim)',
    marginBottom: '0.6rem'
  },
  taskMeta: {
    display: 'flex',
    gap: '1.2rem'
  },
  metaItem: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  taskActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  actionBtn: {
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--text-dim)',
    padding: '0.6rem',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
        background: 'rgba(255,255,255,0.1)'
    }
  },
  emptyState: {
    textAlign: 'center',
    padding: '5rem 2rem',
    border: '2px dashed var(--border-glass)',
    borderRadius: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    color: 'var(--text-dim)'
  },
  emptyTitle: {
    fontSize: '1.5rem',
    color: 'var(--text-primary)'
  },
  emptySub: {
    fontSize: '0.9rem'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)'
  },
  modal: {
    width: '100%',
    maxWidth: '500px',
    padding: '2rem',
    borderRadius: '24px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-dim)',
    cursor: 'pointer'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '1rem'
  },
  modalInput: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '0.8rem',
    color: 'white',
    outline: 'none'
  },
  modalTextarea: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '0.8rem',
    color: 'white',
    outline: 'none',
    minHeight: '100px',
    resize: 'vertical'
  },
  modalSelect: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '0.8rem',
    color: 'white',
    outline: 'none'
  },
  saveBtn: {
    marginTop: '1rem',
    padding: '1rem',
    borderRadius: '12px',
    fontWeight: '700'
  }
};

export default ToDoList;
