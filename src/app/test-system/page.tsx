'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Phone,
  Video,
  Bell,
  Database,
  Wifi,
  Volume2
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function TestSystemPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  // قائمة الاختبارات
  const testSuite = [
    {
      name: 'Firebase Connection',
      test: testFirebaseConnection
    },
    {
      name: 'User Authentication',
      test: testUserAuth
    },
    {
      name: 'Jitsi Meet API',
      test: testJitsiAPI
    },
    {
      name: 'Audio Generator',
      test: testAudioGenerator
    },
    {
      name: 'Call Notifications',
      test: testCallNotifications
    },
    {
      name: 'Browser Permissions',
      test: testBrowserPermissions
    }
  ];

  // تشغيل جميع الاختبارات
  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    for (const testCase of testSuite) {
      setCurrentTest(testCase.name);
      
      // إضافة اختبار في حالة الانتظار
      setTests(prev => [...prev, {
        name: testCase.name,
        status: 'pending',
        message: 'جاري التشغيل...'
      }]);

      try {
        const result = await testCase.test();
        
        // تحديث النتيجة
        setTests(prev => prev.map(test => 
          test.name === testCase.name ? result : test
        ));
      } catch (error) {
        setTests(prev => prev.map(test => 
          test.name === testCase.name ? {
            name: testCase.name,
            status: 'error',
            message: 'فشل الاختبار',
            details: error instanceof Error ? error.message : 'خطأ غير معروف'
          } : test
        ));
      }

      // انتظار قصير بين الاختبارات
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTest('');
    setIsRunning(false);
  };

  // اختبار اتصال Firebase
  async function testFirebaseConnection(): Promise<TestResult> {
    try {
      const { db } = await import('@/lib/firebase');
      if (db) {
        return {
          name: 'Firebase Connection',
          status: 'success',
          message: 'تم الاتصال بـ Firebase بنجاح'
        };
      } else {
        throw new Error('Firebase غير متاح');
      }
    } catch (error) {
      return {
        name: 'Firebase Connection',
        status: 'error',
        message: 'فشل الاتصال بـ Firebase',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  // اختبار المصادقة
  async function testUserAuth(): Promise<TestResult> {
    if (user) {
      return {
        name: 'User Authentication',
        status: 'success',
        message: `مسجل دخول: ${user.displayName || user.email}`
      };
    } else {
      return {
        name: 'User Authentication',
        status: 'warning',
        message: 'غير مسجل دخول',
        details: 'يجب تسجيل الدخول لاختبار المكالمات'
      };
    }
  }

  // اختبار Jitsi Meet API
  async function testJitsiAPI(): Promise<TestResult> {
    try {
      // محاولة تحميل Jitsi API
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      
      return new Promise((resolve) => {
        script.onload = () => {
          document.head.removeChild(script);
          resolve({
            name: 'Jitsi Meet API',
            status: 'success',
            message: 'تم تحميل Jitsi Meet API بنجاح'
          });
        };
        
        script.onerror = () => {
          document.head.removeChild(script);
          resolve({
            name: 'Jitsi Meet API',
            status: 'error',
            message: 'فشل في تحميل Jitsi Meet API',
            details: 'تحقق من الاتصال بالإنترنت'
          });
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      return {
        name: 'Jitsi Meet API',
        status: 'error',
        message: 'خطأ في اختبار Jitsi API',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  // اختبار مولد الأصوات
  async function testAudioGenerator(): Promise<TestResult> {
    try {
      const { audioGenerator } = await import('@/lib/audio-generator');
      
      if (typeof window !== 'undefined' && window.AudioContext) {
        const ringtone = audioGenerator.createRingtone();
        if (ringtone) {
          return {
            name: 'Audio Generator',
            status: 'success',
            message: 'مولد الأصوات يعمل بنجاح'
          };
        } else {
          return {
            name: 'Audio Generator',
            status: 'warning',
            message: 'مولد الأصوات متاح لكن قد يحتاج تفاعل المستخدم'
          };
        }
      } else {
        return {
          name: 'Audio Generator',
          status: 'error',
          message: 'AudioContext غير مدعوم في هذا المتصفح'
        };
      }
    } catch (error) {
      return {
        name: 'Audio Generator',
        status: 'error',
        message: 'فشل في اختبار مولد الأصوات',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  // اختبار إشعارات المكالمات
  async function testCallNotifications(): Promise<TestResult> {
    try {
      const { CallNotificationManager } = await import('@/lib/call-notifications');
      
      if (user) {
        const manager = new CallNotificationManager(user.uid, user.displayName || 'اختبار');
        manager.dispose(); // تنظيف فوري
        
        return {
          name: 'Call Notifications',
          status: 'success',
          message: 'نظام الإشعارات جاهز'
        };
      } else {
        return {
          name: 'Call Notifications',
          status: 'warning',
          message: 'يحتاج تسجيل دخول لاختبار الإشعارات'
        };
      }
    } catch (error) {
      return {
        name: 'Call Notifications',
        status: 'error',
        message: 'فشل في اختبار نظام الإشعارات',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  // اختبار أذونات المتصفح
  async function testBrowserPermissions(): Promise<TestResult> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          name: 'Browser Permissions',
          status: 'error',
          message: 'getUserMedia غير مدعوم في هذا المتصفح'
        };
      }

      // اختبار الوصول للكاميرا والميكروفون
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // إيقاف الستريم فوراً
      stream.getTracks().forEach(track => track.stop());
      
      return {
        name: 'Browser Permissions',
        status: 'success',
        message: 'أذونات الكاميرا والميكروفون متاحة'
      };
    } catch (error) {
      return {
        name: 'Browser Permissions',
        status: 'warning',
        message: 'أذونات الكاميرا/الميكروفون مرفوضة',
        details: 'يجب السماح للموقع بالوصول للكاميرا والميكروفون'
      };
    }
  }

  // أيقونة الحالة
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  // لون الخلفية
  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* العنوان */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">اختبار النظام الجديد</h1>
          <p className="text-gray-600">فحص شامل لجميع مكونات نظام المكالمات</p>
        </motion.div>

        {/* زر بدء الاختبار */}
        <div className="text-center mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runAllTests}
            disabled={isRunning}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRunning ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الاختبار...
              </div>
            ) : (
              'بدء الاختبار الشامل'
            )}
          </motion.button>
        </div>

        {/* الاختبار الحالي */}
        {isRunning && currentTest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-6 text-center"
          >
            <p className="text-blue-800 font-medium">جاري اختبار: {currentTest}</p>
          </motion.div>
        )}

        {/* نتائج الاختبارات */}
        <div className="space-y-4">
          {tests.map((test, index) => (
            <motion.div
              key={test.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <h3 className="font-semibold text-gray-800">{test.name}</h3>
                </div>
                <span className={`text-sm font-medium ${
                  test.status === 'success' ? 'text-green-600' :
                  test.status === 'error' ? 'text-red-600' :
                  test.status === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {test.status === 'success' ? 'نجح' :
                   test.status === 'error' ? 'فشل' :
                   test.status === 'warning' ? 'تحذير' :
                   'جاري...'}
                </span>
              </div>
              
              <p className="text-gray-700 mt-2">{test.message}</p>
              
              {test.details && (
                <p className="text-gray-600 text-sm mt-1 bg-white/50 p-2 rounded">
                  {test.details}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* ملخص النتائج */}
        {tests.length > 0 && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">ملخص النتائج</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {tests.filter(t => t.status === 'success').length}
                </div>
                <div className="text-green-700">نجح</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {tests.filter(t => t.status === 'warning').length}
                </div>
                <div className="text-yellow-700">تحذير</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {tests.filter(t => t.status === 'error').length}
                </div>
                <div className="text-red-700">فشل</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
