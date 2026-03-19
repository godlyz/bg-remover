import { EngineConfig } from '@/types';

/** 文件校验工具（仅浏览器端使用） */
export async function validateFile(
  file: File,
  config: EngineConfig
): Promise<{ valid: boolean; error?: string }> {
  // 格式校验
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `请上传 JPG、PNG 或 WebP 格式的图片（当前格式：${file.type}）`,
    };
  }

  // 大小校验
  const maxSizeBytes = config.maxSize * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `文件大小不能超过 ${config.maxSize}MB（当前：${(file.size / 1024 / 1024).toFixed(2)}MB）`,
    };
  }

  // 尺寸校验
  if (typeof window === 'undefined') {
    return { valid: true }; // SSR 时跳过图片尺寸校验
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.width > config.maxWidth || img.height > config.maxHeight) {
        resolve({
          valid: false,
          error: `图片尺寸不能超过 ${config.maxWidth.toLocaleString()}×${config.maxHeight.toLocaleString()} 像素（当前：${img.width}×${img.height}）`,
        });
      } else {
        resolve({ valid: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: '无法读取图片文件，请重试' });
    };

    img.src = url;
  });
}
