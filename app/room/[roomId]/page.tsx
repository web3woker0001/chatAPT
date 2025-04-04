"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { LiveKitRoom, VideoConference, useTracks, useLocalParticipant } from '@livekit/components-react'
import '@livekit/components-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import React from 'react'
import { Track } from 'livekit-client'
import { Mic, MicOff, Video, VideoOff, LogOut } from 'lucide-react'
import { TranscriptionTile } from '@/components/chat/TranscriptionTile'

interface RoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

function RoomContent({ isConnected }: { isConnected: boolean }) {
  const { isMicrophoneEnabled, isCameraEnabled, localParticipant } = useLocalParticipant()
  const router = useRouter()

  useEffect(() => {
    // 检查麦克风权限
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log('麦克风权限已获取')
        stream.getTracks().forEach(track => track.stop())
      })
      .catch(err => {
        console.error('麦克风权限错误:', err)
      })

    // 检查音频状态
    if (localParticipant) {
      console.log('音频状态:', {
        isMicrophoneEnabled,
        isConnected,
        participantIdentity: localParticipant.identity,
        participantName: localParticipant.name
      })
    }
  }, [localParticipant, isMicrophoneEnabled, isConnected])

  const handleLeave = () => {
    router.push('/')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between p-4 bg-gray-100">
        <div className="flex items-center space-x-4">
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
        <div className="w-80 border-l">
          <TranscriptionTile accentColor="#000000" />
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

  useEffect(() => {
    // 检查麦克风权限
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
  }, [])

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
      audioPermissionGranted
    })
  }, [roomId, token, serverUrl, isAudioEnabled, audioPermissionGranted])

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

  return (
    <div className="flex flex-col min-h-screen" onClick={handleUserInteraction}>
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">Room: {roomId}</h1>
      </header>

      <main className="flex-1 p-4">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={isAudioEnabled}
          video={true}
          onConnected={() => {
            setIsConnected(true)
            toast.success('Connected to room')
          }}
          onDisconnected={() => {
            setIsConnected(false)
            toast.info('Disconnected from room')
          }}
          onError={(error) => {
            console.error('LiveKit error:', {
              error,
              roomId,
              tokenLength: token.length,
              serverUrl,
            })
            setError(error.message)
            toast.error('Failed to connect to room')
          }}
        >
          <RoomContent isConnected={isConnected} />
        </LiveKitRoom>

        {error && (
          <div className="mt-4 p-4 bg-red-100 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}
      </main>
    </div>
  )
} 