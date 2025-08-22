'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  User,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
  MoreVertical,
  Pin,
  PinOff
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking?: boolean;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'disconnected';
}

interface EnhancedVideoDisplayProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  localParticipant: Participant;
  remoteParticipant: Participant;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onPinParticipant?: (participantId: string) => void;
  pinnedParticipant?: string;
}

export default function EnhancedVideoDisplay({
  localVideoRef,
  remoteVideoRef,
  localParticipant,
  remoteParticipant,
  isFullscreen = false,
  onToggleFullscreen,
  onPinParticipant,
  pinnedParticipant
}: EnhancedVideoDisplayProps) {
  const [showControls, setShowControls] = useState(true);
  const [localVideoSize, setLocalVideoSize] = useState<'small' | 'medium' | 'large'>('small');
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // إخفاء أدوات التحكم تلقائياً
  useEffect(() => {
    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    resetTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseMove = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // مكون عرض المشارك
  const ParticipantVideo = ({ 
    participant, 
    videoRef, 
    isLocal = false, 
    className = "" 
  }: { 
    participant: Participant; 
    videoRef: React.RefObject<HTMLVideoElement>; 
    isLocal?: boolean;
    className?: string;
  }) => (
    <div className={`relative video-container ${className}`}>
      {/* الفيديو */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover bg-gray-900"
        style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
      />

      {/* طبقة عدم وجود فيديو */}
      {!participant.isVideoEnabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
          <div className="text-center text-white">
            {participant.avatar ? (
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-white/20 flex items-center justify-center">
                <User className="w-12 h-12 text-white/70" />
              </div>
            )}
            <h3 className="text-xl font-semibold">{participant.name}</h3>
            <p className="text-white/70 text-sm mt-1">الكاميرا مغلقة</p>
          </div>
        </div>
      )}

      {/* معلومات المشارك */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <div className="bg-black/50 backdrop-blur-md rounded-lg px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{participant.name}</span>
                {participant.isSpeaking && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* حالة الميكروفون */}
                {participant.isAudioEnabled ? (
                  <Mic className="w-4 h-4 text-green-400" />
                ) : (
                  <MicOff className="w-4 h-4 text-red-400" />
                )}
                
                {/* حالة الكاميرا */}
                {participant.isVideoEnabled ? (
                  <Video className="w-4 h-4 text-green-400" />
                ) : (
                  <VideoOff className="w-4 h-4 text-red-400" />
                )}
                
                {/* جودة الاتصال */}
                {participant.connectionQuality === 'excellent' && (
                  <Wifi className="w-4 h-4 text-green-400" />
                )}
                {participant.connectionQuality === 'good' && (
                  <Wifi className="w-4 h-4 text-yellow-400" />
                )}
                {participant.connectionQuality === 'poor' && (
                  <Wifi className="w-4 h-4 text-red-400" />
                )}
                {participant.connectionQuality === 'disconnected' && (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* أدوات التحكم في الفيديو */}
      <AnimatePresence>
        {showControls && !isLocal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 right-4 flex gap-2"
          >
            {onPinParticipant && (
              <button
                onClick={() => onPinParticipant(participant.id)}
                className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                  pinnedParticipant === participant.id
                    ? 'bg-green-500/80 text-white'
                    : 'bg-black/50 text-white/70 hover:text-white'
                }`}
              >
                {pinnedParticipant === participant.id ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </button>
            )}
            
            <button className="p-2 rounded-full bg-black/50 text-white/70 hover:text-white backdrop-blur-md transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* الفيديو الرئيسي (المشارك البعيد) */}
      <ParticipantVideo
        participant={remoteParticipant}
        videoRef={remoteVideoRef}
        className="w-full h-full"
      />

      {/* الفيديو المحلي (صورة في صورة) */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={{
          top: 20,
          left: 20,
          right: window.innerWidth - 220,
          bottom: window.innerHeight - 180
        }}
        className={`absolute top-4 right-4 z-10 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 cursor-move ${
          localVideoSize === 'small' ? 'w-48 h-32' :
          localVideoSize === 'medium' ? 'w-64 h-48' : 'w-80 h-60'
        }`}
        whileHover={{ scale: 1.02 }}
      >
        <ParticipantVideo
          participant={localParticipant}
          videoRef={localVideoRef}
          isLocal={true}
          className="w-full h-full"
        />
        
        {/* أدوات التحكم في الفيديو المحلي */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 right-2 flex gap-1"
            >
              <button
                onClick={() => {
                  const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
                  const currentIndex = sizes.indexOf(localVideoSize);
                  const nextIndex = (currentIndex + 1) % sizes.length;
                  setLocalVideoSize(sizes[nextIndex]);
                }}
                className="p-1 rounded bg-black/50 text-white/70 hover:text-white backdrop-blur-md transition-colors"
              >
                <Maximize className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* أدوات التحكم في الشاشة الكاملة */}
      <AnimatePresence>
        {showControls && onToggleFullscreen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onToggleFullscreen}
            className="absolute top-4 left-4 p-3 rounded-full bg-black/50 text-white/70 hover:text-white backdrop-blur-md transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* مؤشر التحميل */}
      {(!remoteParticipant.isVideoEnabled && remoteParticipant.connectionQuality === 'disconnected') && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full"
            />
            <p className="text-lg">جاري الاتصال...</p>
          </div>
        </div>
      )}
    </div>
  );
}
