'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Monitor,
  MonitorOff,
  MessageCircle,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MoreVertical
} from 'lucide-react';

interface ActiveCallScreenProps {
  recipientName: string;
  recipientAvatar?: string;
  duration: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  onOpenChat?: () => void;
  connectionQuality?: 'excellent' | 'good' | 'poor';
}

export default function ActiveCallScreen({
  recipientName,
  recipientAvatar,
  duration,
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  localVideoRef,
  remoteVideoRef,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onEndCall,
  onOpenChat,
  connectionQuality = 'good'
}: ActiveCallScreenProps) {
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showControls]);

  const handleScreenClick = () => {
    setShowControls(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div 
      className="relative w-full h-screen bg-gray-900 overflow-hidden cursor-pointer"
      onClick={handleScreenClick}
    >
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <VideoOff className="w-6 h-6 text-white/60" />
          </div>
        )}
      </div>

      {/* Call Info */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 text-white"
          >
            <div className="flex items-center space-x-3">
              {recipientAvatar && (
                <img
                  src={recipientAvatar}
                  alt={recipientName}
                  className="w-10 h-10 rounded-full border-2 border-white/20"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{recipientName}</h3>
                <div className="flex items-center space-x-2 text-sm text-white/70">
                  <span>{duration}</span>
                  <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`} />
                  <span className="capitalize">{connectionQuality}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-md rounded-full px-6 py-4">
              {/* Audio Toggle */}
              <button
                onClick={onToggleAudio}
                className={`p-3 rounded-full transition-all ${
                  isAudioEnabled 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {/* Video Toggle */}
              <button
                onClick={onToggleVideo}
                className={`p-3 rounded-full transition-all ${
                  isVideoEnabled 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              {/* Screen Share */}
              <button
                onClick={onToggleScreenShare}
                className={`p-3 rounded-full transition-all ${
                  isScreenSharing 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {isScreenSharing ? <Monitor className="w-6 h-6" /> : <MonitorOff className="w-6 h-6" />}
              </button>

              {/* Chat */}
              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
              )}

              {/* End Call */}
              <button
                onClick={onEndCall}
                className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Additional Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-1/2 right-4 transform -translate-y-1/2"
          >
            <div className="flex flex-col space-y-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap to show controls hint */}
      {!showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm"
        >
          اضغط لإظهار الأزرار
        </motion.div>
      )}
    </div>
  );
}
