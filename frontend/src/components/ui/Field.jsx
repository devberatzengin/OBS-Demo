import { cn } from './cn';

const control =
  'w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle ' +
  'shadow-card transition-colors focus:border-accent focus:outline-none focus:ring-3 focus:ring-[var(--ring)] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

export function Label({ children, htmlFor, className }) {
  return <label htmlFor={htmlFor} className={cn('mb-1.5 block text-sm font-medium text-fg', className)}>{children}</label>;
}

export function Input({ className, icon: Icon, ...props }) {
  if (!Icon) return <input className={cn(control, 'h-9', className)} {...props} />;
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
      <input className={cn(control, 'h-9 pl-9', className)} {...props} />
    </div>
  );
}

export function Select({ className, children, ...props }) {
  return <select className={cn(control, 'h-9 pr-8', className)} {...props}>{children}</select>;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(control, 'min-h-24 py-2', className)} {...props} />;
}

export function Field({ label, htmlFor, hint, children, className }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
