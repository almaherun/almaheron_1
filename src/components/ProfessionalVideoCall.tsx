'use client';

import React, { useEffect } from 'react';
import { useVercelWebRTC } from '@/hooks/useVercelWebRTC';
import { useAuth } from '@/contexts/AuthContext';
import IncomingCallScreen from './IncomingCallScreen';
import ActiveCallScreen from './ActiveCallScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video } from 'lucide-react';

interface ProfessionalVideoCallProps {
  userId: string;
  userType: 'student' | 'teacher';
  userName: string;
  // للطلاب: معلومات المعلم المراد الاتصال به
  targetTeacherId?: string;
  targetTeacherName?: string;
  targetTeacherImage?: string;
  // للمعلمين: معلومات إضافية
  currentSurah?: string;
}

export default function ProfessionalVideoCall({
  userId,
  userType,
  userName,
  targetTeacherId,
  targetTeacherName,
  targetTeacherImage,
  currentSurah = "سورة البقرة"
}: ProfessionalVideoCallProps) {
  
  const {
    isConnected,
    isInCall,
    connectionState,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    error,
    isLoading,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    getConnectionQuality
  } = useVercelWebRTC({
    userId: userId,
    userName: userName,
    autoConnect: true
  });

  // تشخيص مفصل
  useEffect(() => {
    console.log('🔍 ProfessionalVideoCall Debug:', {
      userId,
      userName,
      userType,
      targetTeacherId,
      targetTeacherName,
      isConnected,
      connectionState,
      error: error?.message
    });
  }, [userId, userName, userType, targetTeacherId, targetTeacherName, isConnected, connectionState, error]);

  // تحميل CSS الإسلامي - تم إصلاح المسار
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/islamic-theme.css';
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // معالجة المكالمة الواردة
  if (incomingCall) {
    return (
      <IncomingCallScreen
        callerName={incomingCall.fromUserId || 'مستخدم'}
        callerImage=""
        callerTitle={userType === 'student' ? 'معلم تحفيظ القرآن الكريم' : 'طالب'}
        isVisible={true}
        onAcceptAudio={acceptCall}
        onAcceptVideo={acceptCall}
        onReject={rejectCall}
      />
    );
  }

  // عرض شاشة المكالمة النشطة
  if (isInCall && remoteStream) {
    return (
      <ActiveCallScreen
        recipientName={targetTeacherName || 'مستخدم'}
        recipientAvatar={targetTeacherImage}
        duration="00:00"
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        isScreenSharing={false}
        connectionQuality={(() => {
          const quality = getConnectionQuality();
          return quality === 'disconnected' ? 'poor' : quality;
        })()}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onToggleScreenShare={() => {
          console.log('Screen share not implemented yet');
        }}
        onEndCall={endCall}
        onOpenChat={() => {
          console.log('Opening chat...');
        }}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
      />
    );
  }

  // عرض حالة الاتصال (للطلاب)
  if (connectionState === 'connecting') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center"
      >
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6 border-4 border-white/30 border-t-white rounded-full"
          />
          
          <h2 className="text-2xl font-bold mb-2">جاري الاتصال...</h2>
          <p className="text-white/80">
            {userType === 'student' 
              ? `الاتصال بـ ${targetTeacherName}` 
              : 'قبول المكالمة...'
            }
          </p>
          
          <div className="mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={endCall}
              className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              إلغاء
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // تشخيص
  console.log('🔍 ProfessionalVideoCall Debug:', {
    userType,
    targetTeacherId,
    targetTeacherName,
    isConnected,
    connectionState,
    error
  });

  // عرض أزرار المكالمة (للطلاب)
  if (userType === 'student' && targetTeacherId && targetTeacherName) {
    console.log('✅ Showing call buttons for student');
    return (
      <div className="space-y-4">
        {/* زر مكالمة فيديو احترافي */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => targetTeacherId && startCall(targetTeacherId)}
          disabled={isLoading || !isConnected}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
        >
          <Video className="w-6 h-6" />
          <span className="font-semibold text-lg">
            {isLoading ? '⏳ جاري الاتصال...' : '📹 مكالمة فيديو'}
          </span>
        </motion.button>

        {/* زر مكالمة صوتية */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => targetTeacherId && startCall(targetTeacherId)}
          disabled={isLoading || !isConnected}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
        >
          <Phone className="w-5 h-5" />
          <span className="font-semibold">
            {isLoading ? '⏳ جاري الاتصال...' : '📞 مكالمة صوتية'}
          </span>
        </motion.button>

        {/* معلومات المعلم */}
        {targetTeacherImage && (
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md">
            <img
              src={targetTeacherImage}
              alt={targetTeacherName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-800">{targetTeacherName}</h3>
              <p className="text-sm text-gray-600">معلم تحفيظ القرآن الكريم</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // عرض رسالة خطأ
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
      >
        <div className="text-red-600 text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">حدث خطأ</h3>
        <p className="text-red-600 mb-4">{error?.message || 'خطأ غير معروف'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </motion.div>
    );
  }

  // الحالة الافتراضية (للمعلمين بدون مكالمات)
  if (userType === 'teacher') {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📞</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          في انتظار المكالمات
        </h3>
        <p className="text-gray-600">
          سيتم إشعارك عند وصول مكالمة جديدة من الطلاب
        </p>
        
        {/* مؤشر الحالة */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-medium">متصل ومتاح</span>
        </div>
      </div>
    );
  }

  // رسالة احتياطية للتشخيص
  return (
    <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-xl">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        مشكلة في تحميل نظام المكالمات
      </h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <p><strong>نوع المستخدم:</strong> {userType}</p>
        <p><strong>معرف المعلم:</strong> {targetTeacherId || 'غير محدد'}</p>
        <p><strong>اسم المعلم:</strong> {targetTeacherName || 'غير محدد'}</p>
        <p><strong>متصل:</strong> {isConnected ? 'نعم' : 'لا'}</p>
        <p><strong>حالة الاتصال:</strong> {connectionState || 'غير محدد'}</p>
        {error && <p><strong>خطأ:</strong> {String(error)}</p>}
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
      >
        إعادة تحميل الصفحة
      </button>
    </div>
  );
}
