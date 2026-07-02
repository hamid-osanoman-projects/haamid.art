'use client';

import React, {
  useState, useEffect, useRef, useCallback, DragEvent,
} from 'react';
import {
  X, Copy, Download, RefreshCw, Upload, CheckCheck, Sliders,
} from 'lucide-react';

interface ColorTheme {
  label: string;
  textClass: string;
  hex: string;
  bg: string;
}

// For a dark theme (white text on black bg):
// Dark pixels (0) -> ' ' (shows black bg)
// Bright pixels (255) -> '@' (shows dense white text)
const DENSITY_RAMP     = ' .:-=+*#%@';

const THEMES: ColorTheme[] = [
  { label: 'Classic',  textClass: 'text-zinc-100',   hex: '#f4f4f5', bg: '#09090b' },
  { label: 'Matrix',   textClass: 'text-emerald-400', hex: '#34d399', bg: '#022c22' },
  { label: 'Cyan',     textClass: 'text-cyan-400',    hex: '#22d3ee', bg: '#083344' },
  { label: 'Purple',   textClass: 'text-purple-400',  hex: '#c084fc', bg: '#1a0030' },
];

const DEFAULT_WIDTH = 100;
const MIN_WIDTH     = 40;
const MAX_WIDTH     = 150;
const DEFAULT_IMAGE = '/hamid-profile.png';

function imageToAscii(
  img: HTMLImageElement,
  charWidth: number,
): string {
  const ramp = DENSITY_RAMP;
  // Font aspect ratio compensation (Courier New is typically ~0.5)
  const aspectRatio = img.naturalHeight / img.naturalWidth;
  const charHeight  = Math.round(charWidth * aspectRatio * 0.5);

  const canvas = document.createElement('canvas');
  canvas.width  = charWidth;
  canvas.height = charHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, charWidth, charHeight);

  const { data } = ctx.getImageData(0, 0, charWidth, charHeight);
  
  // 1. Find min and max brightness for auto-contrast (histogram stretching)
  let minB = 255;
  let maxB = 0;
  for (let i = 0; i < data.length; i += 4) {
    const b = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
    if (b < minB) minB = b;
    if (b > maxB) maxB = b;
  }
  // Avoid division by zero if image is flat
  if (maxB === minB) {
    maxB = 255;
    minB = 0;
  }

  // 2. Map stretched brightness to ASCII ramp
  let output = '';
  for (let row = 0; row < charHeight; row++) {
    for (let col = 0; col < charWidth; col++) {
      const i = (row * charWidth + col) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const originalBrightness = r * 0.3 + g * 0.59 + b * 0.11;
      
      // Stretch contrast so darkest pixel is 0 and brightest is 255
      const stretched = ((originalBrightness - minB) / (maxB - minB)) * 255;
      
      // Apply a slight gamma curve (1.2) to boost midtones for clearer ASCII
      const gammaCorrected = 255 * Math.pow(stretched / 255, 1 / 1.2);

      let idx = Math.floor((gammaCorrected / 255) * (ramp.length - 1));
      idx = Math.max(0, Math.min(idx, ramp.length - 1)); // clamp
      
      output += ramp[idx];
    }
    output += '\n';
  }
  return output;
}

function WindowChrome({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClose}
        className="h-3.5 w-3.5 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors cursor-pointer border-none"
        title="Close"
      />
      <span className="h-3.5 w-3.5 rounded-full bg-amber-500/60 cursor-default" />
      <span className="h-3.5 w-3.5 rounded-full bg-emerald-500/60 cursor-default" />
    </div>
  );
}

interface AsciiArtGeneratorProps {
  standalone?: boolean;
  onClose?: () => void;
}

export default function AsciiArtGenerator({
  standalone = false,
  onClose,
}: AsciiArtGeneratorProps) {
  const [ascii, setAscii]           = useState('');
  const [charWidth, setCharWidth]   = useState(DEFAULT_WIDTH);
  const [themeIdx, setThemeIdx]     = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [fileName, setFileName]     = useState('hamid-profile.png');

  const imgRef    = useRef<HTMLImageElement | null>(null);
  const preRef    = useRef<HTMLPreElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const theme = THEMES[themeIdx];

  const generate = useCallback(() => {
    if (!imgRef.current) return;
    setAscii(imageToAscii(imgRef.current, charWidth));
  }, [charWidth]);

  const loadDefaultImage = useCallback(() => {
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = DEFAULT_IMAGE;
    img.onload = () => {
      imgRef.current = img;
      setIsLoading(false);
    };
    img.onerror = () => setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDefaultImage();
  }, [loadDefaultImage]);

  useEffect(() => {
    if (!isLoading && imgRef.current) generate();
  }, [charWidth, generate, isLoading]);

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setFileName(file.name);
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setIsLoading(false);
        setAscii(imageToAscii(img, charWidth));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ascii);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!preRef.current || !ascii) return;

    const lines    = ascii.split('\n');
    const cols     = lines[0]?.length ?? charWidth;
    const fontSize = 8;
    const lineH    = fontSize + 1;
    const padX     = 16;
    const padY     = 16;

    const canvas   = document.createElement('canvas');
    canvas.width   = cols * (fontSize * 0.6) + padX * 2;
    canvas.height  = lines.length * lineH + padY * 2;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle  = theme.hex;
    ctx.font       = `${fontSize}px "Courier New", monospace`;
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      ctx.fillText(line, padX, padY + i * lineH);
    });

    const link    = document.createElement('a');
    link.download = `ascii-${fileName.replace(/\.[^.]+$/, '')}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  };

  const containerClass = standalone
    ? 'w-full min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#09090b]'
    : 'fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4';

  return (
    <div className={containerClass}>
      <div
        className={`
          flex flex-col bg-[#09090b] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/80
          w-full max-w-6xl max-h-[95vh] ${standalone ? 'h-[85vh]' : ''}
        `}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <WindowChrome onClose={standalone ? undefined : onClose} />
            <span className="text-[11px] text-zinc-500 font-mono font-bold ml-1 tracking-wider">
              ascii-art-generator.tsx
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
            <span className="text-zinc-700">src:</span>
            <span className="text-zinc-400 max-w-[140px] truncate">{fileName}</span>
          </div>

          {(onClose || standalone) && (
            <button
              onClick={() => {
                if (onClose) onClose();
                else if (standalone) {
                  if (window.history.length > 1) window.history.back();
                  else window.location.href = '/tools';
                }
              }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          <div className="w-full lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950/40 flex flex-col gap-0 overflow-y-auto">
            <div className="p-4 border-b border-zinc-800/60">
              <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest mb-3">
                Image Source
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
                  ${isDragging
                    ? 'border-purple-500/70 bg-purple-500/5'
                    : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 hover:bg-zinc-900/60'}
                `}
              >
                <Upload className="h-5 w-5 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 text-center leading-relaxed font-mono">
                  Drop image or<br />click to upload
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
              <button
                onClick={() => {
                  setFileName('hamid-profile.png');
                  loadDefaultImage();
                }}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] text-zinc-600 hover:text-purple-400 transition-colors font-mono py-1.5 cursor-pointer bg-transparent border-none"
              >
                <RefreshCw className="h-3 w-3" />
                Reset to default photo
              </button>
            </div>

            <div className="p-4 border-b border-zinc-800/60">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sliders className="h-3 w-3" />
                  Resolution
                </p>
                <span className="font-mono text-xs font-bold text-purple-400">{charWidth}</span>
              </div>
              <input
                type="range"
                min={MIN_WIDTH}
                max={MAX_WIDTH}
                value={charWidth}
                onChange={(e) => setCharWidth(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-800 accent-purple-500"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-zinc-700 font-mono">{MIN_WIDTH}</span>
                <span className="text-[9px] text-zinc-700 font-mono">{MAX_WIDTH}</span>
              </div>
            </div>

            <div className="p-4 border-b border-zinc-800/60">
              <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest mb-3">
                Color Theme
              </p>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setThemeIdx(i)}
                    className={`
                      px-3 py-2 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer
                      ${themeIdx === i
                        ? 'border-purple-500/60 bg-purple-500/10 text-purple-300'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}
                    `}
                  >
                    <span style={{ color: t.hex }}>■</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 mt-auto">
              <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest mb-3">
                Export
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!ascii}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
                >
                  {copied ? (
                    <><CheckCheck className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy ASCII Text</>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!ascii}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-700/30 text-xs font-mono font-bold text-white transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PNG
                </button>
              </div>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800"
            style={{ backgroundColor: theme.bg }}
          >
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-600">
                <div className="font-mono text-xs animate-pulse">Rendering ASCII...</div>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : ascii ? (
              <pre
                ref={preRef}
                className={`font-mono leading-none tracking-widest text-[7px] sm:text-[8px] font-bold select-text whitespace-pre ${theme.textClass}`}
                style={{ 
                  fontFamily: '"Courier New", "Lucida Console", monospace',
                  textShadow: `0 0 10px ${theme.hex}40` // Subtle premium glow matching the theme
                }}
              >
                {ascii}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-700 font-mono text-xs">
                <span className="text-3xl">⚡</span>
                <span>Upload an image to generate ASCII art</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 bg-zinc-950/80 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-zinc-600">
              chars: <span className="text-zinc-400">{ascii.length.toLocaleString()}</span>
            </span>
            <span className="text-[9px] font-mono text-zinc-600">
              width: <span className="text-zinc-400">{charWidth}</span>
            </span>
            <span className="text-[9px] font-mono text-zinc-600">
              theme: <span className="text-zinc-400">{theme.label}</span>
            </span>
          </div>
          <span className="text-[9px] font-mono text-zinc-700">
            haaamid.art/tools/ascii
          </span>
        </div>
      </div>
    </div>
  );
}