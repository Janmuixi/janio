'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ title, description, type = 'info', duration = DEFAULT_DURATION }) => {
    const id = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    const toast = { id, title, description, type };

    setToasts((current) => [...current, toast]);

    const timeout = setTimeout(() => removeToast(id), duration);
    return () => {
      clearTimeout(timeout);
      removeToast(id);
    };
  }, [removeToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-72 rounded-xl shadow-lg border p-4 bg-white ${
            toast.type === 'error'
              ? 'border-red-200'
              : toast.type === 'success'
              ? 'border-green-200'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{toast.title}</p>
              {toast.description && (
                <p className="text-sm text-gray-600 mt-1">{toast.description}</p>
              )}
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
