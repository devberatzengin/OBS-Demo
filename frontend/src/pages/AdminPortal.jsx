import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  GraduationCap, School, Shield, BookOpen, Plus, Search, Pencil, Trash2, Building2, Layers, Activity, UserX, RotateCcw,
  UserPlus, Megaphone, CalendarDays,
} from 'lucide-react';
import AdministrativeService from '../services/AdministrativeService';
import { useAuth } from '../context/AuthContext';
import BroadcastModal from '../components/BroadcastModal';
import {
  Alert, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Pagination, Select,
  Spinner, StatCard, Table, TBody, TD, TH, THead, TR, Tabs, useToast,
} from '../components/ui';
import { formatDateTime } from '../lib/format';
import { apiError, fieldErrors } from '../lib/errors';

const ROLE_TABS = [
  { id: 'STUDENT', label: 'Students', icon: GraduationCap, fetch: AdministrativeService.getStudents },
  { id: 'ACADEMICIAN', label: 'Academicians', icon: School, fetch: AdministrativeService.getAcademicians },
  { id: 'ADMINISTRATIVE', label: 'Staff', icon: Shield, fetch: AdministrativeService.getAdministratives },
];

const PAGE_SIZE = 25;
const EMPTY_PAGE = { content: [], page: 0, totalPages: 0, totalElements: 0 };

const EMPTY_USER = {
  username: '', password: '', email: '', firstName: '', lastName: '',
  studentNumber: '', staffNumber: '', departmentId: '', advisorId: '', academicTitle: '', officeNumber: '', position: '',
};
const EMPTY_COURSE = { code: '', name: '', akts: 5, credits: 3, semesterLevel: 1, departmentId: '', instructorId: '' };

const num = (v) => (v === '' || v == null ? null : Number(v));
const fullName = (u) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();

function sectionFromPath(path) {
  if (path.includes('/users')) return 'users';
  if (path.includes('/courses')) return 'courses';
  if (path.includes('/infra')) return 'infra';
  return 'overview';
}

const TITLES = {
  overview: ['System overview', 'Users, courses and recent activity across the university.'],
  users: ['Users', 'Create and manage student, academician and staff accounts.'],
  courses: ['Courses', 'The course catalogue and instructor assignments.'],
  infra: ['Infrastructure', 'Faculties and their departments.'],
};

const AdminPortal = () => {
  const location = useLocation();
  const section = sectionFromPath(location.pathname);
  const toast = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicians, setAcademicians] = useState([]); // [{ id, name, departmentId }] for the pickers
  const [logs, setLogs] = useState(EMPTY_PAGE);
  const [logPage, setLogPage] = useState(0);
  // The users or courses list on screen: one page from the server (plan 4.2)
  const [loaded, setLoaded] = useState({ key: null, data: EMPTY_PAGE });
  const [pageState, setPageState] = useState({ key: null, page: 0 });
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [listVersion, setListVersion] = useState(0); // bump to reload the current page
  const [partialError, setPartialError] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [editor, setEditor] = useState(null); // { type: 'user'|'course', role?, item?, form }
  const [fe, setFe] = useState({}); // field errors from the last save
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toDelete, setToDelete] = useState(null); // { type, item }
  const [deleting, setDeleting] = useState(false);
  const [broadcast, setBroadcast] = useState(false);

  // Everything except the paged list: summary numbers, pickers and the department counts
  const load = useCallback(() => Promise.allSettled([
    AdministrativeService.getStats(),
    AdministrativeService.getFaculties(),
    AdministrativeService.getDepartments(),
    AdministrativeService.getAcademicianOptions(),
  ]).then((r) => {
    const val = (i, fallback) => (r[i].status === 'fulfilled' ? r[i].value ?? fallback : fallback);
    setStats(val(0, null));
    setFaculties(val(1, []));
    setDepartments(val(2, []));
    setAcademicians(val(3, []));
    setPartialError(r.some((x) => x.status === 'rejected'));
  }).finally(() => setLoading(false)), []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    AdministrativeService.getLogs({ page: logPage, size: 10 }).then(setLogs).catch(() => setPartialError(true));
  }, [logPage, listVersion]);

  // Search runs on the server: wait until typing pauses
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // A new search, tab or filter starts again at the first page: the page belongs to one list key
  const listKey = `${section}|${role}|${deptFilter}|${debouncedQuery}`;
  const page = pageState.key === listKey ? pageState.page : 0;
  const setPage = (p) => setPageState({ key: listKey, page: p });
  // What is on screen is stale until the response for exactly this request has arrived
  const requestKey = `${listKey}|${page}|${listVersion}`;
  const listLoading = loaded.key !== requestKey;
  const list = loaded.data;

  useEffect(() => {
    if (section !== 'users' && section !== 'courses') return undefined;
    let cancelled = false;
    const params = { page, size: PAGE_SIZE, q: debouncedQuery };
    const request = section === 'users'
      ? ROLE_TABS.find((t) => t.id === role).fetch(params)
      : AdministrativeService.getCourses({ ...params, departmentId: deptFilter === 'ALL' ? null : deptFilter });
    request
      .then((data) => { if (!cancelled) setLoaded({ key: requestKey, data: data ?? EMPTY_PAGE }); })
      .catch((err) => {
        if (cancelled) return;
        setLoaded({ key: requestKey, data: EMPTY_PAGE });
        toast.error('Could not load the list', apiError(err));
      });
    return () => { cancelled = true; };
  }, [section, role, page, debouncedQuery, deptFilter, requestKey, toast]);

  const refresh = () => { load(); setListVersion((v) => v + 1); };

  const deptName = useCallback((id) => departments.find((d) => d.id === id)?.name, [departments]);

  /* ---------- editor ---------- */

  const openUser = (item = null) => {
    setFormError('');
    setFe({});
    setEditor({
      type: 'user',
      role,
      item,
      form: item ? { ...EMPTY_USER, ...Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v ?? ''])), password: '' } : { ...EMPTY_USER },
    });
  };

  const openCourse = (item = null) => {
    setFormError('');
    setFe({});
    setEditor({
      type: 'course',
      item,
      form: item ? { ...EMPTY_COURSE, ...Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v ?? ''])) } : { ...EMPTY_COURSE },
    });
  };

  const setField = (key) => (e) => {
    setEditor((ed) => ({ ...ed, form: { ...ed.form, [key]: e.target.value } }));
    setFe((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const save = async (e) => {
    e.preventDefault();
    const { type, item, form } = editor;
    setSaving(true);
    setFormError('');
    try {
      if (type === 'user') {
        const base = {
          username: form.username, email: form.email, firstName: form.firstName, lastName: form.lastName,
          password: form.password || (item ? null : form.password),
        };
        if (editor.role === 'STUDENT') {
          const body = { ...base, studentNumber: form.studentNumber, departmentId: num(form.departmentId), advisorId: num(form.advisorId) };
          await (item ? AdministrativeService.updateStudent(item.id, body) : AdministrativeService.registerStudent(body));
        } else if (editor.role === 'ACADEMICIAN') {
          const body = { ...base, staffNumber: form.staffNumber, departmentId: num(form.departmentId), academicTitle: form.academicTitle, officeNumber: form.officeNumber };
          await (item ? AdministrativeService.updateAcademician(item.id, body) : AdministrativeService.registerAcademician(body));
        } else {
          const body = { ...base, staffNumber: form.staffNumber, position: form.position };
          await (item ? AdministrativeService.updateAdministrative(item.id, body) : AdministrativeService.registerAdministrative(body));
        }
      } else {
        const body = {
          code: form.code, name: form.name, akts: num(form.akts), credits: num(form.credits),
          semesterLevel: num(form.semesterLevel), departmentId: num(form.departmentId), instructorId: num(form.instructorId),
        };
        await (item ? AdministrativeService.updateCourse(item.id, body) : AdministrativeService.createCourse(body));
      }
      toast.success(`${type === 'user' ? 'User' : 'Course'} ${item ? 'updated' : 'created'}`);
      setEditor(null);
      refresh();
    } catch (err) {
      const errors = fieldErrors(err);
      setFe(errors);
      // Field messages are shown under the inputs; the banner only repeats what has no field
      setFormError(Object.keys(errors).length ? 'Please fix the highlighted fields.' : apiError(err, 'Operation failed.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      if (toDelete.type === 'user') await AdministrativeService.deleteUser(toDelete.item.id);
      else await AdministrativeService.deleteCourse(toDelete.item.id);
      toast.success(toDelete.type === 'user' ? 'User deactivated' : 'Course deleted');
      setToDelete(null);
      refresh();
    } catch (err) {
      toast.error(toDelete.type === 'user' ? 'Could not deactivate user' : 'Delete failed', apiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const reactivate = async (u) => {
    try {
      await AdministrativeService.reactivateUser(u.id);
      toast.success('User reactivated', `${fullName(u)} can sign in again.`);
      refresh();
    } catch (err) {
      toast.error('Could not reactivate user', apiError(err));
    }
  };

  /* ---------- derived lists ---------- */

  const roleTab = ROLE_TABS.find((t) => t.id === role);
  const q = debouncedQuery;
  // Rows of another list (a different tab, filter or search) are never shown, even while loading
  const sameList = loaded.key?.startsWith(`${listKey}|`);
  const userRows = section === 'users' && sameList ? list.content : [];
  const courseRows = section === 'courses' && sameList ? list.content : [];
  const pager = sameList && (
    <Pagination page={list.page} totalPages={list.totalPages} totalElements={list.totalElements} onChange={setPage} />
  );

  if (loading) return <Spinner label="Loading…" />;

  const [title, description] = TITLES[section];
  const actions = {
    overview: <Button variant="secondary" icon={Megaphone} onClick={() => setBroadcast(true)}>Broadcast</Button>,
    users: <Button icon={UserPlus} onClick={() => openUser()}>Add {roleTab.label.replace(/s$/, '').toLowerCase()}</Button>,
    courses: <Button icon={Plus} onClick={() => openCourse()}>Add course</Button>,
    infra: null,
  }[section];

  return (
    <>
      <PageHeader eyebrow="Administration" title={title} description={description} actions={actions} />
      {partialError && <Alert tone="warning" className="mb-6">Some data could not be loaded. The figures below may be incomplete.</Alert>}

      {section === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Students" value={stats?.studentCount ?? '—'} icon={GraduationCap} />
            <StatCard label="Academicians" value={stats?.academicianCount ?? '—'} icon={School} tone="info" />
            <StatCard label="Staff" value={stats?.administrativeCount ?? '—'} icon={Shield} tone="info" />
            <StatCard label="Courses" value={stats?.courseCount ?? '—'} icon={BookOpen} tone="success"
              hint={stats?.activeSemesterName ? `Active: ${stats.activeSemesterName}` : undefined} />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader icon={Activity} title="Recent activity" description="Audit log of administrative actions." />
              {logs.content.length === 0 ? <EmptyState icon={Activity} title="No activity recorded yet" /> : (
                <ul className="max-h-[480px] divide-y divide-border overflow-y-auto">
                  {logs.content.map((l) => (
                    <li key={l.id} className="flex items-start gap-3 px-5 py-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                        {l.action?.includes('REGISTER') ? <UserPlus className="size-3.5" /> : <Activity className="size-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{l.action?.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</p>
                        <p className="truncate text-sm text-fg-subtle">{l.details}</p>
                      </div>
                      <div className="shrink-0 text-right text-xs text-fg-subtle">
                        <p>{formatDateTime(l.timestamp)}</p>
                        {l.performedBy && <p>{l.performedBy}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Pagination page={logs.page} totalPages={logs.totalPages} totalElements={logs.totalElements} onChange={setLogPage} />
            </Card>
            <Card>
              <CardHeader icon={Building2} title="Organisation" />
              <dl className="divide-y divide-border">
                {[['Faculties', faculties.length], ['Departments', departments.length], ['Courses', stats?.courseCount ?? '—'],
                  ['Unassigned courses', stats?.unassignedCourseCount ?? '—']].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
                    <dt className="text-fg-muted">{k}</dt><dd className="font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <dt className="text-fg-muted">Active semester</dt>
                  <dd>{stats?.activeSemesterName ? <Badge tone="success" icon={CalendarDays}>{stats.activeSemesterName}</Badge> : <Badge tone="warning">None</Badge>}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </>
      )}

      {section === 'users' && (
        <>
          <Tabs className="mb-4" value={role} onChange={(id) => { setRole(id); setQuery(''); }}
            tabs={ROLE_TABS.map((t) => ({ ...t, count: t.id === role && !listLoading ? list.totalElements : undefined }))} />
          <Card>
            <div className="border-b border-border px-5 py-3">
              <Input icon={Search} placeholder="Search by name, username, email or number" value={query}
                onChange={(e) => setQuery(e.target.value)} className="max-w-md" />
            </div>
            {listLoading && userRows.length === 0 ? <Spinner label="Loading…" /> : userRows.length === 0 ? <EmptyState icon={roleTab.icon} title={q ? 'No matches' : `No ${roleTab.label.toLowerCase()} yet`} /> : (
              <Table>
                <THead><tr>
                  <TH>Name</TH><TH>{role === 'STUDENT' ? 'Student no.' : 'Staff no.'}</TH>
                  <TH>{role === 'ADMINISTRATIVE' ? 'Position' : 'Department'}</TH><TH>Email</TH><TH />
                </tr></THead>
                <TBody>
                  {userRows.map((u) => (
                    <TR key={u.id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-fg-muted">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 truncate font-medium">
                              {role === 'ACADEMICIAN' && u.academicTitle ? `${u.academicTitle} ` : ''}{fullName(u)}
                              {u.role === 'ADMIN' && <Badge tone="accent">Admin</Badge>}
                              {u.active === false && <Badge tone="warning">Inactive</Badge>}
                            </p>
                            <p className="truncate text-xs text-fg-subtle">@{u.username}</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="tabular-nums text-fg-muted">{u.studentNumber || u.staffNumber || '—'}</TD>
                      <TD className="text-fg-muted">{role === 'ADMINISTRATIVE' ? (u.position || '—') : (deptName(u.departmentId) ?? '—')}</TD>
                      <TD className="text-fg-muted">{u.email}</TD>
                      <TD className="text-right whitespace-nowrap">
                        <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => openUser(u)}><Pencil className="size-4" /></Button>
                        {u.active === false ? (
                          <Button size="icon-sm" variant="ghost" aria-label="Reactivate" title="Reactivate" onClick={() => reactivate(u)}><RotateCcw className="size-4" /></Button>
                        ) : u.role !== 'ADMIN' && u.id !== user?.id && (
                          <Button size="icon-sm" variant="danger-ghost" aria-label="Deactivate" title="Deactivate" onClick={() => setToDelete({ type: 'user', item: u })}><UserX className="size-4" /></Button>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
            {pager}
          </Card>
        </>
      )}

      {section === 'courses' && (
        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
            <Input icon={Search} placeholder="Search by code or name" value={query} onChange={(e) => setQuery(e.target.value)} className="w-72" />
            <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-64" aria-label="Department">
              <option value="ALL">All departments{stats?.courseCount != null ? ` (${stats.courseCount})` : ''}</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>{d.name} ({d.courseCount ?? 0})</option>
              ))}
            </Select>
          </div>
          {listLoading && courseRows.length === 0 ? <Spinner label="Loading…" /> : courseRows.length === 0 ? <EmptyState icon={BookOpen} title={q || deptFilter !== 'ALL' ? 'No matching courses' : 'No courses yet'} /> : (
            <Table>
              <THead><tr><TH>Course</TH><TH>Department</TH><TH>Semester</TH><TH>Credits</TH><TH>Instructor</TH><TH /></tr></THead>
              <TBody>
                {courseRows.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <p className="text-xs font-semibold text-accent">{c.code}</p>
                      <p className="font-medium">{c.name}</p>
                    </TD>
                    <TD className="text-fg-muted">{c.departmentName ?? deptName(c.departmentId) ?? '—'}</TD>
                    <TD className="text-fg-muted">{c.semesterLevel ?? '—'}</TD>
                    <TD className="whitespace-nowrap tabular-nums text-fg-muted">{c.credits} · {c.akts} ECTS</TD>
                    <TD>{c.instructorName ? <span className="text-fg-muted">{c.instructorName}</span> : <Badge tone="warning">Unassigned</Badge>}</TD>
                    <TD className="text-right whitespace-nowrap">
                      <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => openCourse(c)}><Pencil className="size-4" /></Button>
                      <Button size="icon-sm" variant="danger-ghost" aria-label="Delete" onClick={() => setToDelete({ type: 'course', item: c })}><Trash2 className="size-4" /></Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
          {pager}
        </Card>
      )}

      {section === 'infra' && (
        faculties.length === 0 ? <Card><EmptyState icon={Building2} title="No faculties defined" /></Card> : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {faculties.map((f) => {
              const depts = departments.filter((d) => d.facultyId === f.id || d.facultyName === f.name);
              return (
                <Card key={f.id}>
                  <CardHeader icon={Building2} title={f.name} description={`${depts.length} department${depts.length === 1 ? '' : 's'}`} />
                  {depts.length === 0 ? <EmptyState icon={Layers} title="No departments" /> : (
                    <ul className="divide-y divide-border">
                      {depts.map((d) => {
                        const n = d.courseCount ?? 0;
                        const s = d.studentCount ?? 0;
                        return (
                          <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                            <span className="flex items-center gap-2 text-sm font-medium"><Layers className="size-4 text-fg-subtle" />{d.name}</span>
                            <span className="flex gap-2"><Badge>{n} courses</Badge><Badge>{s} students</Badge></span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Editor */}
      <Modal
        open={!!editor}
        onClose={() => setEditor(null)}
        size="lg"
        title={editor ? `${editor.item ? 'Edit' : 'New'} ${editor.type === 'course' ? 'course' : ROLE_TABS.find((t) => t.id === editor.role).label.replace(/s$/, '').toLowerCase()}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditor(null)}>Cancel</Button>
            <Button type="submit" form="admin-editor" loading={saving}>{editor?.item ? 'Save changes' : 'Create'}</Button>
          </>
        }
      >
        {editor && (
          <form id="admin-editor" onSubmit={save} className="space-y-4">
            {formError && <Alert tone="danger">{formError}</Alert>}
            {editor.type === 'user' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First name" htmlFor="u-first" error={fe.firstName}><Input id="u-first" required value={editor.form.firstName} onChange={setField('firstName')} /></Field>
                <Field label="Last name" htmlFor="u-last" error={fe.lastName}><Input id="u-last" required value={editor.form.lastName} onChange={setField('lastName')} /></Field>
                <Field label="Email" htmlFor="u-email" error={fe.email}><Input id="u-email" type="email" required value={editor.form.email} onChange={setField('email')} /></Field>
                <Field label="Username" htmlFor="u-user" error={fe.username} hint={editor.item ? 'Usernames cannot be changed.' : undefined}>
                  <Input id="u-user" required disabled={!!editor.item} value={editor.form.username} onChange={setField('username')} />
                </Field>
                <Field label={editor.item ? 'New password' : 'Password'} htmlFor="u-pass" error={fe.password} hint={editor.item ? 'Leave empty to keep the current password.' : 'At least 8 characters.'}>
                  <Input id="u-pass" type="password" autoComplete="new-password" minLength={8} maxLength={72} required={!editor.item} value={editor.form.password} onChange={setField('password')} />
                </Field>
                {editor.role === 'STUDENT' ? (
                  <Field label="Student number" htmlFor="u-no" error={fe.studentNumber ?? fe.staffNumber}><Input id="u-no" required value={editor.form.studentNumber} onChange={setField('studentNumber')} /></Field>
                ) : (
                  <Field label="Staff number" htmlFor="u-no" error={fe.studentNumber ?? fe.staffNumber}><Input id="u-no" required value={editor.form.staffNumber} onChange={setField('staffNumber')} /></Field>
                )}
                {editor.role !== 'ADMINISTRATIVE' && (
                  <Field label="Department" htmlFor="u-dept" error={fe.departmentId}>
                    <Select id="u-dept" required value={editor.form.departmentId} onChange={setField('departmentId')}>
                      <option value="">Select department</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                  </Field>
                )}
                {editor.role === 'STUDENT' && (
                  <Field label="Advisor" htmlFor="u-adv">
                    <Select id="u-adv" value={editor.form.advisorId} onChange={setField('advisorId')}>
                      <option value="">No advisor</option>
                      {academicians.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Select>
                  </Field>
                )}
                {editor.role === 'ACADEMICIAN' && (
                  <>
                    <Field label="Academic title" htmlFor="u-title"><Input id="u-title" placeholder="Dr. Öğr. Üyesi" value={editor.form.academicTitle} onChange={setField('academicTitle')} /></Field>
                    <Field label="Office" htmlFor="u-office"><Input id="u-office" placeholder="B-214" value={editor.form.officeNumber} onChange={setField('officeNumber')} /></Field>
                  </>
                )}
                {editor.role === 'ADMINISTRATIVE' && (
                  <Field label="Position" htmlFor="u-pos"><Input id="u-pos" value={editor.form.position} onChange={setField('position')} /></Field>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                <Field label="Code" htmlFor="c-code" error={fe.code} className="sm:col-span-2"><Input id="c-code" required value={editor.form.code} onChange={setField('code')} /></Field>
                <Field label="Name" htmlFor="c-name" error={fe.name} className="sm:col-span-4"><Input id="c-name" required value={editor.form.name} onChange={setField('name')} /></Field>
                <Field label="Credits" htmlFor="c-cr" error={fe.credits} className="sm:col-span-2"><Input id="c-cr" type="number" min={0} required value={editor.form.credits} onChange={setField('credits')} /></Field>
                <Field label="ECTS" htmlFor="c-akts" error={fe.akts} className="sm:col-span-2"><Input id="c-akts" type="number" min={1} max={30} required value={editor.form.akts} onChange={setField('akts')} /></Field>
                <Field label="Semester" htmlFor="c-sem" className="sm:col-span-2"><Input id="c-sem" type="number" min={1} max={8} required value={editor.form.semesterLevel} onChange={setField('semesterLevel')} /></Field>
                <Field label="Department" htmlFor="c-dept" error={fe.departmentId} className="sm:col-span-3">
                  <Select id="c-dept" required value={editor.form.departmentId} onChange={setField('departmentId')}>
                    <option value="">Select department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </Field>
                <Field label="Instructor" htmlFor="c-ins" className="sm:col-span-3">
                  <Select id="c-ins" value={editor.form.instructorId} onChange={setField('instructorId')}>
                    <option value="">Unassigned</option>
                    {academicians.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </Select>
                </Field>
              </div>
            )}
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title={toDelete?.type === 'course' ? 'Delete course?' : 'Deactivate user?'}
        confirmLabel={toDelete?.type === 'course' ? 'Delete' : 'Deactivate'}
        description={toDelete ? (toDelete.type === 'course'
          ? `${toDelete.item.code} · ${toDelete.item.name} will be permanently removed.`
          : `${fullName(toDelete.item)} (@${toDelete.item.username}) will no longer be able to sign in. Grades, enrollments and messages are kept, and you can reactivate the account later.`) : ''}
      />

      <BroadcastModal open={broadcast} onClose={() => setBroadcast(false)} />
    </>
  );
};

export default AdminPortal;
