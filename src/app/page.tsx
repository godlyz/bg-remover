"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import ImageUploader from "@/components/ImageUploader";
import ResultPreview from "@/components/ResultPreview";
import EngineSwitcher, { EngineType } from "@/components/EngineSwitcher";
import PrivacyConfirm from "@/components/PrivacyConfirm";
import { ToastProvider, useToast } from "@/components/Toast";

function HomeContent() {
  const { showToast } = useToast();
  const [engine, setEngine] = useState<EngineType>("local");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [pendingEngine, setPendingEngine] = useState<EngineType | null>(null);

  // Image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  // Progress state
  const [progress, setProgress] = useState({ label: "", percent: 0, detail: "" });

  const handleEngineSwitch = useCallback(
    (target: EngineType) => {
      if (target === engine || processing) return;
      if (target === "cloud") {
        setPendingEngine("cloud");
        setShowPrivacy(true);
      } else {
        setEngine("local");
        // Re-process if file selected
        if (selectedFile) {
          setResultBlob(null);
          processImage(selectedFile, "local");
        }
      }
    },
    [engine, processing, selectedFile]
  );

  const handlePrivacyConfirm = useCallback(() => {
    setShowPrivacy(false);
    if (pendingEngine) {
      setEngine(pendingEngine);
      setPendingEngine(null);
      if (selectedFile) {
        setResultBlob(null);
        processImage(selectedFile, pendingEngine);
      }
    }
  }, [pendingEngine, selectedFile]);

  const handlePrivacyCancel = useCallback(() => {
    setShowPrivacy(false);
    setPendingEngine(null);
  }, []);

  const processImage = useCallback(
    async (file: File, targetEngine: EngineType) => {
      setProcessing(true);
      setError("");
      setProgress({ label: "Initializing...", percent: 0, detail: "" });

      try {
        if (targetEngine === "cloud") {
          // Cloud engine — placeholder for M6
          showToast("info", "Pro Quality mode coming soon! Using local engine for now.");
          // Fall through to local processing
        }

        // Local engine — @imgly/background-removal (loaded from CDN)
        setProgress({ label: "Loading AI engine...", percent: 5, detail: "" });

        const { loadBgRemoval } = await import("@/utils/bgRemovalLoader");
        const removeBackground = await loadBgRemoval();

        const config = {
          publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
          debug: false,
          device: "gpu" as const,
          model: "isnet_fp16" as const,
          output: {
            format: "image/png" as const,
            quality: 0.8,
            type: "foreground" as const,
          },
        };

        const timeoutMs = 120000; // 2 minutes total timeout
        const startTime = Date.now();

        const blob = await Promise.race([
          removeBackground(file, {
            ...config,
            progress: (key: string, current: number, total: number) => {
              if (key.includes("onnx") || key.includes("wasm") || key.includes("model")) {
                const percent = total > 0 ? Math.round((current / total) * 100) : 0;
                const downloadedMB = (current / 1024 / 1024).toFixed(1);
                const totalMB = (total / 1024 / 1024).toFixed(1);
                setProgress({
                  label: "Loading AI model...",
                  percent: Math.min(percent, 95),
                  detail: total > 0 ? `${downloadedMB}MB / ${totalMB}MB` : "Downloading...",
                });
              }
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Processing timed out. Please try again.")), timeoutMs)
          ),
        ]);

        setProgress({ label: "Done!", percent: 100, detail: "" });
        setResultBlob(blob);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        showToast("success", `Background removed in ${elapsed}s`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to process image";
        setError(msg);
        showToast("error", msg);
      } finally {
        setProcessing(false);
        setProgress({ label: "", percent: 0, detail: "" });
      }
    },
    [showToast]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate size based on engine
      const maxSize = engine === "local" ? 10 * 1024 * 1024 : 12 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast("error", `File too large. Max ${maxSize / 1024 / 1024}MB for ${engine === "local" ? "free" : "pro"} mode.`);
        return;
      }

      setSelectedFile(file);
      setResultBlob(null);
      setError("");
      setOriginalUrl(URL.createObjectURL(file));

      // Auto-start processing
      processImage(file, engine);
    },
    [engine, processImage, showToast]
  );

  const handleReset = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setSelectedFile(null);
    setOriginalUrl("");
    setResultBlob(null);
    setError("");
    setProcessing(false);
  }, [originalUrl]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" onPaste={(e) => {
      // Global paste handler is in ImageUploader
    }}>
      <Header />

      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-12">
        {/* Hero */}
        {!selectedFile && (
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
              Remove Image Background
            </h1>
            <p className="text-gray-500 mt-3 text-base md:text-lg">
              Free, fast, and no signup required. Upload an image and let AI do the rest.
            </p>
          </div>
        )}

        {/* Engine Switcher */}
        <EngineSwitcher engine={engine} onSwitch={handleEngineSwitch} disabled={processing} />

        {/* Upload or Result */}
        {!resultBlob ? (
          <>
            <ImageUploader
              onFileSelect={handleFileSelect}
              disabled={processing}
              engine={engine}
            />
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

            {/* Features section */}
            {!selectedFile && (
              <div className="mt-12 w-full max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Upload</h3>
                    <p className="text-gray-500 text-sm mt-1">Drag & drop, click, or Ctrl+V paste</p>
                  </div>
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.504.05-.748.09-.74.137-1.512.32-2.228.493-2.97L9.75 3.104z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">AI Processing</h3>
                    <p className="text-gray-500 text-sm mt-1">AI removes background in seconds</p>
                  </div>
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m9 0l4.5-4.5" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Download</h3>
                    <p className="text-gray-500 text-sm mt-1">Get transparent PNG instantly</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <ResultPreview
            originalUrl={originalUrl}
            resultBlob={resultBlob}
            processing={processing}
            engine={engine}
            progress={progress.percent > 0 ? progress : undefined}
            onReset={handleReset}
          />
        )}

        {/* Footer info */}
        <div className="mt-auto pt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            {engine === "local" ? (
              <>
                <span>✅ Completely free</span>
                <span>✅ No signup</span>
                <span>✅ Image stays on your device</span>
              </>
            ) : (
              <>
                <span>✅ No signup</span>
                <span>✅ Sharper edges</span>
                <span>⚠️ Image uploaded to cloud</span>
              </>
            )}
          </div>
          <p className="text-gray-300 text-xs mt-2">
            Powered by BRIA RMBG-1.4 &amp; remove.bg API · © 2026 BGFree
          </p>
        </div>
      </main>

      {/* Privacy Confirm Modal */}
      <PrivacyConfirm
        open={showPrivacy}
        onConfirm={handlePrivacyConfirm}
        onCancel={handlePrivacyCancel}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
}
