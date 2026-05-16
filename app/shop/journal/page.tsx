'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { journalApi, type JournalPost } from '@/lib/api'
import { formatDate, getImageUrl } from '@/lib/utils'
import PlaceholderImg from '@/components/ui/PlaceholderImg'
import { PageLoader } from '@/components/ui/Spinner'

export default function JournalIndexPage() {
  const [posts, setPosts] = useState<JournalPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    journalApi.list(1, 24)
      .then((r) => setPosts(r.posts))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const [hero, ...rest] = posts

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--line)', paddingBottom: 28, marginBottom: 36 }}>
        <div className="t-micro" style={{ color: 'var(--terracotta-2)' }}>The Journal</div>
        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(40px, 5vw, 72px)',
            lineHeight: 1.0,
            color: 'var(--ink)',
            marginTop: 12,
            fontWeight: 400,
            letterSpacing: -0.01,
          }}
        >
          Notes from the studio,{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--terracotta)' }}>slowly</span>
          <br />
          collected.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 16, maxWidth: 600, lineHeight: 1.6 }}>
          Field notes, maker visits, and the small ideas behind the things we keep.
        </p>
      </header>

      {posts.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--ink-3)' }}>
          <p>No journal posts yet — check back soon.</p>
        </div>
      ) : (
        <>
          {/* Featured hero post */}
          {hero && (
            <Link
              href={`/shop/journal/${hero.slug}`}
              style={{ display: 'block', marginBottom: 56, textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                  gap: 40,
                  alignItems: 'center',
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 14, overflow: 'hidden', background: 'var(--bg-muted)' }}>
                  {hero.coverImageUrl ? (
                    <Image
                      src={getImageUrl(hero.coverImageUrl)}
                      alt={hero.title}
                      fill
                      sizes="(min-width: 1024px) 720px, 100vw"
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                  ) : (
                    <PlaceholderImg label={hero.title} />
                  )}
                </div>
                <div>
                  <div className="t-micro" style={{ color: 'var(--terracotta-2)', marginBottom: 12 }}>
                    {hero.eyebrow || 'Field notes'}
                  </div>
                  <h2
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 'clamp(30px, 3.4vw, 48px)',
                      lineHeight: 1.05,
                      color: 'var(--ink)',
                      margin: 0,
                      fontWeight: 400,
                      letterSpacing: -0.005,
                    }}
                  >
                    {hero.title}
                  </h2>
                  {hero.excerpt && (
                    <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ink-2)', marginTop: 16 }}>
                      {hero.excerpt}
                    </p>
                  )}
                  <div style={{ marginTop: 24, fontSize: 13, color: 'var(--ink-3)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    {hero.author && <span>{hero.author}</span>}
                    {hero.author && (hero.publishedAt || hero.createdAt) && <span style={{ opacity: 0.4 }}>·</span>}
                    <span>{formatDate(hero.publishedAt || hero.createdAt)}</span>
                  </div>
                  <div style={{ marginTop: 24, fontSize: 13, color: 'var(--terracotta-2)', textTransform: 'uppercase', letterSpacing: 0.08, fontWeight: 500 }}>
                    Read the post →
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Grid of remaining */}
          {rest.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 36,
                borderTop: '1px solid var(--line)',
                paddingTop: 48,
              }}
            >
              {rest.map((p) => (
                <Link
                  key={p.id}
                  href={`/shop/journal/${p.slug}`}
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-muted)', marginBottom: 16 }}>
                    {p.coverImageUrl ? (
                      <Image
                        src={getImageUrl(p.coverImageUrl)}
                        alt={p.title}
                        fill
                        sizes="(min-width: 1024px) 360px, 100vw"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <PlaceholderImg label={p.title} />
                    )}
                  </div>
                  <div className="t-micro" style={{ color: 'var(--terracotta-2)', marginBottom: 6 }}>
                    {p.eyebrow || 'Field notes'}
                  </div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.2, color: 'var(--ink)', margin: 0, fontWeight: 400 }}>
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 8 }}>
                      {p.excerpt.length > 120 ? `${p.excerpt.slice(0, 120).trimEnd()}…` : p.excerpt}
                    </p>
                  )}
                  <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-3)', display: 'flex', gap: 10 }}>
                    {p.author && <span>{p.author}</span>}
                    {p.author && (p.publishedAt || p.createdAt) && <span style={{ opacity: 0.4 }}>·</span>}
                    <span>{formatDate(p.publishedAt || p.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
