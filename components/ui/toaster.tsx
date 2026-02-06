import * as React from 'react';
import { ToastProvider, useToast as useToastContext, Toast, ToastVariant } from './use-toast';

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  React.useEffect(() => {
    if (toast.duration === 0) return;
    const timer = setTimeout(() => onClose(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  let variantClass = '';
  if (toast.variant === 'success') variantClass = 'bg-green-100 border-green-500 text-green-900';
  else if (toast.variant === 'destructive') variantClass = 'bg-red-100 border-red-500 text-red-900';
  else variantClass = 'bg-white border-gray-200 text-gray-900';

  return (
    <div
      className={`border rounded-lg shadow-md px-4 py-3 mb-2 flex flex-col gap-1 ${variantClass}`}
      role="alert"
      aria-live="assertive"
    >
      {toast.title && <div className="font-semibold">{toast.title}</div>}
      {toast.description && <div className="text-sm">{toast.description}</div>}
      <button
        className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-900"
        onClick={() => onClose(toast.id)}
        aria-label="Close"
        tabIndex={0}
      >
        ×
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts, removeToast, addToast } = useToastContext();

  // Attach addToast to window for singleton toast()
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__shadcn_toast = addToast;
    }
  }, [addToast]);

  return (
    <div className="fixed z-50 top-4 right-4 w-96 max-w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

// For app root usage
export function ToastRoot({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
