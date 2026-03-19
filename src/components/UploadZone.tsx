'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { EngineConfig } from '@/types';

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

  const handleFile = useCallback(
    (file: File) => {
      if (!disabled) {
        onFileSelect(file);
      }
    },
    [disabled, onFileSelect]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // 全局粘贴事件
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [disabled, handleFile]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
          ${
            isDragging
              ? 'border-blue-400 bg-blue-50/50 scale-[1.01]'
              : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50/30'
          }
          ${disabled ? 'pointer-events-none opacity-50' : ''}
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
            // 重置 input 以允许重复选择同一文件
            e.target.value = '';
          }}
        />

        <div className="flex flex-col items-center gap-5 px-6 py-16 sm:py-20">
          {/* 上传图标 */}
          <div className={`
            rounded-2xl p-4 transition-colors duration-200
            ${isDragging ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'}
          `}>
            <svg
              className={`h-10 w-10 transition-colors duration-200 ${isDragging ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {/* 提示文字 */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">拖拽图片到这里</p>
            <p className="mt-1 text-sm text-gray-400">或 <span className="font-medium text-blue-600">点击上传</span></p>
          </div>

          {/* 格式和限制说明 */}
          <div className="space-y-1 text-center text-xs text-gray-400">
            <p>支持 JPG、PNG、WebP 格式</p>
            <p>
              最大 {engineConfig.maxSize}MB
              {engineConfig.maxWidth < 100000 ? ` · 最大 ${engineConfig.maxWidth.toLocaleString()}×${engineConfig.maxHeight.toLocaleString()} px` : ''}
            </p>
            <p className="flex items-center justify-center gap-1">
              <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
              <span>+</span>
              <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px]">V</kbd>
              <span className="ml-1">粘贴图片</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
