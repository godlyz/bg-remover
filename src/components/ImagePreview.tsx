import type { ProcessingState } from '@/types';

/** 处理中占位视图（用于上传图片后、引擎确定前） */
interface PlaceholderProps {
  state: ProcessingState;
}

export default function Placeholder({ state }: PlaceholderProps) {
  return null;
}
