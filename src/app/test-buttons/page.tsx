'use client';

import React from 'react';
import SimpleCallTest from '@/components/SimpleCallTest';
import { useAuth } from '@/contexts/AuthContext';

export default function TestButtonsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧪 اختبار الأزرار والوظائف
          </h1>
          <p className="text-gray-600">
            اختبار شامل للأزرار والوظائف الأساسية قبل المكالمات
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">خدمة مجانية 100% - بدون فيزا</span>
          </div>
        </div>

        {!user ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-2">⚠️ يجب تسجيل الدخول</h2>
            <p>يرجى تسجيل الدخول أولاً لاختبار المكالمات</p>
            <a 
              href="/auth" 
              className="inline-block mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              تسجيل الدخول
            </a>
          </div>
        ) : (
          <SimpleCallTest />
        )}

        {/* معلومات إضافية */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">🔍 نصائح التشخيص</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• افتح Console المتصفح (F12) لرؤية السجلات المفصلة</li>
              <li>• تأكد من تفعيل JavaScript في المتصفح</li>
              <li>• تحقق من اتصال الإنترنت</li>
              <li>• تأكد من استخدام HTTPS (مطلوب للمكالمات)</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">✅ ما يجب أن يعمل</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• الزر الأساسي يظهر رسالة تأكيد</li>
              <li>• اختبار Firebase ينشئ مستند جديد</li>
              <li>• اختبار المكالمات يرسل طلب مكالمة</li>
              <li>• السجلات تظهر جميع الأحداث</li>
            </ul>
          </div>
        </div>

        {/* روابط مفيدة */}
        <div className="mt-8 bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h3 className="font-bold text-gray-800 mb-3">🔗 روابط مفيدة للاختبار</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <a 
              href="/debug-calls" 
              className="bg-blue-600 text-white px-3 py-2 rounded text-center hover:bg-blue-700 transition-colors text-sm"
            >
              🔍 تشخيص المكالمات
            </a>
            <a 
              href="/test-call" 
              className="bg-green-600 text-white px-3 py-2 rounded text-center hover:bg-green-700 transition-colors text-sm"
            >
              📞 اختبار المكالمة
            </a>
            <a 
              href="/test-jitsi" 
              className="bg-purple-600 text-white px-3 py-2 rounded text-center hover:bg-purple-700 transition-colors text-sm"
            >
              🎥 اختبار Jitsi
            </a>
            <a
              href="/free-servers"
              className="bg-green-600 text-white px-3 py-2 rounded text-center hover:bg-green-700 transition-colors text-sm"
            >
              🆓 خوادم مجانية
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
