'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Components
import TextField from '@/components/auth/TextField';
import PrimaryButton from '@/components/auth/PrimaryButton';
import ErrorBanner from '@/components/auth/ErrorBanner';

// Validation
import { validateEmail } from '@/lib/validation';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  // Validation functions
  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return !value ? 'الرجاء إدخال كلمة المرور.' : '';
      default:
        return '';
    }
  };

  // Handle field changes
  const handleFieldChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear server error when user starts typing
    if (serverError) setServerError('');
    
    // Validate if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle field blur
  const handleFieldBlur = (name: keyof FormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Check if form is valid
  const isFormValid = () => {
    return formData.email && 
           formData.password && 
           !validateField('email', formData.email) && 
           !validateField('password', formData.password);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const newTouched = { email: true, password: true };
    setTouched(newTouched);
    
    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field as keyof FormData, formData[field as keyof FormData]);
      if (error) newErrors[field as keyof FormErrors] = error;
    });
    
    setErrors(newErrors);
    
    // Stop if there are errors
    if (Object.keys(newErrors).length > 0) {
      // Focus first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      await signIn(formData.email, formData.password);
      
      // Success - redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('خطأ في تسجيل الدخول:', error);
      
      // Handle specific errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setServerError('بيانات الاعتماد غير صحيحة. الرجاء المحاولة مرة أخرى.');
      } else if (error.code === 'auth/user-disabled') {
        setServerError('تم تعطيل الحساب. تواصل مع الدعم.');
      } else if (error.code === 'auth/too-many-requests') {
        setServerError('تم تجاوز عدد المحاولات المسموح. حاول مرة أخرى لاحقاً.');
      } else {
        setServerError('تعذّر تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">أ</span>
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              تسجيل الدخول
            </h1>
            <p className="text-sm text-gray-600">
              مرحباً بعودتك إلى أكاديمية الماهرون
            </p>
          </div>

          {/* Server Error Banner */}
          <ErrorBanner
            message={serverError}
            onRetry={() => setServerError('')}
            onDismiss={() => setServerError('')}
          />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <TextField
              label="البريد الإلكتروني"
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={(value) => handleFieldChange('email', value)}
              onBlur={() => handleFieldBlur('email')}
              error={errors.email}
              required
            />

            {/* Password */}
            <div className="space-y-2">
              <TextField
                label="كلمة المرور"
                type="password"
                value={formData.password}
                onChange={(value) => handleFieldChange('password', value)}
                onBlur={() => handleFieldBlur('password')}
                error={errors.password}
                required
              />
              
              {/* Forgot Password Link */}
              <div className="text-left">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  هل نسيت كلمة المرور؟
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <PrimaryButton
              type="submit"
              disabled={!isFormValid()}
              loading={isSubmitting}
              className="mt-8"
            >
              تسجيل الدخول
            </PrimaryButton>

            {/* Sign Up Link */}
            <div className="text-center text-sm text-gray-600">
              ليس لديك حساب؟{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                إنشاء حساب
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
