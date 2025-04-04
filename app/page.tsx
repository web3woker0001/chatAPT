"use client"

import { WalletConnect } from '@/components/wallet-connect'
import { useWalletContext } from '@/components/wallet-provider'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { account } = useWalletContext()
  const router = useRouter()
  const [roomId, setRoomId] = useState('')
  const [participant, setParticipant] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [joinRoomId, setJoinRoomId] = useState('')
  const [joinToken, setJoinToken] = useState('')
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)

  const handleCreateRoom = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId, participant }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      setToken(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinRoom = () => {
    if (!joinRoomId.trim() || !joinToken.trim()) return
    router.push(`/room/${joinRoomId}?token=${joinToken}`)
  }

  const handleUserInteraction = () => {
    setIsAudioEnabled(true)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Aptos Video Conference</h1>
          <p className="text-gray-500">Connect your wallet to create or join a video conference</p>
        </div>

        <WalletConnect />

        {account && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create a Room</CardTitle>
                <CardDescription>Enter room details to create a new video conference room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="roomId" className="text-sm font-medium">
                    Room ID
                  </label>
                  <Input
                    id="roomId"
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="participant" className="text-sm font-medium">
                    Your Name
                  </label>
                  <Input
                    id="participant"
                    placeholder="Enter your name"
                    value={participant}
                    onChange={(e) => setParticipant(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500">
                    {error}
                  </div>
                )}
                {token ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Room Token</div>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={token}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyToken}
                        className="h-9 w-9"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Copy this token and share it with other participants
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleCreateRoom}
                    disabled={isLoading || !roomId || !participant}
                  >
                    {isLoading ? 'Creating...' : 'Create Room'}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Join Room</CardTitle>
                <CardDescription>Join an existing video conference room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="joinRoomId" className="text-sm font-medium">
                    Room ID
                  </label>
                  <Input
                    id="joinRoomId"
                    placeholder="Enter room ID"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="joinToken" className="text-sm font-medium">
                    Token
                  </label>
                  <Input
                    id="joinToken"
                    placeholder="Enter room token"
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleJoinRoom}
                  disabled={!joinRoomId.trim() || !joinToken.trim()}
                >
                  Join Room
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}

