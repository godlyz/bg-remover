import { useState } from 'react';
import { EngineType } from '@/types';

/** 结果预览视图 */
interface ResultViewProps {
  originalUrl: string;
  resultUrl: string;
  engineUsed: EngineType;
  backgroundColor: string | null;
  onBackgroundColorChange: (color: string | null) => void;
  onDownload: () => void;
  onReupload: () => void;
}

export default function ResultView({
  originalUrl,
  resultUrl,
  engineUsed,
  backgroundColor,
  onBackgroundColorChange,
  onDownload,
  onReupload,
}: ResultViewProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  // 动态生成预览图片（带背景色）
  const getPreviewStyle = () => {
    if (backgroundColor) {
      return { backgroundColor };
    }
    // 透明背景显示棋盘格
    return {
      backgroundImage: `
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%)
      `,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    };
  };

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {/* 引擎标识 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">处理引擎：</span>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
              {engineUsed === 'local' ? '本地 AI 处理' : '云端专业品质'}
            </span>
          </div>

          {/* 切换对比按钮 */}
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-sm text-blue-600 transition-colors hover:text-blue-700"
          >
            {showOriginal ? '查看结果' : '查看原图'}
          </button>
        </div>

        {/* 图片预览区 */}
        <div className="mb-6 flex gap-4">
          {/* 原图 */}
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-gray-700">原图</p>
            <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalUrl} alt="原图" className="h-full w-full object-contain" />
            </div>
          </div>

          {/* 结果 */}
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-gray-700">结果</p>
            <div
              className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              style={getPreviewStyle()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showOriginal ? originalUrl : resultUrl}
                alt={showOriginal ? '原图' : '结果'}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={onDownload}
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            下载 PNG
          </button>

          <button
            onClick={onReupload}
            className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            重新上传
          </button>
        </div>
      </div>
    </div>
  );
}
