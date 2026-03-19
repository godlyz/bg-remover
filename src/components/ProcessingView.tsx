import { ProcessingState } from '@/types';

/** 处理中状态视图 */
interface ProcessingViewProps {
  state: ProcessingState;
  onRetry?: () => void;
}

export default function ProcessingView({ state, onRetry }: ProcessingViewProps) {
  const getStatusText = () => {
    switch (state.status) {
      case 'loading-model':
        return '正在加载 AI 模型...';
      case 'processing':
        return '正在处理图片...';
      case 'error':
        return '处理失败';
      default:
        return '';
    }
  };

  const getSubtext = () => {
    if (state.errorMessage) {
      return state.errorMessage;
    }
    if (state.progressText) {
      return state.progressText;
    }
    return '';
  };

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-12">
        {/* 动画图标 */}
        <div className="flex h-20 w-20 items-center justify-center">
          {state.status === 'error' ? (
            // 错误图标
            <div className="rounded-full bg-red-100 p-4">
              <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            // 加载动画
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          )}
        </div>

        {/* 状态文字 */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">{getStatusText()}</p>
          <p className="mt-2 text-sm text-gray-500">{getSubtext()}</p>
        </div>

        {/* 进度条 */}
        {state.progress !== undefined && state.status !== 'error' && (
          <div className="w-full max-w-xs">
            <div className="mb-2 flex justify-between text-xs text-gray-500">
              <span>处理进度</span>
              <span>{state.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 重试按钮 */}
        {state.status === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            重新尝试
          </button>
        )}

        {/* 降级提示 */}
        {state.fallbackUsed && (
          <div className="rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            云端处理失败，已自动切换到免费模式
          </div>
        )}
      </div>
    </div>
  );
}
