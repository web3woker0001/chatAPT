"use client"

import { useWalletContext } from './wallet-provider'
import { Button } from './ui/button'

export function WalletConnect() {
  const { wallets, activeWallet, account, isConnecting, error, connect, disconnect } = useWalletContext()

  if (activeWallet && account) {
    return (
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Connected Wallet</span>
            <span className="font-medium">
              {activeWallet.name}
            </span>
          </div>
          <Button
            variant="destructive"
            onClick={disconnect}
            disabled={isConnecting}
            className="ml-4"
          >
            Disconnect Wallet
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Address:</span>
          <code className="px-2 py-1 bg-gray-100 rounded">
            {account.slice(0, 6)}...{account.slice(-4)}
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Connect Wallet</h2>
        <div className="flex flex-wrap gap-2">
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <Button
                key={wallet.name}
                onClick={() => connect(wallet)}
                disabled={isConnecting}
                className="flex items-center gap-2 min-w-[200px] justify-center"
              >
                {wallet.icon && (
                  <img
                    src={wallet.icon}
                    alt={`${wallet.name} icon`}
                    className="w-5 h-5"
                  />
                )}
                {isConnecting ? 'Connecting...' : `Connect ${wallet.name}`}
              </Button>
            ))
          ) : (
            <div className="text-center w-full p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">
                No Aptos wallets detected
              </p>
              <a
                href="https://petra.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Install Petra Wallet →
              </a>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  )
} 