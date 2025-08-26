'use client';

import { useState, useEffect, useRef } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface TestResult {
  test: string;
  status: 'running' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

interface TestUser {
  email: string;
  password: string;
  name: string;
  type: 'student' | 'teacher';
  uid?: string;
}

export default function AutoTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);

  const logRef = useRef<HTMLDivElement>(null);

  // إضافة نتيجة اختبار
  const addResult = (test: string, status: TestResult['status'], message: string, details?: any) => {
    const result: TestResult = {
      test,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setResults(prev => [...prev, result]);
    console.log(`[${status.toUpperCase()}] ${test}: ${message}`, details || '');
    
    // التمرير التلقائي للأسفل
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 100);
  };

  // إنشاء مستخدمين تجريبيين
  const createTestUsers = async () => {
    const users: TestUser[] = [
      {
        email: `student-test-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        name: 'طالب تجريبي',
        type: 'student'
      },
      {
        email: `teacher-test-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        name: 'معلم تجريبي',
        type: 'teacher'
      }
    ];

    setTestUsers(users);
    addResult('إعداد المستخدمين', 'success', 'تم إنشاء بيانات المستخدمين التجريبيين', users);

    for (const user of users) {
      try {
        addResult(`إنشاء ${user.type}`, 'running', `جاري إنشاء حساب ${user.name}...`);
        
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        user.uid = userCredential.user.uid;

        // إضافة بيانات المستخدم في Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: user.name,
          email: user.email,
          type: user.type,
          createdAt: new Date(),
          isTestUser: true
        });

        addResult(`إنشاء ${user.type}`, 'success', `تم إنشاء ${user.name} بنجاح`, {
          uid: user.uid,
          email: user.email
        });

      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          // المستخدم موجود، جرب تسجيل الدخول
          try {
            const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
            user.uid = userCredential.user.uid;
            addResult(`إنشاء ${user.type}`, 'warning', `المستخدم موجود، تم تسجيل الدخول`, {
              uid: user.uid
            });
          } catch (loginError) {
            addResult(`إنشاء ${user.type}`, 'error', `فشل في إنشاء أو تسجيل دخول ${user.name}`, error);
          }
        } else {
          addResult(`إنشاء ${user.type}`, 'error', `فشل في إنشاء ${user.name}`, error);
        }
      }
    }

    return users;
  };

  // اختبار APIs
  const testAPIs = async () => {
    const apiTests = [
      { name: 'Signaling Status', url: '/api/signaling?action=status' },
      { name: 'Active Rooms', url: '/api/signaling?action=rooms' },
      { name: 'Active Users', url: '/api/signaling?action=users' }
    ];

    for (const test of apiTests) {
      try {
        addResult(`API: ${test.name}`, 'running', `اختبار ${test.url}...`);
        
        const response = await fetch(test.url);
        const data = await response.json();

        if (response.ok && data.success) {
          addResult(`API: ${test.name}`, 'success', 'يعمل بنجاح', data);
        } else {
          addResult(`API: ${test.name}`, 'error', 'فشل في الاستجابة', {
            status: response.status,
            data
          });
        }
      } catch (error) {
        addResult(`API: ${test.name}`, 'error', 'خطأ في الشبكة', error);
      }
    }
  };

  // اختبار تسجيل المستخدمين في النظام
  const testUserRegistration = async (users: TestUser[]) => {
    for (const user of users) {
      if (!user.uid) continue;

      try {
        addResult(`تسجيل ${user.type}`, 'running', `تسجيل ${user.name} في نظام المكالمات...`);

        const response = await fetch('/api/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register-user',
            data: {
              userId: user.uid,
              name: user.name
            }
          })
        });

        const data = await response.json();
        
        if (data.success) {
          addResult(`تسجيل ${user.type}`, 'success', `تم تسجيل ${user.name} بنجاح`, data);
        } else {
          addResult(`تسجيل ${user.type}`, 'error', `فشل تسجيل ${user.name}`, data);
        }
      } catch (error) {
        addResult(`تسجيل ${user.type}`, 'error', `خطأ في تسجيل ${user.name}`, error);
      }
    }
  };

  // اختبار إنشاء غرفة مكالمة
  const testCallRoom = async (users: TestUser[]) => {
    const student = users.find(u => u.type === 'student');
    const teacher = users.find(u => u.type === 'teacher');

    if (!student?.uid || !teacher?.uid) {
      addResult('إنشاء غرفة', 'error', 'لا يوجد مستخدمين صالحين للاختبار');
      return;
    }

    try {
      addResult('إنشاء غرفة', 'running', 'إنشاء غرفة مكالمة بين الطالب والمعلم...');

      const roomId = `test-room-${Date.now()}`;
      
      // إضافة الطالب للغرفة
      const studentResponse = await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join-room',
          data: {
            roomId,
            userId: student.uid,
            userName: student.name
          }
        })
      });

      const studentData = await studentResponse.json();
      
      if (studentData.success) {
        addResult('إنشاء غرفة', 'success', 'تم إضافة الطالب للغرفة', studentData);
        
        // إضافة المعلم للغرفة
        const teacherResponse = await fetch('/api/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join-room',
            data: {
              roomId,
              userId: teacher.uid,
              userName: teacher.name
            }
          })
        });

        const teacherData = await teacherResponse.json();
        
        if (teacherData.success) {
          addResult('إنشاء غرفة', 'success', 'تم إضافة المعلم للغرفة', {
            roomId,
            participants: teacherData.participantCount
          });
        } else {
          addResult('إنشاء غرفة', 'error', 'فشل إضافة المعلم للغرفة', teacherData);
        }
      } else {
        addResult('إنشاء غرفة', 'error', 'فشل إضافة الطالب للغرفة', studentData);
      }
    } catch (error) {
      addResult('إنشاء غرفة', 'error', 'خطأ في إنشاء الغرفة', error);
    }
  };

  // اختبار الكاميرا والميكروفون
  const testMediaDevices = async () => {
    try {
      addResult('أجهزة الوسائط', 'running', 'اختبار الوصول للكاميرا والميكروفون...');

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const audioDevices = devices.filter(d => d.kind === 'audioinput');

      addResult('أجهزة الوسائط', 'success', 'تم العثور على الأجهزة', {
        video: videoDevices.length,
        audio: audioDevices.length,
        devices: devices.map(d => ({ kind: d.kind, label: d.label }))
      });

      // اختبار الوصول الفعلي
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        addResult('إذن الوسائط', 'success', 'تم الحصول على إذن الكاميرا والميكروفون', {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        });

        // إيقاف الستريم
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        addResult('إذن الوسائط', 'error', 'فشل في الحصول على إذن الوسائط', error);
      }
    } catch (error) {
      addResult('أجهزة الوسائط', 'error', 'فشل في الوصول لأجهزة الوسائط', error);
    }
  };

  // تشغيل جميع الاختبارات
  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setFinalReport(null);

    const totalSteps = 6;
    let currentStep = 0;

    try {
      // الخطوة 1: إنشاء المستخدمين
      setCurrentTest('إنشاء المستخدمين التجريبيين');
      const users = await createTestUsers();
      setProgress(++currentStep / totalSteps * 100);

      // الخطوة 2: اختبار APIs
      setCurrentTest('اختبار APIs');
      await testAPIs();
      setProgress(++currentStep / totalSteps * 100);

      // الخطوة 3: اختبار تسجيل المستخدمين
      setCurrentTest('تسجيل المستخدمين في النظام');
      await testUserRegistration(users);
      setProgress(++currentStep / totalSteps * 100);

      // الخطوة 4: اختبار إنشاء غرفة
      setCurrentTest('اختبار إنشاء غرفة المكالمة');
      await testCallRoom(users);
      setProgress(++currentStep / totalSteps * 100);

      // الخطوة 5: اختبار أجهزة الوسائط
      setCurrentTest('اختبار الكاميرا والميكروفون');
      await testMediaDevices();
      setProgress(++currentStep / totalSteps * 100);

      // الخطوة 6: إنشاء التقرير النهائي
      setCurrentTest('إنشاء التقرير النهائي');
      const report = generateFinalReport();
      setFinalReport(report);
      setProgress(100);

      addResult('اكتمال الاختبار', 'success', 'تم الانتهاء من جميع الاختبارات بنجاح');

    } catch (error) {
      addResult('خطأ عام', 'error', 'فشل في تشغيل الاختبارات', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  // إنشاء التقرير النهائي
  const generateFinalReport = () => {
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;

    return {
      totalTests: results.length,
      successCount,
      errorCount,
      warningCount,
      successRate: Math.round((successCount / results.length) * 100),
      recommendations: generateRecommendations()
    };
  };

  // إنشاء التوصيات
  const generateRecommendations = () => {
    const recommendations = [];
    const errors = results.filter(r => r.status === 'error');

    if (errors.some(e => e.test.includes('API'))) {
      recommendations.push('مشكلة في APIs - تحقق من إعدادات Vercel Functions');
    }

    if (errors.some(e => e.test.includes('إنشاء'))) {
      recommendations.push('مشكلة في إنشاء المستخدمين - تحقق من إعدادات Firebase');
    }

    if (errors.some(e => e.test.includes('وسائط'))) {
      recommendations.push('مشكلة في الوسائط - تحقق من أذونات المتصفح');
    }

    if (recommendations.length === 0) {
      recommendations.push('النظام يعمل بشكل جيد! 🎉');
    }

    return recommendations;
  };

  // تشغيل الاختبار تلقائياً عند تحميل الصفحة
  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            🧪 نظام الاختبار التلقائي المتقدم
          </h1>
          <p className="text-gray-600">
            اختبار شامل لجميع وظائف نظام المكالمات مع تقرير مفصل
          </p>
        </div>

        {/* شريط التقدم */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">تقدم الاختبار</h2>
            <span className="text-2xl font-bold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {currentTest && (
            <p className="text-gray-600 text-center">
              {isRunning ? '🔄' : '✅'} {currentTest}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* سجل الاختبارات */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">سجل الاختبارات المباشر</h2>
            <div 
              ref={logRef}
              className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto"
            >
              {results.map((result, index) => (
                <div key={index} className="mb-2">
                  <span className="text-gray-500">[{result.timestamp}]</span>
                  <span className={`ml-2 ${
                    result.status === 'success' ? 'text-green-400' :
                    result.status === 'error' ? 'text-red-400' :
                    result.status === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {result.status === 'success' ? '✅' :
                     result.status === 'error' ? '❌' :
                     result.status === 'warning' ? '⚠️' : '🔄'}
                  </span>
                  <span className="ml-2 text-white">{result.test}:</span>
                  <span className="ml-2">{result.message}</span>
                </div>
              ))}
              {results.length === 0 && (
                <div className="text-center text-gray-500">
                  جاري بدء الاختبارات...
                </div>
              )}
            </div>
          </div>

          {/* التقرير النهائي */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">التقرير النهائي</h2>
            
            {finalReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {finalReport.successCount}
                    </div>
                    <div className="text-sm text-green-700">نجح</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {finalReport.errorCount}
                    </div>
                    <div className="text-sm text-red-700">فشل</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {finalReport.successRate}%
                  </div>
                  <div className="text-sm text-blue-700">معدل النجاح</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">التوصيات:</h3>
                  <ul className="space-y-1">
                    {finalReport.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                {isRunning ? 'جاري إنشاء التقرير...' : 'في انتظار اكتمال الاختبارات'}
              </div>
            )}
          </div>
        </div>

        {/* معلومات المستخدمين التجريبيين */}
        {testUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">المستخدمين التجريبيين</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testUsers.map((user, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">
                    {user.type === 'student' ? '👨‍🎓 طالب' : '👨‍🏫 معلم'}
                  </h3>
                  <div className="text-sm space-y-1">
                    <p><strong>الاسم:</strong> {user.name}</p>
                    <p><strong>البريد:</strong> {user.email}</p>
                    <p><strong>المعرف:</strong> {user.uid || 'غير متاح'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="text-center mt-6">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg text-lg font-semibold"
          >
            {isRunning ? '🔄 جاري الاختبار...' : '🧪 إعادة تشغيل الاختبارات'}
          </button>
        </div>
      </div>
    </div>
  );
}
