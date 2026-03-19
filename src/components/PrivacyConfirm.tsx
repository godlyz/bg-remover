import { useState } from 'react';

/** 隐私确认弹窗 */
interface PrivacyConfirmProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PrivacyConfirm({ isOpen, onConfirm, onCancel }: PrivacyConfirmProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 半透明遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* 弹窗内容 */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-3 text-lg font-medium text-gray-900">切换到专业品质模式</h3>

        <p className="mb-6 text-sm text-gray-600">
          此模式需要将图片发送到云端处理，<strong className="text-gray-800">不会存储在服务器上</strong>
          。处理完成后图片会立即从服务器删除。
        </p>

        <div className="mb-4 rounded-md bg-yellow-50 p-3 text-xs text-yellow-800">
          <p>⚠️ 请勿上传包含敏感信息的图片</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            确认切换
          </button>
        </div>
      </div>
    </div>
  );
}
