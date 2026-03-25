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
  const [scale, setScale] = useState(1);
  const [tab, setTab] = useState<"result" | "original">("result");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate object URL from blob
  useEffect(() => {
    if (resultBlob) {
      const url = URL.createObjectURL(resultBlob);
      setResultUrl(url);
      setTab("result");
      return () => URL.revokeObjectURL(url);
    }
    setResultUrl("");
  }, [resultBlob]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 3));
  }, []);

  // Render with background color
  useEffect(() => {
    if (!resultBlob || !canvasRef.current || !bgColor) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = URL.createObjectURL(resultBlob);
  }, [resultBlob, bgColor]);

  const handleDownload = useCallback(() => {
    if (!resultBlob && !canvasRef.current) return;
    const timestamp = Date.now();

    if (bgColor && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bgfree_${timestamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    } else if (resultUrl) {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `bgfree_${timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [resultBlob, resultUrl, bgColor]);

  if (!originalUrl) return null;

  // Show preview area while processing or when result is ready
  if (!processing && !resultBlob) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Progress */}
      {processing && progress && (
        <div className="mb-6">
          <div className="w-full max-w-xs mx-auto">
            <p className="text-gray-600 text-sm font-medium mb-2 text-center">{progress.label}</p>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progress.percent < 100 ? "bg-blue-500" : "bg-blue-500 animate-pulse"
                }`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            {progress.detail && (
              <p className="text-gray-400 text-xs mt-1 text-center">{progress.detail}</p>
            )}
            <p className="text-gray-500 text-xs mt-1 text-center">{progress.percent}%</p>
          </div>
        </div>
      )}

      {/* Processing placeholder */}
      {processing && !resultBlob && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Original</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <img src={originalUrl} alt="Original" className="w-full h-auto max-h-80 object-contain" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Processing...</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden h-80 flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">AI is working...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {resultBlob && resultUrl && (
        <>
          {/* Tab switcher */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gray-100 rounded-lg p-0.5 inline-flex">
              <button
                onClick={() => setTab("result")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === "result" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Result {engine === "cloud" && <span className="text-blue-500 ml-1">✨ Pro</span>}
              </button>
              <button
                onClick={() => setTab("original")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === "original" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Original
              </button>
            </div>
          </div>

          {/* Image display */}
          <div
            className="border border-gray-200 rounded-xl overflow-hidden relative"
            onWheel={handleWheel}
            style={{ cursor: "zoom-in" }}
          >
            {tab === "result" ? (
              bgColor && canvasRef.current ? (
                <div className="flex justify-center p-4" style={{ backgroundColor: bgColor }}>
                  <canvas
                    ref={canvasRef}
                    className="max-h-96 object-contain"
                    style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
                  />
                </div>
              ) : bgColor ? (
                /* Canvas rendering in progress */
                <div className="flex justify-center p-4 min-h-[200px]" style={{ backgroundColor: bgColor }}>
                  <canvas ref={canvasRef} className="hidden" />
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="max-h-96 object-contain"
                    style={{ transform: `scale(${scale})`, transformOrigin: "center", mixBlendMode: "multiply" }}
                  />
                </div>
              ) : (
                <div
                  className="flex justify-center p-4"
                  style={{
                    backgroundImage:
                      "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 25%, transparent 50%, #e5e7eb 50%, #e5e7eb 75%, transparent 75%, transparent)",
                    backgroundSize: "16px 16px",
                  }}
                >
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="max-h-96 object-contain"
                    style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
                  />
                </div>
              )
            ) : (
              <div className="flex justify-center p-4 bg-white">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-h-96 object-contain"
                  style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
                />
              </div>
            )}
          </div>

          {/* Hidden canvas for bg color rendering */}
          {bgColor && <canvas ref={canvasRef} className="hidden" />}

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

          {/* Zoom hint */}
          <p className="text-center text-gray-400 text-xs mt-2">Scroll to zoom · {engine === "local" ? "Processed locally" : "Processed in cloud"}</p>
        </>
      )}
    </div>
  );
}
