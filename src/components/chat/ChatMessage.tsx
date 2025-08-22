'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  CheckCheck, 
  Reply, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Edit3,
  Download,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

export default function ChatMessage({
  message,
  isOwn,
  showAvatar = true,
  onReply,
  onEdit,
  onDelete
}: ChatMessageProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onDelete?.(message.id);
    setShowMenu(false);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        if (isEditing && isOwn) {
          return (
            <div className="space-y-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                onBlur={handleEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                dir="rtl"
                autoFocus
              />
            </div>
          );
        }
        return (
          <p className="text-sm leading-relaxed whitespace-pre-wrap" dir="rtl">
            {message.content}
          </p>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={message.content}
              alt="صورة مرسلة"
              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.content, '_blank')}
            />
            {message.content !== message.content && (
              <p className="text-sm text-gray-600" dir="rtl">{message.content}</p>
            )}
          </div>
        );

      case 'file':
        const fileName = message.content.split('/').pop() || 'ملف';
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{fileName}</p>
              <p className="text-xs text-gray-500">انقر للتحميل</p>
            </div>
            <button
              onClick={() => window.open(message.content, '_blank')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg min-w-[200px]">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-1" />
              )}
            </button>
            <div className="flex-1">
              <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full w-1/3"></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">0:15 / 0:45</p>
            </div>
            <Volume2 className="w-4 h-4 text-gray-500" />
          </div>
        );

      case 'system':
        return (
          <p className="text-xs text-gray-500 text-center italic" dir="rtl">
            {message.content}
          </p>
        );

      default:
        return null;
    }
  };

  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-4"
      >
        <div className="bg-gray-200 px-4 py-2 rounded-full">
          {renderMessageContent()}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}
    >
      {/* الصورة الشخصية */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">
              {message.senderName.charAt(0)}
            </div>
          )}
        </div>
      )}

      {/* محتوى الرسالة */}
      <div className={`flex-1 max-w-xs ${isOwn ? 'flex flex-col items-end' : ''}`}>
        {/* اسم المرسل */}
        {!isOwn && showAvatar && (
          <p className="text-xs text-gray-500 mb-1 px-1">{message.senderName}</p>
        )}

        {/* فقاعة الرسالة */}
        <div className="relative">
          <div
            className={`px-4 py-3 rounded-2xl relative ${
              isOwn
                ? 'bg-green-500 text-white rounded-br-md'
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
            } shadow-sm`}
          >
            {renderMessageContent()}

            {/* قائمة الخيارات */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute top-0 ${isOwn ? 'left-0' : 'right-0'} mt-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]`}
              >
                <button
                  onClick={() => onReply?.(message.id)}
                  className="w-full px-3 py-2 text-right text-sm hover:bg-gray-100 flex items-center gap-2"
                  dir="rtl"
                >
                  <Reply className="w-4 h-4" />
                  رد
                </button>
                
                <button
                  onClick={handleCopy}
                  className="w-full px-3 py-2 text-right text-sm hover:bg-gray-100 flex items-center gap-2"
                  dir="rtl"
                >
                  <Copy className="w-4 h-4" />
                  نسخ
                </button>

                {isOwn && message.type === 'text' && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full px-3 py-2 text-right text-sm hover:bg-gray-100 flex items-center gap-2"
                    dir="rtl"
                  >
                    <Edit3 className="w-4 h-4" />
                    تعديل
                  </button>
                )}

                {isOwn && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-right text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                    dir="rtl"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* زر القائمة */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`absolute top-1/2 transform -translate-y-1/2 ${
              isOwn ? '-left-8' : '-right-8'
            } opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-full`}
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* الوقت وحالة القراءة */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(message.timestamp, { 
              addSuffix: true, 
              locale: ar 
            })}
          </span>
          
          {isOwn && (
            <div className="flex items-center">
              {message.isRead ? (
                <CheckCheck className="w-4 h-4 text-blue-500" />
              ) : (
                <Check className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* مساحة فارغة للتوازن */}
      {isOwn && <div className="w-8"></div>}
    </motion.div>
  );
}
