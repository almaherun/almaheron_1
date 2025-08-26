'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  label: string;
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export default function SegmentedControl({
  label,
  options,
  value,
  onChange,
  error,
  required = false,
  className = ''
}: SegmentedControlProps) {
  return (
    <div className={`${className}`}>
      {/* Label */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 text-right">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      </div>

      {/* Segmented Control */}
      <div className="relative bg-gray-100 rounded-xl p-1 flex" dir="rtl">
        {options.map((option, index) => {
          const isSelected = value === option.value;
          
          return (
            <div key={option.value} className="relative flex-1">
              <input
                type="radio"
                name={label}
                value={option.value}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
                id={`${label}-${option.value}`}
              />
              
              <label
                htmlFor={`${label}-${option.value}`}
                className={`
                  relative block w-full py-2 px-4 text-center text-sm font-medium rounded-lg cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'text-blue-600 bg-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                  }
                `}
              >
                {option.label}
                
                {/* Background Animation */}
                {isSelected && (
                  <motion.div
                    layoutId={`${label}-background`}
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </label>
            </div>
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
