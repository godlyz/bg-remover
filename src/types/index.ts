/** 引擎类型 */
export type EngineType = 'local' | 'cloud';

/** 引擎配置 */
export interface EngineConfig {
  type: EngineType;
  maxSize: number;       // MB
  maxWidth: number;      // px
  maxHeight: number;     // px
  label: string;         // Tab 显示名称
  sublabel: string;      // Tab 副标题
  privacyNote: string;   // 隐私提示
}

/** 引擎配置常量 */
export const ENGINE_CONFIGS: Record<EngineType, EngineConfig> = {
  local: {
    type: 'local',
    maxSize: 10,
    maxWidth: 4096,
    maxHeight: 4096,
    label: '⚡ 快速免费',
    sublabel: '图片不离开你的设备',
    privacyNote: '图片不离开你的设备',
  },
  cloud: {
    type: 'cloud',
    maxSize: 12,
    maxWidth: 25000000,
    maxHeight: 25000000,
    label: '✨ 专业品质',
    sublabel: '云端处理，边缘更精准',
    privacyNote: '图片将上传至云端处理',
  },
};

/** 处理状态 */
export interface ProcessingState {
  status: 'idle' | 'uploading' | 'loading-model' | 'processing' | 'done' | 'error';
  progress?: number;
  progressText?: string;
  errorMessage?: string;
  engineUsed?: EngineType;
  fallbackUsed?: boolean;
}

/** 预设背景色 */
export interface PresetColor {
  name: string;
  value: string;
  emoji: string;
}

/** 预设背景色列表 */
export const PRESET_COLORS: PresetColor[] = [
  { name: '白色', value: '#ffffff', emoji: '⬜' },
  { name: '黑色', value: '#000000', emoji: '⬛' },
  { name: '红色', value: '#ef4444', emoji: '🟥' },
  { name: '蓝色', value: '#3b82f6', emoji: '🟦' },
];
