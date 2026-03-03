'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { wishlistApi } from '@/lib/api'
import { useAuth } from './AuthContext'

interface WishlistContextValue {
  ids: Set<number>
  toggle: (productId: number) => Promise<void>
  isInWishlist: (productId: number) => boolean
  refresh: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [ids, setIds] = useState<Set<number>>(new Set())

  const refresh = async () => {
    if (!user) { setIds(new Set()); return }
    try {
      const res = await wishlistApi.getAll()
      setIds(new Set(res.data.map((item: { productId: number }) => item.productId)))
    } catch {
      setIds(new Set())
    }
  }

  useEffect(() => { refresh() }, [user?.id])

  const toggle = async (productId: number) => {
    if (ids.has(productId)) {
      setIds(prev => { const next = new Set(prev); next.delete(productId); return next })
      try { await wishlistApi.remove(productId) } catch { refresh() }
    } else {
      setIds(prev => new Set(prev).add(productId))
      try { await wishlistApi.add(productId) } catch { refresh() }
    }
  }

  const isInWishlist = (productId: number) => ids.has(productId)

  return (
    <WishlistContext.Provider value={{ ids, toggle, isInWishlist, refresh }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}
