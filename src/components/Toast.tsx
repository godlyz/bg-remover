import { useEffect } from 'react';

/** Toast 提示组件 */
interface ToastProps {
  message: string | null;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed right-4 top-4 z-50 animate-fade-in">
      <div className="rounded-md bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}
