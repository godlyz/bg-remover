'use client';

import { useState, useEffect, useRef } from 'react';
import type { EngineType } from '@/types';
import ColorPicker from './ColorPicker';

/** 棋盘格背景样式 */
const CHECKERBOARD = `background-image:
  linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
  linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
  linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
background-size: 16px 16px;
background-position: 0 0, 0 8px, 8px -8px, -8px 0px;`;

/** 结果预览视图 */
interface ResultViewProps {
  originalUrl: string;
  resultUrl: string;
  engineUsed: EngineType;
  fallbackUsed?: boolean;
  backgroundColor: string | null;
  onBackgroundColorChange: (color: string | null) => void;
  onDownload: () => void;
  onReupload: () => void;
}

export default function ResultView({
  originalUrl,
  resultUrl,
  engineUsed,
  fallbackUsed,
  backgroundColor,
  onBackgroundColorChange,
  onDownload,
  onReupload,
}: ResultViewProps) {
  const [compareMode, setCompareMode] = useState<'side' | 'result'>('side');

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* 工具栏 */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 引擎标识 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
            {engineUsed === 'local' ? '⚡ 本地 AI 处理' : '✨ 云端专业品质'}
          </span>
          {fallbackUsed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              ⚠️ 已降级为本地模式
            </span>
          )}
          <span className="text-sm text-gray-500">处理完成</span>
        </div>

        {/* 视图切换 */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => setCompareMode('side')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              compareMode === 'side' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            对比
          </button>
          <button
            onClick={() => setCompareMode('result')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              compareMode === 'result' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            仅结果
          </button>
        </div>
      </div>

      {/* 图片区域 */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {compareMode === 'side' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* 原图 */}
            <div className="relative border-b border-gray-100 sm:border-b-0 sm:border-r">
              <div className="absolute left-3 top-3 z-10 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                原图
              </div>
              <div className="flex items-center justify-center bg-gray-50 p-4" style={{ minHeight: '300px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="原图" className="max-h-[400px] max-w-full rounded-lg object-contain" />
              </div>
            </div>
            {/* 结果 */}
            <div className="relative">
              <div className="absolute left-3 top-3 z-10 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                结果
              </div>
              <div
                className="flex items-center justify-center p-4"
                style={{ minHeight: '300px', backgroundColor: backgroundColor || undefined, ...(backgroundColor ? {} : { cssText: CHECKERBOARD }) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="结果" className="max-h-[400px] max-w-full rounded-lg object-contain" />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center p-6"
            style={{ minHeight: '300px', backgroundColor: backgroundColor || undefined, ...(backgroundColor ? {} : { cssText: CHECKERBOARD }) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="结果" className="max-h-[500px] max-w-full rounded-lg object-contain" />
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="flex flex-col gap-4 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 背景色选择 */}
          <ColorPicker
            selectedColor={backgroundColor}
            onColorSelect={onBackgroundColorChange}
          />

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={onReupload}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              重新上传
            </button>
            <button
              onClick={onDownload}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载 PNG
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
