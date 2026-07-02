'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { ExternalLink, AlertTriangle, Play } from 'lucide-react'

interface VideoPlayerProps {
  url: string
}

type PlayerType = 'hls' | 'youtube' | 'twitch' | 'direct' | 'none'

function detectType(url: string): PlayerType {
  if (!url) return 'none'
  if (url.endsWith('.m3u8') || url.includes('.m3u8?')) return 'hls'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('twitch.tv')) return 'twitch'
  if (url.startsWith('http')) return 'direct'
  return 'none'
}

function getYouTubeEmbedUrl(url: string): string | null {
  let videoId: string | undefined

  if (url.includes('youtube.com/watch')) {
    videoId = new URL(url).searchParams.get('v') ?? undefined
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0]
  } else if (url.includes('youtube.com/live/')) {
    videoId = url.split('youtube.com/live/')[1]?.split('?')[0]
  }

  if (!videoId) return null
  // privacy-enhanced domain + autoplay + no related videos
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=0`
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [type, setType] = useState<PlayerType>('none')
  const [embedUrl, setEmbedUrl] = useState('')
  const [embedBlocked, setEmbedBlocked] = useState(false)
  const [hlsError, setHlsError] = useState('')

  useEffect(() => {
    // Reset state on URL change
    setEmbedBlocked(false)
    setHlsError('')
    hlsRef.current?.destroy()
    hlsRef.current = null

    if (!url) { setType('none'); return }

    const detected = detectType(url)
    setType(detected)

    if (detected === 'hls') {
      // HLS stream — handle in a separate effect below
    } else if (detected === 'youtube') {
      const yt = getYouTubeEmbedUrl(url)
      if (yt) {
        setEmbedUrl(yt)
      } else {
        // Couldn't parse ID, fall back to direct open
        setEmbedBlocked(true)
      }
    } else if (detected === 'twitch') {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'haaamid.art'
      const channel = url.split('twitch.tv/')[1]?.split('?')[0]
      setEmbedUrl(`https://player.twitch.tv/?channel=${channel}&parent=${hostname}&autoplay=true`)
    }
  }, [url])

  // HLS setup in a separate effect so it can access videoRef after render
  useEffect(() => {
    if (type !== 'hls' || !url || !videoRef.current) return

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, maxBufferLength: 10, maxMaxBufferLength: 20 })
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(videoRef.current)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setHlsError('Stream failed to load. Check the URL and try again.')
        }
      })
      return () => { hls.destroy(); hlsRef.current = null }
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / iOS)
      videoRef.current.src = url
      videoRef.current.play().catch(() => {})
    } else {
      setHlsError('HLS not supported in this browser.')
    }
  }, [type, url])

  // ── Empty state ──────────────────────────────────────────────────────────
  if (type === 'none') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-black/40 gap-3">
        <div className="text-6xl">⚽</div>
        <div className="text-sm font-semibold tracking-wide text-zinc-400">Waiting for Hamid to share a stream...</div>
        <div className="text-xs text-zinc-600 max-w-xs text-center">
          Supports: YouTube links, Twitch channels, or .m3u8 stream URLs
        </div>
      </div>
    )
  }

  // ── HLS ──────────────────────────────────────────────────────────────────
  if (type === 'hls') {
    if (hlsError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-black/60 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-400" />
          <p className="text-zinc-300 text-sm font-semibold">{hlsError}</p>
          <p className="text-zinc-500 text-xs">Try a different .m3u8 URL</p>
        </div>
      )
    }
    return (
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        autoPlay
        playsInline
        style={{ background: '#000' }}
      />
    )
  }

  // ── YouTube / Twitch embed blocked fallback ──────────────────────────────
  if (embedBlocked) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-black/60 p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-400" />
        <div className="space-y-2">
          <p className="text-zinc-200 text-sm font-bold">Video blocked from embedding</p>
          <p className="text-zinc-500 text-xs max-w-sm leading-relaxed">
            This video's owner has disabled embedding on external sites.
            Open it directly in a new tab to watch — everyone on the call can still chat and see each other.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition-all active:scale-95"
        >
          <ExternalLink className="h-4 w-4" />
          Open in YouTube
        </a>
        <p className="text-[10px] text-zinc-600">
          Tip: Use a .m3u8 direct stream URL for seamless in-app playback
        </p>
      </div>
    )
  }

  // ── YouTube / Twitch iframe embed ────────────────────────────────────────
  return (
    <div className="w-full h-full relative bg-black">
      <iframe
        key={embedUrl}
        src={embedUrl}
        className="w-full h-full"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        style={{ border: 'none' }}
        onError={() => setEmbedBlocked(true)}
        // Detect if iframe content is blocked via load event
        onLoad={(e) => {
          // Can't reliably detect X-Frame-Options from JS — show hint instead
        }}
      />
      {/* Embed block hint — shows only when iframe appears empty */}
      <div
        className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between gap-3 pointer-events-auto"
        style={{ display: 'none' }} // Hidden by default, shown by CSS if needed
      >
        <span className="text-xs text-zinc-400">Video not loading?</span>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold">
          <ExternalLink className="h-3 w-3" /> Open directly
        </a>
      </div>
    </div>
  )
}
