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
  const [mode, setMode] = useState<"compare" | "result" | "original">("compare");

  useEffect(() => {
    if (resultBlob) {
      const url = URL.createObjectURL(resultBlob);
      setResultUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setResultUrl("");
  }, [resultBlob]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `bgfree_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultUrl]);

  // Loading state
  if (!resultBlob) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            </div>
            {progress ? (
              <div className="text-center w-full max-w-xs">
                <p className="text-gray-700 font-medium">{progress.label}</p>
                <p className="text-gray-500 text-sm mt-1">{progress.detail || "Please wait..."}</p>
              </div>
            ) : processing ? (
              <p className="text-gray-500 text-sm">Preparing to process...</p>
            ) : (
              <p className="text-gray-500 text-sm">Processing your image...</p>
            )}
            {progress && progress.percent > 0 && (
              <div className="w-full max-w-xs">
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress.percent}%` }} />
                </div>
                <p className="text-gray-400 text-xs mt-1.5 text-center">{progress.percent}% complete</p>
              </div>
            )}
            <p className="text-gray-400 text-xs mt-2">
              {engine === "local"
                ? "🔒 AI model loading in your browser — first time ~30 seconds"
                : "🔄 Processing on cloud AI server"}
            </p>
          </div>
          {originalUrl && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-gray-400 text-xs mb-2 text-center">Your uploaded image</p>
              <img src={originalUrl} alt="Original" className="max-h-48 mx-auto rounded-lg object-contain" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Mode switcher */}
      <div className="flex items-center justify-center mb-4">
        <div className="bg-gray-100 rounded-lg p-0.5 inline-flex">
          {(["compare", "result", "original"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {m === "compare" ? "↔ Compare" : m === "result" ? `Result${engine === "cloud" ? " ✨" : ""}` : "Original"}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {mode === "compare" ? (
          <CanvasCompare originalUrl={originalUrl} resultUrl={resultUrl} bgColor={bgColor} />
        ) : mode === "result" ? (
          <div className="flex justify-center p-4" style={bgColor ? { backgroundColor: bgColor } : {
            backgroundImage: "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 25%, transparent 50%, #e5e7eb 50%, #e5e7eb 75%, transparent 75%, transparent)",
            backgroundSize: "16px 16px",
          }}>
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
          <button onClick={onReset} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            New Image
          </button>
          <button onClick={handleDownload} className="px-6 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m9 0l4.5-4.5M3.75 21h16.5" />
            </svg>
            Download PNG
          </button>
        </div>
      </div>
      <p className="text-center text-gray-400 text-xs mt-2">
        {mode === "compare" ? "↔ Drag the slider to compare" : ""}
        {engine === "local" ? " · Processed locally" : " · Processed in cloud"}
      </p>
    </div>
  );
}

/* ── Canvas-based slider comparison for pixel-perfect alignment ── */

function CanvasCompare({ originalUrl, resultUrl, bgColor }: { originalUrl: string; resultUrl: string; bgColor: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const resultImgRef = useRef<HTMLImageElement | null>(null);
  const displayScale = useRef(1);
  const offsetX = useRef(0);
  const offsetY = useRef(0);

  const MAX_H = 500;

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const origImg = originalImgRef.current;
    const resImg = resultImgRef.current;
    if (!canvas || !origImg || !resImg) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use original image dimensions to determine canvas size
    const imgW = origImg.naturalWidth;
    const imgH = origImg.naturalHeight;
    const scale = Math.min(1, MAX_H / imgH);

    canvas.width = Math.round(imgW * scale);
    canvas.height = Math.round(imgH * scale);
    displayScale.current = scale;
    offsetX.current = 0;
    offsetY.current = 0;

    const drawW = canvas.width;
    const drawH = canvas.height;
    const splitX = Math.round(drawW * sliderPos / 100);

    // Draw original (right side of slider)
    ctx.clearRect(0, 0, drawW, drawH);
    ctx.drawImage(origImg, 0, 0, drawW, drawH);

    // Draw result (left side of slider)
    // Save and clip
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, drawH);
    ctx.clip();

    // Draw checkerboard background for transparent areas (only if no bg color)
    if (!bgColor) {
      const sqSize = 8 * scale;
      for (let y = 0; y < drawH; y += sqSize) {
        for (let x = 0; x < splitX; x += sqSize) {
          ctx.fillStyle = ((x / sqSize + y / sqSize) % 2 === 0) ? "#ffffff" : "#e5e7eb";
          ctx.fillRect(x, y, sqSize, sqSize);
        }
      }
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, splitX, drawH);
    }

    // Draw result image on top
    ctx.drawImage(resImg, 0, 0, drawW, drawH);
    ctx.restore();

    // Draw slider line
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(splitX - 1, 0, 2, drawH);

    // Draw slider handle
    const handleY = drawH / 2;
    ctx.beginPath();
    ctx.arc(splitX, handleY, 16, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Arrow icons on handle
    ctx.fillStyle = "#666";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◀▶", splitX, handleY);

    // Labels
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.textAlign = "left";
    ctx.fillText("Result", 8, drawH - 12);
    ctx.textAlign = "right";
    ctx.fillText("Original", drawW - 8, drawH - 12);
  }, [sliderPos, bgColor]);

  // Load images
  useEffect(() => {
    const origImg = new Image();
    origImg.crossOrigin = "anonymous";
    const resImg = new Image();
    resImg.crossOrigin = "anonymous";

    let done = 0;
    const checkDone = () => {
      done++;
      if (done === 2) {
        originalImgRef.current = origImg;
        resultImgRef.current = resImg;
        setLoaded(true);
        draw();
      }
    };

    origImg.onload = checkDone;
    resImg.onload = checkDone;
    origImg.src = originalUrl;
    resImg.src = resultUrl;
  }, [originalUrl, resultUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redraw on slider/bg change
  useEffect(() => {
    if (loaded) draw();
  }, [draw, loaded]);

  // Slider interaction
  const handleMove = useCallback((clientX: number) => {
    if (!wrapperRef.current || !isDragging) return;
    const rect = wrapperRef.current.getBoundingClientRect();
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

  return (
    <div
      ref={wrapperRef}
      className="relative cursor-col-resize bg-gray-100"
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-auto"
        style={{ maxWidth: "100%" }}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
