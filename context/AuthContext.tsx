'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
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

  // Silent refresh on every page load — restores session from HttpOnly refresh_token cookie
  useEffect(() => {
    axios.post('/api/auth/refresh')
      .then(res => {
        const { accessToken } = res.data.data as { accessToken: string }
        tokenStore.set(accessToken)
        return authApi.getMe()
      })
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
