import { useEffect, useMemo, useState } from 'react';
import TranscriptService from '../services/TranscriptService';
import { Award, BookOpen, ChevronDown, Calculator, GraduationCap, Hash, Printer, RotateCcw } from 'lucide-react';
import {
  Alert, Badge, Button, Card, CardHeader, PageHeader, Select, Spinner, StatCard,
  Table, TBody, TD, TH, THead, TR, cn, useToast,
} from '../components/ui';
import { gpaTone, gradeTone } from '../lib/format';
import { apiError } from '../lib/errors';

const GRADES = ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF'];
const sum = (arr, key) => arr.reduce((s, x) => s + (x[key] || 0), 0);

function GpaTrend({ semesters }) {
  const points = semesters.filter((s) => s.semesterGpa != null && s.courses.some((c) => c.grade));
  if (points.length < 2) return null;
  return (
    <Card>
      <CardHeader title="Term GPA trend" description="Each bar is one semester, scale 0–4" />
      <div className="flex items-end gap-3 px-5 pt-4 pb-3">
        {points.map((s) => (
          <div key={s.semesterName} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-xs font-semibold tabular-nums">{s.semesterGpa.toFixed(2)}</span>
            <div className="flex h-24 w-full max-w-12 items-end">
              <div
                className={cn('w-full rounded-t-md', s.active ? 'bg-accent' : 'bg-accent/35')}
                style={{ height: `${Math.max((s.semesterGpa / 4) * 100, 3)}%` }}
              />
            </div>
            <span className="w-full truncate text-center text-[11px] text-fg-subtle" title={s.semesterName}>{s.semesterName}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SemesterCard({ semester, open, onToggle }) {
  const credits = sum(semester.courses, 'credits');
  const akts = sum(semester.courses, 'akts');
  return (
    <Card className={cn(semester.active && 'ring-1 ring-accent/40')}>
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-4 text-left cursor-pointer">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold">{semester.semesterName}</h3>
            {semester.active && <Badge tone="accent">In progress</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-fg-subtle">{semester.courses.length} courses · {credits} credits · {akts} ECTS</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-fg-subtle">Term GPA</p>
          <p className="text-lg font-semibold tabular-nums">
            {semester.courses.some((c) => c.grade) ? semester.semesterGpa?.toFixed(2) ?? '—' : '—'}
          </p>
        </div>
        <ChevronDown className={cn('size-4 text-fg-subtle transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-border">
          <Table>
            <THead><tr><TH>Code</TH><TH>Course</TH><TH className="text-right">Credits</TH><TH className="text-right">ECTS</TH><TH className="text-right">Grade</TH></tr></THead>
            <TBody>
              {semester.courses.map((c) => (
                <TR key={c.courseCode}>
                  <TD className="font-medium text-accent">{c.courseCode}</TD>
                  <TD>{c.courseName}</TD>
                  <TD className="text-right tabular-nums">{c.credits}</TD>
                  <TD className="text-right tabular-nums">{c.akts}</TD>
                  <TD className="text-right">{c.grade ? <Badge tone={gradeTone(c.grade)}>{c.grade}</Badge> : <span className="text-fg-subtle">—</span>}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

function WhatIf({ semester, currentGpa }) {
  const toast = useToast();
  const [grades, setGrades] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const picked = Object.fromEntries(Object.entries(grades).filter(([, g]) => g));
    if (Object.keys(picked).length === 0) {
      toast.info('Pick at least one grade', 'Choose an expected grade for a course to simulate.');
      return;
    }
    setLoading(true);
    try {
      setResult(await TranscriptService.simulateGpa(picked));
    } catch (err) {
      toast.error('Simulation failed', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setGrades({}); setResult(null); };
  const delta = result != null && currentGpa != null ? result - currentGpa : null;

  return (
    <Card>
      <CardHeader icon={Calculator} title="What-if GPA" description="Pick expected grades for this term to see your projected cumulative GPA." />
      <ul className="divide-y divide-border">
        {semester.courses.map((c) => (
          <li key={c.courseCode} className="flex items-center gap-3 px-5 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-accent">{c.courseCode}</p>
              <p className="truncate text-sm">{c.courseName}</p>
            </div>
            <Select
              className="w-24 shrink-0"
              value={grades[c.courseCode] ?? ''}
              onChange={(e) => { setGrades({ ...grades, [c.courseCode]: e.target.value }); setResult(null); }}
            >
              <option value="">—</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 border-t border-border p-4">
        <div className="flex-1">
          {result != null ? (
            <>
              <p className="text-xs text-fg-subtle">Projected cumulative GPA</p>
              <p className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">{result.toFixed(2)}</span>
                {delta != null && Math.abs(delta) >= 0.005 && (
                  <span className={cn('text-sm font-medium tabular-nums', delta > 0 ? 'text-success' : 'text-danger')}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-fg-subtle">Current: {currentGpa?.toFixed(2) ?? '—'}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset"><RotateCcw className="size-4" /></Button>
        <Button onClick={run} loading={loading}>Calculate</Button>
      </div>
    </Card>
  );
}

const TranscriptPage = () => {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});

  useEffect(() => {
    TranscriptService.getTranscript()
      .then((data) => {
        setTranscript(data);
        const first = data.semesters.find((s) => s.active) ?? data.semesters[0];
        if (first) setOpen({ [first.semesterName]: true });
      })
      .catch(() => setError('Could not load your transcript.'))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    if (!transcript) return {};
    const all = transcript.semesters.flatMap((s) => s.courses);
    const completed = all.filter((c) => c.grade && !['FF', 'FD'].includes(c.grade));
    return { credits: sum(completed, 'credits'), akts: sum(completed, 'akts'), courses: all.length };
  }, [transcript]);

  if (loading) return <Spinner label="Loading transcript…" />;
  if (error) return <Alert tone="danger" title="Transcript unavailable">{error}</Alert>;

  const current = transcript.semesters.find((s) => s.active);
  const ordered = [...transcript.semesters].sort((a, b) => Number(b.active) - Number(a.active));
  const chronological = [...transcript.semesters].filter((s) => !s.active).concat(current ? [current] : []);

  return (
    <>
      <PageHeader
        eyebrow="Academic record"
        title="Transcript"
        description={`${transcript.studentName} · ${transcript.studentNumber} · ${transcript.departmentName}`}
        actions={<Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cumulative GPA" value={transcript.cumulativeGpa?.toFixed(2) ?? '—'} icon={Award} tone={gpaTone(transcript.cumulativeGpa)} hint="ECTS-weighted (GNO)" />
        <StatCard label="Credits earned" value={totals.credits} icon={Hash} tone="info" />
        <StatCard label="ECTS earned" value={totals.akts} icon={GraduationCap} tone="info" />
        <StatCard label="Courses taken" value={totals.courses} icon={BookOpen} hint={`${transcript.semesters.length} semesters`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {ordered.map((s) => (
            <SemesterCard
              key={s.semesterName}
              semester={s}
              open={!!open[s.semesterName]}
              onToggle={() => setOpen((o) => ({ ...o, [s.semesterName]: !o[s.semesterName] }))}
            />
          ))}
        </div>
        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          {current && current.courses.length > 0 && <WhatIf semester={current} currentGpa={transcript.cumulativeGpa} />}
          <GpaTrend semesters={chronological} />
        </div>
      </div>
    </>
  );
};

export default TranscriptPage;
