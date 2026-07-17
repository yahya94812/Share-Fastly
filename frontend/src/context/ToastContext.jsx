import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++idCounter;
    setToasts((t) => [...t, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    error: (msg) => push(msg, 'error'),
    success: (msg) => push(msg, 'success'),
    info: (msg) => push(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[calc(100%-2.5rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-fade-up flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm ${
              t.type === 'error'
                ? 'bg-[#2A1520] border-[color:var(--color-danger)]/40 text-[color:var(--color-danger)]'
                : t.type === 'success'
                ? 'bg-[#12271F] border-[color:var(--color-teal)]/40 text-[color:var(--color-teal)]'
                : 'bg-panel border-hair text-paper'
            }`}
          >
            {t.type === 'error' && <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
            {t.type === 'success' && <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            {t.type === 'info' && <Info size={18} className="mt-0.5 shrink-0" />}
            <p className="text-sm leading-snug flex-1 font-body">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
