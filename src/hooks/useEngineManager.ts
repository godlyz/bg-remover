'use client';

import { useCallback } from 'react';
import { EngineType, ProcessingState } from '@/types';
import { useLocalRemoval } from './useLocalRemoval';
import { useCloudRemoval } from './useCloudRemoval';

/** 进度回调类型 */
type ProgressCallback = (state: Partial<ProcessingState>) => void;

/** 引擎管理 Hook - 统一处理本地和云端去背景 */
export function useEngineManager() {
  const localRemoval = useLocalRemoval();
  const cloudRemoval = useCloudRemoval();

  const processImage = useCallback(
    async (
      file: File,
      engine: EngineType,
      onProgress: ProgressCallback
    ): Promise<{ blob: Blob; engineUsed: EngineType; fallbackUsed: boolean }> => {
      try {
        if (engine === 'cloud') {
          // ===== 云端模式 =====
          const blob = await cloudRemoval.process(file, (progress, text) => {
            if (progress >= 100) {
              onProgress({ status: 'processing', progress: 90, progressText: '云端 AI 正在处理...' });
            } else {
              onProgress({ status: 'uploading', progress, progressText: text });
            }
          });
          return { blob, engineUsed: 'cloud', fallbackUsed: false };
        } else {
          // ===== 本地模式 =====
          const blob = await localRemoval.process(file, (progress, text) => {
            if (progress > 0 && progress < 100) {
              onProgress({ status: 'loading-model', progress: Math.min(progress, 90), progressText: `正在加载 AI 模型... ${text}` });
            } else if (progress >= 100 || text.includes('处理')) {
              onProgress({ status: 'processing', progress: 95, progressText: '正在处理图片...' });
            }
          });
          return { blob, engineUsed: 'local', fallbackUsed: false };
        }
      } catch (error) {
        // 云端模式失败时自动降级到本地模式
        if (engine === 'cloud') {
          console.warn('Cloud removal failed, falling back to local:', error);
          onProgress({
            status: 'loading-model',
            progress: 0,
            progressText: '云端失败，正在切换到本地模式...',
            errorMessage: undefined,
          });

          try {
            const blob = await localRemoval.process(file, (progress, text) => {
              if (progress > 0 && progress < 100) {
                onProgress({ status: 'loading-model', progress: Math.min(progress, 90), progressText: `正在加载 AI 模型... ${text}` });
              } else {
                onProgress({ status: 'processing', progress: 95, progressText: '正在处理图片...' });
              }
            });
            return { blob, engineUsed: 'local', fallbackUsed: true };
          } catch (localError) {
            throw new Error('云端和本地处理都失败了，请更换图片或稍后重试');
          }
        }
        throw error;
      }
    },
    [localRemoval, cloudRemoval]
  );

  return { processImage };
}
