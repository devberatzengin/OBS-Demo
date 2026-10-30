import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CalendarCheck2, Clock, MapPin, Percent } from 'lucide-react';
import StudentService from '../services/StudentService';
import { Alert, Badge, Card, CardHeader, EmptyState, PageHeader, Spinner, StatCard, cn } from '../components/ui';
import { examTypeLabel, formatTime, relativeDays, toDate } from '../lib/format';

const STATUS = {
  UPCOMING: ['accent', 'Upcoming'],
  ATTENDED: ['success', 'Attended'],
  MISSED: ['danger', 'Missed'],
};

const TYPE_TONE = { FINAL: 'danger', MIDTERM: 'info', MAKEUP: 'warning', QUIZ: 'neutral' };

function ExamRow({ exam }) {
  const d = toDate(exam.examDate);
  const [tone, label] = STATUS[exam.status] ?? ['neutral', exam.status];
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-border bg-surface-muted py-1.5">
        <span className="text-[10px] font-semibold tracking-wide text-fg-subtle uppercase">
          {d.toLocaleDateString('en-GB', { month: 'short' })}
        </span>
        <span className="text-xl leading-tight font-semibold tabular-nums">{d.getDate()}</span>
        <span className="text-[10px] text-fg-subtle">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TYPE_TONE[exam.examType] ?? 'neutral'}>{examTypeLabel(exam.examType)}</Badge>
          <span className="text-xs font-semibold text-accent">{exam.courseCode}</span>
        </div>
        <p className="mt-1 truncate text-sm font-medium">{exam.courseName}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-subtle">
          <span className="flex items-center gap-1"><Clock className="size-3.5" />{formatTime(exam.examDate)}</span>
          <span className="flex items-center gap-1"><MapPin className="size-3.5" />{exam.classroomCode || 'Room TBA'}</span>
          {exam.ratio != null && <span className="flex items-center gap-1"><Percent className="size-3.5" />{exam.ratio}% of grade</span>}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge tone={tone}>{label}</Badge>
        {exam.status === 'UPCOMING' && <span className="text-xs text-fg-subtle">{relativeDays(exam.examDate)}</span>}
      </div>
    </li>
  );
}

const ExamCalendar = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    StudentService.getExamCalendar()
      .then(setExams)
      .catch(() => setError('Could not load the exam calendar.'))
      .finally(() => setLoading(false));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const sorted = [...exams].sort((a, b) => toDate(a.examDate) - toDate(b.examDate));
    const now = new Date();
    return {
      upcoming: sorted.filter((e) => e.status === 'UPCOMING' || (!e.status && toDate(e.examDate) >= now)),
      past: sorted.filter((e) => !(e.status === 'UPCOMING' || (!e.status && toDate(e.examDate) >= now))).reverse(),
    };
  }, [exams]);

  if (loading) return <Spinner label="Loading exams…" />;

  const next = upcoming[0];
  const thisWeek = upcoming.filter((e) => (toDate(e.examDate) - new Date()) / 86400000 <= 7).length;

  return (
    <>
      <PageHeader title="Exam calendar" description="Midterms, finals and make-up exams for this semester." />
      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Next exam"
          value={next ? next.courseCode : '—'}
          hint={next ? `${examTypeLabel(next.examType)} · ${relativeDays(next.examDate)}` : 'Nothing scheduled'}
          icon={CalendarClock}
        />
        <StatCard label="In the next 7 days" value={thisWeek} icon={Clock} tone={thisWeek > 2 ? 'warning' : 'info'} />
        <StatCard label="Completed" value={past.filter((e) => e.status === 'ATTENDED').length} icon={CalendarCheck2} tone="success"
          hint={past.some((e) => e.status === 'MISSED') ? `${past.filter((e) => e.status === 'MISSED').length} missed` : undefined} />
      </div>

      {exams.length === 0 ? (
        <Card><EmptyState icon={CalendarCheck2} title="No exams yet" description="Exams appear here once your instructors schedule them." /></Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming" description={`${upcoming.length} exam${upcoming.length === 1 ? '' : 's'}`} />
            {upcoming.length === 0
              ? <EmptyState icon={CalendarCheck2} title="Nothing coming up" />
              : <ul className="divide-y divide-border">{upcoming.map((e, i) => <ExamRow key={i} exam={e} />)}</ul>}
          </Card>
          {past.length > 0 && (
            <Card className={cn('opacity-95')}>
              <CardHeader title="Past" description={`${past.length} exam${past.length === 1 ? '' : 's'}`} />
              <ul className="divide-y divide-border">{past.map((e, i) => <ExamRow key={i} exam={e} />)}</ul>
            </Card>
          )}
        </div>
      )}
    </>
  );
};

export default ExamCalendar;
