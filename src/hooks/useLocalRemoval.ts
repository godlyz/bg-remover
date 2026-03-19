'use client';

import { useCallback } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { EngineType } from '@/types';

/** 本地去背景 Hook */
export function useLocalRemoval() {
  const process = useCallback(async (imageSource: string | Blob): Promise<Blob> => {
    const config = {
      publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
      debug: false,
      device: 'gpu' as const,
      model: 'isnet_fp16' as const,
      output: {
        format: 'image/png' as const,
        quality: 0.8,
        type: 'foreground' as const,
      },
    };

    return await removeBackground(imageSource, config);
  }, []);

  return { process };
}
