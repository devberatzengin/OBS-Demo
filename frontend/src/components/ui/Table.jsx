import { cn } from './cn';

export function Table({ className, children }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-left text-sm', className)}>{children}</table>
    </div>
  );
}
export const THead = ({ children }) => (
  <thead className="border-b border-border bg-surface-muted text-xs font-medium text-fg-subtle uppercase tracking-wide">
    {children}
  </thead>
);
export const TBody = ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>;
export const TR = ({ className, children, ...props }) => (
  <tr className={cn('transition-colors hover:bg-surface-hover/60', className)} {...props}>{children}</tr>
);
export const TH = ({ className, children }) => <th className={cn('px-4 py-2.5 font-medium', className)}>{children}</th>;
export const TD = ({ className, children, ...props }) => (
  <td className={cn('px-4 py-3 align-middle', className)} {...props}>{children}</td>
);
