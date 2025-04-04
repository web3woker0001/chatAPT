"use client"

import { WalletConnect } from '@/components/wallet-connect'
import { useWalletContext } from '@/components/wallet-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { account } = useWalletContext()
  const router = useRouter()

  useEffect(() => {
    if (account) {
      // Generate a room ID based on the wallet address
      const roomId = account.slice(0, 8)
      router.push(`/room/${roomId}`)
    }
  }, [account, router])

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Aptos Wallet Demo</h1>
          <p className="text-gray-500">Connect your Aptos wallet to join the video conference</p>
        </div>
        <WalletConnect />
      </div>
    </main>
  )
}

