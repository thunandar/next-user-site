'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { I } from '@/components/ui/Icons';
import { IconBtn } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { categoriesApi, type Category, type PromoBannerSetting } from '@/lib/api';

type CategoryLink = { href: string; label: string; category: string | null };

const SHOP_ALL: CategoryLink = { href: '/shop/products', label: 'Shop all', category: null };

function useCategoryLinks(): CategoryLink[] {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
  }, []);
  return [
    SHOP_ALL,
    ...categories.map((c) => ({
      href: `/shop/products?category=${encodeURIComponent(c.name)}`,
      label: c.name,
      category: c.name,
    })),
  ];
}

function DesktopCategoryNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');
  const onProductsList = pathname === '/shop/products';
  const links = useCategoryLinks();

  const isActive = (link: CategoryLink) =>
    onProductsList && (link.category ?? null) === (currentCategory ?? null);

  return (
    <nav className="hidden md:flex items-center gap-5 flex-1" aria-label="Categories">
      {links.map((c) => {
        const active = isActive(c);
        return (
          <Link
            key={c.label}
            href={c.href}
            aria-current={active ? 'page' : undefined}
            className="transition-colors"
            style={{
              fontSize: 13.5,
              textDecoration: 'none',
              color: active ? 'var(--ink)' : 'var(--ink-3)',
              borderBottom: active ? '2px solid var(--terracotta)' : '2px solid transparent',
              paddingBottom: 2,
            }}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileCategoryNav({ onSelect }: { onSelect: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');
  const onProductsList = pathname === '/shop/products';
  const links = useCategoryLinks();

  return (
    <nav className="md:hidden border-t flex flex-col" style={{ borderColor: 'var(--line)' }}>
      {links.map((c) => {
        const active = onProductsList && (c.category ?? null) === (currentCategory ?? null);
        return (
          <Link
            key={c.label}
            href={c.href}
            onClick={onSelect}
            aria-current={active ? 'page' : undefined}
            style={{
              padding: '12px 20px',
              fontSize: 14,
              color: active ? 'var(--ink)' : 'var(--ink-2)',
              background: active ? 'var(--bg-muted)' : 'transparent',
              textDecoration: 'none',
              borderBottom: '1px solid var(--line)',
              borderLeft: active ? '3px solid var(--terracotta)' : '3px solid transparent',
            }}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get('search') ?? '');

  useEffect(() => {
    setValue(searchParams.get('search') ?? '');
  }, [searchParams]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/shop/products?search=${encodeURIComponent(trimmed)}` : '/shop/products');
  };

  return (
    <form onSubmit={submit} role="search" className="hidden md:flex items-center">
      <Input
        type="search"
        inputSize="sm"
        icon={<I.search />}
        placeholder="Search the edit"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        full={false}
        style={{ width: 220 }}
        aria-label="Search products"
      />
    </form>
  );
}

export default function ShopHeader({ initialBanner }: { initialBanner: PromoBannerSetting | null }) {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { ids } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  const handleSignOut = async () => {
    setAccountOpen(false);
    await logout();
  };

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        borderBottom: '1px solid var(--line)',
        background: 'rgba(250, 250, 247, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Top strip */}
      {initialBanner?.enabled && (
        <div
          className="text-center"
          style={{
            padding: '8px 16px',
            background: 'var(--ink)',
            color: 'var(--bg)',
            fontSize: 12,
            letterSpacing: 0.01,
          }}
        >
          {initialBanner.message}
        </div>
      )}

      {/* Main bar */}
      <div
        className="mx-auto flex items-center gap-6"
        style={{ maxWidth: 1440, padding: '14px 40px' }}
      >
        <Link
          href="/shop"
          className="flex items-baseline gap-2 shrink-0"
          style={{ textDecoration: 'none', color: 'var(--ink)' }}
        >
          <span style={{ fontFamily: 'var(--serif)', fontSize: 26, lineHeight: 1 }}>Nexus</span>
          <span
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--terracotta-2)',
            }}
          >
            shop
          </span>
        </Link>

        <Suspense
          fallback={<div className="hidden md:flex flex-1" aria-hidden style={{ height: 22 }} />}
        >
          <DesktopCategoryNav />
        </Suspense>

        <Suspense fallback={<div className="hidden md:flex" aria-hidden style={{ width: 220, height: 32 }} />}>
          <HeaderSearch />
        </Suspense>

        <div className="flex items-center gap-2">
          {user ? (
            <div ref={accountRef} style={{ position: 'relative' }}>
              <IconBtn
                icon={<I.user />}
                variant="ghost"
                size={36}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((v) => !v)}
              />
              {accountOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: 240,
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                    padding: 6,
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px 12px',
                      borderBottom: '1px solid var(--line)',
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--ink-3)',
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                  {[
                    { href: '/shop/profile', label: 'Profile', icon: <I.user size={15} /> },
                    { href: '/shop/orders', label: 'Orders', icon: <I.bag size={15} /> },
                    { href: '/shop/wishlist', label: 'Wishlist', icon: <I.heart size={15} /> },
                    { href: '/shop/addresses', label: 'Addresses', icon: <I.pin size={15} /> },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5"
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 13.5,
                        color: 'var(--ink-2)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ height: 1, background: 'var(--line)', margin: '4px 8px' }} />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--terracotta-2)',
                      fontSize: 13.5,
                      cursor: 'pointer',
                      textAlign: 'left',
                      font: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <I.logout size={15} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <IconBtn icon={<I.user />} variant="ghost" size={36} aria-label="Sign in" />
            </Link>
          )}
          <Link href="/shop/wishlist" style={{ position: 'relative' }}>
            <IconBtn icon={<I.heart />} variant="ghost" size={36} aria-label="Wishlist" />
            {ids.size > 0 && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 999,
                  background: 'var(--terracotta)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '0 4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ids.size > 9 ? '9+' : ids.size}
              </span>
            )}
          </Link>
          <Link
            href="/shop/cart"
            style={{
              position: 'relative',
              background: 'var(--ink)',
              color: 'var(--bg)',
              borderRadius: 999,
              padding: '0 14px',
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <I.bag size={15} />
            Cart
            {totalItems > 0 && (
              <span
                aria-hidden
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 999,
                  background: 'var(--terracotta)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '0 5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
          <button
            aria-label="Menu"
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-2)',
              cursor: 'pointer',
            }}
          >
            {menuOpen ? <I.x size={18} /> : <I.menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <Suspense fallback={null}>
          <MobileCategoryNav onSelect={() => setMenuOpen(false)} />
        </Suspense>
      )}
    </header>
  );
}
