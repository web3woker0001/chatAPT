"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { LiveKitRoom, VideoConference, useTracks, useLocalParticipant, useRemoteParticipants } from '@livekit/components-react'
import '@livekit/components-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import React from 'react'
import { Track, RemoteParticipant } from 'livekit-client'
import { Mic, MicOff, Video, VideoOff, LogOut } from 'lucide-react'
import { TranscriptionTile } from '@/components/chat/TranscriptionTile'

interface RoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

function RoomContent({ isConnected }: { isConnected: boolean }) {
  const { isMicrophoneEnabled, isCameraEnabled, localParticipant } = useLocalParticipant()
  const remoteParticipants = useRemoteParticipants()
  const router = useRouter()
  const [mediaError, setMediaError] = useState<string | null>(null)

  // 获取远程参与者的音频轨道
  const audioTracks = useTracks(remoteParticipants).filter(
    track => track.source === Track.Source.Microphone
  )
  const remoteAudioTrack = audioTracks[0]

  // 检查是否在安全上下文中
  const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost')

  useEffect(() => {
    // 只在安全上下文中请求媒体权限
    if (isSecureContext && navigator?.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          console.log('麦克风权限已获取')
          stream.getTracks().forEach(track => track.stop())
        })
        .catch(err => {
          console.error('麦克风权限错误:', err)
          setMediaError('无法访问麦克风。请确保您已授予权限。')
        })
    } else if (!isSecureContext) {
      console.warn('不在安全上下文中，无法访问媒体设备。请使用 HTTPS 或 localhost 访问。')
      setMediaError('请使用 HTTPS 或 localhost 访问以启用音频功能。')
    }

    // 检查音频状态和远程参与者
    if (localParticipant) {
      console.log('音频和参与者状态:', {
        isMicrophoneEnabled,
        isConnected,
        isSecureContext,
        localParticipant: {
          identity: localParticipant.identity,
          name: localParticipant.name,
        },
        remoteParticipants: remoteParticipants.map(p => ({
          identity: p.identity,
          name: p.name,
          hasAudio: p.isMicrophoneEnabled,
        })),
        audioTracks: audioTracks.map(track => ({
          sid: track.sid,
          source: track.source,
          participant: track.participant?.identity
        }))
      })
    }
  }, [localParticipant, isMicrophoneEnabled, isConnected, remoteParticipants, audioTracks, isSecureContext])

  const handleLeave = () => {
    router.push('/')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between p-4 bg-gray-100">
        <div className="flex items-center space-x-4">
          {mediaError && (
            <div className="text-sm text-red-500 bg-red-50 px-3 py-1 rounded">
              {mediaError}
            </div>
          )}
          <div className="flex items-center space-x-2">
            {isMicrophoneEnabled ? (
              <Mic className="h-5 w-5 text-green-500" />
            ) : (
              <MicOff className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm">{isMicrophoneEnabled ? 'Audio On' : 'Audio Off'}</span>
          </div>
          <div className="flex items-center space-x-2">
            {isCameraEnabled ? (
              <Video className="h-5 w-5 text-green-500" />
            ) : (
              <VideoOff className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm">{isCameraEnabled ? 'Video On' : 'Video Off'}</span>
          </div>
        </div>
        {isConnected && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeave}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Leave Room</span>
          </Button>
        )}
      </div>
      <div className="flex flex-1">
        <div className="flex-1">
          <VideoConference />
        </div>
        <div className="w-80 border-l h-full">
          <TranscriptionTile 
            accentColor="#000000" 
          />
        </div>
      </div>
    </div>
  )
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = React.use(params)
  const { roomId } = resolvedParams
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false)
  const router = useRouter()

  const handleLeave = () => {
    router.push('/')
  }

  // 检查是否在安全上下文中
  const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost')

  useEffect(() => {
    if (!isSecureContext) {
      console.warn('不在安全上下文中，无法访问媒体设备。请使用 HTTPS 或 localhost 访问。')
      return
    }

    if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          console.log('麦克风权限已获取')
          setAudioPermissionGranted(true)
          stream.getTracks().forEach(track => {
            console.log('音频轨道信息:', {
              kind: track.kind,
              label: track.label,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState
            })
            track.stop()
          })
        })
        .catch(err => {
          console.error('麦克风权限错误:', err)
          setAudioPermissionGranted(false)
        })
    }
  }, [isSecureContext])

  useEffect(() => {
    if (!serverUrl) {
      setError('LiveKit server URL is not configured')
      return
    }
    console.log('LiveKit configuration:', {
      roomId,
      tokenLength: token?.length,
      serverUrl: serverUrl,
      isAudioEnabled,
      audioPermissionGranted,
      isSecureContext
    })
  }, [roomId, token, serverUrl, isAudioEnabled, audioPermissionGranted, isSecureContext])

  const handleUserInteraction = () => {
    console.log('用户交互，启用音频')
    setIsAudioEnabled(true)
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Missing token parameter</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Please join the room with a valid token.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!serverUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Server configuration error</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">LiveKit server URL is not configured.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isSecureContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Security Warning</CardTitle>
            <CardDescription>Secure Context Required</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              This application requires a secure context (HTTPS or localhost) to access media devices.
              Please access the application using HTTPS or localhost.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div onClick={handleUserInteraction} className="min-h-screen">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={isAudioEnabled}
        onConnected={() => {
          console.log('Connected to LiveKit room')
          setIsConnected(true)
        }}
        onDisconnected={() => {
          console.log('Disconnected from LiveKit room')
          setIsConnected(false)
        }}
        onError={(error) => {
          console.error('LiveKit error:', {
            error,
            roomId,
            tokenLength: token.length,
            serverUrl,
            isSecureContext
          })
          setError('Failed to connect to LiveKit room')
        }}
      >
        <RoomContent isConnected={isConnected} />
      </LiveKitRoom>
    </div>
  )
} 