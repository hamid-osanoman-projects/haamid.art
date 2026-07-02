'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Disc3, SkipBack, SkipForward, Music2 } from 'lucide-react';

const TRACKS = [
  { id: 'detox', title: 'Digital Detox', subtitle: 'Music', src: '/sounds/Digital Detox.mp3' },
  { id: 'divine', title: 'Divine', subtitle: 'Music', src: '/sounds/Divine.mp3' },
  { id: 'cortisol', title: 'Morning Cortisol', subtitle: 'Music', src: '/sounds/Morning cortisol.mp3' }
];

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIdx];

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Catch potential autoplay errors if file doesn't exist
      audioRef.current.play().catch((err) => {
        console.warn(`Audio file not found or playback blocked. Please ensure '${currentTrack.src}' is in the public folder.`, err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTrackIdx((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTrackIdx((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  // Play automatically when track changes if it was already playing
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIdx]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Sync state if audio ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => {
      // Auto-play next track
      setCurrentTrackIdx((prev) => (prev + 1) % TRACKS.length);
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end justify-end select-none">
      
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={currentTrack.src} preload="none" />

      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-4 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 p-2 shadow-2xl transition-all duration-500 ease-out cursor-pointer
          ${isExpanded ? 'rounded-2xl pr-6 w-72' : 'rounded-full w-14 h-14 justify-center hover:bg-zinc-800/80 hover:scale-105 active:scale-95'}
        `}
      >
        
        {/* Spinning Vinyl Cover */}
        <div 
          onClick={isExpanded ? togglePlay : undefined}
          className={`
            relative flex-shrink-0 flex items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden transition-all duration-500
            ${isExpanded ? 'w-12 h-12 cursor-pointer hover:scale-105' : 'w-10 h-10'}
            ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-emerald-500/20 mix-blend-overlay" />
          <Disc3 className={`text-zinc-600 ${isExpanded ? 'w-5 h-5' : 'w-4 h-4'}`} />
          
          {/* Center Hole */}
          <div className="absolute w-2 h-2 bg-zinc-900 rounded-full border border-zinc-700" />
        </div>

        {/* Expanded Controls */}
        <div 
          className={`
            flex flex-col flex-grow overflow-hidden transition-all duration-500
            ${isExpanded ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 translate-x-4 w-0 hidden'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col max-w-[120px]">
              <p className="text-xs font-bold text-zinc-200 truncate font-mono tracking-wider" title={currentTrack.title}>
                {currentTrack.title}
              </p>
              <p className="text-[10px] text-emerald-500/80 truncate font-mono">
                {currentTrack.subtitle}
              </p>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={prevTrack}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="text-zinc-300 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-full"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button 
                onClick={nextTrack}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-zinc-800 mx-1" />

              <button 
                onClick={toggleMute}
                className="text-zinc-500 hover:text-white transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
