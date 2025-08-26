'use client';

import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextFieldProps {
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helper,
  required = false,
  disabled = false,
  prefix,
  suffix,
  className = ''
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isFloating = isFocused || value.length > 0;
  const hasError = !!error;
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Container */}
      <div className={`
        relative h-12 rounded-xl border transition-all duration-200
        ${hasError 
          ? 'border-red-500 border-2' 
          : isFocused 
            ? 'border-blue-600 border-2' 
            : 'border-gray-300 border'
        }
        ${disabled ? 'bg-gray-50 opacity-60' : 'bg-white'}
        hover:border-gray-400
      `}>
        
        {/* Prefix */}
        {prefix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {prefix}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={isFloating ? placeholder : ''}
          className={`
            w-full h-full px-4 bg-transparent border-none outline-none text-gray-900
            ${prefix ? 'pr-12' : ''}
            ${(suffix || isPassword) ? 'pl-12' : ''}
            placeholder-gray-400
          `}
          dir="rtl"
          aria-invalid={hasError}
          aria-describedby={error ? `${label}-error` : helper ? `${label}-helper` : undefined}
        />

        {/* Floating Label */}
        <motion.label
          animate={{
            top: isFloating ? '4px' : '50%',
            fontSize: isFloating ? '12px' : '16px',
            transform: isFloating ? 'translateY(0)' : 'translateY(-50%)',
            color: hasError ? '#ef4444' : isFocused ? '#2563eb' : '#6b7280'
          }}
          transition={{ duration: 0.2 }}
          className={`
            absolute right-4 pointer-events-none font-medium
            ${prefix ? 'right-12' : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </motion.label>

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {/* Suffix */}
        {suffix && !isPassword && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {suffix}
          </div>
        )}
      </div>

      {/* Helper/Error Text */}
      <AnimatePresence>
        {(error || helper) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="mt-1 text-xs px-1"
          >
            {error ? (
              <span id={`${label}-error`} className="text-red-500 font-medium">
                {error}
              </span>
            ) : (
              <span id={`${label}-helper`} className="text-gray-500">
                {helper}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

TextField.displayName = 'TextField';

export default TextField;
