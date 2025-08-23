'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVercelWebRTC } from '@/hooks/useVercelWebRTC';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

export default function TestCallPage() {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState('');
  const [callStatus, setCallStatus] = useState<string>('idle');

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
    userId: user?.uid || 'test-user',
    userName: user?.displayName || 'مستخدم تجريبي',
    autoConnect: true
  });

  const handleStartCall = async () => {
    if (!targetUserId.trim()) {
      alert('يرجى إدخال معرف المستخدم المستهدف');
      return;
    }

    try {
      setCallStatus('calling');
      await startCall(targetUserId.trim());
    } catch (error) {
      console.error('خطأ في بدء المكالمة:', error);
      setCallStatus('error');
    }
  };

  const handleAcceptCall = async () => {
    try {
      setCallStatus('accepting');
      await acceptCall();
    } catch (error) {
      console.error('خطأ في قبول المكالمة:', error);
      setCallStatus('error');
    }
  };

  const handleEndCall = async () => {
    try {
      await endCall();
      setCallStatus('ended');
      setTimeout(() => setCallStatus('idle'), 2000);
    } catch (error) {
      console.error('خطأ في إنهاء المكالمة:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-green-600">
          🕌 اختبار نظام المكالمات - أكاديمية المحرون
        </h1>

        {/* معلومات الحالة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">حالة النظام</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm">الاتصال بالخادم</p>
              <p className="text-xs text-gray-500">{isConnected ? 'متصل' : 'غير متصل'}</p>
            </div>
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isInCall ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <p className="text-sm">في مكالمة</p>
              <p className="text-xs text-gray-500">{isInCall ? 'نعم' : 'لا'}</p>
            </div>
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${connectionState === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <p className="text-sm">حالة الاتصال</p>
              <p className="text-xs text-gray-500">{connectionState || 'غير محدد'}</p>
            </div>
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${getConnectionQuality() === 'excellent' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <p className="text-sm">جودة الاتصال</p>
              <p className="text-xs text-gray-500">{getConnectionQuality()}</p>
            </div>
          </div>
        </div>

        {/* أخطاء */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>خطأ:</strong> {error.message}
          </div>
        )}

        {/* مكالمة واردة */}
        {incomingCall && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
            <h3 className="font-semibold mb-2">مكالمة واردة من: {incomingCall.fromUserId}</h3>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptCall}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                قبول
              </button>
              <button
                onClick={() => rejectCall()}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                رفض
              </button>
            </div>
          </div>
        )}

        {/* بدء مكالمة جديدة */}
        {!isInCall && !incomingCall && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">بدء مكالمة جديدة</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="معرف المستخدم المستهدف"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleStartCall}
                disabled={isLoading || !isConnected}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-2 rounded flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                {isLoading ? 'جاري الاتصال...' : 'بدء المكالمة'}
              </button>
            </div>
          </div>
        )}

        {/* أدوات التحكم في المكالمة */}
        {isInCall && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">أدوات التحكم</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${isVideoEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full ${isAudioEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              <button
                onClick={handleEndCall}
                className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* شاشات الفيديو */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* الفيديو المحلي */}
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              أنت
            </div>
          </div>

          {/* الفيديو البعيد */}
          <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              المستخدم الآخر
            </div>
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <p>في انتظار الفيديو البعيد...</p>
              </div>
            )}
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">معلومات تقنية</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>معرف المستخدم:</strong> {user?.uid || 'test-user'}</p>
            <p><strong>اسم المستخدم:</strong> {user?.displayName || 'مستخدم تجريبي'}</p>
            <p><strong>حالة المكالمة:</strong> {callStatus}</p>
            <p><strong>الوسائط المحلية:</strong> {localStream ? 'متوفرة' : 'غير متوفرة'}</p>
            <p><strong>الوسائط البعيدة:</strong> {remoteStream ? 'متوفرة' : 'غير متوفرة'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
