"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Mock wallet types
export interface WalletInfo {
  name: string
  icon?: string
  url?: string
}

export interface AccountInfo {
  address: string
  publicKey: string
}

// Mock wallet context
interface WalletContextState {
  wallets: WalletInfo[]
  connected: boolean
  account: AccountInfo | null
  connect: (walletName: string) => Promise<void>
  disconnect: () => Promise<void>
}

// Create mock wallets
const mockWallets: WalletInfo[] = [
  {
    name: "Petra Wallet",
    icon: "https://petra.app/logo.svg",
    url: "https://petra.app",
  },
  {
    name: "Martian Wallet",
    icon: "https://martianwallet.xyz/assets/logo.svg",
    url: "https://martianwallet.xyz",
  },
  {
    name: "Pontem Wallet",
    icon: "https://pontem.network/logo.svg",
    url: "https://pontem.network",
  },
]

// Create a mock account
const mockAccount: AccountInfo = {
  address: "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef",
  publicKey: "0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789a",
}

// Create context
const WalletContext = createContext<WalletContextState | undefined>(undefined)

// Provider component
export function MockWalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<AccountInfo | null>(null)

  // Mock connect function
  const connect = async (walletName: string) => {
    console.log(`Connecting to ${walletName}...`)

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Simulate successful connection
    setConnected(true)
    setAccount(mockAccount)
    console.log(`Connected to ${walletName}`)
  }

  // Mock disconnect function
  const disconnect = async () => {
    console.log("Disconnecting wallet...")

    // Simulate disconnection delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Simulate successful disconnection
    setConnected(false)
    setAccount(null)
    console.log("Wallet disconnected")
  }

  return (
    <WalletContext.Provider
      value={{
        wallets: mockWallets,
        connected,
        account,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a MockWalletProvider")
  }
  return context
}

