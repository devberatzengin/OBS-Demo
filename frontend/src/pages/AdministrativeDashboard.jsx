import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GraduationCap, School, Building2, CalendarDays, Plus, Pencil, Megaphone, Layers, CheckCircle2, Save,
} from 'lucide-react';
import AdministrativeService from '../services/AdministrativeService';
import BroadcastModal from '../components/BroadcastModal';
import {
  Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Spinner, StatCard, Tabs,
  cn, useToast,
} from '../components/ui';
import { formatDate, toDate } from '../lib/format';
import { apiError } from '../lib/errors';

const isActive = (s) => !!(s?.active ?? s?.isActive);

const PERIODS = [
  { key: 'term', label: 'Semester', start: 'startDate', end: 'endDate', color: 'bg-accent' },
  { key: 'reg', label: 'Course registration', start: 'registrationStartDate', end: 'registrationEndDate', color: 'bg-info' },
  { key: 'exam', label: 'Final exams', start: 'examStartDate', end: 'examEndDate', color: 'bg-warning' },
  { key: 'makeup', label: 'Make-up exams', start: 'makeupExamStartDate', end: 'makeupExamEndDate', color: 'bg-danger' },
];

const EMPTY_SEMESTER = Object.fromEntries([['name', ''], ...PERIODS.flatMap((p) => [[p.start, ''], [p.end, '']])]);

const periodStatus = (start, end) => {
  if (!start || !end) return ['Not set', 'neutral'];
  const now = new Date();
  if (now < toDate(start)) return ['Upcoming', 'info'];
  if (now > new Date(toDate(end).getTime() + 86400000)) return ['Finished', 'neutral'];
  return ['In progress', 'success'];
};

/** Horizontal timeline of a semester's periods with a marker for today */
function SemesterTimeline({ semester }) {
  const dates = PERIODS.flatMap((p) => [semester[p.start], semester[p.end]]).filter(Boolean).map(toDate);
  if (dates.length < 2) return <EmptyState icon={CalendarDays} title="No dates set" description="Edit the semester to define its periods." />;
  const min = Math.min(...dates);
  const max = Math.max(...dates) + 86400000;
  const pos = (d) => ((toDate(d) - min) / (max - min)) * 100;
  const now = new Date().getTime();
  const todayPct = now >= min && now <= max ? ((now - min) / (max - min)) * 100 : null;

  // Month ticks
  const ticks = [];
  const t = new Date(min); t.setDate(1); t.setMonth(t.getMonth() + 1);
  while (t < max) { ticks.push(new Date(t)); t.setMonth(t.getMonth() + 1); }

  return (
    <div className="px-5 py-5">
      <div className="relative ml-44 h-5 text-[11px] text-fg-subtle">
        {ticks.map((d) => (
          <span key={d.toISOString()} className="absolute -translate-x-1/2" style={{ left: `${((d - min) / (max - min)) * 100}%` }}>
            {d.toLocaleDateString('en-GB', { month: 'short' })}
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {PERIODS.map((p) => {
          const s = semester[p.start];
          const e = semester[p.end];
          const [status, tone] = periodStatus(s, e);
          return (
            <div key={p.key} className="flex items-center gap-4">
              <div className="w-40 shrink-0">
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-fg-subtle">{s && e ? `${formatDate(s, { day: 'numeric', month: 'short' })} – ${formatDate(e, { day: 'numeric', month: 'short' })}` : 'Not set'}</p>
              </div>
              <div className="relative h-8 flex-1 rounded-md bg-surface-muted">
                {ticks.map((d) => (
                  <span key={d.toISOString()} className="absolute inset-y-0 w-px bg-border" style={{ left: `${((d - min) / (max - min)) * 100}%` }} />
                ))}
                {s && e && (
                  <div className={cn('absolute inset-y-1.5 rounded', p.color, tone === 'neutral' && status === 'Finished' && 'opacity-40')}
                    style={{ left: `${pos(s)}%`, width: `${Math.max(1, ((toDate(e) - toDate(s) + 86400000) / (max - min)) * 100)}%` }} />
                )}
                {todayPct != null && <span className="absolute -inset-y-1 w-0.5 rounded bg-fg" style={{ left: `${todayPct}%` }} />}
              </div>
              <Badge tone={tone} className="w-24 justify-center">{status}</Badge>
            </div>
          );
        })}
      </div>
      {todayPct != null && <p className="mt-3 ml-44 text-xs text-fg-subtle">The dark line marks today.</p>}
    </div>
  );
}

function SemesterForm({ form, setForm }) {
  return (
    <div className="space-y-5">
      <Field label="Name" htmlFor="sem-name">
        <Input id="sem-name" required placeholder="2026-2027 Spring" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      {PERIODS.map((p) => (
        <fieldset key={p.key}>
          <legend className="mb-1.5 text-sm font-medium">{p.label}</legend>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" aria-label={`${p.label} start`} required value={form[p.start] ?? ''} onChange={(e) => setForm({ ...form, [p.start]: e.target.value })} />
            <Input type="date" aria-label={`${p.label} end`} required min={form[p.start] || undefined} value={form[p.end] ?? ''} onChange={(e) => setForm({ ...form, [p.end]: e.target.value })} />
          </div>
        </fieldset>
      ))}
    </div>
  );
}

const AdministrativeDashboard = () => {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = ['overview', 'calendar', 'infrastructure'].includes(params.get('tab')) ? params.get('tab') : 'overview';
  const setTab = (id) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true });

  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editor, setEditor] = useState(null); // { id?, form }
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(null);
  const [broadcast, setBroadcast] = useState(false);

  const load = useCallback(() => Promise.all([
    AdministrativeService.getFaculties(),
    AdministrativeService.getDepartments(),
    AdministrativeService.getSemesters(),
    AdministrativeService.getStats(),
  ]).then(([f, d, s, st]) => {
    setFaculties(f ?? []); setDepartments(d ?? []); setSemesters(s ?? []); setStats(st);
  }).catch((err) => setError(apiError(err, 'Could not load portal data.')))
    .finally(() => setLoading(false)), []);

  useEffect(() => { load(); }, [load]);

  const sorted = [...semesters].sort((a, b) => (isActive(b) - isActive(a)) || String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')));
  const active = semesters.find(isActive);
  const selected = semesters.find((s) => s.id === selectedId) ?? active ?? sorted[0];

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editor.id) await AdministrativeService.updateSemester(editor.id, editor.form);
      else await AdministrativeService.createSemester(editor.form);
      toast.success(editor.id ? 'Semester updated' : 'Semester created');
      setEditor(null);
      load();
    } catch (err) {
      toast.error('Could not save semester', apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const activate = async (s) => {
    setActivating(s.id);
    try {
      await AdministrativeService.activateSemester(s.id);
      toast.success(`${s.name} is now active`, 'Registration and schedules use this semester.');
      load();
    } catch (err) {
      toast.error('Could not activate semester', apiError(err));
    } finally {
      setActivating(null);
    }
  };

  if (loading) return <Spinner label="Loading…" />;
  if (error) return <Card className="mx-auto mt-16 max-w-md"><EmptyState title="Something went wrong" description={error} /></Card>;

  return (
    <>
      <PageHeader
        eyebrow={stats?.unitName ?? 'Student affairs'}
        title="Staff portal"
        description="Academic calendar, organisation and university-wide announcements."
        actions={
          <>
            <Button variant="secondary" icon={Megaphone} onClick={() => setBroadcast(true)}>Broadcast</Button>
            <Button icon={Plus} onClick={() => setEditor({ form: { ...EMPTY_SEMESTER } })}>New semester</Button>
          </>
        }
      />

      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'calendar', label: 'Academic calendar', count: semesters.length },
        { id: 'infrastructure', label: 'Organisation' },
      ]} />

      {tab === 'overview' && (
        <>
          {!active && <Alert tone="warning" title="No active semester" className="mb-6">Students cannot register for courses until a semester is activated.</Alert>}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Students" value={stats?.studentCount ?? 0} icon={GraduationCap} />
            <StatCard label="Academicians" value={stats?.academicianCount ?? 0} icon={School} tone="info" />
            <StatCard label="Departments" value={stats?.departmentCount ?? departments.length} icon={Layers} tone="info" hint={`${stats?.facultyCount ?? faculties.length} faculties`} />
            <StatCard label="Active semester" value={active?.name ?? 'None'} icon={CalendarDays} tone={active ? 'success' : 'warning'} />
          </div>
          {active && (
            <Card className="mt-6">
              <CardHeader icon={CalendarDays} title={active.name} description="Current semester timeline"
                action={<Button size="sm" variant="ghost" onClick={() => setTab('calendar')}>Manage</Button>} />
              <SemesterTimeline semester={active} />
            </Card>
          )}
        </>
      )}

      {tab === 'calendar' && (
        semesters.length === 0 ? (
          <Card><EmptyState icon={CalendarDays} title="No semesters yet" action={<Button icon={Plus} onClick={() => setEditor({ form: { ...EMPTY_SEMESTER } })}>New semester</Button>} /></Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <Card className="self-start">
              <ul className="divide-y divide-border">
                {sorted.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => setSelectedId(s.id)}
                      className={cn('flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors cursor-pointer',
                        selected?.id === s.id ? 'bg-accent-soft' : 'hover:bg-surface-hover')}>
                      <div className="min-w-0">
                        <p className={cn('truncate text-sm font-medium', selected?.id === s.id && 'text-accent')}>{s.name}</p>
                        <p className="text-xs text-fg-subtle">{s.startDate ? `${formatDate(s.startDate, { month: 'short', year: 'numeric' })} – ${formatDate(s.endDate, { month: 'short', year: 'numeric' })}` : 'Dates not set'}</p>
                      </div>
                      {isActive(s) && <Badge tone="success">Active</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            {selected && (
              <Card>
                <CardHeader
                  icon={CalendarDays}
                  title={selected.name}
                  description={isActive(selected) ? 'Active semester' : 'Inactive'}
                  action={
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" icon={Pencil}
                        onClick={() => setEditor({ id: selected.id, form: { ...EMPTY_SEMESTER, ...Object.fromEntries(Object.entries(selected).map(([k, v]) => [k, v ?? ''])) } })}>
                        Edit
                      </Button>
                      {!isActive(selected) && (
                        <Button size="sm" icon={CheckCircle2} loading={activating === selected.id} onClick={() => activate(selected)}>Set active</Button>
                      )}
                    </div>
                  }
                />
                <SemesterTimeline semester={selected} />
              </Card>
            )}
          </div>
        )
      )}

      {tab === 'infrastructure' && (
        faculties.length === 0 ? <Card><EmptyState icon={Building2} title="No faculties defined" /></Card> : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {faculties.map((f) => {
              const depts = departments.filter((d) => d.facultyId === f.id || d.facultyName === f.name);
              return (
                <Card key={f.id}>
                  <CardHeader icon={Building2} title={f.name} description={`${depts.length} department${depts.length === 1 ? '' : 's'}`} />
                  {depts.length === 0 ? <EmptyState icon={Layers} title="No departments" /> : (
                    <ul className="divide-y divide-border">
                      {depts.map((d) => (
                        <li key={d.id} className="flex items-center gap-2 px-5 py-3 text-sm font-medium">
                          <Layers className="size-4 text-fg-subtle" />{d.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}

      <Modal
        open={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.id ? 'Edit semester' : 'New semester'}
        description="Define the term, registration window and exam periods."
        footer={<><Button variant="ghost" onClick={() => setEditor(null)}>Cancel</Button><Button type="submit" form="sem-form" icon={Save} loading={saving}>{editor?.id ? 'Save changes' : 'Create semester'}</Button></>}
      >
        {editor && (
          <form id="sem-form" onSubmit={save}>
            <SemesterForm form={editor.form} setForm={(form) => setEditor({ ...editor, form })} />
          </form>
        )}
      </Modal>

      <BroadcastModal open={broadcast} onClose={() => setBroadcast(false)} />
    </>
  );
};

export default AdministrativeDashboard;
