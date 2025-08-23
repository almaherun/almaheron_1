'use client';

import React, { useEffect, useState } from 'react';
import { useVercelWebRTC } from '@/hooks/useVercelWebRTC';
import { useAuth } from '@/contexts/AuthContext';
import ActiveCallScreen from './ActiveCallScreen';
import IncomingCallScreen from './IncomingCallScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, PhoneOff } from 'lucide-react';

interface EnhancedVideoCallProps {
  targetUserId?: string;
  targetUserName?: string;
  targetUserImage?: string;
  roomId?: string;
  autoStart?: boolean;
  currentSurah?: string;
}

export default function EnhancedVideoCall({
  targetUserId,
  targetUserName,
  targetUserImage,
  roomId,
  autoStart = false,
  currentSurah = "سورة البقرة"
}: EnhancedVideoCallProps) {
  const { user } = useAuth();
  
  const {
    isConnected,
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
    endCall: endCallManager,
    toggleVideo,
    toggleAudio,
    getConnectionQuality
  } = useVercelWebRTC({
    userId: user?.uid || '',
    userName: user?.displayName || 'مستخدم',
    autoConnect: true
  });

  // حالة المكالمة
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'active' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('good');
  const [incomingCallLocal, setIncomingCallLocal] = useState<any>(null);

  // دالة تنسيق مدة المكالمة
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // تحميل CSS الإسلامي
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

  // معالجة المكالمات الواردة
  useEffect(() => {
    if (incomingCall) {
      setIncomingCallLocal(incomingCall);
      setCallState('incoming');
    }
  }, [incomingCall]);

  // بدء المكالمة تلقائياً إذا كان مطلوباً
  useEffect(() => {
    if (autoStart && targetUserId && user?.uid) {
      handleStartCall();
    }
  }, [autoStart, targetUserId, user?.uid]);

  // تحديث جودة الاتصال
  useEffect(() => {
    if (connectionState === 'connected') {
      const interval = setInterval(async () => {
        try {
          const quality = await getConnectionQuality();
          const validQualities = ['excellent', 'good', 'poor'] as const;
          if (validQualities.includes(quality as any)) {
            setConnectionQuality(quality as 'excellent' | 'good' | 'poor');
          }
        } catch (error) {
          console.warn('Failed to get connection quality:', error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [connectionState, getConnectionQuality]);

  // عداد وقت المكالمة
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callState === 'active') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // تحديث حالة المكالمة بناءً على حالة الاتصال
  useEffect(() => {
    if (connectionState === 'connected' && remoteStream) {
      setCallState('active');
    } else if (connectionState === 'connecting') {
      setCallState('calling');
    } else if (connectionState === 'disconnected') {
      setCallState('ended');
    }
  }, [connectionState, remoteStream]);

  // بدء المكالمة
  const handleStartCall = async () => {
    if (!targetUserId || !user?.uid) return;

    setCallState('calling');
    setCallDuration(0);

    try {
      await startCall(targetUserId);
    } catch (error) {
      console.error('خطأ في بدء المكالمة:', error);
      setCallState('ended');
    }
  };

  // قبول المكالمة
  const handleAcceptCall = async () => {
    if (!incomingCallLocal || !user?.uid) return;

    setCallState('calling');
    setCallDuration(0);

    try {
      await acceptCall();
      setIncomingCallLocal(null);
    } catch (error) {
      console.error('خطأ في قبول المكالمة:', error);
      setCallState('ended');
    }
  };

  // رفض المكالمة
  const handleRejectCall = () => {
    rejectCall();
    setCallState('idle');
  };

  // إنهاء المكالمة
  const handleEndCall = async () => {
    try {
      await endCallManager();
      setCallState('ended');
      setCallDuration(0);

      // العودة للحالة الأولية بعد ثانيتين
      setTimeout(() => {
        setCallState('idle');
      }, 2000);
    } catch (error) {
      console.error('خطأ في إنهاء المكالمة:', error);
    }
  };

  // معالجة الأخطاء
  useEffect(() => {
    if (error) {
      console.error('خطأ في WebRTC:', error);
      setCallState('ended');
    }
  }, [error]);

  // عرض شاشة المكالمة النشطة
  if (callState === 'active') {
    return (
      <ActiveCallScreen
        recipientName={targetUserName || 'مستخدم'}
        recipientAvatar={targetUserImage}
        duration={formatDuration(callDuration)}
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        isScreenSharing={false}
        connectionQuality={connectionQuality === 'disconnected' ? 'poor' : connectionQuality}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onToggleScreenShare={() => console.log('Screen share not implemented')}
        onEndCall={handleEndCall}
        onOpenChat={() => {
          console.log('Opening chat...');
        }}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
      />
    );
  }

  // عرض شاشة المكالمة الواردة
  if (callState === 'incoming' && incomingCallLocal) {
    return (
      <IncomingCallScreen
        callerName={incomingCallLocal.fromUserId || 'مستخدم'}
        callerImage=""
        callerTitle="معلم تحفيظ القرآن الكريم"
        onAcceptAudio={handleAcceptCall}
        onAcceptVideo={handleAcceptCall}
        onReject={handleRejectCall}
        isVisible={true}
      />
    );
  }

  // عرض حالة الاتصال
  if (callState === 'calling') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center"
      >
        <div className="text-center text-white">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-32 h-32 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center"
          >
            <Video className="w-16 h-16" />
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-4">جاري الاتصال...</h2>
          <p className="text-lg text-white/80 mb-8">{targetUserName}</p>
          
          {isLoading && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
          
          <button
            onClick={handleEndCall}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center gap-2 mx-auto transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
            إلغاء
          </button>
        </div>
      </motion.div>
    );
  }

  // عرض حالة انتهاء المكالمة
  if (callState === 'ended') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center"
      >
        <div className="text-center text-white">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
            <PhoneOff className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold mb-4">انتهت المكالمة</h2>
          <p className="text-gray-400">مدة المكالمة: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</p>
        </div>
      </motion.div>
    );
  }

  // الحالة الأولية - زر بدء المكالمة
  return (
    <div className="p-4">
      {targetUserId && targetUserName && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartCall}
          disabled={isLoading || !isConnected}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Video className="w-5 h-5" />
          {isLoading ? 'جاري الاتصال...' : `اتصال مع ${targetUserName}`}
        </motion.button>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          <p className="font-semibold">خطأ في الاتصال:</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {!isConnected && (
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-700">
          <p className="text-sm">جاري الاتصال بخادم الإشارات...</p>
        </div>
      )}
    </div>
  );
}
