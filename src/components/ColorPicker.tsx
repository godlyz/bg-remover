import { PRESET_COLORS, type PresetColor } from '@/types';

/** 背景色选择器 */
interface ColorPickerProps {
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;
}

export default function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">背景色</span>

      <div className="flex flex-wrap gap-2">
        {/* 透明（默认） */}
        <button
          onClick={() => onColorSelect(null)}
          className={`
            flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors
            ${selectedColor === null ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'}
          `}
        >
          <span className="text-lg">♟️</span>
          <span>透明</span>
        </button>

        {/* 预设颜色 */}
        {PRESET_COLORS.map((color: PresetColor) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            className={`
              flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors
              ${selectedColor === color.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'}
            `}
          >
            <span className="text-lg">{color.emoji}</span>
            <span>{color.name}</span>
          </button>
        ))}

        {/* 自定义颜色 */}
        <div className="relative">
          <input
            type="color"
            value={selectedColor || '#ffffff'}
            onChange={(e) => onColorSelect(e.target.value)}
            className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
          />
          <button
            className={`
              flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors
              ${
                selectedColor && !PRESET_COLORS.some((c) => c.value === selectedColor)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }
            `}
          >
            <span className="text-lg">🎨</span>
            <span>自定义</span>
          </button>
        </div>
      </div>
    </div>
  );
}
