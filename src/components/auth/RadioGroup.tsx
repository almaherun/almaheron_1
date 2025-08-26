'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export default function RadioGroup({
  label,
  options,
  value,
  onChange,
  error,
  required = false,
  className = ''
}: RadioGroupProps) {
  return (
    <div className={`${className}`}>
      {/* Label */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 text-right">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      </div>

      {/* Options */}
      <div className="flex gap-6 justify-end" dir="rtl">
        {options.map((option) => {
          const isSelected = value === option.value;
          
          return (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                {option.label}
              </span>
              
              <div className="relative">
                <input
                  type="radio"
                  name={label}
                  value={option.value}
                  checked={isSelected}
                  onChange={(e) => onChange(e.target.value)}
                  className="sr-only"
                />
                
                {/* Custom Radio Button */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`
                    w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                    ${isSelected 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                    }
                  `}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </motion.div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-500 font-medium text-right"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
