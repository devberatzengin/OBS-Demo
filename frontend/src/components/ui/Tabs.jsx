import { cn } from './cn';

/** Underlined tab bar. tabs: [{ id, label, icon, count }] */
export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-border', className)}>
      {tabs.map(({ id, label, icon: Icon, count }) => {
        const active = value === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              '-mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer',
              active ? 'border-accent text-fg' : 'border-transparent text-fg-subtle hover:text-fg',
            )}
          >
            {Icon && <Icon className="size-4" />}
            {label}
            {count != null && (
              <span className={cn('rounded-full px-1.5 text-xs tabular-nums', active ? 'bg-accent-soft text-accent' : 'bg-surface-muted text-fg-subtle')}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
