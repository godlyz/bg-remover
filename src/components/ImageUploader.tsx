"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onFileSelect, disabled }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string>("");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setDragError("");
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        setDragError("File size must be under 10MB");
        return;
      }

      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setDragError("Only JPG, PNG, and WebP formats are supported");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 10 * 1024 * 1024,
    disabled,
    multiple: false,
  });

  const dropzoneClass = isDragActive
    ? "border-blue-500 bg-blue-50"
    : isDragReject
    ? "border-red-500 bg-red-50"
    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${dropzoneClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <svg
          className="w-12 h-12 text-gray-400 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-1.41C5.25 18 4.75 18 4.75 18H3.75a.75.75 0 01-.75-.75V6.75a.75.75 0 01.75-.75h1a4.5 4.5 0 011.41 1.41A4.5 4.5 0 009 9.75v6.75a.75.75 0 01.75.75zm0 0v-6.75a3 3 0 00-3-3h-1a3 3 0 00-3 3v6.75a.75.75 0 01.75.75zm6-4.5V4.5a.75.75 0 00-.75-.75h-1a3 3 0 00-3 3v9a.75.75 0 00.75.75zm0 0v-9a3 3 0 013-3h1a.75.75 0 01.75.75z"
          />
        </svg>
        {isDragActive ? (
          <p className="text-blue-500 font-medium">Drop your image here...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">
              Drag & drop an image here, or click to select
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Supports JPG, PNG, WebP · Max 10MB
            </p>
          </>
        )}
        {dragError && (
          <p className="text-red-500 text-sm mt-2">{dragError}</p>
        )}
      </div>

      {preview && (
        <div className="mt-4 flex justify-center">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 rounded-lg border border-gray-200 object-contain"
          />
        </div>
      )}
    </div>
  );
}
