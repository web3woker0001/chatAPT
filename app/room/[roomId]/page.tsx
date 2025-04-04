"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { LiveKitRoom, VideoConference, useTracks } from '@livekit/components-react'
import '@livekit/components-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import React from 'react'
import { Track } from 'livekit-client'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface RoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

function MediaStatus() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)

  const tracks = useTracks([Track.Source.Microphone, Track.Source.Camera])

  useEffect(() => {
    const audioTrack = tracks.find(track => track.source === Track.Source.Microphone)
    const videoTrack = tracks.find(track => track.source === Track.Source.Camera)

    setIsAudioEnabled(!!audioTrack?.isEnabled)
    setIsVideoEnabled(!!videoTrack?.isEnabled)
  }, [tracks])

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        {isAudioEnabled ? (
          <Mic className="h-5 w-5 text-green-500" />
        ) : (
          <MicOff className="h-5 w-5 text-red-500" />
        )}
        <span className="text-sm">{isAudioEnabled ? 'Audio On' : 'Audio Off'}</span>
      </div>
      <div className="flex items-center space-x-2">
        {isVideoEnabled ? (
          <Video className="h-5 w-5 text-green-500" />
        ) : (
          <VideoOff className="h-5 w-5 text-red-500" />
        )}
        <span className="text-sm">{isVideoEnabled ? 'Video On' : 'Video Off'}</span>
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

  useEffect(() => {
    if (!serverUrl) {
      setError('LiveKit server URL is not configured')
      return
    }
    console.log('LiveKit configuration:', {
      roomId,
      tokenLength: token?.length,
      serverUrl: serverUrl,
    })
  }, [roomId, token, serverUrl])

  const handleUserInteraction = () => {
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
        <div className="flex items-center justify-between p-4 bg-gray-100">
          <MediaStatus />
          <div className="text-sm text-gray-500">
            Room: {roomId}
          </div>
        </div>

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
          <VideoConference />
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