import { useState } from 'react';

/** 图片预览组件（带缩放） */
interface ImagePreviewProps {
  src: string;
  alt: string;
}

export default function ImagePreview({ src, alt }: ImagePreviewProps) {
  const [scale, setScale] = useState(1);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 3));
  };

  return (
    <div className="flex h-full items-center justify-center overflow-hidden">
      <div
        className="max-h-full max-w-full transition-transform"
        style={{ transform: `scale(${scale})` }}
        onWheel={handleWheel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-[500px] max-w-full object-contain" />
      </div>
    </div>
  );
}
