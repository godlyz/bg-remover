'use client';

import { useCallback } from 'react';
import { removeBackground, type Config } from '@imgly/background-removal';

/** 本地去背景 Hook */
export function useLocalRemoval() {
  const process = useCallback(
    async (
      imageSource: string | Blob,
      onProgress?: (progress: number, text: string) => void
    ): Promise<Blob> => {
      const config: Config = {
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        debug: false,
        device: 'gpu',
        model: 'isnet_fp16',
        output: {
          format: 'image/png',
          quality: 0.8,
        },
        progress: (key: string, current: number, total: number) => {
          // 跟踪所有资源下载进度（模型、WASM 等）
          if (onProgress && total > 0) {
            const percent = Math.round((current / total) * 100);
            const downloadedMB = (current / 1024 / 1024).toFixed(1);
            const totalMB = (total / 1024 / 1024).toFixed(1);

            // 判断阶段
            let phase = '加载资源中';
            if (key.includes('onnx') || key.includes('model') || key.includes('isnet')) {
              phase = '加载 AI 模型';
            } else if (key.includes('wasm')) {
              phase = '加载运行环境';
            }

            onProgress(percent, `${phase}... ${downloadedMB}MB / ${totalMB}MB`);
          }
        },
      };

      try {
        return await removeBackground(imageSource, config);
      } catch (error) {
        // 提供更友好的错误信息
        const message = error instanceof Error ? error.message : '处理失败';
        if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
          throw new Error('AI 模型下载失败，请检查网络连接后刷新页面重试');
        }
        if (message.includes('session') || message.includes('backend')) {
          throw new Error('浏览器环境不支持，请使用最新版 Chrome 或 Edge 浏览器');
        }
        throw new Error(`处理失败: ${message}`);
      }
    },
    []
  );

  return { process };
}
