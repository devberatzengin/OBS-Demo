import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Users, ClipboardCheck, GraduationCap, CalendarClock, ChevronLeft, Search, Plus, Pencil, Trash2,
  MapPin, Megaphone, Download, Lock, Check, X, Save, BarChart3, BadgeCheck,
} from 'lucide-react';
import AcademicianService from '../services/AcademicianService';
import {
  Alert, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, StatCard, Table, TBody, TD, TH, THead, TR, Tabs, Textarea, cn, useToast,
} from '../components/ui';
import { examTypeLabel, formatDate, formatTime, todayKey, toDate } from '../lib/format';
import { apiError } from '../lib/errors';
import { downloadText } from '../lib/download';

const initials = (s) => `${s.firstName?.[0] ?? ''}${s.lastName?.[0] ?? ''}`;
const fullName = (s) => `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();

function Avatar({ student, className }) {
  return (
    <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-fg-muted', className)}>
      {initials(student)}
    </div>
  );
}

function Meter({ value, tone = 'accent' }) {
  const color = { accent: 'bg-accent', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
      <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }} />
    </div>
  );
}

/* ---------------- Students ---------------- */

function StudentsTab({ students }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const rows = students.filter((s) =>
    !q || fullName(s).toLowerCase().includes(q) || s.studentNumber?.toLowerCase().includes(q));

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <Input icon={Search} placeholder="Search by name or number" value={query}
          onChange={(e) => setQuery(e.target.value)} className="w-72" />
        <p className="text-sm text-fg-subtle">{rows.length} of {students.length} students</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Users} title={students.length ? 'No matching students' : 'No approved students yet'}
          description={students.length ? 'Try a different search.' : 'Students appear here once their advisor approves the enrollment.'} />
      ) : (
        <Table>
          <THead><tr><TH>Student</TH><TH>Number</TH><TH>Semester</TH><TH className="w-56">Attendance</TH><TH className="text-right">GPA</TH></tr></THead>
          <TBody>
            {rows.map((s) => {
              const rate = Math.round(s.attendanceRate ?? 0);
              return (
                <TR key={s.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar student={s} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{fullName(s)}</p>
                        <p className="truncate text-xs text-fg-subtle">{s.departmentName}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="tabular-nums text-fg-muted">{s.studentNumber}</TD>
                  <TD className="text-fg-muted">{s.currentSemester ?? '—'}</TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Meter value={rate} tone={rate < 70 ? 'danger' : 'success'} />
                      <span className={cn('w-10 text-right text-xs tabular-nums', rate < 70 ? 'text-danger' : 'text-fg-muted')}>{rate}%</span>
                    </div>
                  </TD>
                  <TD className={cn('text-right font-medium tabular-nums', (s.gpa ?? 0) < 2 && 'text-danger')}>
                    {s.gpa != null ? s.gpa.toFixed(2) : '—'}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </Card>
  );
}

/* ---------------- Exams ---------------- */

const EMPTY_EXAM = { examType: 'MIDTERM', examDate: '', ratio: 40, classroomId: '' };

const toInputValue = (value) => {
  const d = toDate(value);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function ExamsTab({ courseId, exams, reload }) {
  const toast = useToast();
  const [form, setForm] = useState(null); // { id?, ...fields }
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const totalRatio = exams.reduce((sum, e) => sum + (e.ratio ?? 0), 0);
  const sorted = [...exams].sort((a, b) => (toDate(a.examDate) ?? 0) - (toDate(b.examDate) ?? 0));

  const save = async () => {
    if (!form.examDate || !form.ratio || !form.classroomId) {
      toast.error('Missing details', 'Date, weight and classroom are required.');
      return;
    }
    setSaving(true);
    const payload = {
      examType: form.examType,
      examDate: form.examDate.length === 16 ? `${form.examDate}:00` : form.examDate,
      ratio: Number(form.ratio),
      classroomId: Number(form.classroomId),
    };
    try {
      if (form.id) await AcademicianService.updateExam(form.id, payload);
      else await AcademicianService.createExam(courseId, payload);
      toast.success(form.id ? 'Exam updated' : 'Exam scheduled');
      setForm(null);
      reload();
    } catch (err) {
      toast.error('Could not save exam', apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await AcademicianService.deleteExam(toDelete.id);
      toast.success('Exam deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error('Could not delete exam', apiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          icon={CalendarClock}
          title="Exams"
          description="Exam weights must add up to 100% before the course can be opened."
          action={<Button icon={Plus} onClick={() => setForm({ ...EMPTY_EXAM })}>Add exam</Button>}
        />
        <div className="border-b border-border px-5 py-3">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-fg-muted">Total weight</span>
            <span className={cn('font-medium tabular-nums', totalRatio === 100 ? 'text-success' : totalRatio > 100 ? 'text-danger' : 'text-warning')}>
              {totalRatio}% / 100%
            </span>
          </div>
          <Meter value={totalRatio} tone={totalRatio === 100 ? 'success' : totalRatio > 100 ? 'danger' : 'warning'} />
        </div>
        {sorted.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No exams scheduled" description="Add a midterm, final or quiz to start grading." />
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((e) => {
              const d = toDate(e.examDate);
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-border py-1.5">
                    <span className="text-[11px] font-medium text-accent uppercase">{d ? d.toLocaleDateString('en-GB', { month: 'short' }) : '—'}</span>
                    <span className="text-lg leading-none font-semibold tabular-nums">{d ? d.getDate() : '?'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{examTypeLabel(e.examType)}</p>
                    <p className="text-sm text-fg-subtle">{formatDate(e.examDate, { weekday: 'long', day: 'numeric', month: 'long' })} · {formatTime(e.examDate)}</p>
                  </div>
                  <Badge icon={MapPin}>{e.classroom?.code ?? 'TBA'}</Badge>
                  <Badge tone="accent">{e.ratio}%</Badge>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" aria-label="Edit exam"
                      onClick={() => setForm({ id: e.id, examType: e.examType, examDate: toInputValue(e.examDate), ratio: e.ratio, classroomId: e.classroom?.id ?? '' })}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon-sm" variant="danger-ghost" aria-label="Delete exam" onClick={() => setToDelete(e)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Edit exam' : 'Schedule exam'}
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button loading={saving} onClick={save}>{form?.id ? 'Save changes' : 'Schedule'}</Button></>}
      >
        {form && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="exam-type">
              <Select id="exam-type" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
                <option value="MIDTERM">Midterm</option>
                <option value="FINAL">Final</option>
                <option value="QUIZ">Quiz</option>
              </Select>
            </Field>
            <Field label="Weight (%)" htmlFor="exam-ratio" hint={`Other exams: ${totalRatio - (exams.find((x) => x.id === form.id)?.ratio ?? 0)}%`}>
              <Input id="exam-ratio" type="number" min={1} max={100} value={form.ratio}
                onChange={(e) => setForm({ ...form, ratio: e.target.value })} />
            </Field>
            <Field label="Date and time" htmlFor="exam-date">
              <Input id="exam-date" type="datetime-local" value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
            </Field>
            <Field label="Classroom ID" htmlFor="exam-room">
              <Input id="exam-room" type="number" min={1} value={form.classroomId}
                onChange={(e) => setForm({ ...form, classroomId: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete exam?"
        description={toDelete ? `${examTypeLabel(toDelete.examType)} on ${formatDate(toDelete.examDate)} and any grades entered for it will be removed.` : ''}
      />
    </>
  );
}

/* ---------------- Grading ---------------- */

function GradingTab({ courseId, course, students, exams, onSaved }) {
  const toast = useToast();
  const [examId, setExamId] = useState(exams[0]?.id ?? '');
  const [grades, setGrades] = useState({});
  const [loadingGrades, setLoadingGrades] = useState(exams.length > 0);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [correction, setCorrection] = useState(null); // { student, score, reason }
  const [correcting, setCorrecting] = useState(false);
  const finalized = !!analytics?.gradesFinalized;

  const loadAnalytics = useCallback(() => {
    AcademicianService.getCourseAnalytics(courseId).then(setAnalytics).catch(() => setAnalytics(null));
  }, [courseId]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  useEffect(() => {
    if (!examId) return undefined;
    let alive = true;
    AcademicianService.getExamGrades(examId)
      .then((data) => {
        if (!alive) return;
        setGrades(Object.fromEntries((data ?? []).map((g) => [g.studentId, g.score ?? ''])));
      })
      .catch(() => alive && setGrades({}))
      .finally(() => alive && setLoadingGrades(false));
    return () => { alive = false; };
  }, [examId]);

  const invalid = Object.values(grades).some((v) => v !== '' && v != null && (Number(v) < 0 || Number(v) > 100));
  const entered = students.filter((s) => grades[s.id] !== '' && grades[s.id] != null).length;

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        grades: Object.entries(grades)
          .filter(([, v]) => v !== '' && v != null)
          .map(([sid, v]) => ({ studentId: Number(sid), score: Number(v) })),
      };
      await AcademicianService.enterGrades(examId, payload);
      toast.success('Grades saved', `${payload.grades.length} scores recorded. Students have been notified.`);
      loadAnalytics();
      onSaved?.();
    } catch (err) {
      toast.error('Could not save grades', apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const finalize = async () => {
    setFinalizing(true);
    try {
      const result = await AcademicianService.finalizeGrades(courseId);
      toast.success('Grades finalized', `${result.finalizedCount} students received their letter grade for ${result.semesterName}.`);
      setConfirmFinalize(false);
      loadAnalytics();
      onSaved?.();
    } catch (err) {
      toast.error('Could not finalize grades', apiError(err));
    } finally {
      setFinalizing(false);
    }
  };

  const submitCorrection = async () => {
    setCorrecting(true);
    try {
      await AcademicianService.correctGrade(examId, {
        studentId: correction.student.id,
        score: Number(correction.score),
        reason: correction.reason.trim(),
      });
      setGrades({ ...grades, [correction.student.id]: correction.score });
      toast.success('Grade corrected', `${fullName(correction.student)} has been notified.`);
      setCorrection(null);
      loadAnalytics();
      onSaved?.();
    } catch (err) {
      toast.error('Could not correct grade', apiError(err));
    } finally {
      setCorrecting(false);
    }
  };

  const exportCsv = async () => {
    try {
      const csv = await AcademicianService.exportCourseGrades(courseId);
      downloadText(csv, `${course?.code ?? 'course'}-grades.csv`);
    } catch (err) {
      toast.error('Export failed', apiError(err));
    }
  };

  if (exams.length === 0) {
    return (
      <Card>
        <EmptyState icon={GraduationCap} title="No exams to grade" description="Schedule an exam in the Exams tab first." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {analytics && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Class average" value={analytics.averageScore?.toFixed(1) ?? '—'} icon={BarChart3} hint="weighted score" />
          <StatCard label="Highest" value={analytics.maxScore?.toFixed(1) ?? '—'} tone="success" />
          <StatCard label="Lowest" value={analytics.minScore?.toFixed(1) ?? '—'} tone="danger" />
          <StatCard label="Pass rate" value={analytics.passRate != null ? `${Math.round(analytics.passRate)}%` : '—'}
            tone="info" hint={`${analytics.passedStudents ?? 0} of ${analytics.totalStudents ?? 0} students`} />
        </div>
      )}

      {finalized ? (
        <Alert tone="success" title="Grades finalized">
          Letter grades are published to students. Changes now go through a correction with a reason, which is logged.
        </Alert>
      ) : (
        <Alert tone="info" title="Letter grades are assigned when you finalize">
          Enter every exam score, then finalize. Until then students see the course as in progress.
        </Alert>
      )}

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4">
          <Field label="Exam" htmlFor="grade-exam" className="w-64">
            <Select id="grade-exam" value={examId} onChange={(e) => { setLoadingGrades(true); setExamId(Number(e.target.value)); }}>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{examTypeLabel(e.examType)} · {formatDate(e.examDate)} · {e.ratio}%</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-subtle tabular-nums">{entered}/{students.length} entered</span>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>
            {!finalized && (
              <>
                <Button variant="secondary" icon={BadgeCheck} onClick={() => setConfirmFinalize(true)}>Finalize grades</Button>
                <Button icon={Save} loading={saving} disabled={invalid || loadingGrades} onClick={save}>Save grades</Button>
              </>
            )}
          </div>
        </div>

        {invalid && <Alert tone="danger" className="mx-5 mt-4">Scores must be between 0 and 100.</Alert>}

        {loadingGrades ? <Spinner label="Loading scores…" /> : students.length === 0 ? (
          <EmptyState icon={Users} title="No students to grade" />
        ) : (
          <Table>
            <THead><tr><TH>Student</TH><TH>Number</TH><TH className="w-40 text-right">Score (0–100)</TH>{finalized && <TH className="w-28" />}</tr></THead>
            <TBody>
              {students.map((s) => {
                const v = grades[s.id] ?? '';
                const bad = v !== '' && (Number(v) < 0 || Number(v) > 100);
                return (
                  <TR key={s.id}>
                    <TD><div className="flex items-center gap-3"><Avatar student={s} /><span className="font-medium">{fullName(s)}</span></div></TD>
                    <TD className="tabular-nums text-fg-muted">{s.studentNumber}</TD>
                    <TD className="text-right">
                      <Input type="number" min={0} max={100} step="0.5" inputMode="decimal" placeholder="—" value={v}
                        aria-label={`Score for ${fullName(s)}`} disabled={finalized}
                        onChange={(e) => setGrades({ ...grades, [s.id]: e.target.value })}
                        className={cn('ml-auto w-24 text-right tabular-nums', bad && 'border-danger')} />
                    </TD>
                    {finalized && (
                      <TD className="text-right">
                        <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setCorrection({ student: s, score: v, reason: '' })}>Correct</Button>
                      </TD>
                    )}
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={confirmFinalize}
        onClose={() => setConfirmFinalize(false)}
        onConfirm={finalize}
        loading={finalizing}
        tone="primary"
        confirmLabel="Finalize"
        title="Finalize grades?"
        description="Letter grades are calculated from all exam scores and published to students; their GPA is updated. Every student needs a score for every exam. Later changes require a correction with a reason."
      />

      <Modal
        open={!!correction}
        onClose={() => setCorrection(null)}
        title={correction ? `Correct ${fullName(correction.student)}` : ''}
        description={exams.find((e) => e.id === examId) ? `${examTypeLabel(exams.find((e) => e.id === examId).examType)} score; the letter grade and GPA are recalculated.` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCorrection(null)}>Cancel</Button>
            <Button loading={correcting}
              disabled={!correction || correction.score === '' || Number(correction.score) < 0 || Number(correction.score) > 100 || correction.reason.trim().length < 10}
              onClick={submitCorrection}>Save correction</Button>
          </>
        }
      >
        {correction && (
          <div className="space-y-4">
            <Field label="New score (0–100)" htmlFor="corr-score">
              <Input id="corr-score" type="number" min={0} max={100} step="0.5" value={correction.score}
                onChange={(e) => setCorrection({ ...correction, score: e.target.value })} className="w-32" />
            </Field>
            <Field label="Reason" htmlFor="corr-reason" hint="At least 10 characters. Stored in the audit log.">
              <Textarea id="corr-reason" rows={3} value={correction.reason}
                onChange={(e) => setCorrection({ ...correction, reason: e.target.value })}
                placeholder="e.g. Exam re-evaluated after objection" />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------------- Attendance ---------------- */

const toMinutes = (t) => {
  const [h, m] = formatTime(t).split(':').map(Number);
  return h * 60 + (m || 0);
};

// Attendance can be saved during a class and up to two hours after it ends
const isOpenNow = (schedule) => {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return schedule.some((s) => s.dayOfWeek === todayKey() && mins >= toMinutes(s.startTime) && mins <= toMinutes(s.endTime) + 120);
};

function AttendanceTab({ courseId, students, onSaved }) {
  const toast = useToast();
  const [present, setPresent] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AcademicianService.getCourseSchedule(courseId).then((s) => setSchedule(s ?? [])).catch(() => setSchedule([]));
    AcademicianService.getTodayAttendance(courseId)
      .then((data) => setPresent(Object.fromEntries((data ?? []).map((a) => [a.studentId, !!a.present]))))
      .catch(() => {});
  }, [courseId]);

  useEffect(() => {
    const check = () => setOpen(isOpenNow(schedule));
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [schedule]);

  const count = students.filter((s) => present[s.id]).length;
  const setAll = (value) => setPresent(Object.fromEntries(students.map((s) => [s.id, value])));

  const save = async () => {
    setSaving(true);
    try {
      await AcademicianService.recordAttendance(courseId, {
        attendanceDate: new Date().toLocaleDateString('en-CA'),
        attendance: students.map((s) => ({ studentId: s.id, present: !!present[s.id] })),
      });
      toast.success('Attendance saved', `${count} present, ${students.length - count} absent.`);
      onSaved?.();
    } catch (err) {
      toast.error('Could not save attendance', apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const todaySlots = schedule.filter((s) => s.dayOfWeek === todayKey());

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-[15px] font-semibold">Attendance · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <p className="mt-0.5 text-sm text-fg-subtle">
            {todaySlots.length
              ? `Class today ${todaySlots.map((s) => `${formatTime(s.startTime)}–${formatTime(s.endTime)}`).join(', ')}`
              : 'No class scheduled today'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg-subtle tabular-nums">{count}/{students.length} present</span>
          <Button variant="ghost" size="sm" onClick={() => setAll(true)}>All present</Button>
          <Button variant="ghost" size="sm" onClick={() => setAll(false)}>Clear</Button>
          <Button icon={open ? Save : Lock} loading={saving} disabled={!open} onClick={save}>
            {open ? 'Save attendance' : 'Locked'}
          </Button>
        </div>
      </div>

      {!open && (
        <Alert tone="info" className="mx-5 mt-4">
          Attendance can only be saved during class time and up to two hours after the class ends.
        </Alert>
      )}

      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students enrolled" />
      ) : (
        <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => {
            const on = !!present[s.id];
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => setPresent({ ...present, [s.id]: !on })}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer',
                  on ? 'border-success/40 bg-success-soft' : 'border-border hover:bg-surface-hover',
                )}
              >
                <Avatar student={s} className={on ? 'bg-success text-white' : undefined} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{fullName(s)}</p>
                  <p className="truncate text-xs text-fg-subtle tabular-nums">{s.studentNumber}</p>
                </div>
                {on ? <Check className="size-4 text-success" /> : <X className="size-4 text-fg-subtle" />}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ---------------- Page ---------------- */

const TAB_IDS = ['students', 'exams', 'grading', 'attendance'];

const CourseDetail = () => {
  const { courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announce, setAnnounce] = useState(null);
  const [posting, setPosting] = useState(false);

  const tab = TAB_IDS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'students';
  const setTab = (id) => setSearchParams(id === 'students' ? {} : { tab: id }, { replace: true });

  const loadStudents = useCallback(
    () => AcademicianService.getCourseStudents(courseId).then((d) => setStudents(d ?? [])).catch(() => {}), [courseId]);
  const loadExams = useCallback(
    () => AcademicianService.getCourseExams(courseId).then((d) => setExams(d ?? [])).catch(() => {}), [courseId]);

  useEffect(() => {
    Promise.all([
      AcademicianService.getMyCourses(),
      AcademicianService.getCourseStudents(courseId),
      AcademicianService.getCourseExams(courseId),
    ])
      .then(([courses, s, e]) => {
        setCourse((courses ?? []).find((c) => String(c.id) === String(courseId)) ?? null);
        setStudents(s ?? []);
        setExams(e ?? []);
      })
      .catch((err) => setError(apiError(err, 'Could not load this course.')))
      .finally(() => setLoading(false));
  }, [courseId]);

  const postAnnouncement = async () => {
    if (!announce.title.trim() || !announce.content.trim()) return;
    setPosting(true);
    try {
      await AcademicianService.postAnnouncement(courseId, announce);
      toast.success('Announcement posted', 'Enrolled students will see it on their dashboard.');
      setAnnounce(null);
    } catch (err) {
      toast.error('Could not post announcement', apiError(err));
    } finally {
      setPosting(false);
    }
  };

  const avgAttendance = useMemo(() => (students.length
    ? Math.round(students.reduce((sum, s) => sum + (s.attendanceRate ?? 0), 0) / students.length) : null), [students]);

  if (loading) return <Spinner label="Loading course…" />;
  if (error) {
    return (
      <Card className="mx-auto mt-16 max-w-md">
        <EmptyState title="Course unavailable" description={error}
          action={<Link to="/academician"><Button variant="secondary" icon={ChevronLeft}>Back to dashboard</Button></Link>} />
      </Card>
    );
  }

  return (
    <>
      <Link to="/academician" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg">
        <ChevronLeft className="size-4" /> Dashboard
      </Link>

      <PageHeader
        eyebrow={course?.code}
        title={course?.name ?? 'Course'}
        description={[course?.akts != null && `${course.akts} ECTS`, course?.credits != null && `${course.credits} credits`,
          `${students.length} students`].filter(Boolean).join(' · ')}
        actions={<Button variant="secondary" icon={Megaphone} onClick={() => setAnnounce({ title: '', content: '' })}>Announcement</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={students.length} icon={Users} />
        <StatCard label="Avg. attendance" value={avgAttendance != null ? `${avgAttendance}%` : '—'} icon={ClipboardCheck}
          tone={avgAttendance != null && avgAttendance < 70 ? 'danger' : 'success'} />
        <StatCard label="Exams" value={exams.length} icon={CalendarClock} tone="info" />
        <StatCard label="Weight defined" value={`${exams.reduce((s, e) => s + (e.ratio ?? 0), 0)}%`} icon={GraduationCap} tone="info" hint="of 100%" />
      </div>

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'students', label: 'Students', icon: Users, count: students.length },
          { id: 'exams', label: 'Exams', icon: CalendarClock, count: exams.length },
          { id: 'grading', label: 'Grading', icon: GraduationCap },
          { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
        ]}
      />

      {tab === 'students' && <StudentsTab students={students} />}
      {tab === 'exams' && <ExamsTab courseId={courseId} exams={exams} reload={loadExams} />}
      {tab === 'grading' && <GradingTab key={exams.length} courseId={courseId} course={course} students={students} exams={exams} onSaved={loadStudents} />}
      {tab === 'attendance' && <AttendanceTab courseId={courseId} students={students} onSaved={loadStudents} />}

      <Modal
        open={!!announce}
        onClose={() => setAnnounce(null)}
        title="Post announcement"
        description={`Visible to students enrolled in ${course?.code ?? 'this course'}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAnnounce(null)}>Cancel</Button>
            <Button icon={Megaphone} loading={posting} disabled={!announce?.title.trim() || !announce?.content.trim()} onClick={postAnnouncement}>Post</Button>
          </>
        }
      >
        {announce && (
          <div className="space-y-4">
            <Field label="Title" htmlFor="ann-title">
              <Input id="ann-title" value={announce.title} maxLength={200} onChange={(e) => setAnnounce({ ...announce, title: e.target.value })} />
            </Field>
            <Field label="Message" htmlFor="ann-content" hint={`${announce.content.length}/2000`}>
              <Textarea id="ann-content" rows={6} maxLength={2000} value={announce.content} onChange={(e) => setAnnounce({ ...announce, content: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CourseDetail;
