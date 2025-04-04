"use client"

import { WalletConnect } from '@/components/wallet-connect'
import { useWalletContext } from '@/components/wallet-provider'
import { RoomCreator } from '@/components/room-creator'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { account } = useWalletContext()
  const router = useRouter()
  const [roomId, setRoomId] = useState('')
  const [token, setToken] = useState('')

  const handleJoinRoom = () => {
    if (!roomId.trim() || !token.trim()) return
    router.push(`/room/${roomId}?token=${token}`)
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
            <RoomCreator account={account} />

            <Card>
              <CardHeader>
                <CardTitle>Join Room</CardTitle>
                <CardDescription>Join an existing video conference room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                  <Input
                    placeholder="Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleJoinRoom}
                  disabled={!roomId.trim() || !token.trim()}
                  className="w-full"
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

