import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

// Returns { success, error, info }; each takes (title, description?)
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
