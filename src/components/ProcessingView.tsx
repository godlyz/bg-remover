import type { ProcessingState } from '@/types';

/** 处理中状态视图 */
interface ProcessingViewProps {
  state: ProcessingState;
  originalUrl: string | null;
  onRetry?: () => void;
}

export default function ProcessingView({ state, originalUrl, onRetry }: ProcessingViewProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-6 p-8 sm:p-12">
          {/* 原图缩略图 + 状态 */}
          <div className="flex w-full max-w-lg items-center gap-6">
            {/* 原图缩略图 */}
            {originalUrl && (
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="原图" className="h-full w-full object-cover" />
              </div>
            )}

            {/* 状态信息 */}
            <div className="flex-1 text-center sm:text-left">
              {state.status === 'error' ? (
                <>
                  <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
                    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900">处理失败</p>
                  </div>
                  <p className="text-sm text-red-600">{state.errorMessage}</p>
                </>
              ) : (
                <>
                  <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
                    {/* 加载动画 */}
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                    <p className="text-lg font-medium text-gray-900">
                      {state.status === 'loading-model' && '加载 AI 模型中...'}
                      {state.status === 'uploading' && '上传图片中...'}
                      {state.status === 'processing' && '处理图片中...'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {state.progressText || '请稍候...'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 进度条 */}
          {state.progress !== undefined && state.status !== 'error' && (
            <div className="w-full max-w-lg">
              <div className="mb-1.5 flex justify-between text-xs text-gray-400">
                <span>
                  {state.status === 'loading-model' && '首次使用需下载 AI 模型（约 40MB），后续秒开'}
                  {state.status === 'uploading' && '上传图片到云端'}
                  {state.status === 'processing' && 'AI 正在处理'}
                </span>
                <span>{state.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(state.progress, 2)}%` }}
                />
              </div>
            </div>
          )}

          {/* 降级提示 */}
          {state.fallbackUsed && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              云端处理失败，已自动切换到免费模式
            </div>
          )}

          {/* 重试按钮 */}
          {state.status === 'error' && onRetry && (
            <div className="flex gap-3">
              <button
                onClick={onRetry}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
              >
                重新尝试
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
