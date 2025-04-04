"use client"

// Import the updated wallet adapter packages
import { AptosWalletAdapterProvider, AptosWallet } from "@aptos-labs/wallet-adapter-react"
import { PetraWallet } from "petra-plugin-wallet-adapter"
// Note: Some wallet adapters might need to be updated to versions compatible with the latest ts-sdk

export function WalletProvider() {
  // Create an array of supported wallet adapters
  // Only including Petra wallet for now to simplify
  const wallets = [new PetraWallet()]

  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
      <div className="p-4">
        <AptosWallet />
      </div>
    </AptosWalletAdapterProvider>
  )
}

