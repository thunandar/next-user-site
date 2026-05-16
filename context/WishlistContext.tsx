'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
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
  const [toggling, setToggling] = useState<Set<number>>(new Set())

  const refresh = useCallback(async () => {
    if (!user) { setIds(new Set()); return }
    try {
      const res = await wishlistApi.getAll()
      setIds(new Set(res.data.map((item: { productId: number }) => item.productId)))
    } catch {
      // Don't wipe existing state on error — user would lose visible wishlist state
      toast.error('Failed to sync wishlist')
    }
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing wishlist from server when user changes
    refresh()
  }, [refresh])

  const toggle = async (productId: number) => {
    if (toggling.has(productId)) return // prevent concurrent toggles on same item

    setToggling(prev => new Set(prev).add(productId))
    const wasInWishlist = ids.has(productId)

    // Optimistic update
    if (wasInWishlist) {
      setIds(prev => { const next = new Set(prev); next.delete(productId); return next })
      try {
        await wishlistApi.remove(productId)
      } catch {
        setIds(prev => new Set(prev).add(productId)) // rollback
        toast.error('Failed to remove from wishlist')
      }
    } else {
      setIds(prev => new Set(prev).add(productId))
      try {
        await wishlistApi.add(productId)
      } catch {
        setIds(prev => { const next = new Set(prev); next.delete(productId); return next }) // rollback
        toast.error('Failed to add to wishlist')
      }
    }

    setToggling(prev => { const next = new Set(prev); next.delete(productId); return next })
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
