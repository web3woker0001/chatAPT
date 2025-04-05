import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CapPayment } from '@/components/cap-payment'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWalletContext } from '@/components/wallet-provider'
import { Copy, Check } from 'lucide-react'

// 缩短地址显示
const shortenAddress = (address: string | null) => {
  if (!address) return 'Not connected';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface RoomCreatorProps {
  account: string | null
}

export function RoomCreator({ account }: RoomCreatorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [createdRoom, setCreatedRoom] = useState<{ roomId: string; token: string } | null>(null)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("payment") // 添加标签页状态
  const [copied, setCopied] = useState<{ roomId: boolean; token: boolean }>({ roomId: false, token: false })
  const router = useRouter()
  const { account: walletAccount } = useWalletContext()
  
  // 使用钱包账户或传入的账户
  const currentAccount = account || walletAccount

  // 添加调试信息
  useEffect(() => {
    console.log('RoomCreator state:', {
      currentAccount,
      paymentComplete,
      paymentError,
      isCreating,
      createdRoom,
      activeTab
    })
  }, [currentAccount, paymentComplete, paymentError, isCreating, createdRoom, activeTab])

  // 当支付完成时自动创建房间
  useEffect(() => {
    if (paymentComplete && !isCreating && !createdRoom) {
      console.log('Payment completed, automatically creating room...')
      handleCreateRoom()
    }
  }, [paymentComplete, isCreating, createdRoom])

  const handleCreateRoom = async () => {
    if (!currentAccount) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!paymentComplete) {
      toast.error('Please complete the CAP token payment first')
      return
    }

    try {
      setIsCreating(true)
      const newRoomId = `${currentAccount.slice(0, 8)}-${Date.now()}`

      console.log('Creating room with:', {
        roomId: newRoomId,
        participant: currentAccount
      })

      const response = await fetch('/api/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: newRoomId,
          participant: currentAccount,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create room')
      }

      const data = await response.json()
      console.log('Room creation response:', data)
      
      if (!data.roomId || !data.token) {
        throw new Error('Invalid response from server')
      }

      const token = String(data.token)
      
      setCreatedRoom({
        roomId: data.roomId,
        token: token,
      })
      
      // 不再自动跳转，让用户查看房间信息
      // const encodedToken = encodeURIComponent(token)
      // router.push(`/room/${data.roomId}?token=${encodedToken}`)
      
      toast.success('Room created successfully')
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  const handlePaymentComplete = () => {
    console.log('Payment completed')
    setPaymentComplete(true)
    setPaymentError(null)
    setActiveTab("create") // 切换到创建房间标签
    toast.success('CAP token payment completed')
  }

  const handlePaymentError = (error: string) => {
    console.log('Payment error:', error)
    setPaymentError(error)
    setPaymentComplete(false)
  }

  const handleCopy = (type: 'roomId' | 'token') => {
    if (createdRoom) {
      const textToCopy = type === 'roomId' ? createdRoom.roomId : createdRoom.token
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(prev => ({ ...prev, [type]: true }))
          setTimeout(() => {
            setCopied(prev => ({ ...prev, [type]: false }))
          }, 2000)
          toast.success(`${type === 'roomId' ? 'Room ID' : 'Token'} copied to clipboard`)
        })
        .catch(err => {
          console.error('Failed to copy:', err)
          toast.error('Failed to copy to clipboard')
        })
    }
  }

  const handleJoinRoom = () => {
    if (createdRoom) {
      const encodedToken = encodeURIComponent(createdRoom.token)
      router.push(`/room/${createdRoom.roomId}?token=${encodedToken}`)
    }
  }

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardHeader className="bg-amber-100">
        <CardTitle>Create Room</CardTitle>
        <CardDescription>Create a new video conference room</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-amber-100 rounded-lg">
          <p className="text-sm font-medium">Current wallet address: {shortenAddress(currentAccount)}</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-amber-200">
            <TabsTrigger value="payment" className="data-[state=active]:bg-amber-400">CAP Payment</TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-amber-400">Create Room</TabsTrigger>
          </TabsList>
          <TabsContent value="payment">
            <CapPayment 
              account={currentAccount} 
              onPaymentComplete={handlePaymentComplete}
              onPaymentError={handlePaymentError}
            />
            {paymentError && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                <p className="text-sm font-medium">Payment Error: {paymentError}</p>
              </div>
            )}
            {paymentComplete && (
              <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg">
                <p className="text-sm font-medium">Payment completed successfully! Room will be created automatically.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="create">
            <div className="space-y-4">
              {isCreating ? (
                <div className="p-4 bg-amber-100 rounded-lg text-center">
                  <p className="text-sm font-medium">Creating room...</p>
                </div>
              ) : createdRoom ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-100 rounded-lg">
                    <p className="text-sm font-medium text-green-700">Room created successfully!</p>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Room ID:</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-700">{createdRoom.roomId}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCopy('roomId')}
                            className="h-6 w-6"
                          >
                            {copied.roomId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Token:</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-700 truncate max-w-[200px]">{createdRoom.token}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCopy('token')}
                            className="h-6 w-6"
                          >
                            {copied.token ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Username:</p>
                        <p className="text-sm text-gray-700">{shortenAddress(currentAccount)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        onClick={handleJoinRoom}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        Join Room
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleCreateRoom}
                  disabled={!currentAccount || !paymentComplete}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  Create New Room
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 