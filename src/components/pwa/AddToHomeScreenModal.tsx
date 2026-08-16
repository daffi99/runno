import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  X,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  CheckCircle2,
  Sparkles,
  Zap,
  WifiOff,
  Layers,
} from 'lucide-react';

interface AddToHomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInstallable: boolean;
  onTriggerInstall: () => Promise<void>;
}

export const AddToHomeScreenModal: React.FC<AddToHomeScreenModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isInstallable,
  onTriggerInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 bg-white rounded-3xl border border-neutral-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF5500] to-[#E64D00] p-0.5 shadow-md flex items-center justify-center">
              <img
                src="/apple-touch-icon.png"
                alt="Runno Icon"
                className="w-10 h-10 rounded-[14px] object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900 tracking-tight flex items-center gap-1.5">
                <span>Add to Home Screen</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-[#FF5500]">
                  PWA
                </span>
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Install Runno for full-screen experience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="p-2 rounded-2xl bg-orange-50/70 border border-orange-100 text-center space-y-1">
            <Zap className="w-4 h-4 text-[#FF5500] mx-auto" />
            <span className="text-[10px] font-bold text-neutral-800 block">Instant Launch</span>
          </div>
          <div className="p-2 rounded-2xl bg-blue-50/70 border border-blue-100 text-center space-y-1">
            <Smartphone className="w-4 h-4 text-blue-600 mx-auto" />
            <span className="text-[10px] font-bold text-neutral-800 block">Full Screen</span>
          </div>
          <div className="p-2 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center space-y-1">
            <WifiOff className="w-4 h-4 text-emerald-600 mx-auto" />
            <span className="text-[10px] font-bold text-neutral-800 block">Offline Ready</span>
          </div>
        </div>

        {/* Step by step instructions based on device */}
        {isIOS ? (
          <div className="space-y-2.5 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80 text-xs">
            <div className="font-bold text-neutral-800 flex items-center gap-1.5 pb-1 border-b border-neutral-200/60">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>How to add on iOS (Safari / Chrome):</span>
            </div>

            <div className="space-y-2 text-neutral-600 text-[11.5px] leading-relaxed">
              <div className="flex items-center space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="text-neutral-900 font-semibold inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 text-blue-600 inline" /></strong> button in the browser toolbar.
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-neutral-900 font-semibold inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 text-neutral-700 inline" /></strong>.
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                  3
                </span>
                <span>
                  Tap <strong className="text-neutral-900 font-semibold">Add</strong> at top right to install Runno icon!
                </span>
              </div>
            </div>
          </div>
        ) : isInstallable ? (
          <div className="space-y-3">
            <p className="text-xs text-neutral-600 leading-relaxed">
              Click the button below to add Runno to your device's home screen or desktop application list.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={onTriggerInstall}
              leftIcon={<PlusSquare className="w-4 h-4" />}
              className="w-full font-bold text-xs bg-[#FF5500] hover:bg-[#E64D00] shadow-glow-orange py-3"
            >
              Install Runno App
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80 text-xs">
            <div className="font-bold text-neutral-800 flex items-center gap-1.5 pb-1 border-b border-neutral-200/60">
              <MoreVertical className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>How to add on Android / Chrome:</span>
            </div>

            <div className="space-y-2 text-neutral-600 text-[11.5px]">
              <div className="flex items-center space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="text-neutral-900 font-semibold">3 dots (⋮)</strong> menu in Chrome.
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <span>
                  Select <strong className="text-neutral-900 font-semibold">"Install app"</strong> or <strong className="text-neutral-900 font-semibold">"Add to Home screen"</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-1">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="w-full font-bold text-xs"
          >
            Got it
          </Button>
        </div>
      </Card>
    </div>
  );
};
