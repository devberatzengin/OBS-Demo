import { Loader2 } from 'lucide-react';
import { cn } from './cn';

const variants = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-card',
  secondary: 'bg-surface text-fg border border-border hover:bg-surface-hover shadow-card',
  ghost: 'text-fg-muted hover:bg-surface-hover hover:text-fg',
  danger: 'bg-danger text-white hover:opacity-90 shadow-card',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
};

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'h-9 w-9 justify-center',
  'icon-sm': 'h-8 w-8 justify-center',
};

export default function Button({
  variant = 'primary', size = 'md', loading = false, icon: Icon,
  className, children, disabled, type = 'button', ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center rounded-lg font-medium whitespace-nowrap cursor-pointer',
        'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4 shrink-0" />}
      {children}
    </button>
  );
}
