import type { ReactNode } from 'react';
import ShopHeader from '@/components/layout/ShopHeader';
import ShopFooter from '@/components/layout/ShopFooter';
import MobileTabBar from '@/components/layout/MobileTabBar';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import type { SiteSettings } from '@/lib/api';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchSettings(): Promise<SiteSettings | null> {
  try {
    const res = await fetch(`${API_URL}/api/settings/public`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: SiteSettings };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const settings = await fetchSettings();
  return (
    <SiteSettingsProvider value={settings}>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
        <ShopHeader initialBanner={settings?.promoBanner ?? null} />
        <main className="flex-1" style={{ paddingBottom: 96 }}>
          {children}
        </main>
        <ShopFooter />
        <MobileTabBar />
      </div>
    </SiteSettingsProvider>
  );
}
