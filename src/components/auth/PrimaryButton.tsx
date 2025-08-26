'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export default function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  className = ''
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={`
        relative w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 
        text-white font-semibold rounded-xl transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-60
        ${className}
      `}
    >
      {/* Loading Spinner */}
      {loading && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <Loader className="w-5 h-5 animate-spin" />
        </div>
      )}
      
      {/* Button Text */}
      <span className={loading ? 'opacity-70' : ''}>
        {children}
      </span>
    </motion.button>
  );
}
