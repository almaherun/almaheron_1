'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Globe,
  Shield,
  Users,
  Zap
} from 'lucide-react';

// قائمة الخوادم المجانية
const FREE_SERVERS = [
  {
    domain: 'meet.jit.si',
    name: 'Jitsi Meet الرسمي',
    description: 'الخادم الرسمي المجاني من Jitsi',
    features: ['مجاني 100%', 'مستقر', 'سريع'],
    location: 'عالمي',
    maxParticipants: 'غير محدود'
  },
  {
    domain: '8x8.vc',
    name: '8x8 Video Meetings',
    description: 'خادم مجاني من شركة 8x8',
    features: ['مجاني', 'جودة عالية', 'موثوق'],
    location: 'أمريكا',
    maxParticipants: '100'
  },
  {
    domain: 'jitsi.riot.im',
    name: 'Riot Jitsi',
    description: 'خادم مجتمعي مجاني',
    features: ['مجاني', 'مفتوح المصدر', 'مجتمعي'],
    location: 'أوروبا',
    maxParticipants: '50'
  },
  {
    domain: 'meet.ffmuc.net',
    name: 'Freifunk München',
    description: 'خادم ألماني مجاني',
    features: ['مجاني', 'خصوصية عالية', 'أوروبي'],
    location: 'ألمانيا',
    maxParticipants: '25'
  }
];

interface ServerStatus {
  domain: string;
  status: 'checking' | 'online' | 'offline';
  responseTime?: number;
}

interface FreeServerSelectorProps {
  onServerSelect: (domain: string) => void;
  selectedServer?: string;
}

export default function FreeServerSelector({ onServerSelect, selectedServer }: FreeServerSelectorProps) {
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // فحص حالة الخوادم
  const checkServerStatus = async (domain: string): Promise<ServerStatus> => {
    const startTime = Date.now();
    
    try {
      // محاولة الوصول للخادم
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000) // timeout بعد 5 ثواني
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        domain,
        status: 'online',
        responseTime
      };
    } catch (error) {
      return {
        domain,
        status: 'offline'
      };
    }
  };

  // فحص جميع الخوادم
  const checkAllServers = async () => {
    setIsChecking(true);
    
    // تعيين حالة "جاري الفحص" لجميع الخوادم
    setServerStatuses(FREE_SERVERS.map(server => ({
      domain: server.domain,
      status: 'checking' as const
    })));

    // فحص الخوادم بشكل متوازي
    const promises = FREE_SERVERS.map(server => checkServerStatus(server.domain));
    const results = await Promise.all(promises);
    
    setServerStatuses(results);
    setIsChecking(false);
  };

  // فحص الخوادم عند التحميل
  useEffect(() => {
    checkAllServers();
  }, []);

  const getStatusIcon = (status: ServerStatus['status']) => {
    switch (status) {
      case 'checking':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: ServerStatus['status'], responseTime?: number) => {
    switch (status) {
      case 'checking':
        return 'جاري الفحص...';
      case 'online':
        return responseTime ? `متاح (${responseTime}ms)` : 'متاح';
      case 'offline':
        return 'غير متاح';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-600" />
            اختيار خادم مجاني
          </h2>
          <p className="text-gray-600 mt-1">
            جميع الخوادم مجانية 100% ولا تحتاج بطاقة ائتمان
          </p>
        </div>
        
        <button
          onClick={checkAllServers}
          disabled={isChecking}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {isChecking ? 'جاري الفحص...' : 'فحص الخوادم'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FREE_SERVERS.map((server) => {
          const status = serverStatuses.find(s => s.domain === server.domain);
          const isSelected = selectedServer === server.domain;
          const isOnline = status?.status === 'online';
          
          return (
            <motion.div
              key={server.domain}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : isOnline 
                    ? 'border-green-200 hover:border-green-300' 
                    : 'border-gray-200 opacity-60'
              }`}
              onClick={() => isOnline && onServerSelect(server.domain)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{server.name}</h3>
                  <p className="text-sm text-gray-600">{server.domain}</p>
                </div>
                {getStatusIcon(status?.status || 'checking')}
              </div>

              <p className="text-sm text-gray-700 mb-3">{server.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">الموقع: {server.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">المشاركين: {server.maxParticipants}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {getStatusText(status?.status || 'checking', status?.responseTime)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {server.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {isSelected && (
                <div className="mt-3 p-2 bg-blue-100 border border-blue-200 rounded text-sm text-blue-800">
                  ✅ تم اختيار هذا الخادم
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">💡 معلومات مهمة:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• جميع الخوادم مجانية تماماً ولا تحتاج تسجيل</li>
          <li>• لا حاجة لبطاقة ائتمان أو فيزا</li>
          <li>• يمكن تغيير الخادم في أي وقت</li>
          <li>• الخوادم الخضراء متاحة والحمراء غير متاحة</li>
        </ul>
      </div>
    </div>
  );
}
