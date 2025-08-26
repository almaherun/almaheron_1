'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, Loader } from 'lucide-react';

interface AvatarUploaderProps {
  value?: string;
  onChange: (file: File | null) => void;
  error?: string;
  className?: string;
}

export default function AvatarUploader({
  value,
  onChange,
  error,
  className = ''
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      // Handle error - invalid file type
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      // Handle error - file too large
      return;
    }

    // Validate dimensions (minimum 200x200)
    const img = new Image();
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        // Handle error - dimensions too small
        return;
      }

      setIsUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setIsUploading(false);
        onChange(file);
      };
      reader.readAsDataURL(file);
    };
    
    img.src = URL.createObjectURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Avatar Circle */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`
          relative w-24 h-24 md:w-24 md:h-24 rounded-full cursor-pointer transition-all duration-200
          ${preview 
            ? 'border-2 border-gray-200 hover:border-gray-300' 
            : 'border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50'
          }
          ${error ? 'border-red-300' : ''}
        `}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Content */}
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </motion.div>
          ) : preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative w-full h-full"
            >
              <img
                src={preview}
                alt="صورة شخصية"
                className="w-full h-full object-cover rounded-full"
              />
              
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-full transition-all duration-200 flex items-center justify-center">
                <Camera className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Upload className="w-8 h-8 text-gray-400" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remove Button */}
        {preview && !isUploading && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>

      {/* Caption */}
      <motion.p
        className={`mt-3 text-sm text-center ${error ? 'text-red-500' : 'text-gray-600'}`}
        animate={{ color: error ? '#ef4444' : '#6b7280' }}
      >
        {error || 'انقر لإضافة صورة شخصية'}
      </motion.p>

      {/* Change Button */}
      {preview && !isUploading && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleClick}
          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          تغيير الصورة
        </motion.button>
      )}
    </div>
  );
}
