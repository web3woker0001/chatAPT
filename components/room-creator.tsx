import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface RoomCreatorProps {
  account: string | null
}

export function RoomCreator({ account }: RoomCreatorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [createdRoom, setCreatedRoom] = useState<{ roomId: string; token: string } | null>(null)
  const router = useRouter()

  const handleCreateRoom = async () => {
    if (!account) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setIsCreating(true)
      const newRoomId = `${account.slice(0, 8)}-${Date.now()}`

      const response = await fetch('/api/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: newRoomId,
          participant: account,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create room')
      }

      const data = await response.json()
      if (!data.roomId || !data.token) {
        throw new Error('Invalid response from server')
      }

      const token = String(data.token)
      
      setCreatedRoom({
        roomId: data.roomId,
        token: token,
      })
      
      const encodedToken = encodeURIComponent(token)
      router.push(`/room/${data.roomId}?token=${encodedToken}`)
      
      toast.success('Room created successfully')
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Room</CardTitle>
        <CardDescription>Create a new video conference room</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleCreateRoom}
          disabled={isCreating || !account}
          className="w-full"
        >
          {isCreating ? 'Creating Room...' : 'Create New Room'}
        </Button>
        {createdRoom && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm font-medium">Room created successfully!</p>
            <p className="text-sm text-gray-500 mt-1">Room ID: {createdRoom.roomId}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 