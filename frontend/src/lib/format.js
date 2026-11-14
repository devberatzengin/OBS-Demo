// Shared display helpers for dates, times and grades.

// Jackson may send LocalDateTime as an ISO string or as [y, m, d, h, min]
export const toDate = (value) => {
  if (value == null) return null;
  if (Array.isArray(value)) return new Date(value[0], value[1] - 1, value[2] ?? 1, value[3] ?? 0, value[4] ?? 0);
  return new Date(value);
};

export const formatDate = (value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? toDate(value).toLocaleDateString('en-GB', opts) : '—';

export const formatTime = (value) => {
  if (!value) return '—';
  // LocalTime arrives as "HH:mm:ss" or "HH:mm"
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  // LocalTime as [h, m]
  if (Array.isArray(value) && value.length <= 3) return `${String(value[0]).padStart(2, '0')}:${String(value[1] ?? 0).padStart(2, '0')}`;
  return toDate(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (value) =>
  value ? `${formatDate(value)} · ${formatTime(value)}` : '—';

export const relativeDays = (value) => {
  if (!value) return '';
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const d = toDate(value); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - start) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
};

export const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
export const dayLabel = (d) => (d ? d.charAt(0) + d.slice(1).toLowerCase() : '');
export const todayKey = () =>
  ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][new Date().getDay()];

// Tone for a letter grade, used by badges
export const gradeTone = (grade) => {
  if (!grade) return 'neutral';
  if (['AA', 'BA', 'BB'].includes(grade)) return 'success';
  if (['CB', 'CC'].includes(grade)) return 'accent';
  if (['DC', 'DD'].includes(grade)) return 'warning';
  if (['FD', 'FF'].includes(grade)) return 'danger';
  return 'neutral';
};

export const gpaTone = (gpa) => (gpa == null ? 'neutral' : gpa >= 3 ? 'success' : gpa >= 2 ? 'accent' : 'danger');

export const examTypeLabel = (t) =>
  ({ MIDTERM: 'Midterm', FINAL: 'Final', QUIZ: 'Quiz', MAKEUP: 'Make-up', PROJECT: 'Project', HOMEWORK: 'Homework' }[t] ??
  (t ? t.charAt(0) + t.slice(1).toLowerCase() : ''));
