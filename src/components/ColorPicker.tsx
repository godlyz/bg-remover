"use client";

import { useState } from "react";

interface ColorPickerProps {
  selectedColor: string | null;
  onColorChange: (color: string | null) => void;
}

const PRESET_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
];

export default function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-gray-500 text-xs font-medium mr-1">Background:</span>
      {PRESET_COLORS.map(({ name, value }) => (
        <button
          key={value}
          title={name}
          onClick={() => {
            onColorChange(selectedColor === value ? null : value);
            setShowCustom(false);
          }}
          className={`w-7 h-7 rounded-full border-2 transition-all ${
            selectedColor === value
              ? "border-blue-500 scale-110 shadow-md"
              : "border-gray-200 hover:border-gray-400"
          }`}
          style={{ backgroundColor: value }}
        >
          {value === "#FFFFFF" && (
            <span className="text-[10px] text-gray-400">W</span>
          )}
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
            showCustom
              ? "border-blue-500 scale-110 shadow-md"
              : "border-gray-200 hover:border-gray-400"
          } bg-gradient-to-br from-red-400 via-green-400 to-blue-400`}
          title="Custom color"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
          </svg>
        </button>
        {showCustom && (
          <div className="absolute top-9 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
            <input
              type="color"
              value={selectedColor || "#6366F1"}
              onChange={(e) => {
                onColorChange(e.target.value);
                setShowCustom(false);
              }}
              className="w-8 h-8 cursor-pointer border-0"
            />
          </div>
        )}
      </div>
      {selectedColor && (
        <button
          onClick={() => onColorChange(null)}
          className="text-gray-400 hover:text-gray-600 text-xs ml-1 underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
