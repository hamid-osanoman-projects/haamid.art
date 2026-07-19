'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Loader2 } from 'lucide-react';

export default function P2PRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  // Authenticate and fetch room details
  useEffect(() => {
    async function init() {
      // ── Step 1: Determine WHO is visiting ──────────────────────────────
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'hamid.codehub@gmail.com';
      const adminIsLoggedIn = !!authUser && authUser.email === ownerEmail;

      let participantData: any = null;

      if (adminIsLoggedIn) {
        participantData = { id: authUser.id, name: 'Hamid', isAdmin: true };
      } else {
        const stored = localStorage.getItem('vibe_contact');
        if (!stored) {
          router.push('/vibe');
          return;
        }
        const parsed = JSON.parse(stored);
        participantData = { id: parsed.id, name: parsed.name, isAdmin: false };
      }
      setUser(participantData);

      // ── Step 2: Load room details ───────────────────────────────────────
      const { data: roomData, error } = await supabase
        .from('vibe_rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (error || !roomData) {
        alert('Room not found or ended.');
        router.push(participantData.isAdmin ? '/vibe/lobby' : '/vibe');
        return;
      }
      
      setRoom(roomData);
      setIsLoading(false);
    }
    init();
  }, [roomId, router, supabase]);

  // Pass userId to hook once loaded
  const { 
    localStream, 
    remoteStream, 
    isConnecting, 
    error: rtcError,
    initCall,
    endCall,
    toggleAudio,
    toggleVideo
  } = useWebRTC({ 
    roomId, 
    userId: user?.id || '',
    onPeerLeft: () => {
      endCall();
      alert('The other person has ended the call.');
      router.push(user?.isAdmin ? '/vibe/lobby' : '/vibe');
    }
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleAudio = () => {
    toggleAudio(!isAudioEnabled);
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleToggleVideo = () => {
    toggleVideo(!isVideoEnabled);
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleEndCall = async () => {
    endCall(); // Instantly kill tracks and broadcast peer-left

    // If owner, end the room for everyone in DB
    if (user?.isAdmin) {
      await fetch('/api/vibe/room', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, roomName: room.room_name })
      });
      router.push('/vibe/lobby');
    } else {
      router.push('/vibe');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-6 text-center px-4 select-none">
        <div className="h-20 w-20 bg-purple-600/10 border border-purple-500/20 rounded-full flex items-center justify-center mb-4">
          <Video className="h-10 w-10 text-purple-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Join P2P Call</h1>
        <p className="text-zinc-400 text-sm max-w-sm">
          You are about to join a secure, peer-to-peer video call. Your browser will request permission to access your camera and microphone.
        </p>
        
        {rtcError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-semibold max-w-sm">
            {rtcError}
          </div>
        )}

        <button
          onClick={() => {
            setHasJoined(true);
            initCall();
          }}
          className="mt-4 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-xl shadow-purple-900/20"
        >
          Enable Camera & Join
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden select-none">
      
      {/* Remote Video (Fullscreen) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 text-zinc-500">
            <div className="h-24 w-24 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <User className="h-10 w-10 text-zinc-600" />
            </div>
            <p className="font-mono text-sm uppercase tracking-widest animate-pulse">
              {isConnecting ? 'Establishing secure P2P connection...' : 'Waiting for peer...'}
            </p>
            {rtcError && <p className="text-rose-500 text-xs">{rtcError}</p>}
          </div>
        )}
      </div>

      {/* Local Video (Picture in Picture) */}
      <div className="absolute top-6 right-6 w-32 md:w-48 aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl z-10">
        {localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
            style={{ transform: 'scaleX(-1)' }} // Mirror local video
          />
        ) : null}
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <VideoOff className="h-8 w-8 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Room Details Overlay */}
      <div className="absolute top-6 left-6 z-10 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
        <h1 className="text-white font-bold text-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {room.display_name}
        </h1>
        <p className="text-zinc-400 text-xs mt-1">P2P Encrypted Call</p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-4 rounded-full border border-white/10 shadow-2xl">
        <button
          onClick={handleToggleAudio}
          className={`p-4 rounded-full transition-all ${
            isAudioEnabled ? 'bg-zinc-800/80 hover:bg-zinc-700 text-white' : 'bg-rose-500/20 text-rose-500 border border-rose-500/50'
          }`}
        >
          {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </button>

        <button
          onClick={handleToggleVideo}
          className={`p-4 rounded-full transition-all ${
            isVideoEnabled ? 'bg-zinc-800/80 hover:bg-zinc-700 text-white' : 'bg-rose-500/20 text-rose-500 border border-rose-500/50'
          }`}
        >
          {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/50 transition-transform hover:scale-105 active:scale-95"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>

    </div>
  );
}
