'use client';

import { useVercelWebRTC } from '@/hooks/useVercelWebRTC';
import { useState } from 'react';

export default function TestSimplePage() {
  const [userId] = useState('test-user-123');
  const [userName] = useState('مستخدم تجريبي');

  console.log('🧪 TestSimplePage rendering with:', { userId, userName });

  const {
    isConnected,
    isInCall,
    connectionState,
    error,
    isLoading,
    startCall,
    localVideoRef,
    remoteVideoRef
  } = useVercelWebRTC({
    userId,
    userName,
    autoConnect: true
  });

  console.log('🧪 useVercelWebRTC state:', {
    isConnected,
    isInCall,
    connectionState,
    error: error?.message,
    isLoading
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🧪 اختبار النظام الجديد
        </h1>

        {/* معلومات الحالة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">حالة النظام</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>معرف المستخدم:</strong> {userId}
            </div>
            <div>
              <strong>اسم المستخدم:</strong> {userName}
            </div>
            <div>
              <strong>متصل:</strong> 
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? ' ✅ نعم' : ' ❌ لا'}
              </span>
            </div>
            <div>
              <strong>في مكالمة:</strong> 
              <span className={isInCall ? 'text-green-600' : 'text-gray-600'}>
                {isInCall ? ' ✅ نعم' : ' ⏸️ لا'}
              </span>
            </div>
            <div>
              <strong>حالة الاتصال:</strong> {connectionState || 'غير محدد'}
            </div>
            <div>
              <strong>جاري التحميل:</strong> 
              <span className={isLoading ? 'text-yellow-600' : 'text-gray-600'}>
                {isLoading ? ' ⏳ نعم' : ' ✅ لا'}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              <strong>خطأ:</strong> {error.message}
            </div>
          )}
        </div>

        {/* أزرار الاختبار */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">اختبارات</h2>
          <div className="space-y-4">
            <button
              onClick={() => startCall('test-target-user')}
              disabled={!isConnected || isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              🧪 اختبار بدء مكالمة
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              🔄 إعادة تحميل الصفحة
            </button>
          </div>
        </div>

        {/* فيديو */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">الفيديو</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">الفيديو المحلي</h3>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-48 bg-gray-200 rounded"
              />
            </div>
            <div>
              <h3 className="font-medium mb-2">الفيديو البعيد</h3>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-48 bg-gray-200 rounded"
              />
            </div>
          </div>
        </div>

        {/* روابط مفيدة */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">روابط مفيدة</h2>
          <div className="space-y-2">
            <a 
              href="/api/signaling?action=status" 
              target="_blank"
              className="block text-blue-600 hover:underline"
            >
              📡 حالة خادم الإشارات
            </a>
            <a 
              href="/debug-calls" 
              className="block text-blue-600 hover:underline"
            >
              🔧 صفحة التشخيص الشاملة
            </a>
            <a 
              href="/test-call" 
              className="block text-blue-600 hover:underline"
            >
              📞 صفحة اختبار المكالمات
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
