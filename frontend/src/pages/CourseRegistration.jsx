import { useEffect, useMemo, useState } from 'react';
import CourseService from '../services/CourseService';
import { BookOpen, Check, Clock, Lock, Plus, Search, TriangleAlert, X } from 'lucide-react';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, Spinner, cn, useToast } from '../components/ui';
import { apiError } from '../lib/errors';

const AKTS_LIMIT = 30;
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'selected', label: 'Selected' },
  { key: 'enrolled', label: 'Enrolled' },
];

const CourseRegistration = () => {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const data = await CourseService.getAvailableCourses();
    setCourses(data);
    return data;
  };

  useEffect(() => {
    CourseService.getAvailableCourses()
      .then((data) => {
        setCourses(data);
        // Failed (FF) courses that are not yet registered are pre-selected
        setSelected(data.filter((c) => c.mandatory && !c.registered));
      })
      .catch(() => setError('Could not load courses. The backend may still be starting.'))
      .finally(() => setLoading(false));
  }, []);

  const isSelected = (c) => selected.some((s) => s.id === c.id);

  const toggle = (course) => {
    if (course.registered) return;
    if (course.passed) {
      toast.info('Already passed', `You passed ${course.code} with ${course.grade}. Only DD and DC can be retaken.`);
      return;
    }
    if (isSelected(course)) {
      if (course.mandatory) {
        toast.info('This course is required', 'You failed it previously, so it must be retaken.');
        return;
      }
      setSelected(selected.filter((c) => c.id !== course.id));
    } else {
      setSelected([...selected, course]);
    }
  };

  const enrolledAkts = courses.filter((c) => c.registered).reduce((s, c) => s + c.akts, 0);
  const selectedAkts = selected.reduce((s, c) => s + c.akts, 0);
  const totalAkts = enrolledAkts + selectedAkts;
  const overLimit = totalAkts > AKTS_LIMIT;

  const handleRegister = async () => {
    const newCourses = selected.filter((c) => !c.registered);
    if (newCourses.length === 0) return;
    setSubmitting(true);
    try {
      await CourseService.enroll(newCourses.map((c) => c.id));
      toast.success('Registration submitted', `${newCourses.length} course(s) sent for advisor approval.`);
      setSelected([]);
      await load();
    } catch (err) {
      toast.error('Registration failed', apiError(err, 'Check ECTS limits or timetable conflicts.'));
      await load().catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.instructorName?.toLowerCase().includes(q))
      .filter((c) => {
        if (filter === 'enrolled') return c.registered;
        if (filter === 'available') return !c.registered;
        if (filter === 'selected') return selected.some((s) => s.id === c.id);
        return true;
      })
      .sort((a, b) => Number(b.mandatory && !b.registered) - Number(a.mandatory && !a.registered));
  }, [courses, query, filter, selected]);

  const counts = {
    all: courses.length,
    available: courses.filter((c) => !c.registered).length,
    selected: selected.length,
    enrolled: courses.filter((c) => c.registered).length,
  };

  if (loading) return <Spinner label="Loading courses…" />;
  if (error) return <Alert tone="danger" title="Course registration unavailable">{error}</Alert>;

  const mandatoryPending = courses.filter((c) => c.mandatory && !c.registered);

  return (
    <>
      <PageHeader
        title="Course registration"
        description="Pick this semester's courses. Your advisor approves them after you submit."
      />

      {mandatoryPending.length > 0 && (
        <Alert tone="warning" title="Required retakes" className="mb-6">
          {mandatoryPending.map((c) => c.code).join(', ')} {mandatoryPending.length > 1 ? 'were' : 'was'} failed
          previously and must be taken again this semester. They are already selected.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Catalogue */}
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="min-w-56 flex-1">
              <Input icon={Search} placeholder="Search by code, name or instructor" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'h-7 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer',
                    filter === f.key ? 'bg-surface text-fg shadow-card ring-1 ring-border' : 'text-fg-subtle hover:text-fg',
                  )}
                >
                  {f.label} <span className="ml-0.5 text-fg-subtle tabular-nums">{counts[f.key]}</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses match" description="Try a different search or filter." />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((c) => {
                const sel = isSelected(c);
                const pending = c.registered && c.status === 'PENDING';
                const locked = c.registered || c.passed;
                return (
                  <li
                    key={c.id}
                    onClick={() => toggle(c)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3.5 transition-colors',
                      locked ? 'cursor-default' : 'cursor-pointer hover:bg-surface-hover/60',
                      c.passed && 'opacity-60',
                      sel && 'bg-accent-soft/60 hover:bg-accent-soft',
                    )}
                  >
                    {/* selection control */}
                    <div
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-md border',
                        locked ? 'border-border bg-surface-muted text-fg-subtle'
                          : sel ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong bg-surface',
                      )}
                    >
                      {locked ? <Lock className="size-3" /> : sel && <Check className="size-3.5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold tracking-wide text-accent">{c.code}</span>
                        {c.mandatory && !c.registered && <Badge tone="warning" icon={TriangleAlert}>Required retake</Badge>}
                        {pending && <Badge tone="warning" icon={Clock}>Awaiting approval</Badge>}
                        {c.registered && !pending && <Badge tone="success" icon={Check}>Enrolled</Badge>}
                        {c.status === 'REJECTED' && !c.registered && <Badge tone="danger" icon={X}>Rejected</Badge>}
                        {c.passed && <Badge tone="neutral">Passed · {c.grade}</Badge>}
                        {!c.passed && !c.mandatory && c.grade && <Badge tone="accent">Retake to raise {c.grade}</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-fg-subtle">{c.instructorName}</p>
                    </div>

                    <div className="hidden text-right text-xs text-fg-subtle sm:block">
                      <p className="text-sm font-semibold text-fg tabular-nums">{c.akts} ECTS</p>
                      <p>{c.credits} credits</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Summary */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card>
            <CardHeader title="Your semester" description={`${counts.enrolled} enrolled · ${selected.length} selected`} />
            <div className="p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-fg-muted">ECTS load</span>
                <span className={cn('text-lg font-semibold tabular-nums', overLimit && 'text-danger')}>
                  {totalAkts}<span className="text-sm font-normal text-fg-subtle"> / {AKTS_LIMIT}</span>
                </span>
              </div>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-surface-muted">
                <div className="bg-success transition-all" style={{ width: `${Math.min(enrolledAkts / AKTS_LIMIT, 1) * 100}%` }} />
                <div
                  className={cn('transition-all', overLimit ? 'bg-danger' : 'bg-accent')}
                  style={{ width: `${Math.min(selectedAkts / AKTS_LIMIT, Math.max(0, 1 - enrolledAkts / AKTS_LIMIT)) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex gap-4 text-xs text-fg-subtle">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />Enrolled {enrolledAkts}</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" />Selected {selectedAkts}</span>
              </div>
              {overLimit && (
                <Alert tone="danger" className="mt-4">Remove {totalAkts - AKTS_LIMIT} ECTS to stay within the limit.</Alert>
              )}
            </div>

            <div className="border-t border-border">
              {selected.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-fg-subtle">Select courses from the list to add them here.</p>
              ) : (
                <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                  {selected.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-5 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-accent">{c.code}</p>
                        <p className="truncate text-sm">{c.name}</p>
                      </div>
                      <span className="text-xs text-fg-subtle tabular-nums">{c.akts}</span>
                      {!c.mandatory && (
                        <button onClick={() => toggle(c)} aria-label={`Remove ${c.code}`} className="rounded p-1 text-fg-subtle hover:bg-surface-hover hover:text-fg cursor-pointer">
                          <X className="size-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-border p-4">
              <Button
                className="w-full justify-center"
                icon={Plus}
                loading={submitting}
                disabled={selected.length === 0 || overLimit}
                onClick={handleRegister}
              >
                Submit {selected.length > 0 ? `${selected.length} course${selected.length > 1 ? 's' : ''}` : 'registration'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CourseRegistration;
