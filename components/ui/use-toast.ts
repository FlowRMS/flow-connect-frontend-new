import * as React from 'react';

export type ToastVariant = 'default' | 'success' | 'destructive';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

let toastCount = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastCount}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration ?? 4000);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = React.useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return React.createElement(ToastContext.Provider, { value }, children);
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return {
    ...context,
    toast: (toast: Omit<Toast, 'id'>) => context.addToast(toast),
  };
}

// Singleton toast function for imperative usage
export const toast = (toast: Omit<Toast, 'id'>) => {
  if (typeof window === 'undefined') return;
  // @ts-ignore
  window.__shadcn_toast?.(toast);
};

// Internal: attach the context addToast to window for singleton usage
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__shadcn_toast = (toast: Omit<Toast, 'id'>) => {
    // This will be replaced by Toaster on mount
  };
}
