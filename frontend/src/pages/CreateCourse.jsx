import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import AcademicianService from '../services/AcademicianService';
import { Alert, Button, Card, CardBody, Field, Input, PageHeader, Textarea, useToast } from '../components/ui';
import { apiError } from '../lib/errors';

const CreateCourse = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', code: '', credits: 3, akts: 5, capacity: 30, description: '' });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AcademicianService.createCourse(form);
      toast.success('Course created', `${form.code} is waiting for department approval.`);
      navigate('/academician');
    } catch (err) {
      toast.error('Could not create course', apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Link to="/academician" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg">
        <ChevronLeft className="size-4" /> Dashboard
      </Link>
      <PageHeader title="New course" description="Propose a course for the current semester." />

      <Card className="max-w-3xl">
        <form onSubmit={submit}>
          <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-6">
            <Field label="Course name" htmlFor="c-name" className="sm:col-span-4">
              <Input id="c-name" required placeholder="Advanced Algorithms" value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Code" htmlFor="c-code" className="sm:col-span-2">
              <Input id="c-code" required placeholder="CS302" value={form.code} onChange={set('code')} />
            </Field>
            <Field label="Local credits" htmlFor="c-credits" className="sm:col-span-2">
              <Input id="c-credits" type="number" min={0} required value={form.credits} onChange={set('credits')} />
            </Field>
            <Field label="ECTS" htmlFor="c-akts" className="sm:col-span-2">
              <Input id="c-akts" type="number" min={0} max={30} required value={form.akts} onChange={set('akts')} />
            </Field>
            <Field label="Capacity" htmlFor="c-cap" className="sm:col-span-2">
              <Input id="c-cap" type="number" min={1} required value={form.capacity} onChange={set('capacity')} />
            </Field>
            <Field label="Description" htmlFor="c-desc" className="sm:col-span-6">
              <Textarea id="c-desc" rows={5} placeholder="A short overview of the course content" value={form.description} onChange={set('description')} />
            </Field>
            <Alert tone="info" className="sm:col-span-6">New courses need department approval before they appear in the catalogue.</Alert>
          </CardBody>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Link to="/academician"><Button variant="ghost">Cancel</Button></Link>
            <Button type="submit" icon={Save} loading={saving}>Create course</Button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default CreateCourse;
