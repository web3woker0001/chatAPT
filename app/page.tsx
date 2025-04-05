"use client"

import { WalletConnect } from '@/components/wallet-connect'
import { useWalletContext } from '@/components/wallet-provider'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RoomCreator } from '@/components/room-creator'

export default function Home() {
  const { account } = useWalletContext()
  const router = useRouter()
  const [joinRoomId, setJoinRoomId] = useState('')
  const [joinToken, setJoinToken] = useState('')
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)

  const handleJoinRoom = () => {
    if (!joinRoomId.trim() || !joinToken.trim()) return
    router.push(`/room/${joinRoomId}?token=${joinToken}`)
  }

  const handleUserInteraction = () => {
    setIsAudioEnabled(true)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-amber-50">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-amber-900">chatAPT</h1>
          <p className="text-amber-700">Connect your wallet to create or join a video conference</p>
        </div>

        <WalletConnect />

        {account && (
          <div className="space-y-4">
            <RoomCreator account={account} />

            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="bg-amber-100">
                <CardTitle>Join Room</CardTitle>
                <CardDescription>Join an existing video conference room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="joinRoomId" className="text-sm font-medium text-amber-900">
                    Room ID
                  </label>
                  <Input
                    id="joinRoomId"
                    placeholder="Enter room ID"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    className="border-amber-300 focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="joinToken" className="text-sm font-medium text-amber-900">
                    Token
                  </label>
                  <Input
                    id="joinToken"
                    placeholder="Enter room token"
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                    className="border-amber-300 focus:border-amber-500"
                  />
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
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

