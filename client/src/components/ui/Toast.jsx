import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000, title }) => {
    const id = ++toastId;
    setToasts((prev) => {
      // Don't show duplicate messages at the same time
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      // Keep at most 3 visible toasts
      const trimmed = prev.length >= 3 ? prev.slice(1) : prev;
      return [...trimmed, { id, message, type, duration, title }];
    });

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, opts) => addToast({ message, type: 'success', ...opts }),
    error: (message, opts) => addToast({ message, type: 'error', ...opts }),
    warning: (message, opts) => addToast({ message, type: 'warning', ...opts }),
    info: (message, opts) => addToast({ message, type: 'info', ...opts }),
    remove: removeToast,
  };

  const icons = {
    success: <CheckCircle size={18} color="#10b981" />,
    error: <XCircle size={18} color="#ef4444" />,
    warning: <AlertCircle size={18} color="#f59e0b" />,
    info: <Info size={18} color="#3b82f6" />,
  };

  const colors = {
    success: 'rgba(16, 185, 129, 0.12)',
    error: 'rgba(239, 68, 68, 0.12)',
    warning: 'rgba(245, 158, 11, 0.12)',
    info: 'rgba(59, 130, 246, 0.12)',
  };

  const borderColors = {
    success: 'rgba(16, 185, 129, 0.2)',
    error: 'rgba(239, 68, 68, 0.2)',
    warning: 'rgba(245, 158, 11, 0.2)',
    info: 'rgba(59, 130, 246, 0.2)',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none"
          style={{ maxWidth: 380 }}
          aria-live="polite"
        >
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                className="pointer-events-auto"
                role="alert"
              >
                <div
                  style={{
                    background: `${colors[t.type]}`,
                    border: `1px solid ${borderColors[t.type]}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    boxShadow: 'var(--shadow-card)',
                    backdropFilter: 'blur(12px)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Progress bar */}
                  {t.duration > 0 && (
                    <motion.div
                      initial={{ scaleX: 1, originX: 0 }}
                      animate={{ scaleX: 0 }}
                      transition={{ duration: t.duration / 1000, ease: 'linear' }}
                      style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        height: 2,
                        background: borderColors[t.type],
                        transformOrigin: 'left',
                      }}
                    />
                  )}
                  <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
                  <div className="flex-1 min-w-0">
                    {t.title && (
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{t.title}</p>
                    )}
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{t.message}</p>
                  </div>
                  <button
                    onClick={() => removeToast(t.id)}
                    className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Close notification"
                  >
                    <X size={14} color="var(--color-text-secondary)" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
