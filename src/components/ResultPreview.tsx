"use client";

interface ResultPreviewProps {
  originalUrl: string;
  resultUrl: string;
  processing: boolean;
}

export default function ResultPreview({ originalUrl, resultUrl, processing }: ResultPreviewProps) {
  if (!originalUrl) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Original</h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <img
              src={originalUrl}
              alt="Original"
              className="w-full h-auto max-h-80 object-contain"
            />
          </div>
        </div>

        {/* Result */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Background Removed</h3>
          <div
            className="border border-gray-200 rounded-xl overflow-hidden"
            style={{
              backgroundImage: "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 25%, transparent 50%, #e5e7eb 50%, #e5e7eb 75%, transparent 75%, transparent)",
              backgroundSize: "16px 16px",
            }}
          >
            {processing ? (
              <div className="w-full h-80 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 text-sm">Processing...</p>
                </div>
              </div>
            ) : resultUrl ? (
              <img
                src={resultUrl}
                alt="Result"
                className="w-full h-auto max-h-80 object-contain"
              />
            ) : (
              <div className="w-full h-80 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Waiting for processing...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download button */}
      {resultUrl && !processing && (
        <div className="flex justify-center mt-6">
          <button
            className="bg-green-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-600 transition flex items-center gap-2"
            onClick={() => {
              const a = document.createElement("a");
              a.href = resultUrl;
              a.download = "bgfree-result.png";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m9 0l4.5-4.5M3.75 21h16.5" />
            </svg>
            Download PNG
          </button>
        </div>
      )}
    </div>
  );
}
