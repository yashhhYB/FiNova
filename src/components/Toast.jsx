import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

const DURATION = 3800;
const VARIANTS = {
  success:   { Icon: CheckCircle2, cls: 'text-emerald-500', bar: 'bg-emerald-500',  border: 'border-emerald-200/60 dark:border-emerald-600/30' },
  error:     { Icon: AlertCircle,  cls: 'text-rose-500',    bar: 'bg-rose-500',     border: 'border-rose-200/60 dark:border-rose-600/30' },
  info:      { Icon: Info,         cls: 'text-blue-400',    bar: 'bg-blue-500',     border: 'border-blue-200/60 dark:border-blue-600/30' },
  celebrate: { Icon: Sparkles,     cls: 'text-amber-400',   bar: 'bg-gradient-to-r from-amber-400 to-orange-500', border: 'border-amber-300/60 dark:border-amber-600/30' },
};

function ToastItem({ id, message, type = 'info', onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const v = VARIANTS[type] || VARIANTS.info;

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 16);
    const t2 = setTimeout(() => startLeave(), DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const startLeave = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(id), 380);
  };

  return (
    <div
      style={{ transition: 'all 0.38s cubic-bezier(0.16,1,0.3,1)' }}
      className={`relative flex items-start gap-3 pl-4 pr-3 py-3.5 min-w-[280px] max-w-[380px]
        bg-surface/95 backdrop-blur-2xl border ${v.border} rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.35)]
        overflow-hidden
        ${visible && !leaving ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'}`}
    >
      <v.Icon size={15} className={`${v.cls} shrink-0 mt-0.5`} />
      <p className="text-sm font-medium text-ink leading-snug flex-1 pr-1">{message}</p>
      <button
        onClick={startLeave}
        className="w-5 h-5 flex items-center justify-center text-dim hover:text-ink transition-all duration-200 hover:scale-110 hover:rotate-90 shrink-0"
      >
        <X size={12} />
      </button>
      <div
        className={`absolute bottom-0 left-0 h-[2.5px] ${v.bar} rounded-full`}
        style={{ animation: `toast-shrink ${DURATION}ms linear forwards` }}
      />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(p => [...p.slice(-4), { id, message, type }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
