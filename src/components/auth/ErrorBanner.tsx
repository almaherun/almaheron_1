'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  className = ''
}: ErrorBannerProps) {
  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className={`mb-6 ${className}`}
      >
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-800 font-medium text-right">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onRetry && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRetry}
                  className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-red-100 transition-colors"
                  title="محاولة مرة أخرى"
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.button>
              )}
              
              {onDismiss && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDismiss}
                  className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-red-100 transition-colors"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
