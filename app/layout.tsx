import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import GoogleProvider from '@/components/auth/GoogleProvider'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Nexus', template: '%s | Nexus' },
  description: 'Shop the best products online',
  icons: { icon: '/icon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="antialiased">
        <GoogleProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: {
                    background: 'var(--bg-elev)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    fontSize: '14px',
                  },
                }}
              />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  )
}
