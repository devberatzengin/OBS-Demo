import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert } from 'lucide-react';
import { cn } from './cn';

export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-medium tracking-wide text-accent uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-subtle">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const statTones = {
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

export function StatCard({ label, value, hint, icon: Icon, tone = 'accent', onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border bg-surface p-5 shadow-card',
        onClick && 'cursor-pointer transition-colors hover:border-border-strong',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {Icon && (
          <div className={cn('flex size-8 items-center justify-center rounded-lg', statTones[tone])}>
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-surface-muted text-fg-subtle">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-subtle">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-16 text-sm text-fg-subtle', className)}>
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

const alertTones = {
  info: ['bg-info-soft text-info', Info],
  success: ['bg-success-soft text-success', CheckCircle2],
  warning: ['bg-warning-soft text-warning', TriangleAlert],
  danger: ['bg-danger-soft text-danger', AlertCircle],
};

export function Alert({ tone = 'info', title, children, className }) {
  const [cls, Icon] = alertTones[tone];
  return (
    <div className={cn('flex gap-3 rounded-lg px-4 py-3 text-sm', cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
    </div>
  );
}
