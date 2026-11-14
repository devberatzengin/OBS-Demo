import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ClipboardCheck, Search, Check, X, MessageSquare, TriangleAlert, Award, Download, Send,
} from 'lucide-react';
import AcademicianService from '../services/AcademicianService';
import {
  Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, StatCard,
  Table, TBody, TD, TH, THead, TR, Textarea, cn, useToast,
} from '../components/ui';
import { gpaTone } from '../lib/format';
import { apiError } from '../lib/errors';
import { downloadText } from '../lib/download';

const atRisk = (a) => a.atRisk ?? a.isAtRisk ?? (a.gpa != null && a.gpa < 2);
const name = (a) => `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim();

const Advisees = () => {
  const toast = useToast();
  const [pending, setPending] = useState([]);
  const [advisees, setAdvisees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null); // { student, content }
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([AcademicianService.getPendingEnrollments(), AcademicianService.getAdviseePerformance()])
      .then(([p, a]) => { setPending(p ?? []); setAdvisees(a ?? []); })
      .catch((err) => setError(apiError(err, 'Could not load advisee data.')))
      .finally(() => setLoading(false));
  }, []);

  // Group pending requests per student so each advisee's selection is reviewed together
  const pendingByStudent = useMemo(() => {
    const groups = new Map();
    pending.forEach((e) => groups.set(e.studentName, [...(groups.get(e.studentName) ?? []), e]));
    return [...groups.entries()];
  }, [pending]);

  const decide = async (ids, approve) => {
    setBusy(ids.join(','));
    const results = await Promise.allSettled(ids.map((id) => (approve
      ? AcademicianService.approveEnrollment(id) : AcademicianService.rejectEnrollment(id))));
    const ok = ids.filter((_, i) => results[i].status === 'fulfilled');
    setPending((list) => list.filter((e) => !ok.includes(e.id)));
    if (ok.length === ids.length) toast.success(approve ? 'Approved' : 'Rejected', `${ok.length} enrollment${ok.length > 1 ? 's' : ''} updated.`);
    else toast.error('Some updates failed', apiError(results.find((r) => r.status === 'rejected')?.reason));
    setBusy(null);
  };

  const send = async () => {
    setSending(true);
    try {
      await AcademicianService.messageAdvisee(message.student.studentId, message.content.trim());
      toast.success('Message sent', `Delivered to ${name(message.student)}.`);
      setMessage(null);
    } catch (err) {
      toast.error('Could not send message', apiError(err));
    } finally {
      setSending(false);
    }
  };

  const exportCsv = async () => {
    try {
      downloadText(await AcademicianService.exportAdvisees(), 'advisees.csv');
    } catch (err) {
      toast.error('Export failed', apiError(err));
    }
  };

  if (loading) return <Spinner label="Loading advisees…" />;
  if (error) return <Card className="mx-auto mt-16 max-w-md"><EmptyState title="Something went wrong" description={error} /></Card>;

  const q = query.trim().toLowerCase();
  const rows = advisees
    .filter((a) => filter === 'all' || atRisk(a))
    .filter((a) => !q || name(a).toLowerCase().includes(q) || a.studentNumber?.toLowerCase().includes(q))
    .sort((a, b) => (a.gpa ?? 0) - (b.gpa ?? 0));
  const riskCount = advisees.filter(atRisk).length;
  const withGpa = advisees.filter((a) => a.gpa != null);
  const avgGpa = withGpa.length ? withGpa.reduce((s, a) => s + a.gpa, 0) / withGpa.length : null;

  return (
    <>
      <PageHeader
        title="Advising"
        description="Review your advisees' course selections and keep an eye on their academic standing."
        actions={<Button variant="secondary" icon={Download} onClick={exportCsv}>Export list</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Advisees" value={advisees.length} icon={Users} />
        <StatCard label="Average GPA" value={avgGpa != null ? avgGpa.toFixed(2) : '—'} icon={Award} tone={gpaTone(avgGpa)} />
        <StatCard label="At risk (GPA < 2.00)" value={riskCount} icon={TriangleAlert} tone={riskCount ? 'danger' : 'success'}
          onClick={riskCount ? () => setFilter('risk') : undefined} />
      </div>

      <Card className="mt-6">
        <CardHeader icon={ClipboardCheck} title="Enrollment requests"
          description={pending.length ? `${pending.length} course selections from ${pendingByStudent.length} students` : 'Nothing waiting for review'} />
        {pendingByStudent.length === 0 ? (
          <EmptyState icon={Check} title="All caught up" description="New course selections from your advisees will appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {pendingByStudent.map(([student, items]) => {
              const ids = items.map((e) => e.id);
              const groupBusy = busy === ids.join(',');
              return (
                <li key={student} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-fg-muted">
                        {student?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{student}</p>
                        <p className="text-xs text-fg-subtle">{items.length} course{items.length > 1 ? 's' : ''} selected</p>
                      </div>
                    </div>
                    {items.length > 1 && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => decide(ids, false)}>Reject all</Button>
                        <Button size="sm" icon={Check} loading={groupBusy} disabled={!!busy} onClick={() => decide(ids, true)}>Approve all</Button>
                      </div>
                    )}
                  </div>
                  <ul className="mt-3 space-y-1.5 pl-11">
                    {items.map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                        <p className="min-w-0 truncate text-sm"><span className="font-medium text-accent">{e.courseCode}</span> · {e.courseName}</p>
                        <div className="flex shrink-0 gap-1">
                          <Button size="icon-sm" variant="ghost" aria-label="Reject" disabled={!!busy} onClick={() => decide([e.id], false)}>
                            <X className="size-4" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" aria-label="Approve" disabled={!!busy} onClick={() => decide([e.id], true)}
                            className="text-success hover:bg-success-soft hover:text-success">
                            <Check className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h3 className="text-[15px] font-semibold">Advisees</h3>
          <div className="flex flex-wrap gap-2">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40" aria-label="Filter">
              <option value="all">All students</option>
              <option value="risk">At risk only</option>
            </Select>
            <Input icon={Search} placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="w-60" />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title={advisees.length ? 'No matching advisees' : 'No advisees assigned'} />
        ) : (
          <Table>
            <THead><tr><TH>Student</TH><TH>Number</TH><TH>Semester</TH><TH>Status</TH><TH className="text-right">GPA</TH><TH /></tr></THead>
            <TBody>
              {rows.map((a) => (
                <TR key={a.studentId}>
                  <TD>
                    <p className="font-medium">{name(a)}</p>
                    <p className="text-xs text-fg-subtle">{a.departmentName}</p>
                  </TD>
                  <TD className="tabular-nums text-fg-muted">{a.studentNumber}</TD>
                  <TD className="text-fg-muted">{a.currentSemester ?? '—'}</TD>
                  <TD>{atRisk(a) ? <Badge tone="danger" icon={TriangleAlert}>At risk</Badge> : <Badge tone="success">Good standing</Badge>}</TD>
                  <TD className={cn('text-right font-medium tabular-nums', atRisk(a) && 'text-danger')}>{a.gpa != null ? a.gpa.toFixed(2) : '—'}</TD>
                  <TD className="text-right">
                    <Button size="sm" variant="ghost" icon={MessageSquare} onClick={() => setMessage({ student: a, content: '' })}>Message</Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!message}
        onClose={() => setMessage(null)}
        title={message ? `Message ${name(message.student)}` : ''}
        description="Sent as a direct message; the conversation continues in Messages."
        footer={
          <>
            <Link to="/academician/messages" className="mr-auto"><Button variant="ghost">Open Messages</Button></Link>
            <Button variant="ghost" onClick={() => setMessage(null)}>Cancel</Button>
            <Button icon={Send} loading={sending} disabled={!message?.content.trim()} onClick={send}>Send</Button>
          </>
        }
      >
        {message && (
          <Field label="Message" htmlFor="adv-msg">
            <Textarea id="adv-msg" rows={5} autoFocus value={message.content} onChange={(e) => setMessage({ ...message, content: e.target.value })}
              placeholder={atRisk(message.student) ? 'e.g. Could we meet this week to talk about your courses?' : ''} />
          </Field>
        )}
      </Modal>
    </>
  );
};

export default Advisees;
