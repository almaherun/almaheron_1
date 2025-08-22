'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCManager } from '@/lib/webrtc-manager';

interface UseWebRTCOptions {
  signalingServerUrl?: string;
  autoJoinRoom?: boolean;
}

interface WebRTCState {
  isConnected: boolean;
  connectionState: RTCPeerConnectionState | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  participants: any[];
  error: Error | null;
  isLoading: boolean;
}

export function useWebRTC(options: UseWebRTCOptions = {}) {
  const { 
    signalingServerUrl = 'http://localhost:3002',
    autoJoinRoom = false 
  } = options;

  // حالة WebRTC
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    connectionState: null,
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isScreenSharing: false,
    participants: [],
    error: null,
    isLoading: false
  });

  // مراجع
  const webrtcManager = useRef<WebRTCManager | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // تهيئة WebRTC Manager
  useEffect(() => {
    webrtcManager.current = new WebRTCManager(signalingServerUrl);

    // إعداد معالجات الأحداث
    const manager = webrtcManager.current;

    manager.on('connection-state-change', (connectionState) => {
      setState(prev => ({ ...prev, connectionState }));
    });

    manager.on('local-stream', (localStream) => {
      setState(prev => ({ ...prev, localStream }));
      
      // ربط التدفق بعنصر الفيديو
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    });

    manager.on('remote-stream', (remoteStream) => {
      setState(prev => ({ ...prev, remoteStream }));
      
      // ربط التدفق بعنصر الفيديو
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    manager.on('user-joined', (user) => {
      setState(prev => ({
        ...prev,
        participants: [...prev.participants, user]
      }));
    });

    manager.on('user-left', (user) => {
      setState(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.userId !== user.userId)
      }));
    });

    manager.on('call-ended', () => {
      setState(prev => ({
        ...prev,
        localStream: null,
        remoteStream: null,
        participants: [],
        connectionState: null
      }));
    });

    manager.on('error', (error) => {
      setState(prev => ({ ...prev, error, isLoading: false }));
    });

    manager.on('ice-connection-state', (iceState) => {
      const isConnected = iceState === 'connected' || iceState === 'completed';
      setState(prev => ({ ...prev, isConnected }));
    });

    // تنظيف عند الإلغاء
    return () => {
      if (webrtcManager.current) {
        webrtcManager.current.destroy();
        webrtcManager.current = null;
      }
    };
  }, [signalingServerUrl]);

  // تسجيل المستخدم
  const registerUser = useCallback(async (userId: string, userName: string, userAvatar?: string) => {
    if (!webrtcManager.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await webrtcManager.current.registerUser(userId, userName, userAvatar);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isLoading: false 
      }));
    }
  }, []);

  // الانضمام لغرفة
  const joinRoom = useCallback(async (roomId: string, isInitiator: boolean = false) => {
    if (!webrtcManager.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await webrtcManager.current.joinRoom(roomId, isInitiator);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isLoading: false 
      }));
    }
  }, []);

  // تبديل الفيديو
  const toggleVideo = useCallback(async () => {
    if (!webrtcManager.current) return false;

    try {
      const isEnabled = await webrtcManager.current.toggleVideo();
      setState(prev => ({ ...prev, isVideoEnabled: isEnabled }));
      return isEnabled;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      return false;
    }
  }, []);

  // تبديل الصوت
  const toggleAudio = useCallback(async () => {
    if (!webrtcManager.current) return false;

    try {
      const isEnabled = await webrtcManager.current.toggleAudio();
      setState(prev => ({ ...prev, isAudioEnabled: isEnabled }));
      return isEnabled;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      return false;
    }
  }, []);

  // تبديل مشاركة الشاشة
  const toggleScreenShare = useCallback(async () => {
    if (!webrtcManager.current) return false;

    try {
      const isSharing = await webrtcManager.current.toggleScreenShare();
      setState(prev => ({ ...prev, isScreenSharing: isSharing }));
      return isSharing;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      return false;
    }
  }, []);

  // إرسال رسالة عبر قناة البيانات
  const sendMessage = useCallback((message: any) => {
    if (!webrtcManager.current) return false;
    return webrtcManager.current.sendDataChannelMessage(message);
  }, []);

  // إنهاء المكالمة
  const endCall = useCallback(async () => {
    if (!webrtcManager.current) return;

    try {
      await webrtcManager.current.endCall();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  }, []);

  // الحصول على الإحصائيات
  const getStats = useCallback(async () => {
    if (!webrtcManager.current) return null;
    return await webrtcManager.current.getStats();
  }, []);

  // الحصول على حالة الاتصال
  const getConnectionQuality = useCallback(async () => {
    const stats = await getStats();
    if (!stats) return 'unknown';

    // تحليل الإحصائيات لتحديد جودة الاتصال
    let quality: 'excellent' | 'good' | 'poor' | 'disconnected' = 'good';

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const packetsLost = report.packetsLost || 0;
        const packetsReceived = report.packetsReceived || 0;
        const lossRate = packetsLost / (packetsLost + packetsReceived);

        if (lossRate < 0.02) {
          quality = 'excellent';
        } else if (lossRate < 0.05) {
          quality = 'good';
        } else {
          quality = 'poor';
        }
      }
    });

    return quality;
  }, [getStats]);

  // إعادة الاتصال
  const reconnect = useCallback(() => {
    if (webrtcManager.current) {
      webrtcManager.current.destroy();
      webrtcManager.current = new WebRTCManager(signalingServerUrl);
    }
  }, [signalingServerUrl]);

  return {
    // الحالة
    ...state,
    
    // المراجع
    localVideoRef,
    remoteVideoRef,
    
    // الوظائف
    registerUser,
    joinRoom,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    sendMessage,
    endCall,
    getStats,
    getConnectionQuality,
    reconnect,
    
    // معلومات إضافية
    manager: webrtcManager.current,
    status: webrtcManager.current?.getStatus() || null
  };
}
