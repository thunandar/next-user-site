'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { journalApi, type JournalPost } from '@/lib/api'
import { formatDate, getImageUrl } from '@/lib/utils'
import PlaceholderImg from '@/components/ui/PlaceholderImg'
import { PageLoader } from '@/components/ui/Spinner'

export default function JournalDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()

  const [post, setPost] = useState<JournalPost | null>(null)
  const [related, setRelated] = useState<JournalPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets state when slug changes
    setLoading(true)
    setNotFound(false)
    journalApi
      .getBySlug(slug)
      .then((p) => {
        setPost(p)
        journalApi
          .list(1, 6)
          .then((r) => setRelated(r.posts.filter((x) => x.slug !== slug).slice(0, 3)))
          .catch(() => {})
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const paragraphs = useMemo(
    () => (post?.body ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    [post?.body],
  )

  if (loading) return <PageLoader />

  if (notFound || !post) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
        <div className="t-micro" style={{ color: 'var(--terracotta-2)', marginBottom: 12 }}>
          Not found
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, color: 'var(--ink)', fontWeight: 400, margin: 0 }}>
          This post has wandered off.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 14, lineHeight: 1.6 }}>
          The piece you&rsquo;re looking for may have been retitled, unpublished, or never existed.
        </p>
        <button
          type="button"
          onClick={() => router.push('/shop/journal')}
          style={{
            marginTop: 28,
            padding: '10px 22px',
            borderRadius: 999,
            border: '1px solid var(--line-strong)',
            background: 'transparent',
            color: 'var(--ink)',
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: 0.04,
          }}
        >
          Back to the journal
        </button>
      </div>
    )
  }

  return (
    <article style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 96px' }}>
      {/* Breadcrumb */}
      <nav
        style={{
          fontSize: 12.5,
          color: 'var(--ink-3)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginBottom: 28,
        }}
      >
        <Link href="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>
          Shop
        </Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <Link href="/shop/journal" style={{ color: 'inherit', textDecoration: 'none' }}>
          Journal
        </Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ color: 'var(--ink-2)' }}>{post.title}</span>
      </nav>

      {/* Header */}
      <header style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', paddingBottom: 36 }}>
        <div
          className="t-micro"
          style={{ color: 'var(--terracotta-2)', marginBottom: 16 }}
        >
          {post.eyebrow || 'Field notes'}
        </div>
        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(36px, 5vw, 60px)',
            lineHeight: 1.05,
            color: 'var(--ink)',
            margin: 0,
            fontWeight: 400,
            letterSpacing: -0.01,
          }}
        >
          {post.title}
        </h1>
        {post.excerpt && (
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 'clamp(17px, 1.6vw, 21px)',
              lineHeight: 1.5,
              color: 'var(--ink-2)',
              marginTop: 22,
            }}
          >
            {post.excerpt}
          </p>
        )}
        <div
          style={{
            marginTop: 28,
            fontSize: 12.5,
            color: 'var(--ink-3)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'center',
            textTransform: 'uppercase',
            letterSpacing: 0.08,
          }}
        >
          {post.author && <span>{post.author}</span>}
          {post.author && (post.publishedAt || post.createdAt) && (
            <span style={{ opacity: 0.4 }}>·</span>
          )}
          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
        </div>
      </header>

      {/* Cover */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          width: '100%',
          maxWidth: 1100,
          margin: '0 auto 48px',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'var(--bg-muted)',
        }}
      >
        {post.coverImageUrl ? (
          <Image
            src={getImageUrl(post.coverImageUrl)}
            alt={post.title}
            fill
            sizes="(min-width: 1100px) 1100px, 100vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        ) : (
          <PlaceholderImg label={post.title} />
        )}
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          fontFamily: 'var(--serif)',
          fontSize: 19,
          lineHeight: 1.75,
          color: 'var(--ink-2)',
        }}
      >
        {paragraphs.length === 0 ? (
          <p style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>
            This post has no body yet.
          </p>
        ) : (
          paragraphs.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '1.2em 0 0' }}>
              {p}
            </p>
          ))
        )}
      </div>

      {/* Footer rule */}
      <div
        style={{
          maxWidth: 680,
          margin: '56px auto 0',
          paddingTop: 32,
          borderTop: '1px solid var(--line)',
          textAlign: 'center',
          fontSize: 12.5,
          color: 'var(--ink-3)',
          textTransform: 'uppercase',
          letterSpacing: 0.1,
        }}
      >
        End of post
      </div>

      {/* Continue reading */}
      {related.length > 0 && (
        <section style={{ marginTop: 80, borderTop: '1px solid var(--line)', paddingTop: 48 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 28,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(26px, 3vw, 36px)',
                color: 'var(--ink)',
                margin: 0,
                fontWeight: 400,
              }}
            >
              Continue reading,{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--terracotta)' }}>slowly</span>
            </h2>
            <Link
              href="/shop/journal"
              style={{
                fontSize: 12.5,
                color: 'var(--terracotta-2)',
                textTransform: 'uppercase',
                letterSpacing: 0.08,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              All posts →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 32,
            }}
          >
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/shop/journal/${r.slug}`}
                style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '4 / 3',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'var(--bg-muted)',
                    marginBottom: 14,
                  }}
                >
                  {r.coverImageUrl ? (
                    <Image
                      src={getImageUrl(r.coverImageUrl)}
                      alt={r.title}
                      fill
                      sizes="(min-width: 1024px) 340px, 100vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <PlaceholderImg label={r.title} />
                  )}
                </div>
                <div
                  className="t-micro"
                  style={{ color: 'var(--terracotta-2)', marginBottom: 6 }}
                >
                  {r.eyebrow || 'Field notes'}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 20,
                    lineHeight: 1.25,
                    color: 'var(--ink)',
                    margin: 0,
                    fontWeight: 400,
                  }}
                >
                  {r.title}
                </h3>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  {r.author && <span>{r.author}</span>}
                  {r.author && (r.publishedAt || r.createdAt) && (
                    <span style={{ opacity: 0.4 }}>·</span>
                  )}
                  <span>{formatDate(r.publishedAt || r.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
