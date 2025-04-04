"use client"

import { useState, useEffect } from "react"
import { useWallet } from "./mock-wallet-adapter"
import { Wallet } from "lucide-react"
import { Button } from "./Button"

export function AptosWallet() {
  const { connect, disconnect, account, wallets, connected } = useWallet()
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [showWalletList, setShowWalletList] = useState(false)

  // Find available wallet adapters
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      // Default to first wallet if none selected
      setSelectedWallet(wallets[0].name)
    }
  }, [wallets, selectedWallet])

  // Handle wallet connection
  const handleConnectWallet = async () => {
    console.log("Connect wallet button clicked")

    if (connected) {
      try {
        await disconnect()
        console.log("Wallet disconnected")
      } catch (error) {
        console.error("Failed to disconnect wallet:", error)
      }
    } else if (wallets.length === 0) {
      console.error("No wallets available to connect")
    } else if (wallets.length === 1) {
      // If there's only one wallet, connect directly
      try {
        console.log("Connecting to only available wallet:", wallets[0].name)
        await connect(wallets[0].name)
        console.log("Wallet connected successfully")
      } catch (error) {
        console.error("Failed to connect wallet:", error)
      }
    } else {
      // Multiple wallets available, show selection
      console.log("Showing wallet list")
      setShowWalletList(!showWalletList) // Toggle wallet list
    }
  }

  // Handle wallet selection
  const handleSelectWallet = async (walletName: string) => {
    console.log("Wallet selected:", walletName)
    setSelectedWallet(walletName)
    setShowWalletList(false)

    try {
      console.log("Connecting to selected wallet:", walletName)
      await connect(walletName)
      console.log("Wallet connected successfully")
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  // Close wallet list when clicking outside
  useEffect(() => {
    if (showWalletList) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (!target.closest(".wallet-list-container") && !target.closest(".wallet-button")) {
          setShowWalletList(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showWalletList])

  return (
    <div className="relative wallet-container">
      <Button
        onClick={handleConnectWallet}
        className={`wallet-button ${connected ? "bg-green-600" : "bg-blue-500"} hover:bg-opacity-90 flex items-center`}
        type="button"
      >
        <Wallet size={20} />
        <span className="ml-2">
          {connected ? `${account?.address?.slice(0, 6)}...${account?.address?.slice(-4)}` : "Connect Wallet"}
        </span>
      </Button>

      {showWalletList && (
        <div className="wallet-list-container absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 z-10 min-w-[200px]">
          <div className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Select Wallet</div>
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <div
                key={wallet.name}
                className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                onClick={() => handleSelectWallet(wallet.name)}
              >
                {wallet.icon && (
                  <img src={wallet.icon || "/placeholder.svg"} alt={`${wallet.name} icon`} className="w-5 h-5 mr-2" />
                )}
                <span>{wallet.name}</span>
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500">No wallets available</div>
          )}
        </div>
      )}
    </div>
  )
}

