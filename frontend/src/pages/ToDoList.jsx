import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react';
import TodoService from '../services/TodoService';
import {
  Alert, Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner,
  Textarea, cn, useToast,
} from '../components/ui';
import { formatDate } from '../lib/format';
import { apiError } from '../lib/errors';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CATEGORIES = ['ACADEMIC', 'EXAM', 'MEETING', 'PERSONAL'];
const PRIORITY_TONE = { LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'danger' };
const label = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '');
const today = () => new Date().toISOString().split('T')[0];
const EMPTY = { title: '', description: '', priority: 'MEDIUM', category: 'ACADEMIC', dueDate: '' };

// Backend expects LocalDateTime; the form works with plain dates
const toPayload = (t) => ({ ...t, dueDate: t.dueDate ? (t.dueDate.includes('T') ? t.dueDate : `${t.dueDate}T00:00:00`) : null });
const fromApi = (t) => ({ ...t, dueDate: t.dueDate ? t.dueDate.split('T')[0] : '' });

const GROUPS = [
  ['overdue', 'Overdue'],
  ['today', 'Today'],
  ['upcoming', 'Upcoming'],
  ['nodate', 'No due date'],
  ['done', 'Completed'],
];

const groupOf = (t) => {
  if (t.completed) return 'done';
  if (!t.dueDate) return 'nodate';
  if (t.dueDate < today()) return 'overdue';
  if (t.dueDate === today()) return 'today';
  return 'upcoming';
};

const ToDoList = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('ALL');
  const [quick, setQuick] = useState('');
  const [editor, setEditor] = useState(null); // task being edited/created
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    TodoService.getTodos()
      .then((data) => setTasks(data.map(fromApi)))
      .catch(() => setError('Could not load your tasks.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (task) => {
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    try {
      await TodoService.toggleTodo(task.id);
    } catch (err) {
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
      toast.error('Could not update task', apiError(err));
    }
  };

  const quickAdd = async (e) => {
    e.preventDefault();
    if (!quick.trim()) return;
    try {
      const added = await TodoService.addTodo(toPayload({ ...EMPTY, title: quick.trim(), dueDate: today(), category: category === 'ALL' ? 'ACADEMIC' : category }));
      setTasks((ts) => [...ts, fromApi(added)]);
      setQuick('');
    } catch (err) {
      toast.error('Could not add task', apiError(err));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editor.id) {
        const updated = fromApi(await TodoService.updateTodo(editor.id, toPayload(editor)));
        setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const added = fromApi(await TodoService.addTodo(toPayload(editor)));
        setTasks((ts) => [...ts, added]);
      }
      setEditor(null);
    } catch (err) {
      toast.error('Could not save task', apiError(err, 'Please check the fields.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await TodoService.deleteTodo(toDelete.id);
      setTasks((ts) => ts.filter((t) => t.id !== toDelete.id));
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Could not delete task', apiError(err));
    } finally {
      setToDelete(null);
    }
  };

  const grouped = useMemo(() => {
    const list = tasks.filter((t) => category === 'ALL' || t.category === category);
    const map = Object.fromEntries(GROUPS.map(([k]) => [k, []]));
    list.forEach((t) => map[groupOf(t)].push(t));
    Object.values(map).forEach((arr) => arr.sort((a, b) =>
      (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority)));
    return map;
  }, [tasks, category]);

  if (loading) return <Spinner label="Loading tasks…" />;

  const done = tasks.filter((t) => t.completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title="To-do list"
        description={tasks.length ? `${done} of ${tasks.length} done · ${pct}%` : 'Keep track of assignments, exams and meetings.'}
        actions={<Button icon={Plus} onClick={() => setEditor({ ...EMPTY, dueDate: today() })}>New task</Button>}
      />
      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      {tasks.length > 0 && (
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {['ALL', ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'h-8 rounded-full border px-3 text-xs font-medium transition-colors cursor-pointer',
              category === c ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-fg-muted hover:text-fg',
            )}
          >
            {c === 'ALL' ? 'All' : label(c)}
          </button>
        ))}
      </div>

      <Card>
        <form onSubmit={quickAdd} className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Plus className="size-4 text-fg-subtle" />
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="Add a task for today and press Enter"
            className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle"
          />
        </form>

        {tasks.length === 0 ? (
          <EmptyState icon={ListTodo} title="Nothing to do yet" description="Add your first task above." />
        ) : GROUPS.map(([key, title]) => grouped[key].length > 0 && (
          <section key={key}>
            <h3 className={cn(
              'border-b border-border bg-surface-muted px-4 py-2 text-xs font-semibold tracking-wide uppercase',
              key === 'overdue' ? 'text-danger' : 'text-fg-subtle',
            )}>
              {title} <span className="ml-1 font-normal tabular-nums">{grouped[key].length}</span>
            </h3>
            <ul className="divide-y divide-border">
              {grouped[key].map((t) => (
                <li key={t.id} className="group flex items-start gap-3 px-4 py-3">
                  <button
                    onClick={() => toggle(t)}
                    aria-label={t.completed ? 'Mark as not done' : 'Mark as done'}
                    className={cn(
                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer',
                      t.completed ? 'border-success bg-success text-white' : 'border-border-strong hover:border-accent',
                    )}
                  >
                    {t.completed && <Check className="size-3" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-medium', t.completed && 'text-fg-subtle line-through')}>{t.title}</p>
                    {t.description && <p className="mt-0.5 line-clamp-2 text-sm text-fg-subtle">{t.description}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge tone={PRIORITY_TONE[t.priority]}>{label(t.priority)}</Badge>
                      <Badge>{label(t.category)}</Badge>
                      {t.dueDate && (
                        <span className={cn('flex items-center gap-1 text-xs', key === 'overdue' ? 'text-danger' : 'text-fg-subtle')}>
                          <CalendarDays className="size-3" />{formatDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditor(t)} aria-label="Edit"><Pencil className="size-3.5" /></Button>
                    <Button variant="danger-ghost" size="icon-sm" onClick={() => setToDelete(t)} aria-label="Delete"><Trash2 className="size-3.5" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Card>

      <Modal
        open={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.id ? 'Edit task' : 'New task'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditor(null)}>Cancel</Button>
            <Button type="submit" form="task-form" loading={saving}>{editor?.id ? 'Save' : 'Add task'}</Button>
          </>
        }
      >
        {editor && (
          <form id="task-form" onSubmit={save} className="space-y-4">
            <Field label="Title" htmlFor="t-title">
              <Input id="t-title" required autoFocus value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} />
            </Field>
            <Field label="Description" htmlFor="t-desc">
              <Textarea id="t-desc" rows={3} value={editor.description ?? ''} onChange={(e) => setEditor({ ...editor, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Due date" htmlFor="t-due">
                <Input id="t-due" type="date" value={editor.dueDate} onChange={(e) => setEditor({ ...editor, dueDate: e.target.value })} />
              </Field>
              <Field label="Priority" htmlFor="t-pri">
                <Select id="t-pri" value={editor.priority} onChange={(e) => setEditor({ ...editor, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
                </Select>
              </Field>
              <Field label="Category" htmlFor="t-cat">
                <Select id="t-cat" value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
                </Select>
              </Field>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete task?"
        description={`"${toDelete?.title}" will be removed permanently.`}
      />
    </>
  );
};

export default ToDoList;
