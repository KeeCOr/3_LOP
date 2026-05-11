'use client';
import { useEffect, useState } from 'react';

export default function PwaInit() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    // Only show rotate prompt on touch devices (mobile)
    const isMobile = () => window.matchMedia('(pointer: coarse)').matches;

    const check = () => {
      setIsPortrait(isMobile() && window.innerHeight > window.innerWidth);
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="text-6xl" style={{ animation: 'spin90 1.5s ease-in-out infinite alternate' }}>📱</div>
      <div className="text-white text-xl font-bold">화면을 가로로 돌려주세요</div>
      <div className="text-gray-400 text-sm">가로 모드에서 플레이 가능합니다</div>
      <style>{`
        @keyframes spin90 {
          from { transform: rotate(0deg); }
          to   { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}
