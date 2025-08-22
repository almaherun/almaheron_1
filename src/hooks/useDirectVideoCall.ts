'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DirectWebRTCCall, CallOffer } from '@/lib/webrtc-direct';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export interface CallState {
  isInCall: boolean;
  isConnecting: boolean;
  connectionState: RTCPeerConnectionState;
  callDuration: number;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  currentCall: CallOffer | null;
  incomingCalls: CallOffer[];
  error: string | null;
}

export function useDirectVideoCall(userId: string, userType: 'student' | 'teacher') {
  const { toast } = useToast();
  
  // State
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isConnecting: false,
    connectionState: 'new',
    callDuration: 0,
    isVideoEnabled: true,
    isAudioEnabled: true,
    currentCall: null,
    incomingCalls: [],
    error: null
  });

  // Refs
  const webrtcCallRef = useRef<DirectWebRTCCall | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // تحديث مؤقت المكالمة
  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    
    let duration = 0;
    callTimerRef.current = setInterval(() => {
      duration += 1;
      setCallState(prev => ({ ...prev, callDuration: duration }));
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallState(prev => ({ ...prev, callDuration: 0 }));
  }, []);

  // الاستماع للمكالمات الواردة
  useEffect(() => {
    if (userType !== 'teacher') return;

    console.log('🎧 Listening for incoming calls...');
    
    // استعلام مبسط بدون orderBy لتجنب مشكلة Index
    const callsQuery = query(
      collection(db, 'webrtc_calls'),
      where('status', '==', 'pending'),
      limit(10)
    );

    console.log('🎧 Teacher listening for calls with userId:', userId);

    const unsubscribe = onSnapshot(callsQuery, (snapshot) => {
      const calls: CallOffer[] = [];
      const allCalls: CallOffer[] = [];

      console.log('🔍 Firebase snapshot received:', {
        size: snapshot.size,
        empty: snapshot.empty,
        teacherUserId: userId
      });

      snapshot.forEach((doc) => {
        const data = doc.data() as CallOffer;

        // إضافة معرف الوثيقة
        const call = {
          ...data,
          id: doc.id
        } as CallOffer;

        // إضافة جميع المكالمات للتشخيص
        allCalls.push(call);

        // فلترة المكالمات للمعلم الحالي
        let isForMe = false;

        if (userType === 'teacher') {
          // للمعلم: تحقق من معرف المعلم أو اسم المعلم
          isForMe = data.teacherId === userId ||
                   data.teacherName === userId ||
                   (userId === 'qGO5FqM2NaacFBKRdTcVA9zYppm1' && data.teacherName === 'tech') ||
                   (userId === 'qGO5FqM2NaacFBKRdTcVA9zYppm1' && data.teacherId === 'tech');
        } else {
          // للطالب: تحقق من معرف الطالب
          isForMe = data.studentId === userId;
        }

        if (isForMe) {
          calls.push(call);
        }

        console.log('📄 Call document:', {
          id: doc.id,
          studentId: data.studentId,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          currentUserId: userId,
          userType: userType,
          isForMe: isForMe,
          status: data.status,
          matchConditions: {
            teacherIdMatch: data.teacherId === userId,
            teacherNameMatch: data.teacherName === userId,
            specialTechMatch: userId === 'qGO5FqM2NaacFBKRdTcVA9zYppm1' && data.teacherName === 'tech',
            specialTechIdMatch: userId === 'qGO5FqM2NaacFBKRdTcVA9zYppm1' && data.teacherId === 'tech'
          }
        });
      });

      console.log('📞 Incoming calls updated:', {
        totalCallsInDB: allCalls.length,
        callsForMe: calls.length,
        myUserId: userId,
        userType: userType,
        allCallsData: allCalls.map(c => ({
          id: c.id,
          studentId: c.studentId,
          teacherId: c.teacherId,
          teacherName: c.teacherName,
          status: c.status
        }))
      });
      
      setCallState(prev => ({ ...prev, incomingCalls: calls }));

      // إشعار بالمكالمة الجديدة
      if (calls.length > 0 && !callState.isInCall) {
        const latestCall = calls[0];
        toast({
          title: "📞 مكالمة فيديو واردة",
          description: `مكالمة من ${latestCall.studentName}`,
          duration: 10000,
        });
      }
    });

    return () => unsubscribe();
  }, [userType, toast, callState.isInCall]);

  // بدء مكالمة جديدة (للطالب)
  const startCall = useCallback(async (
    teacherId: string, 
    studentName: string, 
    teacherName: string
  ) => {
    try {
      console.log('📞 Starting new call...');
      
      setCallState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        error: null 
      }));

      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // إنشاء مكالمة WebRTC جديدة
      const webrtcCall = new DirectWebRTCCall(callId, userId, 'student', true);
      webrtcCallRef.current = webrtcCall;

      // إعداد callbacks
      webrtcCall.onRemoteStream = (stream) => {
        console.log('📺 Remote stream received');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      webrtcCall.onConnectionStateChange = (state) => {
        console.log('🔄 Connection state:', state);
        setCallState(prev => ({ ...prev, connectionState: state }));

        if (state === 'connected') {
          setCallState(prev => ({ 
            ...prev, 
            isInCall: true, 
            isConnecting: false 
          }));
          startCallTimer();
          
          toast({
            title: "✅ تم الاتصال",
            description: "بدأت المكالمة بنجاح",
            className: "bg-green-600 text-white"
          });
        }
      };

      webrtcCall.onCallEnded = () => {
        console.log('📞 Call ended');
        endCall();
      };

      // بدء المكالمة مع تمرير معرف المعلم
      console.log('🎯 Starting call with data:', {
        studentName,
        teacherName,
        teacherId,
        studentId: userId
      });

      await webrtcCall.startCall(studentName, teacherName, teacherId);

      // عرض الفيديو المحلي
      const localStream = webrtcCall.getLocalStream();
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // إنشاء بيانات المكالمة
      const callData: CallOffer = {
        id: callId,
        studentId: userId,
        teacherId: teacherId,
        studentName,
        teacherName,
        offer: {} as RTCSessionDescriptionInit, // سيتم تحديثه في WebRTC
        status: 'pending',
        createdAt: new Date()
      };

      console.log('📞 Call data created:', callData);

      setCallState(prev => ({ 
        ...prev, 
        currentCall: callData 
      }));

    } catch (error: any) {
      console.error('❌ Error starting call:', error);
      setCallState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error.message 
      }));
      
      toast({
        title: "❌ خطأ في بدء المكالمة",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [userId, toast, startCallTimer]);

  // قبول المكالمة (للمعلم)
  const acceptCall = useCallback(async (call: CallOffer, permissionAlreadyGranted?: boolean) => {
    try {
      console.log('✅ Accepting call:', call.id);
      
      setCallState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        currentCall: call,
        error: null 
      }));

      // إنشاء مكالمة WebRTC
      const webrtcCall = new DirectWebRTCCall(call.id, userId, 'teacher', false);
      webrtcCallRef.current = webrtcCall;

      // إعداد callbacks
      webrtcCall.onRemoteStream = (stream) => {
        console.log('📺 Remote stream received');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      webrtcCall.onConnectionStateChange = (state) => {
        console.log('🔄 Connection state:', state);
        setCallState(prev => ({ ...prev, connectionState: state }));

        if (state === 'connected') {
          setCallState(prev => ({ 
            ...prev, 
            isInCall: true, 
            isConnecting: false,
            incomingCalls: [] // مسح المكالمات الواردة
          }));
          startCallTimer();
          
          toast({
            title: "✅ تم قبول المكالمة",
            description: `بدأت المكالمة مع ${call.studentName}`,
            className: "bg-green-600 text-white"
          });
        }
      };

      webrtcCall.onCallEnded = () => {
        console.log('📞 Call ended');
        endCall();
      };

      // قبول المكالمة مع معالجة أخطاء الإذن
      try {
        console.log('🔍 Permission already granted:', permissionAlreadyGranted);

        if (permissionAlreadyGranted) {
          // الإذن تم منحه بالفعل، تجاوز طلب الإذن في WebRTC
          await webrtcCall.acceptCallWithPermission(userId);
        } else {
          // طلب الإذن كالمعتاد
          await webrtcCall.acceptCall(userId);
        }

        // عرض الفيديو المحلي
        const localStream = webrtcCall.getLocalStream();
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (permissionError: any) {
        console.error('❌ Permission error:', permissionError);

        // عرض رسالة واضحة للمستخدم فقط إذا لم يكن الإذن ممنوح مسبقاً
        if (!permissionAlreadyGranted) {
          toast({
            title: "🚫 مطلوب إذن الكاميرا والميكروفون",
            description: "يرجى السماح للكاميرا والميكروفون في المتصفح ثم المحاولة مرة أخرى",
            variant: "destructive",
            duration: 8000,
          });
        } else {
          toast({
            title: "❌ خطأ في المكالمة",
            description: "حدث خطأ أثناء بدء المكالمة، يرجى المحاولة مرة أخرى",
            variant: "destructive",
            duration: 5000,
          });
        }

        // إعادة تعيين الحالة
        setCallState(prev => ({
          ...prev,
          isConnecting: false,
          error: permissionError.message || 'فشل في بدء المكالمة'
        }));

        return; // إيقاف العملية
      }

    } catch (error: any) {
      console.error('❌ Error accepting call:', error);
      setCallState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error.message 
      }));
      
      toast({
        title: "❌ خطأ في قبول المكالمة",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [userId, toast, startCallTimer]);

  // رفض المكالمة
  const rejectCall = useCallback(async (call: CallOffer) => {
    console.log('❌ Rejecting call:', call.id);
    
    setCallState(prev => ({
      ...prev,
      incomingCalls: prev.incomingCalls.filter(c => c.id !== call.id)
    }));

    toast({
      title: "❌ تم رفض المكالمة",
      description: `تم رفض مكالمة ${call.studentName}`,
    });
  }, [toast]);

  // تبديل الفيديو
  const toggleVideo = useCallback(async () => {
    if (webrtcCallRef.current) {
      const enabled = await webrtcCallRef.current.toggleVideo();
      setCallState(prev => ({ ...prev, isVideoEnabled: enabled }));
      return enabled;
    }
    return false;
  }, []);

  // تبديل الصوت
  const toggleAudio = useCallback(async () => {
    if (webrtcCallRef.current) {
      const enabled = await webrtcCallRef.current.toggleAudio();
      setCallState(prev => ({ ...prev, isAudioEnabled: enabled }));
      return enabled;
    }
    return false;
  }, []);

  // إنهاء المكالمة
  const endCall = useCallback(async () => {
    console.log('📞 Ending call...');
    
    if (webrtcCallRef.current) {
      await webrtcCallRef.current.endCall();
      webrtcCallRef.current = null;
    }

    // تنظيف الفيديو
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    stopCallTimer();

    setCallState(prev => ({
      ...prev,
      isInCall: false,
      isConnecting: false,
      connectionState: 'new',
      currentCall: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      error: null
    }));

    toast({
      title: "📞 انتهت المكالمة",
      description: "تم إنهاء المكالمة بنجاح",
    });
  }, [stopCallTimer, toast]);

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      if (webrtcCallRef.current) {
        webrtcCallRef.current.endCall();
      }
      stopCallTimer();
    };
  }, [stopCallTimer]);

  return {
    ...callState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    toggleVideo,
    toggleAudio,
    endCall
  };
}
