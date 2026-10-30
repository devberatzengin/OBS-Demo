import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import AdministrativeService from '../services/AdministrativeService';
import { Button, Field, Input, Modal, Select, Textarea, useToast } from './ui';
import { apiError } from '../lib/errors';

const EMPTY = { title: '', content: '', targetRole: 'ALL' };

// System-wide announcement; each target user receives a notification
export default function BroadcastModal({ open, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);

  const close = () => { setForm(EMPTY); onClose(); };

  const send = async () => {
    setSending(true);
    try {
      await AdministrativeService.sendAnnouncement(form);
      toast.success('Announcement sent', form.targetRole === 'ALL' ? 'Delivered to every user.' : `Delivered to all ${form.targetRole.toLowerCase()}s.`);
      close();
    } catch (err) {
      toast.error('Could not send announcement', apiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Broadcast announcement"
      description="Appears in the notifications of every selected user."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button icon={Megaphone} loading={sending} disabled={!form.title.trim() || !form.content.trim()} onClick={send}>Send</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Audience" htmlFor="bc-role">
          <Select id="bc-role" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
            <option value="ALL">Everyone</option>
            <option value="STUDENT">Students</option>
            <option value="ACADEMICIAN">Academicians</option>
          </Select>
        </Field>
        <Field label="Title" htmlFor="bc-title">
          <Input id="bc-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Message" htmlFor="bc-content">
          <Textarea id="bc-content" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}
