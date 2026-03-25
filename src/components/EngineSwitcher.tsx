"use client";

export type EngineType = "local" | "cloud";

interface EngineSwitcherProps {
  engine: EngineType;
  onSwitch: (engine: EngineType) => void;
  disabled: boolean;
}

export default function EngineSwitcher({ engine, onSwitch, disabled }: EngineSwitcherProps) {
  return (
    <div className={`w-full max-w-md mx-auto mb-6 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => onSwitch("local")}
          className={`flex-1 flex flex-col items-center py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            engine === "local"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="text-lg mb-0.5">⚡</span>
          <span>Quick & Free</span>
          <span className="text-[11px] font-normal opacity-70">Stays on your device</span>
        </button>
        <button
          onClick={() => onSwitch("cloud")}
          className={`flex-1 flex flex-col items-center py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            engine === "cloud"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="text-lg mb-0.5">✨</span>
          <span>Pro Quality</span>
          <span className="text-[11px] font-normal opacity-70">Cloud AI, sharper edges</span>
        </button>
      </div>
    </div>
  );
}
