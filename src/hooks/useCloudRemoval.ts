'use client';

import { useCallback } from 'react';

/** 云端去背景 Hook */
export function useCloudRemoval() {
  const process = useCallback(
    async (
      file: File,
      onProgress?: (progress: number, text: string) => void
    ): Promise<Blob> => {
      if (onProgress) onProgress(30, '正在上传图片到云端...');

      const formData = new FormData();
      formData.append('image_file', file);

      const xhr = new XMLHttpRequest();

      return new Promise<Blob>((resolve, reject) => {
        xhr.open('POST', '/api/remove-bg');

        // 上传进度
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const percent = Math.round((e.loaded / e.total) * 100);
            const loadedMB = (e.loaded / 1024 / 1024).toFixed(1);
            const totalMB = (e.total / 1024 / 1024).toFixed(1);
            onProgress(30 + Math.round(percent * 0.3), `上传中 ${loadedMB}MB / ${totalMB}MB`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const blob = xhr.response instanceof Blob ? xhr.response : new Blob([xhr.response], { type: 'image/png' });
            resolve(blob);
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || `云端处理失败 (${xhr.status})`));
            } catch {
              reject(new Error(`云端处理失败 (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('网络错误，请检查网络后重试'));
        xhr.ontimeout = () => reject(new Error('请求超时，请稍后重试'));
        xhr.timeout = 60000; // 60 秒超时
        xhr.responseType = 'blob';
        xhr.send(formData);
      });
    },
    []
  );

  return { process };
}
