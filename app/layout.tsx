import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/components/wallet-provider'

export const metadata: Metadata = {
  title: 'chatAPT',
  description: 'Aptos Video Conference',
  generator: 'chatAPT',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
