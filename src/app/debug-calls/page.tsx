'use client';

import React, { useState, useEffect } from 'react';
import { JitsiDebugUtils } from '@/lib/jitsi-manager';
import JitsiVideoCall from '@/components/JitsiVideoCall';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Bug,
  Download,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Phone,
  Video,
  Mic,
  Camera,
  Wifi,
  Shield
} from 'lucide-react';

export default function DebugCallsPage() {
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testMode, setTestMode] = useState<'diagnosis' | 'call'>('diagnosis');

  // فحص حالة النظام عند التحميل
  useEffect(() => {
    handleCheckSystem();
    handleRefreshLogs();
  }, []);

  const handleCheckSystem = async () => {
    setIsLoading(true);
    try {
      const status = await JitsiDebugUtils.checkSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('خطأ في فحص النظام:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshLogs = () => {
    const logs = JitsiDebugUtils?.getDebugLogs?.() || [];
    setDebugLogs(logs);
  };

  const handleExportLogs = () => {
    JitsiDebugUtils.exportLogs();
  };

  const handleClearLogs = () => {
    JitsiDebugUtils.clearLogs();
    setDebugLogs([]);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 bg-red-900/20';
      case 'WARN': return 'text-yellow-400 bg-yellow-900/20';
      case 'INFO': return 'text-blue-400 bg-blue-900/20';
      case 'DEBUG': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">يجب تسجيل الدخول</h1>
          <p className="text-gray-400">يرجى تسجيل الدخول للوصول إلى أدوات التشخيص</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Bug className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">🔍 تشخيص نظام المكالمات</h1>
          </motion.div>
          <p className="text-gray-400">أدوات متقدمة لتشخيص وحل مشاكل المكالمات</p>
        </div>

        {/* أزرار التبديل */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setTestMode('diagnosis')}
              className={`px-6 py-2 rounded-md transition-all ${
                testMode === 'diagnosis'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              التشخيص
            </button>
            <button
              onClick={() => setTestMode('call')}
              className={`px-6 py-2 rounded-md transition-all ${
                testMode === 'call'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              اختبار المكالمة
            </button>
          </div>
        </div>

        {testMode === 'diagnosis' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* لوحة التحكم */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                أدوات التحكم
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCheckSystem}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg flex items-center gap-2 justify-center"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  فحص النظام
                </button>

                <button
                  onClick={handleRefreshLogs}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 justify-center"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث السجلات
                </button>

                <button
                  onClick={handleExportLogs}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 justify-center"
                >
                  <Download className="w-4 h-4" />
                  تصدير السجلات
                </button>

                <button
                  onClick={handleClearLogs}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح السجلات
                </button>
              </div>
            </motion.div>

            {/* حالة النظام */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                حالة النظام
              </h2>

              {systemStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      الاتصال بالإنترنت
                    </span>
                    {getStatusIcon(systemStatus.online)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      HTTPS آمن
                    </span>
                    {getStatusIcon(systemStatus.https)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      دعم WebRTC
                    </span>
                    {getStatusIcon(systemStatus.webrtc)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Jitsi API
                    </span>
                    {getStatusIcon(systemStatus.jitsiAPI)}
                  </div>

                  {systemStatus.devices && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          الكاميرات
                        </span>
                        <span className="text-white">{systemStatus.devices.video || 0}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 flex items-center gap-2">
                          <Mic className="w-4 h-4" />
                          الميكروفونات
                        </span>
                        <span className="text-white">{systemStatus.devices.audio || 0}</span>
                      </div>
                    </>
                  )}

                  <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                    <div className="text-xs text-gray-400">
                      <div>المتصفح: {systemStatus.browser?.split(' ')[0] || 'غير معروف'}</div>
                      <div>الوقت: {new Date(systemStatus.timestamp).toLocaleString('ar')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                  <p>اضغط "فحص النظام" للبدء</p>
                </div>
              )}
            </motion.div>

            {/* السجلات */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Bug className="w-5 h-5" />
                السجلات المفصلة ({debugLogs.length})
              </h2>

              <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {debugLogs.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Info className="w-12 h-12 mx-auto mb-2" />
                    <p>لا توجد سجلات متاحة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {debugLogs.slice(-50).map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-sm ${getLogLevelColor(log.level)}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-500 min-w-[80px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="font-mono text-xs min-w-[60px]">
                            [{log.level}]
                          </span>
                          <span className="flex-1">{log.message}</span>
                        </div>
                        {log.data && (
                          <div className="mt-1 ml-24 text-xs text-gray-400 font-mono">
                            {JSON.stringify(log.data, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          /* اختبار المكالمة */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              اختبار المكالمة المباشر
            </h2>

            <div className="h-[600px]">
              <JitsiVideoCall
                targetUserId="test-user"
                targetUserName="مستخدم تجريبي"
                callSubject="اختبار نظام المكالمات"
                autoStart={false}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

