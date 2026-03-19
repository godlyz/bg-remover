'use client';

import { useCallback } from 'react';
import { EngineType, ProcessingState } from '@/types';
import { useLocalRemoval } from './useLocalRemoval';
import { useCloudRemoval } from './useCloudRemoval';

/** 引擎管理 Hook - 统一处理本地和云端去背景 */
export function useEngineManager() {
  const localRemoval = useLocalRemoval();
  const cloudRemoval = useCloudRemoval();

  const processImage = useCallback(
    async (
      file: File,
      engine: EngineType,
      onProgress: (state: Partial<ProcessingState>) => void
    ): Promise<{ blob: Blob; engineUsed: EngineType; fallbackUsed: boolean }> => {
      try {
        if (engine === 'cloud') {
          // 云端模式
          onProgress({ status: 'processing', progressText: '正在上传图片到云端...' });
          const blob = await cloudRemoval.process(file);
          return { blob, engineUsed: 'cloud', fallbackUsed: false };
        } else {
          // 本地模式
          onProgress({ status: 'loading-model', progressText: '正在加载 AI 模型...' });
          const blob = await localRemoval.process(file);
          return { blob, engineUsed: 'local', fallbackUsed: false };
        }
      } catch (error) {
        // 云端模式失败时自动降级到本地模式
        if (engine === 'cloud') {
          console.warn('Cloud removal failed, falling back to local:', error);
          onProgress({ status: 'loading-model', progressText: '云端失败，切换到本地模式...' });
          try {
            const blob = await localRemoval.process(file);
            return { blob, engineUsed: 'local', fallbackUsed: true };
          } catch (localError) {
            throw new Error('本地处理也失败了，请更换图片或稍后重试');
          }
        }
        throw error;
      }
    },
    [localRemoval, cloudRemoval]
  );

  return { processImage };
}
