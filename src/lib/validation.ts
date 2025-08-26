// دوال التحقق من صحة البيانات

export const validateName = (name: string): string => {
  if (!name || name.trim().length === 0) {
    return 'الرجاء إدخال الاسم الكامل.';
  }
  
  if (name.trim().length < 2) {
    return 'الاسم يجب أن يكون حرفين على الأقل.';
  }
  
  if (name.trim().length > 70) {
    return 'الاسم طويل جداً (الحد الأقصى 70 حرف).';
  }
  
  // التحقق من الأحرف المسموحة (عربي، لاتيني، مسافات، شرطة)
  const nameRegex = /^[\u0600-\u06FFa-zA-Z\s\-]+$/;
  if (!nameRegex.test(name.trim())) {
    return 'الاسم يجب أن يحتوي على أحرف عربية أو لاتينية فقط.';
  }
  
  return '';
};

export const validateEmail = (email: string): string => {
  if (!email || email.trim().length === 0) {
    return 'الرجاء إدخال البريد الإلكتروني.';
  }
  
  // إزالة المسافات
  const cleanEmail = email.trim();
  
  // التحقق من صيغة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return 'صيغة البريد الإلكتروني غير صحيحة.';
  }
  
  return '';
};

export const validatePhone = (phone: string): string => {
  if (!phone || phone.trim().length === 0) {
    return 'الرجاء إدخال رقم الهاتف.';
  }
  
  // إزالة المسافات والرموز
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // التحقق من الرقم المصري (يبدأ بـ 01 ويتكون من 11 رقم)
  const phoneRegex = /^01[0-9]{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return 'الرجاء إدخال رقم هاتف مصري صالح يبدأ بـ 01 ويتكون من 11 رقماً.';
  }
  
  return '';
};

export const validatePassword = (password: string): string => {
  if (!password || password.length === 0) {
    return 'الرجاء إدخال كلمة المرور.';
  }
  
  if (password.length < 8) {
    return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';
  }
  
  // التحقق من وجود حرف كبير
  if (!/[A-Z]/.test(password)) {
    return 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل.';
  }
  
  // التحقق من وجود حرف صغير
  if (!/[a-z]/.test(password)) {
    return 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل.';
  }
  
  // التحقق من وجود رقم
  if (!/[0-9]/.test(password)) {
    return 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.';
  }
  
  return '';
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 8) return 'weak';
  
  let score = 0;
  
  // طول كلمة المرور
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // تنوع الأحرف
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

export const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak': return 'ضعيف';
    case 'medium': return 'متوسط';
    case 'strong': return 'قوي';
  }
};

export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak': return 'text-red-500';
    case 'medium': return 'text-yellow-500';
    case 'strong': return 'text-green-500';
  }
};
