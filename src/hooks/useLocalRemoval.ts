'use client';

import { useCallback } from 'react';
import { removeBackground, type Config } from '@imgly/background-removal';
import { EngineType } from '@/types';

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
          if (onProgress && (key.includes('onnx') || key.includes('wasm') || key.includes('model'))) {
            const percent = total > 0 ? Math.round((current / total) * 100) : 0;
            const downloadedMB = (current / 1024 / 1024).toFixed(1);
            const totalMB = (total / 1024 / 1024).toFixed(1);
            onProgress(percent, `${downloadedMB}MB / ${totalMB}MB`);
          }
        },
      };

      return await removeBackground(imageSource, config);
    },
    []
  );

  return { process };
}
