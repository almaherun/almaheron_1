'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Image, 
  FileText, 
  Music, 
  Video, 
  X, 
  Camera,
  Mic,
  MicOff
} from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File, type: 'image' | 'file' | 'audio') => void;
  onClose: () => void;
}

export default function FileUpload({ onFileSelect, onClose }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // معالجة رفع الملفات العامة
  const handleFileUpload = (type: 'image' | 'file') => {
    const input = type === 'image' ? imageInputRef.current : fileInputRef.current;
    input?.click();
  };

  // معالجة اختيار الملف
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file, type);
    }
  };

  // بدء تسجيل الصوت
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
        onFileSelect(file, 'audio');
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // عداد الوقت
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // إيقاف التسجيل تلقائياً بعد دقيقتين
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording(false);
          setRecordingTime(0);
          clearInterval(timer);
        }
      }, 120000);

    } catch (error) {
      console.error('خطأ في الوصول للميكروفون:', error);
      alert('لا يمكن الوصول للميكروفون. تأكد من السماح بالوصول.');
    }
  };

  // إيقاف تسجيل الصوت
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // تنسيق وقت التسجيل
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
    >
      {/* رأس رفع الملفات */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">إرسال ملف</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* خيارات رفع الملفات */}
      <div className="p-4 space-y-3">
        
        {/* رفع صورة */}
        <button
          onClick={() => handleFileUpload('image')}
          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-right"
          dir="rtl"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Image className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">صورة</p>
            <p className="text-sm text-gray-500">JPG, PNG, GIF</p>
          </div>
        </button>

        {/* رفع ملف */}
        <button
          onClick={() => handleFileUpload('file')}
          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-right"
          dir="rtl"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">ملف</p>
            <p className="text-sm text-gray-500">PDF, DOC, TXT</p>
          </div>
        </button>

        {/* تسجيل صوتي */}
        <div className="border-t border-gray-200 pt-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-right"
              dir="rtl"
            >
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">تسجيل صوتي</p>
                <p className="text-sm text-gray-500">اضغط للبدء</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-900">جاري التسجيل...</p>
                <p className="text-sm text-red-600">{formatTime(recordingTime)}</p>
              </div>
              <button
                onClick={stopRecording}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <MicOff className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* معلومات إضافية */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
          الحد الأقصى لحجم الملف: 10 ميجابايت
        </div>
      </div>

      {/* مدخلات الملفات المخفية */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'image')}
        className="hidden"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        onChange={(e) => handleFileChange(e, 'file')}
        className="hidden"
      />
    </motion.div>
  );
}
