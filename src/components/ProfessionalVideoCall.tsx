'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SimpleVideoCall from './SimpleVideoCall';

interface ProfessionalVideoCallProps {
  userId: string;
  userName: string;
  userType: 'student' | 'teacher';
  targetTeacherId?: string;
  targetTeacherName?: string;
}

export default function ProfessionalVideoCall({
  userId,
  userName,
  userType,
  targetTeacherId,
  targetTeacherName
}: ProfessionalVideoCallProps) {
  const { user } = useAuth();

  console.log('🎯 ProfessionalVideoCall props:', {
    userId,
    userName,
    userType,
    targetTeacherId,
    targetTeacherName
  });

  // استخدام النظام البسيط الجديد
  return (
    <SimpleVideoCall
      userId={userId}
      userName={userName}
      targetUserId={targetTeacherId}
      targetUserName={targetTeacherName}
      userType={userType}
    />
  );
}
