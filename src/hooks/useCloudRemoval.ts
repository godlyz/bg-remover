'use client';

import { useCallback } from 'react';

/** 云端去背景 Hook */
export function useCloudRemoval() {
  const process = useCallback(async (file: File): Promise<Blob> => {
    const formData = new FormData();
    formData.append('image_file', file);

    const response = await fetch('/api/remove-bg', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '云端处理失败');
    }

    return await response.blob();
  }, []);

  return { process };
}
