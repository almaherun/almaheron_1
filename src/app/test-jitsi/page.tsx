'use client';

import React, { useState } from 'react';
import JitsiVideoCall from '@/components/JitsiVideoCall';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Video, 
  Users, 
  Settings,
  TestTube,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function TestJitsiPage() {
  const { user } = useAuth();
  const [testMode, setTestMode] = useState<'setup' | 'call'>('setup');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserName, setTargetUserName] = useState('');
  const [callSubject, setCallSubject] = useState('اختبار نظام المكالمات الجديد');

  // بيانات اختبار افتراضية
  const testUsers = [
    { id: 'teacher1', name: 'الأستاذ أحمد محمد', role: 'معلم' },
    { id: 'teacher2', name: 'الأستاذة فاطمة علي', role: 'معلمة' },
    { id: 'student1', name: 'محمد عبدالله', role: 'طالب' },
    { id: 'student2', name: 'عائشة محمود', role: 'طالبة' },
  ];

  const handleStartTest = () => {
    if (targetUserId && targetUserName) {
      setTestMode('call');
    }
  };

  const handleBackToSetup = () => {
    setTestMode('setup');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">يجب تسجيل الدخول</h1>
          <p className="text-gray-600">يرجى تسجيل الدخول لاختبار نظام المكالمات</p>
        </div>
      </div>
    );
  }

  if (testMode === 'call') {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* شريط علوي */}
        <div className="bg-white/10 backdrop-blur-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TestTube className="w-6 h-6 text-white" />
            <h1 className="text-white font-bold">اختبار نظام المكالمات الجديد</h1>
          </div>
          <button
            onClick={handleBackToSetup}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
          >
            العودة للإعدادات
          </button>
        </div>

        {/* مكون المكالمة */}
        <div className="h-[calc(100vh-80px)]">
          <JitsiVideoCall
            targetUserId={targetUserId}
            targetUserName={targetUserName}
            callSubject={callSubject}
            autoStart={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* العنوان */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">اختبار نظام المكالمات الجديد</h1>
          </div>
          <p className="text-gray-600">نظام Jitsi Meet المجاني مع الرنين والإشعارات</p>
        </motion.div>

        {/* معلومات النظام */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            ميزات النظام الجديد
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Video className="w-5 h-5 text-green-600" />
              <span className="text-green-800">مكالمات فيديو عالية الجودة</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">نظام رنين وإشعارات</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800">دعم متعدد المشاركين</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Settings className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800">تحكم كامل في الإعدادات</span>
            </div>
          </div>
        </motion.div>

        {/* إعدادات الاختبار */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6">إعدادات الاختبار</h2>
          
          {/* معلومات المستخدم الحالي */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">معلوماتك:</h3>
            <p className="text-blue-700">الاسم: {user.displayName || 'غير محدد'}</p>
            <p className="text-blue-700">المعرف: {user.uid}</p>
          </div>

          {/* اختيار المستخدم المستهدف */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر مستخدم للاتصال به:
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              {testUsers.map((testUser) => (
                <motion.button
                  key={testUser.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setTargetUserId(testUser.id);
                    setTargetUserName(testUser.name);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    targetUserId === testUser.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{testUser.name}</p>
                    <p className="text-sm text-gray-600">{testUser.role}</p>
                    <p className="text-xs text-gray-500">ID: {testUser.id}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* إعدادات إضافية */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              موضوع المكالمة:
            </label>
            <input
              type="text"
              value={callSubject}
              onChange={(e) => setCallSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل موضوع المكالمة..."
            />
          </div>

          {/* زر البدء */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartTest}
            disabled={!targetUserId || !targetUserName}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
              targetUserId && targetUserName
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Video className="w-5 h-5" />
              بدء اختبار المكالمة
            </div>
          </motion.button>
        </motion.div>

        {/* تعليمات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <h3 className="font-semibold text-yellow-800 mb-2">تعليمات الاختبار:</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• اختر مستخدم من القائمة أعلاه</li>
            <li>• اضغط "بدء اختبار المكالمة"</li>
            <li>• سيتم إنشاء غرفة مكالمة جديدة</li>
            <li>• يمكنك اختبار جميع الميزات (صوت، فيديو، إنهاء)</li>
            <li>• النظام يدعم المكالمات المجانية بدون حدود</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
