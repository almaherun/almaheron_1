'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { JitsiManager, JitsiDebugUtils } from '@/lib/jitsi-manager';

interface UseJitsiCallProps {
  displayName: string;
  autoConnect?: boolean;
  preferredServer?: string; // خادم مفضل للمكالمة
}

interface CallParticipant {
  id: string;
  displayName: string;
  isLocal?: boolean;
}

export function useJitsiCall({
  displayName,
  autoConnect = false,
  preferredServer = 'meet.jit.si'
}: UseJitsiCallOptions) {
  // الحالات
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string>('');

  // المراجع
  const jitsiManagerRef = useRef<JitsiManager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // إنشاء مدير Jitsi مع الخادم المفضل
  useEffect(() => {
    if (displayName) {
      console.log('🔧 useJitsiCall: إنشاء JitsiManager', { displayName, preferredServer });
      jitsiManagerRef.current = new JitsiManager(displayName, preferredServer);
      
      // إعداد معالجات الأحداث
      const manager = jitsiManagerRef.current;
      
      manager.onReady = () => {
        console.log('✅ Jitsi Call Ready');
        setIsConnecting(false);
        setIsInCall(true);
        setError(null);
      };

      manager.onVideoConferenceJoined = (participant) => {
        console.log('🎉 Joined conference:', participant);
        setParticipants(prev => [
          ...prev,
          {
            id: participant.id || 'local',
            displayName: participant.displayName || displayName,
            isLocal: true
          }
        ]);
      };

      manager.onParticipantJoined = (participant) => {
        console.log('👋 Participant joined:', participant);
        setParticipants(prev => [
          ...prev,
          {
            id: participant.id,
            displayName: participant.displayName || 'مشارك',
            isLocal: false
          }
        ]);
      };

      manager.onParticipantLeft = (participant) => {
        console.log('👋 Participant left:', participant);
        setParticipants(prev => 
          prev.filter(p => p.id !== participant.id)
        );
      };

      manager.onVideoConferenceLeft = () => {
        console.log('📞 Left conference');
        setIsInCall(false);
        setIsConnecting(false);
        setParticipants([]);
        setCurrentRoomName('');
      };

      manager.onError = (error) => {
        console.error('❌ Jitsi Error:', error);
        setError(error.message || 'حدث خطأ في المكالمة');
        setIsConnecting(false);
        setIsInCall(false);
      };
    }

    return () => {
      if (jitsiManagerRef.current) {
        jitsiManagerRef.current.dispose();
      }
    };
  }, [displayName]);

  // بدء مكالمة جديدة مع تسجيل مفصل
  const startCall = useCallback(async (roomName: string) => {
    console.log('🚀 useJitsiCall: بدء مكالمة جديدة', { roomName });

    if (!jitsiManagerRef.current || !containerRef.current) {
      const errorMsg = 'مدير المكالمة غير متاح';
      console.error('❌ useJitsiCall:', errorMsg, {
        hasManager: !!jitsiManagerRef.current,
        hasContainer: !!containerRef.current
      });
      setError(errorMsg);
      return false;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setCurrentRoomName(roomName);

      console.log('📞 useJitsiCall: إنشاء المكالمة...');
      await jitsiManagerRef.current.createCall(roomName, containerRef.current);
      console.log('✅ useJitsiCall: تم إنشاء المكالمة بنجاح');
      return true;

    } catch (error: any) {
      console.error('❌ useJitsiCall: فشل في بدء المكالمة:', error);
      setError(error.message || 'فشل في بدء المكالمة');
      setIsConnecting(false);
      return false;
    }
  }, []);

  // الانضمام لمكالمة موجودة
  const joinCall = useCallback(async (roomName: string) => {
    return await startCall(roomName);
  }, [startCall]);

  // إنهاء المكالمة
  const endCall = useCallback(() => {
    if (jitsiManagerRef.current) {
      jitsiManagerRef.current.endCall();
    }
    setIsInCall(false);
    setIsConnecting(false);
    setParticipants([]);
    setCurrentRoomName('');
    setError(null);
  }, []);

  // تبديل حالة الصوت
  const toggleAudio = useCallback(() => {
    if (jitsiManagerRef.current) {
      jitsiManagerRef.current.toggleAudio();
      setIsAudioMuted(prev => !prev);
    }
  }, []);

  // تبديل حالة الفيديو
  const toggleVideo = useCallback(() => {
    if (jitsiManagerRef.current) {
      jitsiManagerRef.current.toggleVideo();
      setIsVideoMuted(prev => !prev);
    }
  }, []);

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      if (jitsiManagerRef.current) {
        jitsiManagerRef.current.dispose();
      }
    };
  }, []);

  // تحديث حالات الصوت والفيديو
  useEffect(() => {
    if (jitsiManagerRef.current && isInCall) {
      const manager = jitsiManagerRef.current;
      setIsAudioMuted(manager.getAudioMuted());
      setIsVideoMuted(manager.getVideoMuted());
    }
  }, [isInCall]);

  return {
    // الحالات
    isInCall,
    isConnecting,
    participants,
    isAudioMuted,
    isVideoMuted,
    error,
    currentRoomName,

    // المراجع
    containerRef,

    // الوظائف
    startCall,
    joinCall,
    endCall,
    toggleAudio,
    toggleVideo,

    // معلومات إضافية
    participantCount: participants.length,
    isCallActive: jitsiManagerRef.current?.isCallActive() || false,
    manager: jitsiManagerRef.current
  };
}
