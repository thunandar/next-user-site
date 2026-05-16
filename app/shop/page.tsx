'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, journalApi, vendorsApi, type JournalPost, type Vendor, type TrustIconKey } from '@/lib/api';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import ProductCard from '@/components/shop/ProductCard';
import VendorMarquee from '@/components/shop/VendorMarquee';
import Card from '@/components/ui/Card';
import SectionHead from '@/components/ui/SectionHead';
import Button, { IconBtn } from '@/components/ui/Button';
import PlaceholderImg from '@/components/ui/PlaceholderImg';
import { I } from '@/components/ui/Icons';
import { formatCurrency, getPrimaryImage, getImageUrl } from '@/lib/utils';
import type { Product } from '@/types';

const TRUST_FALLBACK: { iconKey: TrustIconKey; title: string; sub: string }[] = [
  { iconKey: 'truck', title: 'Free shipping over $80', sub: 'Carbon-neutral, tracked' },
  { iconKey: 'refund', title: '60-day returns', sub: 'No questions asked' },
  { iconKey: 'shield', title: 'Secure checkout', sub: 'Encrypted end-to-end' },
  { iconKey: 'chat', title: 'Human support', sub: 'Written replies, 24h' },
];

const renderTrustIcon = (key: TrustIconKey, size = 22) => {
  const Cmp = (I as Record<string, (p: { size?: number }) => React.ReactElement>)[key] ?? I.truck;
  return <Cmp size={size} />;
};

export default function ShopHomePage() {
  const settings = useSiteSettings();
  const hero = settings?.hero;
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<{
    totalProducts: number;
    totalVendors: number;
    avgRating: number | null;
    totalReviews: number;
  } | null>(null);
  const [latestPost, setLatestPost] = useState<JournalPost | null>(null);

  const railRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateRailEdges = () => {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollRail = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-rail-item]');
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  };

  useEffect(() => {
    updateRailEdges();
    const el = railRef.current;
    if (!el) return;
    const onScroll = () => updateRailEdges();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [featured.length]);

  useEffect(() => {
    productsApi
      .getAll({ page: 1, limit: 8, sortBy: 'createdAt', sortOrder: 'DESC' })
      .then((r) => setFeatured(r.data))
      .catch(() => {});
    productsApi
      .getAll({ page: 1, limit: 4, sortBy: 'sales', sortOrder: 'DESC' })
      .then((r) => setBestsellers(r.data))
      .catch(() => {});
    productsApi
      .getStorefrontStats()
      .then(setStats)
      .catch(() => {});
    vendorsApi
      .list({ status: 'active' })
      .then(setVendors)
      .catch(() => {});
    journalApi
      .list(1, 1)
      .then((r) => setLatestPost(r.posts[0] ?? null))
      .catch(() => {});
  }, []);

  const heroProduct = featured[0];

  return (
    <div>
      {/* Hero split */}
      <section style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px 0' }}>
        <div
          className="grid gap-8"
          style={{ gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)' }}
        >
          <div className="flex flex-col justify-between" style={{ minHeight: 440 }}>
            <div>
              <div className="t-micro" style={{ color: 'var(--terracotta-2)' }}>
                {hero?.eyebrow ?? 'Spring 026 · The Quiet Edit'}
              </div>
              <h1
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 'clamp(44px, 6vw, 96px)',
                  lineHeight: 0.95,
                  letterSpacing: -0.01,
                  color: 'var(--ink)',
                  marginTop: 14,
                }}
              >
                {hero?.headlineLead ?? 'Objects, made'}{' '}
                <span style={{ fontStyle: 'italic', color: 'var(--terracotta)' }}>
                  {hero?.headlineAccent ?? 'slowly,'}
                </span>
                <br />
                {hero?.headlineTrail ?? 'for keeping.'}
              </h1>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: 'var(--ink-2)',
                  marginTop: 20,
                  maxWidth: 520,
                }}
              >
                {hero?.body ??
                  'A short list of things our small studio loves — shipped from makers who take their time. No newsletters, no tricks, just the objects we use every day.'}
              </p>
              <div className="flex gap-3 mt-8">
                <Link href={hero?.primaryCtaHref ?? '/shop/products'}>
                  <Button variant="primary" size="lg" iconRight={<I.arr_r />}>
                    {hero?.primaryCtaLabel ?? 'Shop the edit'}
                  </Button>
                </Link>
                <Link href={hero?.secondaryCtaHref ?? '/shop/journal'}>
                  <Button variant="ghost" size="lg">
                    {hero?.secondaryCtaLabel ?? 'Read the journal'}
                  </Button>
                </Link>
              </div>
            </div>

            <div
              className="grid grid-cols-3 gap-6"
              style={{ borderTop: '1px solid var(--line)', paddingTop: 24, marginTop: 40 }}
            >
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28 }}>
                  {stats ? stats.totalProducts : '—'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>pieces curated</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28 }}>
                  {stats ? stats.totalVendors : '—'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>independent makers</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28 }}>
                  {stats?.avgRating != null ? stats.avgRating.toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>avg. review</div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            {(() => {
              const heroImg = heroProduct ? getPrimaryImage(heroProduct.ProductImages) : null;
              const hasHeroImg = heroImg && heroImg !== '/placeholder.png';
              return hasHeroImg ? (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 620,
                    borderRadius: 20,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={heroImg}
                    alt={heroProduct!.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <PlaceholderImg
                  label={heroProduct?.name || 'Featured'}
                  h={620}
                  tone={['#E8C99B', '#C26A47']}
                  style={{ borderRadius: 20 }}
                />
              );
            })()}
            {heroProduct && (
              <Card
                padding={20}
                style={{
                  position: 'absolute',
                  left: 20,
                  right: 20,
                  bottom: 20,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="t-micro" style={{ color: 'var(--ink-3)' }}>
                      Featured piece
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 22,
                        color: 'var(--ink)',
                        marginTop: 4,
                      }}
                    >
                      {heroProduct.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                      {formatCurrency(heroProduct.price)} ·{' '}
                      {(heroProduct as { vendor?: string }).vendor ?? 'Nexus'}
                    </div>
                  </div>
                  <Link href={`/shop/products/${heroProduct.id}`}>
                    <IconBtn icon={<I.arr_r />} variant="bordered" size={40} />
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Featured edit */}
      <section style={{ maxWidth: 1440, margin: '80px auto 0', padding: '0 24px' }}>
        <SectionHead
          eyebrow={`The Quiet Edit · ${featured.length} pieces`}
          title="What we’re loving"
          right={
            <div className="flex gap-2">
              <IconBtn
                icon={<I.chev_l />}
                variant="bordered"
                size={40}
                onClick={() => scrollRail(-1)}
                disabled={!canPrev}
                style={{ opacity: canPrev ? 1 : 0.4, transition: 'opacity 200ms' }}
              />
              <IconBtn
                icon={<I.chev_r />}
                variant="bordered"
                size={40}
                onClick={() => scrollRail(1)}
                disabled={!canNext}
                style={{ opacity: canNext ? 1 : 0.4, transition: 'opacity 200ms' }}
              />
            </div>
          }
        />
        <div
          ref={railRef}
          className="mt-6 nx-rail"
          style={{
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: 0,
            scrollBehavior: 'smooth',
            paddingBottom: 4,
          }}
        >
          {featured.slice(0, 8).map((p) => (
            <div
              key={p.id}
              data-rail-item
              style={{
                flex: '0 0 auto',
                width: 'clamp(240px, 28vw, 320px)',
                scrollSnapAlign: 'start',
              }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <style jsx>{`
          .nx-rail {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .nx-rail::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      {/* Editorial */}
      {latestPost && (
        <section style={{ maxWidth: 1440, margin: '80px auto 0', padding: '0 24px' }}>
          <div
            className="grid gap-8 md:grid-cols-2"
            style={{
              background: 'var(--ink)',
              color: 'var(--bg)',
              padding: 48,
              borderRadius: 20,
            }}
          >
            <div className="flex flex-col justify-between">
              <div>
                <div
                  className="t-micro"
                  style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}
                >
                  {latestPost.eyebrow || 'From the Journal'}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 44,
                    lineHeight: 1.05,
                    color: 'var(--bg)',
                  }}
                >
                  {latestPost.title}
                </div>
                {latestPost.excerpt && (
                  <p
                    style={{
                      marginTop: 16,
                      color: 'rgba(255,255,255,0.7)',
                      maxWidth: 500,
                      lineHeight: 1.6,
                    }}
                  >
                    {latestPost.excerpt}
                  </p>
                )}
              </div>
              <div className="mt-8">
                <Link
                  href={`/shop/journal/${latestPost.slug}`}
                  style={{
                    display: 'inline-block',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'var(--bg)',
                    padding: '12px 20px',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Read the piece →
                </Link>
              </div>
            </div>
            <div
              style={{
                position: 'relative',
                height: 360,
                borderRadius: 16,
                overflow: 'hidden',
                background: 'var(--bg-muted)',
              }}
            >
              {latestPost.coverImageUrl ? (
                <Image
                  src={getImageUrl(latestPost.coverImageUrl)}
                  alt={latestPost.title}
                  fill
                  sizes="(min-width: 1024px) 640px, 100vw"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <PlaceholderImg
                  label={latestPost.title}
                  h={360}
                  tone={['#6B655C', '#2D2B26']}
                  style={{ borderRadius: 16 }}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Vendors strip */}
      {vendors.length > 0 && (
        <section style={{ marginTop: 80 }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px 18px' }}>
            <div className="t-micro" style={{ color: 'var(--ink-3)' }}>
              The makers
            </div>
            <h2
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 28,
                lineHeight: 1.1,
                color: 'var(--ink)',
                marginTop: 6,
                fontWeight: 400,
              }}
            >
              Small studios, slow batches
            </h2>
          </div>
          <VendorMarquee vendors={vendors} />
        </section>
      )}

      {/* Bestsellers */}
      <section style={{ maxWidth: 1440, margin: '80px auto 0', padding: '0 24px' }}>
        <SectionHead
          eyebrow="Worn-in favourites"
          title="Bestsellers"
          right={
            <Link
              href="/shop/products?sortBy=sales"
              style={{ color: 'var(--terracotta-2)', fontSize: 13.5, textDecoration: 'none' }}
            >
              See all →
            </Link>
          }
        />
        <div
          className="grid gap-5 mt-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
        >
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Trust strip */}
      {(() => {
        const items = settings?.trust?.items?.length ? settings.trust.items : TRUST_FALLBACK;
        return (
          <section style={{ maxWidth: 1440, margin: '80px auto 0', padding: '0 24px' }}>
            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}
            >
              {items.map((t, i) => (
                <div
                  key={`${t.title}-${i}`}
                  className="flex items-center gap-3"
                  style={{
                    padding: '24px 20px',
                    borderRight: i < items.length - 1 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <span style={{ color: 'var(--terracotta)' }}>
                    {renderTrustIcon(t.iconKey, 22)}
                  </span>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--ink)' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
