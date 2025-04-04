"use client"

import { useEffect, useState } from 'react'

export type WalletName = 'petra' | 'martian' | 'rise' | 'pontem' | 'fewcha'

interface WalletState {
  wallets: any[]
  activeWallet: any | null
  account: string | null
  isConnecting: boolean
  error: string | null
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    wallets: [],
    activeWallet: null,
    account: null,
    isConnecting: false,
    error: null,
  })

  useEffect(() => {
    const detectWallets = async () => {
      const detected: any[] = []
      
      // Wait for window to be fully loaded
      if (typeof window === 'undefined') return

      // Detect Petra Wallet with retry
      const detectPetra = async () => {
        // Check if aptos object exists
        if (!('aptos' in window)) {
          console.log('Waiting for Petra wallet to load...')
          return
        }

        try {
          // Wait a bit to ensure wallet is fully initialized
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const petraWallet = window.aptos
          if (petraWallet) {
            // Try to get network to verify wallet is working
            try {
              await petraWallet.network()
              detected.push({
                name: 'petra',
                icon: 'https://petra.app/favicon.ico',
                wallet: petraWallet
              })
            } catch (e) {
              console.warn('Petra wallet detected but not ready:', e)
            }
          }
        } catch (error) {
          console.error('Error detecting Petra wallet:', error)
        }
      }

      await detectPetra()
      setState(prev => ({ ...prev, wallets: detected }))
    }

    // Initial detection
    detectWallets()

    // Set up event listeners for wallet changes
    const handleAccountChange = () => {
      console.log('Wallet account changed, updating state...')
      detectWallets()
    }

    const handleNetworkChange = () => {
      console.log('Wallet network changed, updating state...')
      detectWallets()
    }

    window.addEventListener('load', detectWallets)
    window.addEventListener('aptos#networkChange', handleNetworkChange)
    window.addEventListener('aptos#accountChange', handleAccountChange)

    return () => {
      window.removeEventListener('load', detectWallets)
      window.removeEventListener('aptos#networkChange', handleNetworkChange)
      window.removeEventListener('aptos#accountChange', handleAccountChange)
    }
  }, [])

  const connect = async (walletData: any) => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }))
      
      if (walletData.name === 'petra') {
        try {
          // First check if wallet is accessible
          if (!walletData.wallet) {
            throw new Error('Petra wallet not found. Please refresh the page or reinstall the wallet.')
          }

          // Try to connect
          const response = await walletData.wallet.connect()
          
          // Get account info
          const account = await walletData.wallet.account()
          
          if (!account?.address) {
            throw new Error('Failed to get account address')
          }

          setState(prev => ({
            ...prev,
            activeWallet: walletData,
            account: account.address,
            isConnecting: false
          }))
        } catch (error: any) {
          // Handle specific Petra errors
          if (error?.message?.includes('User rejected')) {
            throw new Error('Connection rejected by user')
          }
          throw error
        }
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
        isConnecting: false
      }))
    }
  }

  const disconnect = async () => {
    if (state.activeWallet?.wallet) {
      try {
        await state.activeWallet.wallet.disconnect()
        setState(prev => ({
          ...prev,
          activeWallet: null,
          account: null
        }))
      } catch (error) {
        console.error('Wallet disconnect error:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to disconnect wallet'
        }))
      }
    }
  }

  return {
    ...state,
    connect,
    disconnect
  }
}

// Add type declarations for window object
declare global {
  interface Window {
    aptos?: any
  }
} 