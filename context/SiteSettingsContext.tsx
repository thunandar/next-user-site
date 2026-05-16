'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SiteSettings } from '@/lib/api';

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: SiteSettings | null;
  children: ReactNode;
}) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings | null {
  return useContext(SiteSettingsContext);
}
