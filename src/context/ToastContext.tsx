import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (messageOrOptions: string | ToastOptions, type?: ToastType, duration?: number) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => string;
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => string;
  info: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => string;
  warning: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global custom event name for calling toasts outside of React tree if necessary
const TOAST_EVENT_NAME = 'taemry:show_toast';

/**
 * Global helper to trigger toasts from anywhere in the application.
 */
export const toast = {
  show: (messageOrOptions: string | ToastOptions, type: ToastType = 'info', duration = 4500) => {
    if (typeof window === 'undefined') return '';
    const payload: ToastOptions =
      typeof messageOrOptions === 'string'
        ? { message: messageOrOptions, type, duration }
        : { type, duration, ...messageOrOptions };

    window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail: payload }));
    return payload.id || '';
  },
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
    toast.show({ ...options, message, type: 'success' }),
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
    toast.show({ ...options, message, type: 'error' }),
  info: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
    toast.show({ ...options, message, type: 'info' }),
  warning: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
    toast.show({ ...options, message, type: 'warning' }),
};

interface ToastCardProps {
  key?: React.Key;
  toastItem: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({
  toastItem,
  onDismiss,
}: ToastCardProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const remainingTimeRef = useRef(toastItem.duration);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    if (toastItem.duration <= 0) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        const now = Date.now();
        const delta = now - lastTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - delta);
        setProgress((remainingTimeRef.current / toastItem.duration) * 100);

        if (remainingTimeRef.current <= 0) {
          clearInterval(interval);
          onDismiss(toastItem.id);
        }
      }
      lastTimeRef.current = Date.now();
    }, 50);

    return () => clearInterval(interval);
  }, [toastItem.id, toastItem.duration, isPaused, onDismiss]);

  const config = {
    success: {
      border: 'border-[#10b981]/30 dark:border-[#059669]/40',
      bgGlow: 'bg-[#10b981]/5',
      iconBg: 'bg-[#ecfdf5] dark:bg-[#064e3b]/50 text-[#059669] dark:text-[#34d399] border-[#a7f3d0]/70 dark:border-[#059669]/40',
      barColor: 'bg-[#059669]',
      defaultTitle: 'Success',
      icon: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />,
    },
    error: {
      border: 'border-[#ef4444]/30 dark:border-[#dc2626]/40',
      bgGlow: 'bg-[#ef4444]/5',
      iconBg: 'bg-[#fef2f2] dark:bg-[#7f1d1d]/40 text-[#dc2626] dark:text-[#f87171] border-[#fecaca]/70 dark:border-[#dc2626]/40',
      barColor: 'bg-[#dc2626]',
      defaultTitle: 'Notice',
      icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    },
    warning: {
      border: 'border-[#f59e0b]/30 dark:border-[#d97706]/40',
      bgGlow: 'bg-[#f59e0b]/5',
      iconBg: 'bg-[#fffbeb] dark:bg-[#78350f]/40 text-[#d97706] dark:text-[#fbbf24] border-[#fde68a]/70 dark:border-[#d97706]/40',
      barColor: 'bg-[#d97706]',
      defaultTitle: 'Warning',
      icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
    },
    info: {
      border: 'border-[#0ea5e9]/30 dark:border-[#0284c7]/40',
      bgGlow: 'bg-[#0ea5e9]/5',
      iconBg: 'bg-[#f0f9ff] dark:bg-[#0c4a6e]/40 text-[#0284c7] dark:text-[#38bdf8] border-[#bae6fd]/70 dark:border-[#0284c7]/40',
      barColor: 'bg-[#0284c7]',
      defaultTitle: 'Information',
      icon: <Info className="w-5 h-5 flex-shrink-0" />,
    },
  }[toastItem.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      onMouseEnter={() => {
        setIsPaused(true);
        lastTimeRef.current = Date.now();
      }}
      onMouseLeave={() => {
        setIsPaused(false);
        lastTimeRef.current = Date.now();
      }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#091a20]/95 backdrop-blur-md border ${config.border} shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-4 sm:p-4.5 transition-all duration-200 hover:shadow-xl`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3.5">
        {/* Type Icon Badge */}
        <div className={`p-2 rounded-xl border ${config.iconBg} shadow-xs`}>
          {config.icon}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#09353e] dark:text-[#ecf3f4] mb-0.5">
            {toastItem.title || config.defaultTitle}
          </h4>
          <p className="text-xs sm:text-[13px] text-[#4b6065] dark:text-[#a0b5b9] font-medium leading-relaxed break-words">
            {toastItem.message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onDismiss(toastItem.id)}
          className="p-1 -mr-1 -mt-1 rounded-lg text-[#7c9397] hover:text-[#09353e] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar for Auto-dismiss */}
      {toastItem.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden">
          <div
            className={`h-full ${config.barColor} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (messageOrOptions: string | ToastOptions, type: ToastType = 'info', duration = 4500): string => {
      const id =
        typeof messageOrOptions === 'object' && messageOrOptions.id
          ? messageOrOptions.id
          : `toast-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const newItem: ToastItem = {
        id,
        message: typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions.message,
        title: typeof messageOrOptions === 'object' ? messageOrOptions.title : undefined,
        type: (typeof messageOrOptions === 'object' ? messageOrOptions.type : type) || 'info',
        duration: (typeof messageOrOptions === 'object' ? messageOrOptions.duration : duration) ?? 4500,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Keep up to 5 concurrent toasts to prevent viewport clutter
        const filtered = prev.filter((t) => t.id !== id);
        return [...filtered.slice(-4), newItem];
      });

      return id;
    },
    []
  );

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
      showToast({ ...options, message, type: 'success' }),
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
      showToast({ ...options, message, type: 'error' }),
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
      showToast({ ...options, message, type: 'info' }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
      showToast({ ...options, message, type: 'warning' }),
    [showToast]
  );

  // Listen for custom window events so non-React / outside helpers can also trigger toasts
  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ToastOptions>;
      if (customEvent.detail) {
        showToast(customEvent.detail);
      }
    };

    window.addEventListener(TOAST_EVENT_NAME, handleEvent);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handleEvent);
  }, [showToast]);

  const value: ToastContextValue = {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
    success,
    error,
    info,
    warning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Global Toast Container Floating Top-Right */}
      <div
        id="globalToastContainer"
        aria-live="assertive"
        className="fixed top-4 sm:top-6 right-4 sm:right-6 z-[999999] pointer-events-none flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-96"
      >
        <AnimatePresence mode="sync">
          {toasts.map((toastItem) => (
            <ToastCard
              key={toastItem.id}
              toastItem={toastItem}
              onDismiss={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if component is outside ToastProvider
    return {
      toasts: [],
      showToast: toast.show,
      dismissToast: () => {},
      dismissAll: () => {},
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
    };
  }
  return context;
}

export default ToastContext;
