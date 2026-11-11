import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronLeft, Search, Users } from 'lucide-react';
import AcademicianService from '../services/AcademicianService';
import {
  Badge, Card, EmptyState, Input, PageHeader, Spinner, Table, TBody, TD, TH, THead, TR, cn,
} from '../components/ui';

const name = (s) => `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();

const MyStudents = () => {
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    AcademicianService.getAllStudents()
      .then((d) => setGroups(d ?? {}))
      .catch(() => setError('Could not load your students.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading students…" />;

  const q = query.trim().toLowerCase();
  const entries = Object.entries(groups)
    .map(([course, students]) => [course, students.filter((s) =>
      !q || name(s).toLowerCase().includes(q) || s.studentNumber?.toLowerCase().includes(q))])
    .filter(([, students]) => !q || students.length);
  const unique = new Set(Object.values(groups).flat().map((s) => s.id)).size;

  return (
    <>
      <Link to="/academician" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg">
        <ChevronLeft className="size-4" /> Dashboard
      </Link>
      <PageHeader
        title="My students"
        description={`${unique} students across ${Object.keys(groups).length} courses`}
        actions={<Input icon={Search} placeholder="Search by name or number" value={query} onChange={(e) => setQuery(e.target.value)} className="w-72" />}
      />

      {error ? <Card><EmptyState title="Something went wrong" description={error} /></Card>
        : entries.length === 0 ? (
          <Card><EmptyState icon={Users} title={q ? 'No matching students' : 'No students yet'} /></Card>
        ) : (
          <div className="space-y-4">
            {entries.map(([course, students]) => {
              const open = !collapsed[course];
              return (
                <Card key={course}>
                  <button
                    onClick={() => setCollapsed({ ...collapsed, [course]: open })}
                    className={cn('flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left cursor-pointer', open && 'border-b border-border')}
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-[15px] font-semibold">{course}</h3>
                      <Badge icon={Users}>{students.length}</Badge>
                    </div>
                    <ChevronDown className={cn('size-4 text-fg-subtle transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <Table>
                      <THead><tr><TH>Student</TH><TH>Number</TH><TH>Department</TH><TH className="w-44">Attendance</TH><TH className="text-right">GPA</TH></tr></THead>
                      <TBody>
                        {students.map((s) => {
                          const rate = Math.round(s.attendanceRate ?? 0);
                          return (
                            <TR key={s.id}>
                              <TD className="font-medium">{name(s)}</TD>
                              <TD className="tabular-nums text-fg-muted">{s.studentNumber}</TD>
                              <TD className="text-fg-muted">{s.departmentName}</TD>
                              <TD>
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                                    <div className={cn('h-full rounded-full', rate < 70 ? 'bg-danger' : 'bg-success')} style={{ width: `${rate}%` }} />
                                  </div>
                                  <span className={cn('w-9 text-right text-xs tabular-nums', rate < 70 ? 'text-danger' : 'text-fg-muted')}>{rate}%</span>
                                </div>
                              </TD>
                              <TD className={cn('text-right font-medium tabular-nums', s.gpa != null && s.gpa < 2 && 'text-danger')}>{s.gpa != null ? s.gpa.toFixed(2) : '—'}</TD>
                            </TR>
                          );
                        })}
                      </TBody>
                    </Table>
                  )}
                </Card>
              );
            })}
          </div>
        )}
    </>
  );
};

export default MyStudents;
