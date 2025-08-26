'use client';

import React, { useEffect, useState } from 'react';
import { useJitsiCall } from '@/hooks/useJitsiCall';
import { CallNotificationManager, CallRequest } from '@/lib/call-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { JitsiDebugUtils } from '@/lib/jitsi-manager';
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
  X,
  Bug,
  Download,
  RefreshCw
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

  // تسجيل تهيئة المكون
  console.log('🎬 JitsiVideoCall: تهيئة المكون', {
    targetUserId,
    targetUserName,
    targetUserAvatar,
    autoStart,
    callSubject,
    currentUser: user?.uid,
    timestamp: new Date().toISOString()
  });

  // حالات المكالمة
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [incomingCall, setIncomingCall] = useState<CallRequest | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);
  const [notificationManager, setNotificationManager] = useState<CallNotificationManager | null>(null);

  // حالات التشخيص
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);

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

  // إعداد مدير الإشعارات مع تسجيل مفصل
  useEffect(() => {
    console.log('🔧 JitsiVideoCall: إعداد مدير الإشعارات', {
      hasUser: !!user,
      userId: user?.uid,
      displayName: user?.displayName
    });

    if (user?.uid) {
      console.log('📱 JitsiVideoCall: إنشاء CallNotificationManager');

      const manager = new CallNotificationManager(
        user.uid,
        user.displayName || 'مستخدم'
      );

      console.log('📱 JitsiVideoCall: تعيين callbacks للمدير');
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

      console.log('👂 JitsiVideoCall: بدء الاستماع للإشعارات');
      manager.startListening();

      console.log('💾 JitsiVideoCall: حفظ مدير الإشعارات في الحالة');
      setNotificationManager(manager);

      return () => {
        console.log('🧹 JitsiVideoCall: تنظيف مدير الإشعارات');
        manager.dispose();
      };
    } else {
      console.warn('⚠️ JitsiVideoCall: لا يوجد مستخدم مسجل دخول - لن يتم إعداد مدير الإشعارات');
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

  // بدء مكالمة جديدة مع تسجيل مفصل
  const handleStartCall = async () => {
    console.log('🚀 JitsiVideoCall: تم الضغط على زر بدء المكالمة');
    console.log('📋 JitsiVideoCall: فحص المتطلبات', {
      targetUserId,
      targetUserName,
      hasNotificationManager: !!notificationManager,
      callState,
      user: user?.uid
    });

    if (!targetUserId) {
      console.error('❌ JitsiVideoCall: targetUserId مفقود');
      alert('خطأ: معرف المستخدم المستهدف مفقود');
      return;
    }

    if (!targetUserName) {
      console.error('❌ JitsiVideoCall: targetUserName مفقود');
      alert('خطأ: اسم المستخدم المستهدف مفقود');
      return;
    }

    if (!notificationManager) {
      console.error('❌ JitsiVideoCall: notificationManager غير متاح');
      alert('خطأ: مدير الإشعارات غير متاح. تأكد من تسجيل الدخول.');
      return;
    }

    if (!user) {
      console.error('❌ JitsiVideoCall: المستخدم غير مسجل دخول');
      alert('خطأ: يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      console.log('📞 JitsiVideoCall: بدء إرسال طلب المكالمة...');
      setCallState('calling');

      const callId = await notificationManager.sendCallRequest(
        targetUserId,
        targetUserName,
        'video',
        callSubject
      );

      console.log('✅ JitsiVideoCall: تم إرسال طلب المكالمة بنجاح', { callId });
      setCurrentCallId(callId);

    } catch (error: any) {
      console.error('❌ JitsiVideoCall: خطأ في بدء المكالمة', {
        error: error.message,
        stack: error.stack,
        targetUserId,
        targetUserName
      });

      setCallState('idle');
      alert(`خطأ في بدء المكالمة: ${error.message}`);
    }
  };

  // قبول مكالمة واردة مع تسجيل مفصل
  const handleAcceptCall = async () => {
    console.log('✅ JitsiVideoCall: تم الضغط على زر قبول المكالمة');
    console.log('📋 JitsiVideoCall: فحص المتطلبات للقبول', {
      hasIncomingCall: !!incomingCall,
      incomingCallId: incomingCall?.id,
      hasNotificationManager: !!notificationManager,
      callState
    });

    if (!incomingCall) {
      console.error('❌ JitsiVideoCall: لا توجد مكالمة واردة للقبول');
      alert('خطأ: لا توجد مكالمة واردة للقبول');
      return;
    }

    if (!notificationManager) {
      console.error('❌ JitsiVideoCall: notificationManager غير متاح للقبول');
      alert('خطأ: مدير الإشعارات غير متاح');
      return;
    }

    try {
      console.log('📞 JitsiVideoCall: قبول المكالمة...', { callId: incomingCall.id });

      await notificationManager.acceptCall(incomingCall.id!);
      setCurrentCallId(incomingCall.id!);
      setIncomingCall(null);

      console.log('✅ JitsiVideoCall: تم قبول المكالمة بنجاح');

    } catch (error: any) {
      console.error('❌ JitsiVideoCall: خطأ في قبول المكالمة', {
        error: error.message,
        callId: incomingCall.id
      });
      alert(`خطأ في قبول المكالمة: ${error.message}`);
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

  // دوال التشخيص
  const handleShowDebugPanel = () => {
    setShowDebugPanel(!showDebugPanel);
    if (!showDebugPanel) {
      // تحديث السجلات عند فتح اللوحة
      const logs = JitsiDebugUtils?.getDebugLogs?.() || [];
      setDebugLogs(logs);
    }
  };

  const handleCheckSystemStatus = async () => {
    try {
      const status = await JitsiDebugUtils.checkSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('خطأ في فحص حالة النظام:', error);
    }
  };

  const handleExportLogs = () => {
    JitsiDebugUtils.exportLogs();
  };

  const handleClearLogs = () => {
    JitsiDebugUtils.clearLogs();
    setDebugLogs([]);
  };

  const handleRefreshLogs = () => {
    const logs = JitsiDebugUtils?.getDebugLogs?.() || [];
    setDebugLogs(logs);
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

  // تسجيل حالة المكون عند الـ render
  console.log('🎨 JitsiVideoCall: render', {
    callState,
    isInCall,
    isConnecting,
    hasTargetUserId: !!targetUserId,
    hasNotificationManager: !!notificationManager,
    hasUser: !!user,
    timestamp: new Date().toISOString()
  });

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
            
            {targetUserId ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('🖱️ JitsiVideoCall: تم الضغط على زر بدء المكالمة (onClick)');
                  handleStartCall();
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto"
              >
                <Phone className="w-5 h-5" />
                بدء المكالمة
              </motion.button>
            ) : (
              <div className="text-center">
                <p className="text-red-400 mb-4">⚠️ معرف المستخدم المستهدف مفقود</p>
                <p className="text-white/60 text-sm">targetUserId: {targetUserId || 'غير محدد'}</p>
              </div>
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

      {/* زر التشخيص */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleShowDebugPanel}
        className="absolute top-4 right-4 w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center text-white"
        title="لوحة التشخيص"
      >
        <Bug className="w-5 h-5" />
      </motion.button>

      {/* لوحة التشخيص */}
      <AnimatePresence>
        {showDebugPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 w-80 h-full bg-gray-900/95 backdrop-blur-sm text-white p-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">🔍 لوحة التشخيص</h3>
              <button
                onClick={handleShowDebugPanel}
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* أزرار التحكم */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={handleCheckSystemStatus}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                فحص النظام
              </button>

              <button
                onClick={handleRefreshLogs}
                className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث السجلات
              </button>

              <button
                onClick={handleExportLogs}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تصدير السجلات
              </button>

              <button
                onClick={handleClearLogs}
                className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
              >
                مسح السجلات
              </button>
            </div>

            {/* حالة النظام */}
            {systemStatus && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">📊 حالة النظام</h4>
                <div className="bg-gray-800 p-3 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>🌐 متصل: {systemStatus.online ? '✅' : '❌'}</div>
                    <div>🔒 HTTPS: {systemStatus.https ? '✅' : '❌'}</div>
                    <div>📹 WebRTC: {systemStatus.webrtc ? '✅' : '❌'}</div>
                    <div>🎥 Jitsi API: {systemStatus.jitsiAPI ? '✅' : '❌'}</div>
                  </div>
                  {systemStatus.devices && (
                    <div className="mt-2">
                      <div>📷 كاميرات: {systemStatus.devices.video || 0}</div>
                      <div>🎤 ميكروفونات: {systemStatus.devices.audio || 0}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* السجلات */}
            <div>
              <h4 className="font-semibold mb-2">📝 السجلات ({debugLogs.length})</h4>
              <div className="bg-gray-800 p-3 rounded text-xs max-h-60 overflow-y-auto">
                {debugLogs.length === 0 ? (
                  <div className="text-gray-400">لا توجد سجلات</div>
                ) : (
                  debugLogs.slice(-20).map((log, index) => (
                    <div key={index} className={`mb-1 ${
                      log.level === 'ERROR' ? 'text-red-400' :
                      log.level === 'WARN' ? 'text-yellow-400' :
                      log.level === 'INFO' ? 'text-blue-400' :
                      'text-green-400'
                    }`}>
                      <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="ml-2">[{log.level}]</span>
                      <span className="ml-2">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
