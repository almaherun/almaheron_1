'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Components
import TextField from '@/components/auth/TextField';
import RadioGroup from '@/components/auth/RadioGroup';
import SegmentedControl from '@/components/auth/SegmentedControl';
import AvatarUploader from '@/components/auth/AvatarUploader';
import PrimaryButton from '@/components/auth/PrimaryButton';
import ErrorBanner from '@/components/auth/ErrorBanner';

// Validation
import { validateEmail, validatePhone, validatePassword, validateName } from '@/lib/validation';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  gender: string;
  userType: string;
  avatar: File | null;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  gender?: string;
  userType?: string;
  avatar?: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    userType: '',
    avatar: null
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  // Validation functions
  const validateField = (name: keyof FormData, value: any): string => {
    switch (name) {
      case 'fullName':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'password':
        return validatePassword(value);
      case 'gender':
        return !value ? 'الرجاء اختيار الجنس.' : '';
      case 'userType':
        return !value ? 'الرجاء اختيار نوع المستخدم.' : '';
      default:
        return '';
    }
  };

  // Handle field changes
  const handleFieldChange = (name: keyof FormData, value: any) => {
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
    const requiredFields: (keyof FormData)[] = ['fullName', 'email', 'phone', 'password', 'gender', 'userType'];
    
    return requiredFields.every(field => {
      const value = formData[field];
      return value && !validateField(field, value);
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = Object.keys(formData) as (keyof FormData)[];
    const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
    setTouched(newTouched);
    
    // Validate all fields
    const newErrors: FormErrors = {};
    allFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    
    // Stop if there are errors
    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error and focus
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.fullName,
        phoneNumber: formData.phone,
        gender: formData.gender,
        userType: formData.userType,
        avatar: formData.avatar
      });

      // Success - redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('خطأ في إنشاء الحساب:', error);
      
      // Handle specific errors
      if (error.code === 'auth/email-already-in-use') {
        setServerError('هذا البريد الإلكتروني مستخدم بالفعل.');
      } else if (error.code === 'auth/weak-password') {
        setServerError('كلمة المرور ضعيفة جداً.');
      } else {
        setServerError('تعذّر إنشاء الحساب. الرجاء المحاولة مرة أخرى.');
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
              إنشاء حساب جديد
            </h1>
            <p className="text-sm text-gray-600">
              انضم إلى أكاديمية الماهرون
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
            {/* Avatar */}
            <AvatarUploader
              value={formData.avatar ? URL.createObjectURL(formData.avatar) : undefined}
              onChange={(file) => handleFieldChange('avatar', file)}
              error={errors.avatar}
            />

            {/* Full Name */}
            <TextField
              label="الاسم الكامل"
              placeholder="أدخل اسمك الكامل"
              value={formData.fullName}
              onChange={(value) => handleFieldChange('fullName', value)}
              onBlur={() => handleFieldBlur('fullName')}
              error={errors.fullName}
              required
            />

            {/* Email */}
            <TextField
              label="البريد الإلكتروني"
              type="email"
              placeholder="teacher@gmail.com"
              value={formData.email}
              onChange={(value) => handleFieldChange('email', value)}
              onBlur={() => handleFieldBlur('email')}
              error={errors.email}
              required
            />

            {/* Phone */}
            <TextField
              label="رقم الهاتف"
              type="tel"
              placeholder="01xxxxxxxxx"
              value={formData.phone}
              onChange={(value) => handleFieldChange('phone', value)}
              onBlur={() => handleFieldBlur('phone')}
              error={errors.phone}
              required
            />

            {/* Password */}
            <TextField
              label="كلمة المرور"
              type="password"
              value={formData.password}
              onChange={(value) => handleFieldChange('password', value)}
              onBlur={() => handleFieldBlur('password')}
              error={errors.password}
              required
            />

            {/* Gender */}
            <RadioGroup
              label="الجنس"
              options={[
                { value: 'male', label: 'ذكر' },
                { value: 'female', label: 'أنثى' }
              ]}
              value={formData.gender}
              onChange={(value) => handleFieldChange('gender', value)}
              error={errors.gender}
              required
            />

            {/* User Type */}
            <SegmentedControl
              label="نوع المستخدم"
              options={[
                { value: 'student', label: 'طالب' },
                { value: 'teacher', label: 'معلم' }
              ]}
              value={formData.userType}
              onChange={(value) => handleFieldChange('userType', value)}
              error={errors.userType}
              required
            />

            {/* Submit Button */}
            <PrimaryButton
              type="submit"
              disabled={!isFormValid()}
              loading={isSubmitting}
              className="mt-8"
            >
              إنشاء حساب
            </PrimaryButton>

            {/* Login Link */}
            <div className="text-center text-sm text-gray-600">
              لديك حساب بالفعل؟{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                تسجيل الدخول
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
