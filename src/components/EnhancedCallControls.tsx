'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MessageCircle, 
  Star,
  BookOpen,
  MoreVertical,
  Maximize,
  Minimize,
  Settings,
  Volume2,
  VolumeX,
  ScreenShare,
  ScreenShareOff,
  Camera,
  CameraOff,
  Users,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

interface EnhancedCallControlsProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeakerEnabled?: boolean;
  isScreenSharing?: boolean;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'disconnected';
  callDuration: number;
  participantCount?: number;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleSpeaker?: () => void;
  onToggleScreenShare?: () => void;
  onEndCall: () => void;
  onOpenChat: () => void;
  onOpenQuran: () => void;
  onOpenSettings?: () => void;
  onRateCall?: () => void;
}

export default function EnhancedCallControls({
  isVideoEnabled,
  isAudioEnabled,
  isSpeakerEnabled = true,
  isScreenSharing = false,
  connectionQuality = 'good',
  callDuration,
  participantCount = 2,
  onToggleVideo,
  onToggleAudio,
  onToggleSpeaker,
  onToggleScreenShare,
  onEndCall,
  onOpenChat,
  onOpenQuran,
  onOpenSettings,
  onRateCall
}: EnhancedCallControlsProps) {
  const [showMoreControls, setShowMoreControls] = useState(false);

  // تنسيق وقت المكالمة
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // أيقونة جودة الاتصال
  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'good':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <Wifi className="w-4 h-4 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* شريط المعلومات العلوي */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/20 backdrop-blur-md text-white px-6 py-2"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">{participantCount}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-sm capitalize">{connectionQuality}</span>
            </div>
          </div>

          <div className="text-sm text-white/70">
            🕌 أكاديمية المحرون - درس مباشر
          </div>
        </div>
      </motion.div>

      {/* أدوات التحكم الرئيسية */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/10 backdrop-blur-xl border-t border-white/20 px-6 py-4"
      >
        <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
          
          {/* زر الميكروفون */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleAudio}
            className={`control-button ${isAudioEnabled ? 'active' : 'danger'}`}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </motion.button>

          {/* زر الكاميرا */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleVideo}
            className={`control-button ${isVideoEnabled ? 'active' : 'danger'}`}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </motion.button>

          {/* زر مشاركة الشاشة */}
          {onToggleScreenShare && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleScreenShare}
              className={`control-button ${isScreenSharing ? 'active' : ''}`}
            >
              {isScreenSharing ? <ScreenShareOff className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}
            </motion.button>
          )}

          {/* زر السماعة */}
          {onToggleSpeaker && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleSpeaker}
              className={`control-button ${isSpeakerEnabled ? 'active' : ''}`}
            >
              {isSpeakerEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </motion.button>
          )}

          {/* زر الدردشة */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onOpenChat}
            className="control-button"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>

          {/* زر المصحف */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onOpenQuran}
            className="control-button"
          >
            <BookOpen className="w-6 h-6" />
          </motion.button>

          {/* زر المزيد */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMoreControls(!showMoreControls)}
            className="control-button"
          >
            <MoreVertical className="w-6 h-6" />
          </motion.button>

          {/* زر إنهاء المكالمة */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEndCall}
            className="control-button danger w-16 h-16"
          >
            <PhoneOff className="w-8 h-8" />
          </motion.button>
        </div>

        {/* أدوات التحكم الإضافية */}
        <AnimatePresence>
          {showMoreControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/20"
            >
              {onOpenSettings && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onOpenSettings}
                  className="control-button"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              )}

              {onRateCall && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onRateCall}
                  className="control-button"
                >
                  <Star className="w-5 h-5" />
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="control-button"
              >
                <Maximize className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
