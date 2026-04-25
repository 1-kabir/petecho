'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className={cn(
                "flex items-center gap-3 rounded-2xl border-2 border-black bg-white p-4 pr-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-w-[300px] max-w-md",
                t.type === 'success' && "bg-[#f0fdf4]",
                t.type === 'error' && "bg-[#fef2f2]",
                t.type === 'info' && "bg-[#eff6ff]"
              )}>
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black",
                  t.type === 'success' && "bg-green-500",
                  t.type === 'error' && "bg-red-500",
                  t.type === 'info' && "bg-blue-500"
                )}>
                  {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-white" />}
                  {t.type === 'error' && <AlertCircle className="h-4 w-4 text-white" />}
                  {t.type === 'info' && <Info className="h-4 w-4 text-white" />}
                </div>
                <p className="flex-1 font-heading text-sm font-bold text-black">{t.message}</p>
                <button 
                  onClick={() => removeToast(t.id)}
                  className="ml-2 rounded-lg p-1 hover:bg-black/5 transition-colors"
                >
                  <X className="h-4 w-4 text-black/40" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
