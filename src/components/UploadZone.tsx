'use client';

import { useRef, useState, useEffect } from 'react';
import { EngineConfig } from '@/types';

/** 上传区域组件 - 拖拽 + 点击 + Ctrl+V */
interface UploadZoneProps {
  engineConfig: EngineConfig;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function UploadZone({
  engineConfig,
  onFileSelect,
  disabled = false,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // 注册全局粘贴事件（仅浏览器端）
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;

      const items = e.clipboardData?.items;
      for (const item of items || []) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [disabled]);

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors
          ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'cursor-not-allowed bg-gray-50 opacity-50' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <div className="flex flex-col items-center gap-4">
          {/* 上传图标 */}
          <div className="rounded-full bg-blue-100 p-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {/* 提示文字 */}
          <div>
            <p className="text-lg font-medium text-gray-700">拖拽图片到这里</p>
            <p className="text-sm text-gray-500">或点击上传</p>
          </div>

          {/* 格式和限制说明 */}
          <div className="text-xs text-gray-400">
            <p>支持 JPG、PNG、WebP 格式</p>
            <p>
              最大 {engineConfig.maxSize}MB · 最大 {engineConfig.maxWidth.toLocaleString()}×{engineConfig.maxHeight.toLocaleString()} 像素
            </p>
            <p>也支持 Ctrl+V 粘贴</p>
          </div>
        </div>
      </div>
    </div>
  );
}
