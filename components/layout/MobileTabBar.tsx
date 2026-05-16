'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { I } from '@/components/ui/Icons';
import { useCart } from '@/context/CartContext';
import { cloneElement, type ReactElement } from 'react';

const TABS: { href: string; label: string; icon: ReactElement }[] = [
  { href: '/shop', label: 'Shop', icon: <I.store /> },
  { href: '/shop/products', label: 'Browse', icon: <I.search /> },
  { href: '/shop/wishlist', label: 'Saved', icon: <I.heart /> },
  { href: '/shop/orders', label: 'Orders', icon: <I.bag /> },
  { href: '/shop/profile', label: 'You', icon: <I.user /> },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: 'rgba(250,250,247,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--line)',
        padding: '8px 0 16px',
      }}
    >
      <div className="flex justify-around">
        {TABS.map((t) => {
          const active = t.href === '/shop' ? pathname === '/shop' : pathname.startsWith(t.href);
          const showBadge = t.href === '/shop/orders' && totalItems > 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col items-center gap-1 relative"
              style={{
                fontSize: 10.5,
                color: active ? 'var(--ink)' : 'var(--ink-4)',
                fontWeight: active ? 500 : 400,
                textDecoration: 'none',
                padding: '4px 8px',
              }}
            >
              {cloneElement(t.icon as ReactElement<{ size?: number }>, { size: 20 })}
              {t.label}
              {showBadge && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: 'var(--terracotta)',
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
