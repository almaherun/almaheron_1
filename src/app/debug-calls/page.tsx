'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugCallsPage() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  // اختبار APIs
  const testAPIs = async () => {
    addLog('🧪 بدء اختبار APIs...');
    
    try {
      // اختبار signaling API
      addLog('📡 اختبار /api/signaling...');
      const signalingResponse = await fetch('/api/signaling?action=status');
      const signalingData = await signalingResponse.json();
      
      if (signalingData.success) {
        addLog('✅ Signaling API يعمل بنجاح');
        setApiStatus(signalingData);
      } else {
        addLog('❌ Signaling API فشل');
      }

      // اختبار websocket API
      addLog('🔌 اختبار /api/websocket...');
      const wsResponse = await fetch('/api/websocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          data: { message: 'test' },
          fromUserId: 'test-user',
          toUserId: 'test-target'
        })
      });
      
      const wsData = await wsResponse.json();
      if (wsData.success) {
        addLog('✅ WebSocket API يعمل بنجاح');
      } else {
        addLog('❌ WebSocket API فشل');
      }

    } catch (error) {
      addLog(`❌ خطأ في الاختبار: ${error}`);
    }
  };

  // اختبار تسجيل مستخدم
  const testUserRegistration = async () => {
    if (!user) {
      addLog('❌ لا يوجد مستخدم مسجل دخول');
      return;
    }

    addLog('👤 اختبار تسجيل المستخدم...');
    
    try {
      const response = await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-user',
          data: {
            userId: user.uid,
            name: user.displayName || 'مستخدم تجريبي'
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        addLog('✅ تم تسجيل المستخدم بنجاح');
      } else {
        addLog(`❌ فشل تسجيل المستخدم: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ خطأ في تسجيل المستخدم: ${error}`);
    }
  };

  // اختبار إنشاء غرفة
  const testRoomCreation = async () => {
    if (!user) {
      addLog('❌ لا يوجد مستخدم مسجل دخول');
      return;
    }

    addLog('🏠 اختبار إنشاء غرفة...');
    
    try {
      const roomId = `test-room-${Date.now()}`;
      const response = await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join-room',
          data: {
            roomId,
            userId: user.uid,
            userName: user.displayName || 'مستخدم تجريبي'
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        addLog(`✅ تم إنشاء الغرفة: ${roomId}`);
        addLog(`👥 عدد المشاركين: ${data.participantCount}`);
      } else {
        addLog(`❌ فشل إنشاء الغرفة: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ خطأ في إنشاء الغرفة: ${error}`);
    }
  };

  useEffect(() => {
    testAPIs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
          🔧 تشخيص نظام المكالمات
        </h1>

        {/* معلومات المستخدم */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">معلومات المستخدم</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>المعرف:</strong> {user.uid}</p>
              <p><strong>الاسم:</strong> {user.displayName || 'غير محدد'}</p>
              <p><strong>البريد:</strong> {user.email}</p>
            </div>
          ) : (
            <p className="text-red-600">لا يوجد مستخدم مسجل دخول</p>
          )}
        </div>

        {/* حالة APIs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">حالة APIs</h2>
          {apiStatus ? (
            <div className="space-y-2 text-sm">
              <p><strong>الرسالة:</strong> {apiStatus.message}</p>
              <p><strong>الوقت:</strong> {apiStatus.timestamp}</p>
              <p><strong>الاتصالات النشطة:</strong> {apiStatus.activeConnections}</p>
              <p><strong>الغرف النشطة:</strong> {apiStatus.activeRooms}</p>
              <p><strong>وقت التشغيل:</strong> {Math.round(apiStatus.uptime)} ثانية</p>
            </div>
          ) : (
            <p>جاري التحميل...</p>
          )}
        </div>

        {/* أزرار الاختبار */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">اختبارات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={testAPIs}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              🧪 اختبار APIs
            </button>
            <button
              onClick={testUserRegistration}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              👤 تسجيل مستخدم
            </button>
            <button
              onClick={testRoomCreation}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
            >
              🏠 إنشاء غرفة
            </button>
          </div>
        </div>

        {/* سجل الاختبارات */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">سجل الاختبارات</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))}
            {testResults.length === 0 && (
              <div>جاري تشغيل الاختبارات...</div>
            )}
          </div>
          <button
            onClick={() => setTestResults([])}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
          >
            🗑️ مسح السجل
          </button>
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
              href="/api/signaling?action=rooms" 
              target="_blank"
              className="block text-blue-600 hover:underline"
            >
              🏠 الغرف النشطة
            </a>
            <a 
              href="/api/signaling?action=users" 
              target="_blank"
              className="block text-blue-600 hover:underline"
            >
              👥 المستخدمين المتصلين
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
