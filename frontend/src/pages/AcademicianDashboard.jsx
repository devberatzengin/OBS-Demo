import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AcademicianService from '../services/AcademicianService';
import {
  BookOpen, Users, ClipboardCheck, Clock, CalendarDays, MapPin, Check, X, GraduationCap, ChevronRight,
} from 'lucide-react';
import {
  Alert, Badge, Button, Card, CardHeader, EmptyState, PageHeader, Spinner, StatCard, useToast,
} from '../components/ui';
import { formatTime, todayKey } from '../lib/format';
import { apiError } from '../lib/errors';

const minutes = (t) => {
  const [h, m] = formatTime(t).split(':').map(Number);
  return h * 60 + (m || 0);
};

const AcademicianDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => Promise.allSettled([
    AcademicianService.getMyCourses(),
    AcademicianService.getPendingEnrollments(),
    AcademicianService.getMySchedule(),
  ]).then(([c, p, s]) => {
    if (c.status === 'rejected') throw c.reason;
    setCourses(c.value ?? []);
    setPending(p.value ?? []);
    setSchedule(s.value ?? []);
  }).catch(() => setError('Could not load your dashboard. Make sure the backend is running.'))
    .finally(() => setLoading(false)), []);

  useEffect(() => { load(); }, [load]);

  const decide = async (enrollment, approve) => {
    setBusyId(enrollment.id);
    try {
      if (approve) await AcademicianService.approveEnrollment(enrollment.id);
      else await AcademicianService.rejectEnrollment(enrollment.id);
      setPending((list) => list.filter((e) => e.id !== enrollment.id));
      toast.success(approve ? 'Enrollment approved' : 'Enrollment rejected', `${enrollment.studentName} · ${enrollment.courseCode}`);
    } catch (err) {
      toast.error('Could not update enrollment', apiError(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error) {
    return (
      <Card className="mx-auto mt-16 max-w-md">
        <EmptyState title="Something went wrong" description={error}
          action={<Button onClick={() => { setLoading(true); setError(null); load(); }}>Try again</Button>} />
      </Card>
    );
  }

  const totalStudents = courses.reduce((sum, c) => sum + (c.studentCount ?? 0), 0);
  const weeklyHours = schedule.reduce((sum, s) => sum + Math.max(0, minutes(s.endTime) - minutes(s.startTime)), 0) / 60;
  const key = todayKey();
  const today = schedule
    .filter((s) => s.dayOfWeek === key)
    .sort((a, b) => minutes(a.startTime) - minutes(b.startTime));

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`Welcome back, ${user?.firstName ?? ''}`}
        description="Your courses, today's classes and advisee requests at a glance."
      />

      {pending.length > 0 && (
        <Alert tone="warning" title={`${pending.length} enrollment request${pending.length > 1 ? 's' : ''} waiting`} className="mb-6">
          Advisees cannot finalise their registration until you approve.{' '}
          <Link to="/academician/advisees" className="font-medium underline underline-offset-2">Review all</Link>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courses" value={courses.length} icon={BookOpen} hint="this semester" />
        <Link to="/academician/students" className="block">
          <StatCard label="Students" value={totalStudents} icon={Users} tone="info" hint="across all courses" onClick={() => {}} />
        </Link>
        <StatCard label="Pending approvals" value={pending.length} icon={ClipboardCheck} tone={pending.length ? 'warning' : 'success'} hint="advisee enrollments" />
        <StatCard label="Teaching hours" value={Number.isInteger(weeklyHours) ? weeklyHours : weeklyHours.toFixed(1)} icon={Clock} tone="info" hint="per week" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Courses */}
        <Card className="xl:col-span-2">
          <CardHeader icon={BookOpen} title="My courses" description="Open a course to grade, take attendance or manage exams." />
          {courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses assigned" description="Courses assigned to you by the administration will appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {courses.map((c) => (
                <li key={c.id} className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-surface-hover/60">
                  <Link to={`/academician/courses/${c.id}`} className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-wide text-accent">{c.code}</p>
                    <p className="truncate text-sm font-medium">{c.name}</p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge icon={Users}>{c.studentCount ?? 0}</Badge>
                    {c.akts != null && <Badge>{c.akts} ECTS</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link to={`/academician/courses/${c.id}?tab=grading`}>
                      <Button size="sm" variant="ghost" icon={GraduationCap}>Grades</Button>
                    </Link>
                    <Link to={`/academician/courses/${c.id}?tab=attendance`}>
                      <Button size="sm" variant="ghost" icon={ClipboardCheck}>Attendance</Button>
                    </Link>
                    <Link to={`/academician/courses/${c.id}`} aria-label={`Open ${c.code}`}
                      className="rounded-md p-1.5 text-fg-subtle hover:bg-surface-hover hover:text-fg">
                      <ChevronRight className="size-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Today */}
        <Card>
          <CardHeader
            icon={CalendarDays}
            title="Today"
            action={<Link to="/academician/schedule" className="text-sm font-medium text-accent hover:underline">Full week</Link>}
          />
          {today.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No classes today" />
          ) : (
            <ul className="divide-y divide-border">
              {today.map((s, i) => (
                <li key={`${s.courseId}-${i}`} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-14 shrink-0 text-sm tabular-nums">
                    <p className="font-semibold">{formatTime(s.startTime)}</p>
                    <p className="text-fg-subtle">{formatTime(s.endTime)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.courseCode}</p>
                    <p className="truncate text-xs text-fg-subtle">{s.courseName}</p>
                  </div>
                  {s.classroomName && <Badge icon={MapPin}>{s.classroomName}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Pending enrollments */}
        <Card className="xl:col-span-3">
          <CardHeader
            icon={ClipboardCheck}
            title="Enrollment requests"
            description="Course selections from your advisees awaiting approval."
            action={<Link to="/academician/advisees" className="text-sm font-medium text-accent hover:underline">Advisees</Link>}
          />
          {pending.length === 0 ? (
            <EmptyState icon={Check} title="Nothing to review" description="All advisee enrollments are up to date." />
          ) : (
            <ul className="divide-y divide-border">
              {pending.slice(0, 6).map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-fg-muted">
                    {e.studentName?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.studentName}</p>
                    <p className="truncate text-xs text-fg-subtle"><span className="font-medium text-accent">{e.courseCode}</span> · {e.courseName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" icon={X} disabled={busyId === e.id} onClick={() => decide(e, false)}>Reject</Button>
                    <Button size="sm" icon={Check} loading={busyId === e.id} onClick={() => decide(e, true)}>Approve</Button>
                  </div>
                </li>
              ))}
              {pending.length > 6 && (
                <li className="px-5 py-3 text-sm text-fg-subtle">
                  +{pending.length - 6} more · <Link to="/academician/advisees" className="font-medium text-accent hover:underline">see all</Link>
                </li>
              )}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default AcademicianDashboard;
