import { ENGINE_CONFIGS, type EngineType } from '@/types';

/** 引擎切换组件 */
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
  const engines = ENGINE_CONFIGS;

  return (
    <div className="mx-auto mt-6 mb-8 max-w-5xl px-4 sm:px-6">
      <div className="inline-flex w-full gap-1 rounded-xl bg-gray-100 p-1 sm:w-auto">
        {(Object.keys(engines) as EngineType[]).map((engine) => {
          const config = engines[engine];
          const isSelected = currentEngine === engine;

          return (
            <button
              key={engine}
              onClick={() => !disabled && onEngineChange(engine)}
              disabled={disabled}
              className={`
                flex-1 rounded-lg px-4 py-3 text-left transition-all duration-200 sm:flex-none sm:min-w-[200px]
                ${
                  isSelected
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }
                ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
            >
              <div className="font-medium">{config.label}</div>
              <div className={`mt-0.5 text-xs ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}>
                {config.sublabel}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
