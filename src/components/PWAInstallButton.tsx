import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#9F2089]/10 hover:bg-[#9F2089] text-[#9F2089] hover:text-white border border-[#9F2089]/25 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#EAEAEF] text-[#353543] hover:border-[#9F2089] hover:text-[#9F2089] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-[#EAEAEF] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#353543]">
                  Install Meesho Web App
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[#616173] hover:text-[#353543] cursor-pointer"
                  aria-label="Close install instructions"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[#616173] leading-relaxed">
                1. Tap the{' '}
                <strong className="inline-flex items-center gap-1 text-[#353543]">
                  <Share className="w-3.5 h-3.5 text-[#9F2089]" /> Share
                </strong>{' '}
                button in Safari&apos;s toolbar.
                <br />
                2. Scroll down and tap{' '}
                <strong className="text-[#353543]">Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-[#9F2089] hover:bg-[#831871] text-white text-sm font-bold rounded-md cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
