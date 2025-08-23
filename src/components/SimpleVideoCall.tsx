'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface SimpleVideoCallProps {
  userId: string;
  userName: string;
  targetUserId?: string;
  targetUserName?: string;
  userType: 'student' | 'teacher';
}

export default function SimpleVideoCall({
  userId,
  userName,
  targetUserId,
  targetUserName,
  userType
}: SimpleVideoCallProps) {
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<string>('جاهز للمكالمة');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // بدء الكاميرا والميكروفون
  const startLocalMedia = async () => {
    try {
      console.log('🎥 Starting local media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setCallStatus('تم تشغيل الكاميرا والميكروفون');
      console.log('✅ Local media started successfully');
    } catch (error) {
      console.error('❌ Error starting local media:', error);
      setCallStatus('خطأ في تشغيل الكاميرا أو الميكروفون');
    }
  };

  // إيقاف الكاميرا والميكروفون
  const stopLocalMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setCallStatus('تم إيقاف الكاميرا والميكروفون');
  };

  // بدء المكالمة
  const startCall = async () => {
    console.log('📞 Starting call...');
    setCallStatus('جاري بدء المكالمة...');
    
    await startLocalMedia();
    setIsInCall(true);
    setCallStatus(`في مكالمة مع ${targetUserName || 'مستخدم آخر'}`);
    
    // محاكاة إشعار للطرف الآخر
    console.log(`📞 Call started to ${targetUserId} (${targetUserName})`);
  };

  // إنهاء المكالمة
  const endCall = () => {
    console.log('📞 Ending call...');
    setIsInCall(false);
    stopLocalMedia();
    setCallStatus('تم إنهاء المكالمة');
  };

  // تبديل الفيديو
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // تبديل الصوت
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // تنظيف عند إلغاء المكون
  useEffect(() => {
    return () => {
      stopLocalMedia();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          مكالمة فيديو بسيطة
        </h2>
        <p className="text-gray-600">
          {userType === 'student' ? 'طالب' : 'معلم'}: {userName}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          الحالة: {callStatus}
        </p>
      </div>

      {/* منطقة الفيديو */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* الفيديو المحلي */}
        <div className="relative">
          <h3 className="text-sm font-medium text-gray-700 mb-2">فيديوك</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-48 bg-gray-200 rounded-lg object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* الفيديو البعيد */}
        <div className="relative">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {targetUserName || 'الطرف الآخر'}
          </h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-48 bg-gray-200 rounded-lg object-cover"
          />
          {!isInCall && (
            <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">في انتظار الاتصال</p>
            </div>
          )}
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex justify-center space-x-4 space-x-reverse">
        {!isInCall ? (
          <button
            onClick={startCall}
            disabled={!targetUserId}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 space-x-reverse"
          >
            <Phone className="w-5 h-5" />
            <span>بدء المكالمة</span>
          </button>
        ) : (
          <>
            {/* إنهاء المكالمة */}
            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 space-x-reverse"
            >
              <PhoneOff className="w-5 h-5" />
              <span>إنهاء المكالمة</span>
            </button>

            {/* تبديل الفيديو */}
            <button
              onClick={toggleVideo}
              className={`${
                isVideoEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
              } text-white px-4 py-3 rounded-lg flex items-center space-x-2 space-x-reverse`}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* تبديل الصوت */}
            <button
              onClick={toggleAudio}
              className={`${
                isAudioEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
              } text-white px-4 py-3 rounded-lg flex items-center space-x-2 space-x-reverse`}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          </>
        )}
      </div>

      {/* معلومات إضافية */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">معلومات المكالمة:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>معرفك:</strong> {userId}</p>
          <p><strong>اسمك:</strong> {userName}</p>
          {targetUserId && (
            <>
              <p><strong>معرف الطرف الآخر:</strong> {targetUserId}</p>
              <p><strong>اسم الطرف الآخر:</strong> {targetUserName}</p>
            </>
          )}
          <p><strong>نوع المستخدم:</strong> {userType === 'student' ? 'طالب' : 'معلم'}</p>
        </div>
      </div>

      {!targetUserId && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ لم يتم تحديد الطرف الآخر للمكالمة
          </p>
        </div>
      )}
    </div>
  );
}
