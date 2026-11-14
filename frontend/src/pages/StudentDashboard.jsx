import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentService from '../services/StudentService';
import {
  Award, BookOpen, Bell, UserRound, CalendarDays, Clock, MapPin, ArrowRight, CalendarClock, Hash,
} from 'lucide-react';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, PageHeader, Spinner, StatCard } from '../components/ui';
import { examTypeLabel, formatDate, formatTime, gpaTone, relativeDays, toDate, todayKey } from '../lib/format';

// Dashboard data plus today's classes and the next exams; schedule/exams are optional
async function fetchDashboard() {
  const [dashboard, schedule, examList] = await Promise.allSettled([
    StudentService.getDashboardData(),
    StudentService.getWeeklySchedule(),
    StudentService.getExamCalendar(),
  ]);
  if (dashboard.status === 'rejected') throw dashboard.reason;
  const key = todayKey();
  return {
    data: dashboard.value,
    today: (schedule.value ?? [])
      .filter((s) => s.dayOfWeek === key)
      .sort((a, b) => formatTime(a.startTime).localeCompare(formatTime(b.startTime))),
    exams: (examList.value ?? [])
      .filter((e) => e.status === 'UPCOMING' || toDate(e.examDate) >= new Date())
      .sort((a, b) => toDate(a.examDate) - toDate(b.examDate))
      .slice(0, 4),
  };
}

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [today, setToday] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => fetchDashboard()
    .then((r) => { setData(r.data); setToday(r.today); setExams(r.exams); })
    .catch(() => setError('Could not load your dashboard. Make sure the backend is running.'))
    .finally(() => setLoading(false)), []);

  useEffect(() => { load(); }, [load]);

  const retry = () => { setLoading(true); setError(null); load(); };

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error) {
    return (
      <Card className="mx-auto mt-16 max-w-md">
        <EmptyState title="Something went wrong" description={error} action={<Button onClick={retry}>Try again</Button>} />
      </Card>
    );
  }

  const courses = data.currentCourses ?? [];
  const notifications = data.recentNotifications ?? [];
  const totalAkts = courses.reduce((sum, c) => sum + (c.akts ?? 0), 0);
  const firstName = data.fullName?.split(' ')[0];

  return (
    <>
      <PageHeader
        eyebrow={data.activeSemesterName}
        title={`Welcome back, ${firstName}`}
        description={[data.departmentName, data.facultyName].filter(Boolean).join(' · ')}
      />

      {data.gpa != null && data.gpa < 2 && (
        <Alert tone="warning" title="Academic standing" className="mb-6">
          Your cumulative GPA is below 2.00. Consider meeting your advisor, {data.advisorName}.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cumulative GPA" value={data.gpa?.toFixed(2) ?? '—'} icon={Award} tone={gpaTone(data.gpa)} hint="out of 4.00" />
        <StatCard label="Enrolled this term" value={courses.length} icon={BookOpen} hint={`${totalAkts} ECTS`} />
        <StatCard label="Semester" value={data.currentSemester ?? '—'} icon={CalendarDays} tone="info" hint={data.activeSemesterName} />
        <StatCard label="Student number" value={data.studentNumber} icon={Hash} tone="info" hint={`Advisor: ${data.advisorName ?? '—'}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Today */}
        <Card className="xl:col-span-2">
          <CardHeader
            icon={Clock}
            title="Today's classes"
            description={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            action={<Link to="/student/schedule" className="text-sm font-medium text-accent hover:underline">Full week</Link>}
          />
          {today.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No classes today" description="Enjoy the free time, or catch up on your to-do list." />
          ) : (
            <ul className="divide-y divide-border">
              {today.map((s, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-24 shrink-0 text-sm tabular-nums">
                    <p className="font-semibold">{formatTime(s.startTime)}</p>
                    <p className="text-fg-subtle">{formatTime(s.endTime)}</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      <span className="text-accent">{s.courseCode}</span> · {s.courseName}
                    </p>
                    <p className="truncate text-sm text-fg-subtle">{s.instructorName}</p>
                  </div>
                  {s.classroomCode && <Badge icon={MapPin}>{s.classroomCode}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Upcoming exams */}
        <Card>
          <CardHeader
            icon={CalendarClock}
            title="Upcoming exams"
            action={<Link to="/student/exams" className="text-sm font-medium text-accent hover:underline">Calendar</Link>}
          />
          {exams.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No upcoming exams" />
          ) : (
            <ul className="divide-y divide-border">
              {exams.map((e, i) => (
                <li key={i} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.courseCode} · {examTypeLabel(e.examType)}</p>
                    <p className="text-sm text-fg-subtle">{formatDate(e.examDate)} · {formatTime(e.examDate)}</p>
                  </div>
                  <Badge tone="accent">{relativeDays(e.examDate)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Courses */}
        <Card className="xl:col-span-2">
          <CardHeader
            icon={BookOpen}
            title="Current courses"
            description={`${courses.length} courses · ${totalAkts} ECTS`}
            action={<Link to="/student/registration" className="text-sm font-medium text-accent hover:underline">Registration</Link>}
          />
          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses this semester"
              description="Course registration is where you pick this term's courses."
              action={<Link to="/student/registration"><Button icon={ArrowRight}>Go to registration</Button></Link>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              {courses.map((c) => (
                <div key={c.id ?? c.code} className="rounded-lg border border-border p-4 transition-colors hover:border-border-strong">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold tracking-wide text-accent">{c.code}</p>
                    <Badge>{c.akts} ECTS</Badge>
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-snug">{c.name}</p>
                  {c.instructorName && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle">
                      <UserRound className="size-3.5" /> {c.instructorName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader icon={Bell} title="Notifications" />
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="You're all caught up" />
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n, i) => (
                <li key={i} className="flex gap-3 px-5 py-3.5">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.isRead ? 'bg-border-strong' : 'bg-accent'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 text-sm text-fg-muted">{n.message}</p>
                    <p className="mt-1 text-xs text-fg-subtle">{formatDate(n.timestamp)} · {formatTime(n.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default StudentDashboard;
