import { cn } from './cn';

const tones = {
  neutral: 'bg-surface-muted text-fg-muted border-border',
  accent: 'bg-accent-soft text-accent border-transparent',
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  info: 'bg-info-soft text-info border-transparent',
};

export default function Badge({ tone = 'neutral', className, children, icon: Icon }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
      tones[tone], className,
    )}>
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}
