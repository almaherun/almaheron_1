'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CallNotificationManager } from '@/lib/call-notifications';

export default function SimpleCallTest() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const testBasicButton = () => {
    addLog('🖱️ تم الضغط على زر الاختبار الأساسي');
    alert('الزر يعمل! 🎉');
  };

  const testCallNotificationManager = async () => {
    addLog('🧪 بدء اختبار CallNotificationManager');
    setIsLoading(true);

    try {
      if (!user) {
        addLog('❌ لا يوجد مستخدم مسجل دخول');
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      addLog(`👤 المستخدم الحالي: ${user.uid} (${user.displayName || 'بدون اسم'})`);

      // إنشاء مدير الإشعارات
      addLog('📱 إنشاء CallNotificationManager...');
      const manager = new CallNotificationManager(
        user.uid,
        user.displayName || 'مستخدم تجريبي'
      );

      addLog('✅ تم إنشاء CallNotificationManager بنجاح');

      // اختبار إرسال طلب مكالمة
      addLog('📞 إرسال طلب مكالمة تجريبي...');
      const callId = await manager.sendCallRequest(
        'test-user-id',
        'مستخدم تجريبي',
        'video',
        'اختبار المكالمة'
      );

      addLog(`✅ تم إرسال طلب المكالمة بنجاح! ID: ${callId}`);
      alert(`تم إرسال طلب المكالمة بنجاح!\nCall ID: ${callId}`);

      // تنظيف
      manager.dispose();
      addLog('🧹 تم تنظيف المدير');

    } catch (error: any) {
      addLog(`❌ خطأ: ${error.message}`);
      console.error('خطأ في الاختبار:', error);
      alert(`خطأ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFirebaseConnection = async () => {
    addLog('🔥 اختبار اتصال Firebase...');
    setIsLoading(true);

    try {
      // اختبار بسيط لـ Firebase
      const { db } = await import('@/lib/firebase');
      const { collection, addDoc } = await import('firebase/firestore');

      addLog('📝 إنشاء مستند اختبار...');
      const testDoc = await addDoc(collection(db, 'test'), {
        message: 'اختبار الاتصال',
        timestamp: new Date(),
        userId: user?.uid || 'anonymous'
      });

      addLog(`✅ تم إنشاء مستند الاختبار: ${testDoc.id}`);
      alert(`Firebase يعمل بنجاح!\nDocument ID: ${testDoc.id}`);

    } catch (error: any) {
      addLog(`❌ خطأ في Firebase: ${error.message}`);
      console.error('خطأ في Firebase:', error);
      alert(`خطأ في Firebase: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 تم مسح السجلات');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">
        🧪 اختبار بسيط للأزرار والمكالمات
      </h1>

      {/* معلومات المستخدم */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">معلومات المستخدم:</h2>
        {user ? (
          <div className="text-sm space-y-1">
            <p><strong>المعرف:</strong> {user.uid}</p>
            <p><strong>الاسم:</strong> {user.displayName || 'غير محدد'}</p>
            <p><strong>البريد:</strong> {user.email}</p>
          </div>
        ) : (
          <p className="text-red-600">❌ لا يوجد مستخدم مسجل دخول</p>
        )}
      </div>

      {/* أزرار الاختبار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testBasicButton}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          🖱️ اختبار زر أساسي
        </button>

        <button
          onClick={testCallNotificationManager}
          disabled={isLoading || !user}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          {isLoading ? '⏳ جاري...' : '📞 اختبار المكالمات'}
        </button>

        <button
          onClick={testFirebaseConnection}
          disabled={isLoading}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          {isLoading ? '⏳ جاري...' : '🔥 اختبار Firebase'}
        </button>

        <button
          onClick={clearLogs}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          🗑️ مسح السجلات
        </button>
      </div>

      {/* السجلات */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
        <h3 className="text-white font-bold mb-2">📝 سجل الأحداث:</h3>
        <div className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">لا توجد أحداث بعد...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* تعليمات */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">📋 تعليمات الاختبار:</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. ابدأ بـ "اختبار زر أساسي" للتأكد من عمل الأزرار</li>
          <li>2. جرب "اختبار Firebase" للتأكد من الاتصال بقاعدة البيانات</li>
          <li>3. جرب "اختبار المكالمات" لاختبار نظام الإشعارات</li>
          <li>4. راقب السجلات في الأسفل ورسائل Console في المتصفح</li>
        </ol>
      </div>
    </div>
  );
}
