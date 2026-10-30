import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, List, MapPin, UserRound, LayoutGrid } from 'lucide-react';
import StudentService from '../services/StudentService';
import TimeGrid from '../components/TimeGrid';
import { paletteFor } from '../lib/colors';
import { Alert, Card, EmptyState, PageHeader, Spinner, StatCard, cn } from '../components/ui';
import { DAYS, dayLabel, formatTime } from '../lib/format';

const WeeklySchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid');

  useEffect(() => {
    StudentService.getWeeklySchedule()
      .then(setSchedule)
      .catch(() => setError('Could not load your weekly schedule.'))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => schedule.map((s, i) => ({
    id: i,
    day: s.dayOfWeek,
    start: formatTime(s.startTime),
    end: formatTime(s.endTime),
    code: s.courseCode,
    title: s.courseName,
    lines: [s.classroomCode || 'Room TBA', s.instructorName].filter(Boolean),
    raw: s,
  })), [schedule]);

  const colorOf = paletteFor(items.map((i) => i.code));
  const weeklyHours = items.reduce((sum, i) => {
    const [sh, sm] = String(i.start).split(':').map(Number);
    const [eh, em] = String(i.end).split(':').map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);
  const courseCount = new Set(items.map((i) => i.code)).size;
  const busiest = DAYS.map((d) => [d, items.filter((i) => i.day === d).length]).sort((a, b) => b[1] - a[1])[0];

  if (loading) return <Spinner label="Loading schedule…" />;

  return (
    <>
      <PageHeader
        title="Weekly schedule"
        description="Your timetable for the current semester."
        actions={
          <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
            {[['grid', LayoutGrid, 'Week'], ['list', List, 'List']].map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium cursor-pointer',
                  view === key ? 'bg-accent-soft text-accent' : 'text-fg-subtle hover:text-fg',
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        }
      />

      {error && <Alert tone="danger" className="mb-6">{error}</Alert>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Courses" value={courseCount} icon={CalendarDays} />
        <StatCard label="Class hours per week" value={weeklyHours.toFixed(1).replace('.0', '')} icon={Clock} tone="info" />
        <StatCard label="Busiest day" value={busiest?.[1] ? dayLabel(busiest[0]) : '—'} icon={LayoutGrid} tone="warning"
          hint={busiest?.[1] ? `${busiest[1]} sessions` : undefined} />
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarDays} title="No classes scheduled"
            description="Once your course registration is approved, your classes will appear here." />
        </Card>
      ) : view === 'grid' ? (
        <Card className="overflow-hidden"><TimeGrid items={items} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((d) => {
            const day = items.filter((i) => i.day === d).sort((a, b) => String(a.start).localeCompare(String(b.start)));
            return (
              <Card key={d}>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold">{dayLabel(d)}</p>
                  <span className="text-xs text-fg-subtle">{day.length} sessions</span>
                </div>
                {day.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-fg-subtle">No classes</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {day.map((i) => (
                      <li key={i.id} className="flex gap-3 px-4 py-3">
                        <span className={cn('w-1 shrink-0 rounded-full', colorOf(i.code)[1].replace('/10', ''))} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-fg-subtle tabular-nums">{formatTime(i.start)} – {formatTime(i.end)}</p>
                          <p className="truncate text-sm font-medium">{i.code} · {i.title}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-fg-subtle">
                            <span className="flex items-center gap-1"><MapPin className="size-3" />{i.raw.classroomCode || 'TBA'}</span>
                            <span className="flex items-center gap-1"><UserRound className="size-3" />{i.raw.instructorName}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default WeeklySchedule;
