'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseWebRTCProps {
  roomId: string;
  userId: string;
  onPeerLeft?: () => void;
}

export function useWebRTC({ roomId, userId, onPeerLeft }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<any>(null);
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const supabase = createClient();

  const initCall = useCallback(async () => {
    try {
      // 1. Get local media (optimized for low bandwidth)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15, max: 24 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
      } catch (mediaErr: any) {
        console.warn('Primary media request failed:', mediaErr);
        if (mediaErr.name === 'NotReadableError' || mediaErr.message.includes('Device in use')) {
          // Fallback 1: Try audio only
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setError('Camera is in use by another tab. Joined with audio only.');
          } catch (audioErr) {
            // Fallback 2: No media (receive only)
            console.warn('Audio also in use. Joining receive-only.');
            stream = new MediaStream();
            setError('Camera & Mic are in use by another tab. You are in receive-only mode.');
          }
        } else {
          throw mediaErr;
        }
      }
      
      setLocalStream(stream);
      streamRef.current = stream;

      // 2. Setup RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });
      peerConnection.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setIsConnecting(false);
      };

      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setError('Connection lost. Please try reconnecting.');
        } else if (pc.iceConnectionState === 'connected') {
          setIsConnecting(false);
          setError(null);
        }
      };

      // 3. Setup Supabase Signaling Channel
      const signalingChannel = supabase.channel(`p2p-${roomId}`, {
        config: { broadcast: { self: false } }
      });
      channel.current = signalingChannel;

      // Listen for signaling messages
      signalingChannel.on('broadcast', { event: 'signaling' }, async ({ payload }) => {
        const { type, data, senderId } = payload;
        if (senderId === userId) return; // ignore self

        try {
          if (type === 'offer') {
            const offerCollision = data.type === 'offer' && (makingOffer.current || pc.signalingState !== 'stable');
            // Polite peer logic based on userId comparison to resolve glare
            const isPolite = userId > senderId; 
            
            ignoreOffer.current = !isPolite && offerCollision;
            if (ignoreOffer.current) return;

            await pc.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            signalingChannel.send({
              type: 'broadcast',
              event: 'signaling',
              payload: { type: 'answer', data: pc.localDescription, senderId: userId }
            });
          } else if (type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data));
          } else if (type === 'ice-candidate') {
            try {
              await pc.addIceCandidate(data ? new RTCIceCandidate(data) : undefined);
            } catch (err) {
              if (!ignoreOffer.current) {
                console.warn('Failed to add ICE candidate', err);
              }
            }
          } else if (type === 'peer-joined') {
            // A new peer joined, let's create and send an offer
            makingOffer.current = true;
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              signalingChannel.send({
                type: 'broadcast',
                event: 'signaling',
                payload: { type: 'offer', data: pc.localDescription, senderId: userId }
              });
            } finally {
              makingOffer.current = false;
            }
          } else if (type === 'peer-left') {
            if (onPeerLeft) onPeerLeft();
          }
        } catch (err) {
          console.error('Signaling error:', err);
        }
      });

      // Send local ICE candidates to the remote peer
      pc.onicecandidate = (event) => {
        signalingChannel.send({
          type: 'broadcast',
          event: 'signaling',
          payload: { type: 'ice-candidate', data: event.candidate, senderId: userId }
        });
      };

      // Join the channel
      await signalingChannel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Broadcast that we just joined so the other peer (if already there) can send an offer
          signalingChannel.send({
            type: 'broadcast',
            event: 'signaling',
            payload: { type: 'peer-joined', senderId: userId }
          });
        }
      });

    } catch (err: any) {
      console.error('Failed to init WebRTC:', err);
      setError(err.message || 'Failed to access camera and microphone.');
      setIsConnecting(false);
    }
  }, [roomId, userId, supabase]);

  useEffect(() => {
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (channel.current) {
        supabase.removeChannel(channel.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on unmount

  const endCall = () => {
    if (channel.current) {
      channel.current.send({
        type: 'broadcast',
        event: 'signaling',
        payload: { type: 'peer-left', senderId: userId }
      });
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
  };

  const toggleAudio = (enabled: boolean) => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  };

  const toggleVideo = (enabled: boolean) => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  };

  return {
    localStream,
    remoteStream,
    isConnecting,
    error,
    initCall,
    endCall,
    toggleAudio,
    toggleVideo
  };
}
