import type { Metadata } from 'next'
import Link from 'next/link'
import { Package } from 'lucide-react'

export const metadata: Metadata = { title: 'Account' }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link href="/shop" className="flex items-center justify-center gap-2 text-white font-bold text-lg">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          ProductHub
        </Link>
        {children}
      </div>
    </div>
  )
}
