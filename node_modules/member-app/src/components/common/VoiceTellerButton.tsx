import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  speakText,
  stopSpeaking,
  buildPassbookSpeechText,
  buildReceiptSpeechText,
  PassbookSpeechOptions,
  ReceiptSpeechOptions,
} from '../../lib/audioTeller';

interface VoiceTellerButtonProps {
  mode?: 'passbook' | 'receipt';
  passbookData?: PassbookSpeechOptions;
  receiptData?: ReceiptSpeechOptions;
  customText?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceTellerButton: React.FC<VoiceTellerButtonProps> = ({
  mode = 'passbook',
  passbookData,
  receiptData,
  customText,
  className = '',
  size = 'md',
}) => {
  const { i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    // Default to Hindi unless Marathi is explicitly selected
    const audioLang = i18n.language === 'mr' ? 'mr' : 'hi';
    let textToSpeak = customText || '';

    if (!textToSpeak) {
      if (mode === 'receipt' && receiptData) {
        textToSpeak = buildReceiptSpeechText({
          ...receiptData,
          lang: audioLang,
        });
      } else if (passbookData) {
        textToSpeak = buildPassbookSpeechText({
          ...passbookData,
          lang: audioLang,
        });
      }
    }

    if (!textToSpeak) return;

    speakText(
      textToSpeak,
      audioLang,
      () => setIsPlaying(true),
      () => setIsPlaying(false),
      () => setIsPlaying(false)
    );
  };

  const audioLang = i18n.language === 'mr' ? 'mr' : 'hi';
  const label = isPlaying
    ? audioLang === 'mr'
      ? 'थांबवा (Stop)'
      : 'रोकें (Stop)'
    : audioLang === 'mr'
    ? 'पासबुक ऐका'
    : 'सुनो पासबुक';

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-[11px] gap-1'
      : size === 'lg'
      ? 'px-4 py-2.5 text-sm gap-2'
      : 'px-3 py-1.5 text-xs gap-1.5';

  return (
    <button
      type="button"
      onClick={handleTogglePlay}
      className={`relative inline-flex items-center font-heading font-bold rounded-2xl transition-all cursor-pointer shadow-subtle select-none ${
        isPlaying
          ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse ring-2 ring-amber-300'
          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
      } ${sizeClasses} ${className}`}
      title={isPlaying ? 'Click to stop Hindi audio' : 'सुनो पासबुक (हिंदी ऑडियो)'}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3.5 h-3.5 shrink-0" />
          <span>{label}</span>
          <span className="flex h-2 w-2 relative ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span>{label}</span>
          <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold">
            {audioLang === 'mr' ? 'मराठी' : 'हिंदी'}
          </span>
        </>
      )}
    </button>
  );
};

export default VoiceTellerButton;
