'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const COLS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Shop',
    links: [
      { href: '/shop/products?category=Apparel', label: 'Apparel' },
      { href: '/shop/products?category=Home', label: 'Home' },
      { href: '/shop/products?category=Pantry', label: 'Pantry' },
      { href: '/shop/products?category=Studio', label: 'Studio' },
      { href: '/shop/products', label: 'Gift cards' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { href: '#', label: 'Shipping' },
      { href: '#', label: 'Returns' },
      { href: '#', label: 'Sizing' },
      { href: '#', label: 'Contact' },
    ],
  },
  {
    heading: 'Brand',
    links: [
      { href: '/shop/journal', label: 'Journal' },
      { href: '#', label: 'Stockists' },
      { href: '#', label: 'Press' },
      { href: '#', label: 'Sustainability' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '#', label: 'Terms' },
      { href: '#', label: 'Privacy' },
      { href: '#', label: 'Cookies' },
    ],
  },
];

export default function ShopFooter() {
  const settings = useSiteSettings();
  const brand = settings?.brand;
  const name = brand?.name ?? 'Nexus';
  const tagline = brand?.tagline ?? 'A short list of things our small studio loves — made slowly, shipped kindly.';
  const location = brand?.location ?? 'Made in Lisbon & Brooklyn';

  return (
    <footer
      className="mt-20"
      style={{ background: 'var(--ink)', color: 'var(--ink-4)' }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 1440, padding: '60px 40px 32px' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-8">
          <div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 32,
                color: 'var(--bg)',
                marginBottom: 12,
              }}
            >
              {name}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 320 }}>
              {tagline}
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.heading}>
              <div
                className="t-micro"
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 14,
                  textTransform: 'uppercase',
                  letterSpacing: 0.04,
                  fontSize: 11,
                }}
              >
                {col.heading}
              </div>
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      style={{
                        color: 'var(--ink-4)',
                        textDecoration: 'none',
                        fontSize: 13,
                      }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex justify-between flex-wrap gap-2"
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12,
          }}
        >
          <span>© {new Date().getFullYear()} {name} · {location}</span>
          <span>USD $ · English</span>
        </div>
      </div>
    </footer>
  );
}
