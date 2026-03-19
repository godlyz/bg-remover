import { PRESET_COLORS } from '@/types';

/** 背景色选择器 */
interface ColorPickerProps {
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;
}

export default function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500">背景色：</span>

      {/* 透明 */}
      <button
        onClick={() => onColorSelect(null)}
        title="透明背景"
        className={`
          h-8 w-8 rounded-full border-2 transition-all
          ${selectedColor === null
            ? 'border-blue-500 ring-2 ring-blue-200'
            : 'border-gray-300 hover:border-gray-400'}
        `}
        style={{
          background: `repeating-conic-gradient(#d1d5db 0% 25%, #f3f4f6 0% 50%) 50% / 8px 8px`,
        }}
      />

      {/* 预设颜色 */}
      {PRESET_COLORS.map((color) => (
        <button
          key={color.value}
          onClick={() => onColorSelect(color.value)}
          title={color.name}
          className={`
            h-8 w-8 rounded-full border-2 transition-all
            ${selectedColor === color.value
              ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
              : 'border-gray-300 hover:border-gray-400 hover:scale-105'}
          `}
          style={{ backgroundColor: color.value }}
        />
      ))}

      {/* 自定义颜色 */}
      <div className="relative">
        <input
          type="color"
          value={selectedColor || '#ffffff'}
          onChange={(e) => onColorSelect(e.target.value)}
          className="absolute inset-0 h-8 w-full cursor-pointer opacity-0"
          title="自定义颜色"
        />
        <div className={`
          flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all
          ${!selectedColor || PRESET_COLORS.some(c => c.value === selectedColor)
            ? 'border-gray-300 hover:border-gray-400'
            : 'border-blue-500 ring-2 ring-blue-200 scale-110'}
          bg-gradient-to-br from-red-400 via-green-400 to-blue-400
        `}>
          <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
