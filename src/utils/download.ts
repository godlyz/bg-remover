/** 文件下载工具 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** 生成下载文件名 */
export function generateDownloadFilename(originalName: string, engine: 'local' | 'cloud'): string {
  const timestamp = Date.now();
  const prefix = engine === 'cloud' ? 'bgfree_pro' : 'bgfree';
  const baseName = originalName.replace(/\.[^/.]+$/, ''); // 移除原扩展名
  return `${prefix}_${baseName}_${timestamp}.png`;
}
