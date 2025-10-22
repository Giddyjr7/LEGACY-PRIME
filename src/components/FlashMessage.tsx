import { useEffect } from 'react';

type FlashMessageProps = {
  message: string;
  onClose?: () => void;
  duration?: number; // ms
};

export default function FlashMessage({ message, onClose, duration = 10000 }: FlashMessageProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className="fixed left-1/2 top-6 z-50 w-[min(720px,90%)] -translate-x-1/2 rounded-lg border border-crypto-purple bg-crypto-purple px-4 py-3 shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium text-white">{message}</div>
        <button
          onClick={() => onClose && onClose()}
          className="text-white/90 opacity-90 hover:opacity-100 text-sm"
          aria-label="Dismiss message"
        >
          ×
        </button>
      </div>
    </div>
  );
}
