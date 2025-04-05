"use client"

import { useWalletContext } from './wallet-provider'
import { Button } from './ui/button'

// 缩短地址显示
const shortenAddress = (address: string | null) => {
  if (!address) return 'Not connected';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function WalletConnect() {
  const { wallets, activeWallet, account, isConnecting, error, connect, disconnect } = useWalletContext()

  if (activeWallet && account) {
    return (
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-amber-50 border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-amber-700">Connected Wallet</span>
            <span className="font-medium text-amber-900">
              {activeWallet.name}
            </span>
          </div>
          <Button
            variant="destructive"
            onClick={disconnect}
            disabled={isConnecting}
            className="ml-4 bg-red-600 hover:bg-red-700"
          >
            Disconnect Wallet
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-amber-700">Address:</span>
          <code className="px-2 py-1 bg-amber-100 rounded text-amber-900">
            {shortenAddress(account)}
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
        <h2 className="text-lg font-semibold mb-4 text-amber-900">Connect Wallet</h2>
        <div className="flex flex-wrap gap-2">
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <Button
                key={wallet.name}
                onClick={() => connect(wallet)}
                disabled={isConnecting}
                className="flex items-center gap-2 min-w-[200px] justify-center bg-amber-600 hover:bg-amber-700"
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
            <div className="text-center w-full p-4 bg-amber-100 rounded-lg">
              <p className="text-sm text-amber-700 mb-2">
                No Aptos wallets detected
              </p>
              <a
                href="https://petra.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-900 hover:text-amber-950 text-sm font-medium"
              >
                Install Petra Wallet →
              </a>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="p-4 bg-red-100 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
} 