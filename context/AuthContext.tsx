'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, tokenStore } from '@/lib/api'
import type { User, RegisterData } from '@/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  verifyEmail: (email: string, code: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // tokenStore rehydrates the access token from its cookie on first import. If a
  // token is present, fetch the user; the axios 401 interceptor will silently
  // refresh on expiry. Skipping the eager refresh matters because the backend
  // rotates refresh tokens per use — refreshing on every mount would burn the
  // token saved by Playwright's storageState and break subsequent tests.
  useEffect(() => {
    if (!tokenStore.getAccess()) {
      setIsLoading(false)
      return
    }
    authApi.getMe()
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const { user, tokens } = await authApi.login(email, password)
    tokenStore.set(tokens.accessToken)
    setUser(user)
    router.push('/shop')
  }

  const register = async (data: RegisterData) => {
    await authApi.register(data)
  }

  const verifyEmail = async (email: string, code: string) => {
    const { user, tokens } = await authApi.verifyEmail(email, code)
    tokenStore.set(tokens.accessToken)
    setUser(user)
    router.push('/shop')
  }

  const resendVerification = async (email: string) => {
    await authApi.resendVerification(email)
  }

  const loginWithGoogle = async (idToken: string) => {
    const { user, tokens } = await authApi.google(idToken)
    tokenStore.set(tokens.accessToken)
    setUser(user)
    router.push('/shop')
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore logout errors
    }
    tokenStore.clear()
    setUser(null)
    window.location.href = '/shop'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, verifyEmail, resendVerification, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
