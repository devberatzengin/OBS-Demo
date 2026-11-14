import { useCallback, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext } from './toast-context';
import { cn } from './cn';

const STYLES = {
  success: ['text-success', CheckCircle2],
  error: ['text-danger', AlertCircle],
  info: ['text-info', Info],
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((tone, title, description) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, tone, title, description }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500);
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (title, description) => push('success', title, description),
    error: (title, description) => push('error', title, description),
    info: (title, description) => push('info', title, description),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map(({ id, tone, title, description }) => {
          const [color, Icon] = STYLES[tone];
          return (
            <div key={id} role="status" className="pointer-events-auto flex gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-pop">
              <Icon className={cn('mt-0.5 size-4 shrink-0', color)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{title}</p>
                {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
              </div>
              <button onClick={() => dismiss(id)} className="text-fg-subtle hover:text-fg cursor-pointer" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
