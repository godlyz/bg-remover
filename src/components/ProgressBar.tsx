"use client";

interface ProgressBarProps {
  label: string;
  percent: number;
  detail?: string;
  animated?: boolean;
}

export default function ProgressBar({ label, percent, detail, animated }: ProgressBarProps) {
  return (
    <div className="w-full max-w-xs mx-auto text-center">
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            animated ? "bg-blue-500 animate-pulse" : "bg-blue-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-gray-500 text-xs">{detail || `${percent}%`}</span>
        <span className="text-gray-500 text-xs">{percent}%</span>
      </div>
    </div>
  );
}
