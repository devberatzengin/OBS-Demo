import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, TriangleAlert, XCircle } from 'lucide-react';
import StudentService from '../services/StudentService';
import { Alert, Badge, Card, EmptyState, PageHeader, Spinner, StatCard, cn } from '../components/ui';

const THRESHOLD = 70; // minimum attendance %, mirrors the backend rule

const statusOf = (item) => {
  if (item.isLimitExceeded) return ['danger', 'Limit exceeded'];
  if (item.totalHours > 0 && item.attendancePercentage < THRESHOLD + 10) return ['warning', 'At risk'];
  return ['success', 'Good standing'];
};

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    StudentService.getAttendance()
      .then(setAttendance)
      .catch(() => setError('Could not load attendance.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading attendance…" />;

  const totalHours = attendance.reduce((s, a) => s + a.totalHours, 0);
  const present = attendance.reduce((s, a) => s + a.presentHours, 0);
  const overall = totalHours ? (present / totalHours) * 100 : 0;
  const exceeded = attendance.filter((a) => a.isLimitExceeded);

  return (
    <>
      <PageHeader title="Attendance" description={`You need at least ${THRESHOLD}% attendance in each course.`} />

      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}
      {exceeded.length > 0 && (
        <Alert tone="danger" title="Attendance limit exceeded" className="mb-6">
          {exceeded.map((a) => a.courseCode).join(', ')} {exceeded.length > 1 ? 'are' : 'is'} below {THRESHOLD}%. Talk to your instructor or advisor.
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Overall attendance" value={totalHours ? `${Math.round(overall)}%` : '—'} icon={ClipboardCheck}
          tone={overall >= THRESHOLD ? 'success' : 'danger'} hint={`${present} of ${totalHours} hours`} />
        <StatCard label="Hours missed" value={totalHours - present} icon={XCircle} tone="warning" />
        <StatCard label="Courses at risk" value={attendance.filter((a) => statusOf(a)[0] !== 'success').length} icon={TriangleAlert}
          tone={exceeded.length ? 'danger' : 'info'} />
      </div>

      {attendance.length === 0 ? (
        <Card><EmptyState icon={ClipboardCheck} title="No attendance recorded yet" description="Your instructors haven't taken attendance this semester." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {attendance.map((a) => {
            const [tone, label] = statusOf(a);
            const pct = Math.round(a.attendancePercentage);
            // Absences still allowed if no further classes are missed, based on hours recorded so far
            const allowed = Math.max(Math.floor(a.totalHours * (1 - THRESHOLD / 100)) - a.absentHours, 0);
            return (
              <Card key={a.courseCode} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-accent">{a.courseCode}</p>
                    <p className="mt-0.5 truncate text-sm font-medium">{a.courseName}</p>
                  </div>
                  <Badge tone={tone}>{label}</Badge>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <p className={cn('text-3xl font-semibold tabular-nums', tone === 'danger' && 'text-danger')}>{pct}%</p>
                  <p className="text-xs text-fg-subtle">{a.presentHours}/{a.totalHours} hours</p>
                </div>

                <div className="relative mt-2 h-2 rounded-full bg-surface-muted">
                  <div
                    className={cn('h-full rounded-full', tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : 'bg-success')}
                    style={{ width: `${Math.min(a.attendancePercentage, 100)}%` }}
                  />
                  <div className="absolute -top-1 h-4 w-px bg-fg-subtle" style={{ left: `${THRESHOLD}%` }} title={`${THRESHOLD}% minimum`} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success" />
                    <span className="text-fg-muted">Present</span>
                    <span className="ml-auto font-medium tabular-nums">{a.presentHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="size-4 text-danger" />
                    <span className="text-fg-muted">Absent</span>
                    <span className="ml-auto font-medium tabular-nums">{a.absentHours}</span>
                  </div>
                </div>
                {!a.isLimitExceeded && a.totalHours > 0 && (
                  <p className="mt-3 text-xs text-fg-subtle">
                    {allowed === 0 ? 'No more absences allowed at the current pace.' : `You can miss about ${allowed} more hour${allowed === 1 ? '' : 's'} so far.`}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default AttendancePage;
