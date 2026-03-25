"use client";

import { useState } from "react";
import Header from "@/components/Header";
import ImageUploader from "@/components/ImageUploader";
import ResultPreview from "@/components/ResultPreview";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResultUrl("");
    setError("");
    setOriginalUrl(URL.createObjectURL(file));
  };

  const handleRemoveBg = async () => {
    if (!selectedFile || processing) return;
    setProcessing(true);
    setError("");

    try {
      // M3 会替换为真正的 @imgly/background-removal 调用
      // 目前 placeholder：直接返回原图作为演示
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setResultUrl(originalUrl);
    } catch (err) {
      setError("Failed to process image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Remove Image Background
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Free, fast, and no signup required. Upload an image and let AI do the rest.
          </p>
        </div>

        {/* Upload */}
        <ImageUploader
          onFileSelect={handleFileSelect}
          disabled={processing}
        />

        {/* Process Button */}
        {selectedFile && !resultUrl && (
          <div className="mt-6">
            <button
              onClick={handleRemoveBg}
              disabled={processing}
              className="bg-blue-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12c0-1.006.03-2.056.091-3.065.14a4.5 4.5 0 005.106 4.42l.983 1.686zM14.25 12c0 1.006-.03 2.056-.091 3.065a4.5 4.5 0 01-5.106 4.42l-.983-1.686L15 9.75V15" />
                  </svg>
                  Remove Background
                </>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mt-4">{error}</p>
        )}

        {/* Result Preview */}
        <ResultPreview
          originalUrl={originalUrl}
          resultUrl={resultUrl}
          processing={processing}
        />

        {/* Features */}
        {!selectedFile && (
          <div className="mt-16 w-full max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Upload</h3>
                <p className="text-gray-500 text-sm mt-1">Drag & drop or click to upload your image</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.504.05-.748.09-.74.137-1.512.32-2.228.493-2.97L9.75 3.104z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">AI Processing</h3>
                <p className="text-gray-500 text-sm mt-1">AI automatically removes the background</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m9 0l4.5-4.5" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Download</h3>
                <p className="text-gray-500 text-sm mt-1">Get your transparent PNG instantly</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-gray-400 text-sm">&copy; 2026 BGFree</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-gray-600 text-sm no-underline">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-gray-600 text-sm no-underline">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
