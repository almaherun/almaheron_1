import { useState, useEffect, useRef, useCallback } from 'react';
import { VercelWebRTCManager } from '@/lib/vercel-webrtc-manager';

interface UseVercelWebRTCProps {
  userId: string;
  userName: string;
  autoConnect?: boolean;
}

interface IncomingCall {
  fromUserId: string;
  roomId: string;
  offer: RTCSessionDescriptionInit;
}

export function useVercelWebRTC({ userId, userName, autoConnect = true }: UseVercelWebRTCProps) {
  // الحالات
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // المراجع
  const managerRef = useRef<VercelWebRTCManager | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // إنشاء مدير WebRTC
  useEffect(() => {
    console.log('🚀 useVercelWebRTC initializing:', { userId, userName, autoConnect });

    if (userId && userName) {
      managerRef.current = new VercelWebRTCManager(userId, userName);
      console.log('✅ WebRTC Manager created for:', userId);
      
      // إعداد معالجات الأحداث
      managerRef.current.onLocalStream = (stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      };

      managerRef.current.onRemoteStream = (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      managerRef.current.onConnectionStateChange = (state) => {
        setConnectionState(state);
        setIsInCall(state === 'connected');
      };

      managerRef.current.onError = (error) => {
        setError(error);
        setIsLoading(false);
      };

      managerRef.current.onMessage = (message) => {
        if (message.type === 'incoming-call') {
          setIncomingCall({
            fromUserId: message.fromUserId,
            roomId: message.roomId,
            offer: message.offer
          });
        }
      };

      // الاتصال التلقائي
      if (autoConnect) {
        connectToServer();
      }
    }

    return () => {
      if (managerRef.current) {
        managerRef.current.endCall();
      }
    };
  }, [userId, userName, autoConnect]);

  // تحديث مراجع الفيديو عند تغيير الـ streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // الاتصال بالخادم
  const connectToServer = useCallback(async () => {
    console.log('🔌 Attempting to connect to server...');
    if (!managerRef.current) {
      console.error('❌ No WebRTC manager available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const connected = await managerRef.current.connectToSignalingServer();
      console.log('🔌 Connection result:', connected);
      setIsConnected(connected);
      return connected;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setError(error as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // بدء مكالمة
  const startCall = useCallback(async (targetUserId: string) => {
    console.log('📞 Starting call to:', targetUserId);
    console.log('📞 Connection status:', { isConnected, manager: !!managerRef.current });

    if (!managerRef.current || !isConnected) {
      const errorMsg = !managerRef.current ? 'لا يوجد مدير WebRTC' : 'غير متصل بالخادم';
      console.error('❌ Cannot start call:', errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📞 Calling manager.startCall...');
      await managerRef.current.startCall(targetUserId);
      console.log('✅ Call started successfully');
    } catch (error) {
      console.error('❌ Call failed:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  // قبول مكالمة واردة
  const acceptCall = useCallback(async () => {
    if (!managerRef.current || !incomingCall) {
      throw new Error('لا توجد مكالمة واردة');
    }

    setIsLoading(true);
    setError(null);

    try {
      await managerRef.current.acceptCall(
        incomingCall.fromUserId,
        incomingCall.roomId,
        incomingCall.offer
      );
      setIncomingCall(null);
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [incomingCall]);

  // رفض مكالمة واردة
  const rejectCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  // إنهاء المكالمة
  const endCall = useCallback(async () => {
    if (!managerRef.current) return;

    setIsLoading(true);

    try {
      await managerRef.current.endCall();
      setIsInCall(false);
      setLocalStream(null);
      setRemoteStream(null);
      setConnectionState(null);
      setIncomingCall(null);
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // تبديل الفيديو
  const toggleVideo = useCallback(() => {
    if (!managerRef.current) return false;

    const enabled = managerRef.current.toggleVideo();
    setIsVideoEnabled(enabled);
    return enabled;
  }, []);

  // تبديل الصوت
  const toggleAudio = useCallback(() => {
    if (!managerRef.current) return false;

    const enabled = managerRef.current.toggleAudio();
    setIsAudioEnabled(enabled);
    return enabled;
  }, []);

  // الحصول على جودة الاتصال
  const getConnectionQuality = useCallback((): 'excellent' | 'good' | 'poor' | 'disconnected' => {
    if (!managerRef.current || !managerRef.current.isConnected) {
      return 'disconnected';
    }

    const state = managerRef.current.connectionState;
    switch (state) {
      case 'connected':
        return 'excellent';
      case 'connecting':
        return 'good';
      case 'disconnected':
        return 'disconnected';
      default:
        return 'poor';
    }
  }, [connectionState]);

  return {
    // الحالات
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

    // المراجع
    localVideoRef,
    remoteVideoRef,

    // الوظائف
    connectToServer,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    getConnectionQuality,

    // معلومات إضافية
    manager: managerRef.current
  };
}
