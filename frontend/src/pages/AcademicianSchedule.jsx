import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, LayoutGrid, List, MapPin, Users } from 'lucide-react';
import AcademicianService from '../services/AcademicianService';
import TimeGrid from '../components/TimeGrid';
import { Badge, Card, EmptyState, PageHeader, Spinner, cn } from '../components/ui';
import { DAYS, dayLabel, formatTime, todayKey } from '../lib/format';

const AcademicianSchedule = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid');

  useEffect(() => {
    AcademicianService.getMySchedule()
      .then((d) => setSchedule(d ?? []))
      .catch(() => setError('Could not load your teaching schedule.'))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => schedule.map((s, i) => ({
    id: i,
    courseId: s.courseId,
    day: s.dayOfWeek,
    start: formatTime(s.startTime),
    end: formatTime(s.endTime),
    code: s.courseCode,
    title: s.courseName,
    lines: [[s.classroomName, s.studentCount != null && `${s.studentCount} students`].filter(Boolean).join(' · ')],
  })), [schedule]);

  const hours = schedule.reduce((sum, s) => {
    const [sh, sm] = formatTime(s.startTime).split(':').map(Number);
    const [eh, em] = formatTime(s.endTime).split(':').map(Number);
    return sum + (eh * 60 + em - sh * 60 - sm) / 60;
  }, 0);

  if (loading) return <Spinner label="Loading schedule…" />;

  return (
    <>
      <PageHeader
        title="Teaching schedule"
        description={schedule.length
          ? `${new Set(schedule.map((s) => s.courseId)).size} courses · ${Number.isInteger(hours) ? hours : hours.toFixed(1)} hours per week`
          : 'Your weekly classes and classrooms.'}
        actions={
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            {[['grid', LayoutGrid, 'Week'], ['list', List, 'List']].map(([key, Icon, label]) => (
              <button key={key} onClick={() => setView(key)}
                className={cn('flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium cursor-pointer',
                  view === key ? 'bg-accent-soft text-accent' : 'text-fg-subtle hover:text-fg')}>
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        }
      />

      <Card>
        {error ? <EmptyState title="Something went wrong" description={error} /> : schedule.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No classes scheduled" description="Your timetable appears once classes are assigned." />
        ) : view === 'grid' ? (
          <TimeGrid items={items} onSelect={(i) => navigate(`/academician/courses/${i.courseId}`)} />
        ) : (
          <div className="divide-y divide-border">
            {DAYS.map((d) => {
              const day = schedule.filter((s) => s.dayOfWeek === d)
                .sort((a, b) => formatTime(a.startTime).localeCompare(formatTime(b.startTime)));
              return (
                <section key={d} className="px-5 py-4">
                  <h3 className={cn('mb-2 text-sm font-semibold', d === todayKey() && 'text-accent')}>{dayLabel(d)}</h3>
                  {day.length === 0 ? <p className="text-sm text-fg-subtle">No classes</p> : (
                    <ul className="space-y-1.5">
                      {day.map((s, i) => (
                        <li key={i}>
                          <button onClick={() => navigate(`/academician/courses/${s.courseId}`)}
                            className="flex w-full items-center gap-4 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-surface-hover cursor-pointer">
                            <span className="w-24 shrink-0 text-sm tabular-nums text-fg-muted">{formatTime(s.startTime)}–{formatTime(s.endTime)}</span>
                            <span className="min-w-0 flex-1 truncate text-sm"><span className="font-medium text-accent">{s.courseCode}</span> · {s.courseName}</span>
                            {s.classroomName && <Badge icon={MapPin}>{s.classroomName}</Badge>}
                            {s.studentCount != null && <Badge icon={Users}>{s.studentCount}</Badge>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
};

export default AcademicianSchedule;
