import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface SweetAlertOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  text: string;
  confirmButtonText?: string;
  onConfirm?: () => void;
}

interface SweetAlertProps {
  isOpen: boolean;
  options: SweetAlertOptions | null;
  onClose: () => void;
}

export const SweetAlert: React.FC<SweetAlertProps> = ({ isOpen, options, onClose }) => {
  if (!isOpen || !options) return null;

  const { type, title, text, confirmButtonText = 'OK', onConfirm } = options;

  const iconMap = {
    success: <CheckCircle2 className="w-16 h-16 text-emerald-500 dark:text-emerald-400 stroke-[1.5]" />,
    error: <XCircle className="w-16 h-16 text-rose-500 dark:text-rose-400 stroke-[1.5]" />,
    warning: <AlertTriangle className="w-16 h-16 text-amber-500 dark:text-amber-400 stroke-[1.5]" />,
    info: <Info className="w-16 h-16 text-indigo-500 dark:text-indigo-400 stroke-[1.5]" />,
  };

  const bgIconMap = {
    success: 'bg-emerald-50 dark:bg-emerald-950/20',
    error: 'bg-rose-50 dark:bg-rose-950/20',
    warning: 'bg-amber-50 dark:bg-amber-950/20',
    info: 'bg-indigo-50 dark:bg-indigo-950/20',
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Dark blurred background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-2xl text-center select-none z-10"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Section with pop-in effect */}
          <motion.div
            initial={{ scale: 0.6, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className={`mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center ${bgIconMap[type]}`}
          >
            {iconMap[type]}
          </motion.div>

          {/* Title */}
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            {title}
          </h3>

          {/* Message Text */}
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed whitespace-pre-line">
            {text}
          </p>

          {/* Confirm Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            className={`w-full py-3 px-6 rounded-2xl font-bold text-sm text-white shadow-lg cursor-pointer transition-all ${
              type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10' :
              type === 'error' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10' :
              type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' :
              'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/10'
            }`}
          >
            {confirmButtonText}
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
