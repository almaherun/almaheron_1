'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video,
  Search,
  X,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  timestamp: Date;
  isRead: boolean;
  replyTo?: string;
}

interface ChatInterfaceProps {
  chatId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  recipientName: string;
  recipientAvatar?: string;
  recipientStatus?: 'online' | 'offline' | 'typing';
  messages: Message[];
  isMinimized?: boolean;
  onSendMessage: (content: string, type: 'text' | 'image' | 'file' | 'audio') => void;
  onStartCall?: () => void;
  onStartVideoCall?: () => void;
  onToggleMinimize?: () => void;
  onClose?: () => void;
  onTyping?: (isTyping: boolean) => void;
}

export default function ChatInterface({
  chatId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  recipientName,
  recipientAvatar,
  recipientStatus = 'offline',
  messages,
  isMinimized = false,
  onSendMessage,
  onStartCall,
  onStartVideoCall,
  onToggleMinimize,
  onClose,
  onTyping
}: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // التمرير إلى آخر رسالة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // معالجة الكتابة
  const handleTyping = (text: string) => {
    setMessageText(text);
    
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // إلغاء المؤقت السابق
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // إعداد مؤقت جديد
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1000);
  };

  // إرسال الرسالة
  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim(), 'text');
      setMessageText('');
      setIsTyping(false);
      onTyping?.(false);
      
      // تشغيل صوت الإرسال
      if (soundEnabled) {
        // يمكن إضافة صوت هنا
      }
    }
  };

  // معالجة الضغط على Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // إضافة إيموجي
  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 cursor-pointer"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-3">
          {recipientAvatar ? (
            <img src={recipientAvatar} alt={recipientName} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
              {recipientName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{recipientName}</h3>
            <p className="text-sm text-gray-500">
              {recipientStatus === 'typing' ? 'يكتب...' : 
               recipientStatus === 'online' ? 'متصل' : 'غير متصل'}
            </p>
          </div>
          {messages.filter(m => !m.isRead && m.senderId !== currentUserId).length > 0 && (
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
              {messages.filter(m => !m.isRead && m.senderId !== currentUserId).length}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
    >
      {/* رأس الدردشة */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {recipientAvatar ? (
              <img src={recipientAvatar} alt={recipientName} className="w-10 h-10 rounded-full border-2 border-white/30" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                {recipientName.charAt(0)}
              </div>
            )}
            {recipientStatus === 'online' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{recipientName}</h3>
            <p className="text-sm text-white/80">
              {recipientStatus === 'typing' ? (
                <span className="flex items-center gap-1">
                  يكتب
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ...
                  </motion.span>
                </span>
              ) : recipientStatus === 'online' ? 'متصل الآن' : 'آخر ظهور منذ قليل'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onStartCall && (
            <button
              onClick={onStartCall}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <Phone className="w-5 h-5" />
            </button>
          )}
          
          {onStartVideoCall && (
            <button
              onClick={onStartVideoCall}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <Video className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* منطقة الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              showAvatar={message.senderId !== currentUserId}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* منطقة الكتابة */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالة..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              dir="rtl"
            />
            
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Smile className="w-5 h-5 text-gray-500" />
              </button>
              
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Paperclip className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* منتقي الإيموجي */}
        <AnimatePresence>
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </AnimatePresence>

        {/* رفع الملفات */}
        <AnimatePresence>
          {showFileUpload && (
            <FileUpload
              onFileSelect={(file, type) => {
                // معالجة رفع الملف
                console.log('File selected:', file, type);
                setShowFileUpload(false);
              }}
              onClose={() => setShowFileUpload(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
