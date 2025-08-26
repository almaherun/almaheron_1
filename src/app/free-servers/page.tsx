'use client';

import React, { useState } from 'react';
import FreeServerSelector from '@/components/FreeServerSelector';
import JitsiVideoCall from '@/components/JitsiVideoCall';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  CreditCard, 
  X, 
  CheckCircle,
  Server,
  Phone
} from 'lucide-react';

export default function FreeServersPage() {
  const { user } = useAuth();
  const [selectedServer, setSelectedServer] = useState<string>('meet.jit.si');
  const [showCallTest, setShowCallTest] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* العنوان */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="relative">
              <Server className="w-8 h-8 text-green-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">خوادم مجانية 100%</h1>
          </motion.div>
          <p className="text-gray-600 text-lg">
            مكالمات فيديو مجانية تماماً بدون فيزا أو تسجيل
          </p>
        </div>

        {/* مميزات الخدمة المجانية */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            لماذا خدمتنا مجانية تماماً؟
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-8 h-8 text-green-600" />
                <X className="w-4 h-4 text-red-500 absolute ml-6 -mt-2" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">بدون فيزا</h3>
              <p className="text-sm text-gray-600">
                لا نحتاج بطاقة ائتمان أو أي معلومات دفع
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Server className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">خوادم مجانية</h3>
              <p className="text-sm text-gray-600">
                نستخدم خوادم Jitsi المجانية المفتوحة المصدر
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">مجاني للأبد</h3>
              <p className="text-sm text-gray-600">
                الخدمة مجانية تماماً ولن نطلب دفع أي رسوم
              </p>
            </div>
          </div>
        </motion.div>

        {/* اختيار الخادم */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <FreeServerSelector
            selectedServer={selectedServer}
            onServerSelect={setSelectedServer}
          />
        </motion.div>

        {/* أزرار التحكم */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 mb-8"
        >
          <button
            onClick={() => setShowCallTest(!showCallTest)}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Phone className="w-5 h-5" />
            {showCallTest ? 'إخفاء اختبار المكالمة' : 'اختبار المكالمة'}
          </button>

          {!user && (
            <a
              href="/auth"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              تسجيل الدخول
              <ArrowRight className="w-5 h-5" />
            </a>
          )}
        </motion.div>

        {/* اختبار المكالمة */}
        <AnimatePresence>
          {showCallTest && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Phone className="w-6 h-6 text-green-600" />
                اختبار المكالمة على الخادم: {selectedServer}
              </h2>
              
              {user ? (
                <div className="h-[600px]">
                  <JitsiVideoCall
                    targetUserId="test-user"
                    targetUserName="مستخدم تجريبي"
                    callSubject={`اختبار على ${selectedServer}`}
                    autoStart={false}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    يجب تسجيل الدخول
                  </h3>
                  <p className="text-gray-600 mb-4">
                    سجل دخول مجاني لاختبار المكالمات
                  </p>
                  <a
                    href="/auth"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2"
                  >
                    تسجيل الدخول المجاني
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* معلومات إضافية */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-3">🌟 مميزات الخدمة</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✅ مكالمات فيديو عالية الجودة</li>
              <li>✅ عدد غير محدود من المشاركين</li>
              <li>✅ مشاركة الشاشة</li>
              <li>✅ تسجيل المكالمات</li>
              <li>✅ دردشة نصية</li>
              <li>✅ حماية بكلمة مرور</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-3">🔒 الأمان والخصوصية</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>🔐 تشفير end-to-end</li>
              <li>🛡️ لا نحفظ بياناتك</li>
              <li>🌍 خوادم موزعة عالمياً</li>
              <li>📱 يعمل على جميع الأجهزة</li>
              <li>🔓 مفتوح المصدر</li>
              <li>⚡ سرعة عالية</li>
            </ul>
          </div>
        </motion.div>

        {/* روابط مفيدة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-gray-50 rounded-lg p-6"
        >
          <h3 className="font-bold text-gray-800 mb-3">🔗 روابط مفيدة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <a 
              href="/debug-calls" 
              className="bg-blue-600 text-white px-3 py-2 rounded text-center hover:bg-blue-700 transition-colors text-sm"
            >
              🔍 تشخيص المكالمات
            </a>
            <a 
              href="/test-buttons" 
              className="bg-green-600 text-white px-3 py-2 rounded text-center hover:bg-green-700 transition-colors text-sm"
            >
              🧪 اختبار الأزرار
            </a>
            <a 
              href="/test-call" 
              className="bg-purple-600 text-white px-3 py-2 rounded text-center hover:bg-purple-700 transition-colors text-sm"
            >
              📞 اختبار المكالمة
            </a>
            <a 
              href="/auth" 
              className="bg-orange-600 text-white px-3 py-2 rounded text-center hover:bg-orange-700 transition-colors text-sm"
            >
              👤 تسجيل الدخول
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
