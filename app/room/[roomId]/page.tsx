"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'
import { useWalletContext } from '@/components/wallet-provider'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const { account } = useWalletContext()
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    if (!account) {
      // Redirect to home if not connected
      window.location.href = '/'
      return
    }

    // Generate token for the room
    const generateToken = async () => {
      try {
        const response = await fetch(`/api/get-participant-token?room=${roomId}&identity=${account}`)
        const data = await response.json()
        setToken(data.token)
      } catch (error) {
        console.error('Failed to get token:', error)
      }
    }

    generateToken()
  }, [account, roomId])

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connecting to room...</h2>
          <p className="text-gray-500">Please wait while we connect you to the video conference.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        video={true}
        audio={true}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  )
} 