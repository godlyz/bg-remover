"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ColorPicker from "./ColorPicker";
import { EngineType } from "./EngineSwitcher";

interface ResultPreviewProps {
  originalUrl: string;
  resultBlob: Blob | null;
  processing: boolean;
  engine: EngineType;
  progress?: { label: string; percent: number; detail?: string };
  onReset: () => void;
}

export default function ResultPreview({
  originalUrl,
  resultBlob,
  processing,
  engine,
  progress,
  onReset,
}: ResultPreviewProps) {
  const [resultUrl, setResultUrl] = useState<string>("");
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"compare" | "result" | "original">("compare");
  const compareRef = useRef<HTMLDivElement>(null);

  // Generate object URL from blob
  useEffect(() => {
    if (resultBlob) {
      const url = URL.createObjectURL(resultBlob);
      setResultUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setResultUrl("");
  }, [resultBlob]);

  // Slider drag handlers
  const handleMove = useCallback((clientX: number) => {
    if (!compareRef.current || !isDragging) return;
    const rect = compareRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, [isDragging]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchend", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, handleMove]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `bgfree_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultUrl]);

  // Loading/processing state
  if (!resultBlob) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        {/* Progress section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            {/* Spinner */}
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            </div>

            {/* Status text */}
            {progress ? (
              <div className="text-center w-full max-w-xs">
                <p className="text-gray-700 font-medium">{progress.label}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {progress.detail || "Please wait..."}
                </p>
              </div>
            ) : processing ? (
              <p className="text-gray-500 text-sm">Preparing to process...</p>
            ) : (
              <p className="text-gray-500 text-sm">Processing your image...</p>
            )}

            {/* Progress bar */}
            {progress && progress.percent > 0 && (
              <div className="w-full max-w-xs">
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="text-gray-400 text-xs mt-1.5 text-center">
                  {progress.percent}% complete
                </p>
              </div>
            )}

            {/* Info tip */}
            <p className="text-gray-400 text-xs mt-2">
              {engine === "local"
                ? "🔒 AI model is loading in your browser — first time may take ~30 seconds"
                : "🔄 Processing on cloud AI server"}
            </p>
          </div>

          {/* Original preview while waiting */}
          {originalUrl && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-gray-400 text-xs mb-2 text-center">Your uploaded image</p>
              <img
                src={originalUrl}
                alt="Original"
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Result ready
  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Mode switcher */}
      <div className="flex items-center justify-center mb-4">
        <div className="bg-gray-100 rounded-lg p-0.5 inline-flex">
          <button
            onClick={() => setMode("compare")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "compare" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            ↔ Compare
          </button>
          <button
            onClick={() => setMode("result")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "result" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Result
            {engine === "cloud" && <span className="text-blue-500 ml-1">✨</span>}
          </button>
          <button
            onClick={() => setMode("original")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "original" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Original
          </button>
        </div>
      </div>

      {/* Image display */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {mode === "compare" ? (
          // Slider comparison
          <div
            ref={compareRef}
            className="relative select-none cursor-col-resize"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            {/* Original (full width) */}
            <img
              src={originalUrl}
              alt="Original"
              className="w-full h-auto max-h-[500px] object-contain block"
              draggable={false}
            />

            {/* Result (clipped) */}
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{
                width: `${sliderPos}%`,
                backgroundImage:
                  "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 25%, transparent 50%, #e5e7eb 50%, #e5e7eb 75%, transparent 75%, transparent)",
                backgroundSize: "16px 16px",
              }}
            >
              {bgColor && (
                <div className="absolute inset-0" style={{ backgroundColor: bgColor }} />
              )}
              <img
                src={resultUrl}
                alt="Result"
                className="absolute top-0 left-0 h-full object-contain"
                style={{ width: compareRef.current?.offsetWidth ? `${compareRef.current.offsetWidth}px` : "100vw" }}
                draggable={false}
              />
            </div>

            {/* Slider line */}
            <div
              className="absolute top-0 h-full w-0.5 bg-white shadow-lg z-20"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Slider handle */}
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md z-20">
              Result
            </div>
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md z-20">
              Original
            </div>
          </div>
        ) : mode === "result" ? (
          <div
            className="flex justify-center p-4"
            style={bgColor ? { backgroundColor: bgColor } : {
              backgroundImage:
                "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 25%, transparent 50%, #e5e7eb 50%, #e5e7eb 75%, transparent 75%, transparent)",
              backgroundSize: "16px 16px",
            }}
          >
            <img src={resultUrl} alt="Result" className="max-h-[500px] object-contain" />
          </div>
        ) : (
          <div className="flex justify-center p-4 bg-white">
            <img src={originalUrl} alt="Original" className="max-h-[500px] object-contain" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <ColorPicker selectedColor={bgColor} onColorChange={setBgColor} />
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            New Image
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m9 0l4.5-4.5M3.75 21h16.5" />
            </svg>
            Download PNG
          </button>
        </div>
      </div>

      <p className="text-center text-gray-400 text-xs mt-2">
        {mode === "compare" ? " ↔ Drag the slider to compare" : ""}
        {engine === "local" ? " · Processed locally on your device" : " · Processed in cloud"}
      </p>
    </div>
  );
}
