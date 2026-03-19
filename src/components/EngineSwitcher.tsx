import { EngineType, ENGINE_CONFIGS } from '@/types';

/** 引擎切换组件 - 两个 Tab 按钮 */
interface EngineSwitcherProps {
  currentEngine: EngineType;
  onEngineChange: (engine: EngineType) => void;
  disabled?: boolean;
}

export default function EngineSwitcher({
  currentEngine,
  onEngineChange,
  disabled = false,
}: EngineSwitcherProps) {
  return (
    <div className="mx-auto mb-6 max-w-5xl px-4">
      <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-1">
        {(Object.keys(ENGINE_CONFIGS) as EngineType[]).map((engine) => {
          const config = ENGINE_CONFIGS[engine];
          const isSelected = currentEngine === engine;
          const isDisabled = disabled;

          return (
            <button
              key={engine}
              onClick={() => onEngineChange(engine)}
              disabled={isDisabled}
              className={`
                flex-1 rounded-md px-4 py-3 text-left transition-all
                ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }
                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <div className="font-medium">{config.label}</div>
              <div className="text-sm opacity-80">{config.sublabel}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
