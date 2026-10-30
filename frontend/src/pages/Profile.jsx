import { useEffect, useState } from 'react';
import { Mail, MapPin, Pencil, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StudentService from '../services/StudentService';
import AcademicianService from '../services/AcademicianService';
import AdministrativeService from '../services/AdministrativeService';
import {
  Alert, Badge, Button, Card, CardHeader, Field, Input, PageHeader, Spinner, Textarea, useToast,
} from '../components/ui';
import { formatDate } from '../lib/format';
import { apiError } from '../lib/errors';

const serviceFor = (role) => {
  if (role === 'ACADEMICIAN') return AcademicianService;
  if (role === 'ADMIN' || role === 'ADMINISTRATIVE') return AdministrativeService;
  return StudentService;
};

const ROLE_LABEL = { STUDENT: 'Student', ACADEMICIAN: 'Academician', ADMINISTRATIVE: 'Staff', ADMIN: 'Administrator' };

// Read-only details shown per role; [label, value]
const detailsFor = (role, p) => {
  if (role === 'ACADEMICIAN') {
    return [['Academic title', p.title], ['Department', p.departmentName], ['Office', p.office]];
  }
  if (role === 'ADMIN' || role === 'ADMINISTRATIVE') {
    return [['Staff number', p.staffNumber], ['Position', p.position], ['Faculty', p.facultyName], ['Department', p.departmentName]];
  }
  return [
    ['Student number', p.studentNumber],
    ['Faculty', p.facultyName],
    ['Department', p.departmentName],
    ['Current semester', p.currentSemester],
    ['Advisor', p.advisorName],
    ['Registered on', p.registrationDate ? formatDate(p.registrationDate) : null],
  ];
};

const Profile = () => {
  const { user } = useAuth();
  const toast = useToast();
  const service = serviceFor(user.role);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ email: '', phoneNumber: '', address: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    service.getProfile()
      .then((data) => {
        setProfile(data);
        setForm({ email: data.email || '', phoneNumber: data.phoneNumber || '', address: data.address || '' });
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false));
  }, [service]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await service.updateProfile(form);
      setProfile((p) => ({ ...p, ...form }));
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Could not save changes', apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setForm({ email: profile.email || '', phoneNumber: profile.phoneNumber || '', address: profile.address || '' });
    setEditing(false);
  };

  if (loading) return <Spinner label="Loading profile…" />;
  if (error) return <Alert tone="danger">{error}</Alert>;

  const name = profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user.username;
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const subtitle = user.role === 'ACADEMICIAN' ? profile.title : user.role === 'STUDENT' ? profile.departmentName : profile.position;

  return (
    <>
      <PageHeader title="Profile" description="Your personal and contact information." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Identity */}
        <Card className="h-fit p-6 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent-soft text-2xl font-semibold text-accent">
            {initials}
          </div>
          <h2 className="mt-4 text-lg font-semibold">{name}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-fg-subtle">{subtitle}</p>}
          <div className="mt-3"><Badge tone="accent">{ROLE_LABEL[user.role]}</Badge></div>
          <div className="mt-6 space-y-3 border-t border-border pt-5 text-left text-sm">
            <p className="flex items-center gap-2.5 text-fg-muted"><Mail className="size-4 shrink-0 text-fg-subtle" /><span className="truncate">{profile.email || '—'}</span></p>
            <p className="flex items-center gap-2.5 text-fg-muted"><Phone className="size-4 shrink-0 text-fg-subtle" />{profile.phoneNumber || '—'}</p>
            <p className="flex items-start gap-2.5 text-fg-muted"><MapPin className="mt-0.5 size-4 shrink-0 text-fg-subtle" />{profile.address || '—'}</p>
          </div>
        </Card>

        <div className="space-y-6">
          {/* Contact (editable) */}
          <Card>
            <CardHeader
              title="Contact information"
              description="This is how the university and your instructors reach you."
              action={!editing && <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>}
            />
            <form onSubmit={save}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <Field label="Email" htmlFor="email">
                  <Input id="email" type="email" required disabled={!editing} value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
                <Field label="Phone" htmlFor="phone">
                  <Input id="phone" disabled={!editing} placeholder="+90 5xx xxx xx xx" value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                </Field>
                <Field label="Address" htmlFor="address" className="sm:col-span-2">
                  <Textarea id="address" rows={3} disabled={!editing} value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>
              </div>
              {editing && (
                <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
                  <Button variant="ghost" onClick={cancel}>Cancel</Button>
                  <Button type="submit" loading={saving}>Save changes</Button>
                </div>
              )}
            </form>
          </Card>

          {/* Role details (read-only) */}
          <Card>
            <CardHeader
              title={user.role === 'STUDENT' ? 'Academic details' : user.role === 'ACADEMICIAN' ? 'Professional details' : 'Staff details'}
              description="Managed by the registrar. Contact student affairs to change these."
            />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              {detailsFor(user.role, profile).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium text-fg-subtle">{label}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Profile;
