'use client';

import React, { useEffect, useState } from 'react';
import { useJitsiCall } from '@/hooks/useJitsiCall';
import { CallNotificationManager, CallRequest } from '@/lib/call-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  PhoneCall,
  UserCheck,
  Clock,
  X
} from 'lucide-react';

interface JitsiVideoCallProps {
  targetUserId?: string;
  targetUserName?: string;
  targetUserAvatar?: string;
  autoStart?: boolean;
  callSubject?: string;
}

export default function JitsiVideoCall({
  targetUserId,
  targetUserName,
  targetUserAvatar,
  autoStart = false,
  callSubject = "تحفيظ القرآن الكريم"
}: JitsiVideoCallProps) {
  const { user } = useAuth();
  
  // حالات المكالمة
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [incomingCall, setIncomingCall] = useState<CallRequest | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);
  const [notificationManager, setNotificationManager] = useState<CallNotificationManager | null>(null);

  // Jitsi Hook
  const {
    isInCall,
    isConnecting,
    participants,
    isAudioMuted,
    isVideoMuted,
    error,
    currentRoomName,
    containerRef,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    participantCount
  } = useJitsiCall({
    displayName: user?.displayName || 'مستخدم',
    autoConnect: false
  });

  // إعداد مدير الإشعارات
  useEffect(() => {
    if (user?.uid) {
      const manager = new CallNotificationManager(
        user.uid,
        user.displayName || 'مستخدم'
      );

      manager.setCallbacks({
        onIncomingCall: (callRequest) => {
          console.log('📞 مكالمة واردة:', callRequest);
          setIncomingCall(callRequest);
          setCallState('incoming');
        },
        onCallAccepted: (callRequest) => {
          console.log('✅ تم قبول المكالمة:', callRequest);
          setCallState('connected');
          startCall(callRequest.roomName);
        },
        onCallRejected: () => {
          console.log('❌ تم رفض المكالمة');
          setCallState('idle');
          setCurrentCallId('');
        },
        onCallCancelled: () => {
          console.log('🚫 تم إلغاء المكالمة');
          setCallState('idle');
          setIncomingCall(null);
        },
        onCallEnded: () => {
          console.log('📞 تم إنهاء المكالمة');
          handleEndCall();
        },
        onError: (error) => {
          console.error('❌ خطأ في الإشعارات:', error);
        }
      });

      manager.startListening();
      setNotificationManager(manager);

      return () => {
        manager.dispose();
      };
    }
  }, [user?.uid, startCall]);

  // مؤقت المكالمة
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  // بدء مكالمة جديدة
  const handleStartCall = async () => {
    if (!targetUserId || !targetUserName || !notificationManager) return;

    try {
      setCallState('calling');
      const callId = await notificationManager.sendCallRequest(
        targetUserId,
        targetUserName,
        'video',
        callSubject
      );
      setCurrentCallId(callId);
    } catch (error) {
      console.error('❌ خطأ في بدء المكالمة:', error);
      setCallState('idle');
    }
  };

  // قبول مكالمة واردة
  const handleAcceptCall = async () => {
    if (!incomingCall || !notificationManager) return;

    try {
      await notificationManager.acceptCall(incomingCall.id!);
      setCurrentCallId(incomingCall.id!);
      setIncomingCall(null);
    } catch (error) {
      console.error('❌ خطأ في قبول المكالمة:', error);
    }
  };

  // رفض مكالمة واردة
  const handleRejectCall = async () => {
    if (!incomingCall || !notificationManager) return;

    try {
      await notificationManager.rejectCall(incomingCall.id!);
      setIncomingCall(null);
      setCallState('idle');
    } catch (error) {
      console.error('❌ خطأ في رفض المكالمة:', error);
    }
  };

  // إنهاء المكالمة
  const handleEndCall = async () => {
    try {
      if (currentCallId && notificationManager) {
        if (callState === 'calling') {
          await notificationManager.cancelCall(currentCallId);
        } else {
          await notificationManager.endCall(currentCallId);
        }
      }
      
      endCall();
      setCallState('idle');
      setCurrentCallId('');
      setIncomingCall(null);
      setCallDuration(0);
    } catch (error) {
      console.error('❌ خطأ في إنهاء المكالمة:', error);
    }
  };

  // تنسيق وقت المكالمة
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // واجهة المكالمة الواردة
  if (callState === 'incoming' && incomingCall) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50"
      >
        <div className="text-center text-white p-8">
          {/* شعار الأكاديمية */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🕌</span>
            </div>
            <h1 className="text-2xl font-bold">أكاديمية المحرون للقرآن</h1>
            <p className="text-white/80">مكالمة فيديو واردة</p>
          </div>

          {/* معلومات المتصل */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {incomingCall.fromUserAvatar ? (
                <img 
                  src={incomingCall.fromUserAvatar} 
                  alt={incomingCall.fromUserName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserCheck className="w-16 h-16 text-white" />
              )}
            </div>
            <h2 className="text-3xl font-bold mb-2">{incomingCall.fromUserName}</h2>
            <p className="text-white/80 mb-2">{incomingCall.subject || callSubject}</p>
            <div className="flex items-center justify-center gap-2 text-white/60">
              <Clock className="w-4 h-4" />
              <span>مكالمة فيديو</span>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex justify-center gap-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRejectCall}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
            >
              <PhoneOff className="w-8 h-8" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAcceptCall}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg"
            >
              <Phone className="w-8 h-8" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      {/* حاوي Jitsi */}
      <div ref={containerRef} className="w-full h-full" />

      {/* واجهة البدء */}
      {!isInCall && !isConnecting && callState === 'idle' && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-indigo-900/90 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <PhoneCall className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {targetUserName ? `الاتصال بـ ${targetUserName}` : 'مكالمة فيديو'}
            </h2>
            <p className="text-white/80 mb-6">{callSubject}</p>
            
            {targetUserId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartCall}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto"
              >
                <Phone className="w-5 h-5" />
                بدء المكالمة
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* حالة الاتصال */}
      {(isConnecting || callState === 'calling') && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-lg">
              {callState === 'calling' ? 'جاري الاتصال...' : 'جاري الانضمام للمكالمة...'}
            </p>
          </div>
        </div>
      )}

      {/* أدوات التحكم */}
      {isInCall && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
          {/* مؤقت المكالمة */}
          <div className="text-white text-sm font-mono">
            {formatDuration(callDuration)}
          </div>

          {/* عدد المشاركين */}
          <div className="text-white text-sm">
            {participantCount} مشارك
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isAudioMuted ? 'bg-red-500' : 'bg-gray-600'
              } text-white`}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isVideoMuted ? 'bg-red-500' : 'bg-gray-600'
              } text-white`}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleEndCall}
              className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white"
            >
              <PhoneOff className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      )}

      {/* رسائل الخطأ */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
