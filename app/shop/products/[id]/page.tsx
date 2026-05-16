'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  productsApi,
  reviewsApi,
  trackProductView,
  getApiErrorMessage,
  type ReviewEligibility,
  type TrustIconKey,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { formatCurrency, getImageUrl, getStockStatus } from '@/lib/utils';
import Button, { IconBtn } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import PlaceholderImg from '@/components/ui/PlaceholderImg';
import { I } from '@/components/ui/Icons';
import ProductCard from '@/components/shop/ProductCard';
import type { Product, ProductVariant, Review } from '@/types';

type Tab = 'details' | 'reviews';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const settings = useSiteSettings();
  const trustItems = (settings?.trust?.items ?? []).slice(0, 2);
  const renderTrustIcon = (key: TrustIconKey, size = 15) => {
    const Cmp = (I as Record<string, (p: { size?: number; style?: React.CSSProperties }) => React.ReactElement>)[key] ?? I.truck;
    return <Cmp size={size} style={{ color: 'var(--sage)' }} />;
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryHover, setGalleryHover] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const [activeVariant, setActiveVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<Tab>('details');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewCommentFocused, setReviewCommentFocused] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const REVIEWS_PER_PAGE = 5;

  useEffect(() => {
    if (!id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading indicator on product id change
    setLoading(true);
    productsApi
      .getById(Number(id))
      .then(({ data }) => {
        setProduct(data);
        if (data.variants && data.variants.length > 0) setActiveVariant(data.variants[0] ?? null);
        trackProductView(Number(id));
        if (data.category) {
          productsApi
            .getAll({ category: data.category, limit: 4, page: 1 })
            .then((r) => setRelated(r.data.filter((p) => p.id !== Number(id)).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch((err) => toast.error(getApiErrorMessage(err, 'Failed to load product')))
      .finally(() => setLoading(false));
    reviewsApi
      .getAll(Number(id), 1, REVIEWS_PER_PAGE)
      .then((r) => {
        setReviews(r.reviews);
        setAvgRating(r.avgRating);
        setTotalReviews(r.totalReviews);
        setReviewsTotalPages(r.totalPages);
        setReviewsPage(1);
        setEligibility(r.eligibility);
      })
      .catch(() => {});
  }, [id, user?.id]);

  const loadMoreReviews = async () => {
    if (!id || loadingMoreReviews || reviewsPage >= reviewsTotalPages) return;
    setLoadingMoreReviews(true);
    try {
      const next = reviewsPage + 1;
      const r = await reviewsApi.getAll(Number(id), next, REVIEWS_PER_PAGE);
      setReviews((prev) => [...prev, ...r.reviews]);
      setReviewsPage(next);
      setReviewsTotalPages(r.totalPages);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load more reviews'));
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  const submitReview = async () => {
    if (!id || reviewRating === 0) return;
    setSubmittingReview(true);
    try {
      await reviewsApi.create(Number(id), {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      const fresh = await reviewsApi.getAll(Number(id), 1, REVIEWS_PER_PAGE);
      setReviews(fresh.reviews);
      setAvgRating(fresh.avgRating);
      setTotalReviews(fresh.totalReviews);
      setReviewsTotalPages(fresh.totalPages);
      setReviewsPage(1);
      setEligibility(fresh.eligibility);
      setReviewRating(0);
      setReviewHover(0);
      setReviewComment('');
      toast.success('Thanks for your review');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to submit review'));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !product) {
    return (
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ height: 14, width: 200, background: 'var(--bg-muted)', borderRadius: 4 }} />
        <div
          className="grid md:grid-cols-2 gap-12 mt-6"
          style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)' }}
        >
          <div
            style={{
              height: 620,
              background: 'var(--bg-muted)',
              borderRadius: 16,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div className="flex flex-col gap-3">
            <div style={{ height: 12, width: 160, background: 'var(--bg-muted)', borderRadius: 4 }} />
            <div style={{ height: 48, background: 'var(--bg-muted)', borderRadius: 8 }} />
            <div style={{ height: 20, width: 180, background: 'var(--bg-muted)', borderRadius: 4 }} />
            <div style={{ height: 100, background: 'var(--bg-muted)', borderRadius: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  const galleryImages = product.ProductImages ?? [];
  const galleryCount = galleryImages.length;
  const primary = galleryImages[activeImage];

  const goPrev = () => {
    if (galleryCount < 2) return;
    setActiveImage((i) => (i - 1 + galleryCount) % galleryCount);
  };
  const goNext = () => {
    if (galleryCount < 2) return;
    setActiveImage((i) => (i + 1) % galleryCount);
  };
  const stockStatus = getStockStatus(
    activeVariant ? activeVariant.stock : product.stock,
  );
  const currentPrice =
    activeVariant?.priceOverride ? Number(activeVariant.priceOverride) : Number(product.price);
  const inWishlist = isInWishlist(product.id);
  const vendor = product.vendor ?? 'Nexus';

  const colorVariants = (product.variants ?? []).reduce<Record<string, ProductVariant[]>>(
    (acc, v) => {
      const key = v.color || 'Default';
      acc[key] = acc[key] ?? [];
      acc[key]!.push(v);
      return acc;
    },
    {},
  );
  const allColors = Object.keys(colorVariants);
  const activeColor = activeVariant?.color ?? allColors[0];
  const sizesForColor = activeColor ? colorVariants[activeColor] ?? [] : [];

  const addToCartClick = () => {
    if (stockStatus === 'out') return;
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error('Sign in to save items');
      return;
    }
    await toggle(product.id);
    toast.success(inWishlist ? 'Removed' : 'Saved');
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 24px 40px' }}>
      <div className="t-small" style={{ marginBottom: 16 }}>
        <Link href="/shop" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>
          Shop
        </Link>{' '}
        /{' '}
        <Link
          href={`/shop/products?category=${product.category}`}
          style={{ color: 'var(--ink-3)', textDecoration: 'none' }}
        >
          {product.category}
        </Link>{' '}
        / <span style={{ color: 'var(--ink)' }}>{product.name}</span>
      </div>

      <div
        className="grid gap-12"
        style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)' }}
      >
        <div>
          <div
            onMouseEnter={() => setGalleryHover(true)}
            onMouseLeave={() => setGalleryHover(false)}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0]?.clientX ?? null;
              touchDeltaX.current = 0;
            }}
            onTouchMove={(e) => {
              if (touchStartX.current == null) return;
              touchDeltaX.current = (e.touches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
            }}
            onTouchEnd={() => {
              if (Math.abs(touchDeltaX.current) > 50) {
                if (touchDeltaX.current < 0) goNext();
                else goPrev();
              }
              touchStartX.current = null;
              touchDeltaX.current = 0;
            }}
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '1/1',
              touchAction: 'pan-y',
            }}
          >
            {primary ? (
              <Image
                src={getImageUrl(primary.imageUrl)}
                alt={product.name}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width:1024px) 100vw, 60vw"
                draggable={false}
              />
            ) : (
              <PlaceholderImg label={product.name} h="100%" w="100%" />
            )}
            {galleryCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous image"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 12,
                    transform: 'translateY(-50%)',
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.92)',
                    border: '1px solid var(--line-2)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: galleryHover ? 1 : 0,
                    transition: 'opacity 160ms ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                >
                  <I.chev_l size={16} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next image"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 12,
                    transform: 'translateY(-50%)',
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.92)',
                    border: '1px solid var(--line-2)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: galleryHover ? 1 : 0,
                    transition: 'opacity 160ms ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                >
                  <I.chev_r size={16} />
                </button>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'inline-flex',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {galleryImages.map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: i === activeImage ? 'var(--ink)' : 'var(--line-2)',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {galleryCount > 1 && (
            <div
              className="grid gap-3 mt-3"
              style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
            >
              {galleryImages.slice(0, 4).map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  style={{
                    height: 120,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border:
                      i === activeImage ? '2px solid var(--ink)' : '2px solid transparent',
                    padding: 0,
                    background: 'var(--bg-muted)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <Image
                    src={getImageUrl(img.imageUrl)}
                    alt={`${product.name} view ${i + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="120px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="t-micro" style={{ color: 'var(--terracotta-2)' }}>
            {vendor} {product.tags?.[0] ? `· ${product.tags[0]}` : ''}
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 44, lineHeight: 1.05, color: 'var(--ink)' }}>
            {product.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <I.star_f
                  key={i}
                  size={15}
                  style={{
                    color:
                      avgRating && i < Math.round(avgRating) ? 'var(--sand)' : 'var(--line-2)',
                  }}
                />
              ))}
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              {avgRating ? avgRating.toFixed(1) : '—'} · {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </span>
            {stockStatus !== 'out' && (
              <Badge tone="success" size="sm" dot>
                In stock
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-3 mt-3">
            <span
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 40,
                color: 'var(--ink)',
                lineHeight: 1,
              }}
            >
              {formatCurrency(currentPrice)}
            </span>
          </div>

          {product.description && (
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--ink-2)',
                marginTop: 8,
              }}
            >
              {product.description}
            </p>
          )}

          {allColors.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-2)' }}>
                  Colour
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{activeColor}</span>
              </div>
              <div className="flex gap-2">
                {allColors.map((c) => {
                  const sample = colorVariants[c]?.[0];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        if (sample) setActiveVariant(sample);
                      }}
                      title={c}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        background: sample?.colorHex ?? '#E8C99B',
                        border: activeColor === c ? '2px solid var(--ink)' : '1px solid var(--line-2)',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {sizesForColor.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-2)' }}>Size</span>
                <span style={{ fontSize: 12.5, color: 'var(--terracotta-2)' }}>Size guide</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sizesForColor.map((v) => {
                  const active = activeVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVariant(v)}
                      disabled={v.stock === 0}
                      style={{
                        minWidth: 56,
                        height: 40,
                        padding: '0 14px',
                        borderRadius: 10,
                        background: active ? 'var(--ink)' : 'var(--bg-elev)',
                        color: active ? 'var(--bg)' : 'var(--ink)',
                        border: active ? '1px solid var(--ink)' : '1px solid var(--line-2)',
                        fontSize: 13,
                        cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
                        opacity: v.stock === 0 ? 0.4 : 1,
                      }}
                    >
                      {v.size || v.name}
                    </button>
                  );
                })}
              </div>
              {activeVariant && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12.5,
                    color:
                      activeVariant.stock === 0
                        ? 'var(--ink-3)'
                        : activeVariant.stock <= 5
                        ? 'var(--terracotta-2)'
                        : 'var(--ink-3)',
                  }}
                >
                  {activeVariant.stock === 0
                    ? 'Sold out in this size'
                    : activeVariant.stock <= 5
                    ? `Only ${activeVariant.stock} left in ${activeVariant.size || activeVariant.name}`
                    : `${activeVariant.stock} in stock`}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <div
              className="flex items-center"
              style={{
                border: '1px solid var(--line-2)',
                borderRadius: 999,
                background: 'var(--bg-elev)',
                height: 46,
                padding: '0 4px',
              }}
            >
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
                <I.minus size={14} />
              </button>
              <span style={{ minWidth: 30, textAlign: 'center', fontSize: 14 }}>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
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
                <I.plus size={14} />
              </button>
            </div>
            <Button
              variant="primary"
              size="lg"
              full
              onClick={addToCartClick}
              disabled={stockStatus === 'out'}
            >
              {stockStatus === 'out' ? 'Sold out' : `Add to cart · ${formatCurrency(currentPrice)}`}
            </Button>
            <IconBtn
              icon={inWishlist ? <I.heart_f /> : <I.heart />}
              variant="bordered"
              size={46}
              onClick={handleWishlist}
              style={{ color: inWishlist ? 'var(--terracotta)' : 'var(--ink-2)' }}
            />
          </div>

          {trustItems.length > 0 && (
            <div
              className="grid grid-cols-2 gap-3 mt-4"
              style={{
                padding: 14,
                background: 'var(--bg-muted)',
                borderRadius: 12,
                fontSize: 12.5,
                color: 'var(--ink-2)',
              }}
            >
              {trustItems.map((t, i) => (
                <div key={`${t.title}-${i}`} className="flex items-center gap-2">
                  {renderTrustIcon(t.iconKey, 15)} {t.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <div
          className="flex gap-8"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          {(['details', 'reviews'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent',
                color: tab === t ? 'var(--ink)' : 'var(--ink-3)',
                fontSize: 14,
                fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-8">
          {tab === 'details' && (
            <dl
              className="grid grid-cols-[auto_1fr] gap-y-3 gap-x-10"
              style={{ fontSize: 13.5, maxWidth: 560 }}
            >
              <dt style={{ color: 'var(--ink-3)' }}>Vendor</dt>
              <dd style={{ color: 'var(--ink)' }}>{vendor}</dd>
              <dt style={{ color: 'var(--ink-3)' }}>Category</dt>
              <dd style={{ color: 'var(--ink)' }}>{product.category}</dd>
              {product.tags && product.tags.length > 0 && (
                <>
                  <dt style={{ color: 'var(--ink-3)' }}>Tags</dt>
                  <dd style={{ color: 'var(--ink)' }}>{product.tags.join(', ')}</dd>
                </>
              )}
              <dt style={{ color: 'var(--ink-3)' }}>Availability</dt>
              <dd style={{ color: 'var(--ink)' }}>
                {stockStatus === 'out'
                  ? 'Sold out'
                  : `In stock${activeVariant ? ` · ${activeVariant.stock} left` : ''}`}
              </dd>
            </dl>
          )}
          {tab === 'reviews' && (
            <div
              className="grid gap-10"
              style={{ gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)' }}
            >
              <div className="flex flex-col gap-4">
                {totalReviews === 0 ? (
                  <Card padding={20}>
                    <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
                      No reviews yet — be the first verified purchaser to share thoughts.
                    </p>
                  </Card>
                ) : (
                  <>
                    {reviews.map((r) => (
                      <Card key={r.id} padding={20}>
                        <div className="flex items-center justify-between">
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{r.user?.name}</div>
                          <div className="inline-flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <I.star_f
                                key={i}
                                size={12}
                                style={{
                                  color: i < r.rating ? 'var(--sand)' : 'var(--line-2)',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                            {r.comment}
                          </p>
                        )}
                      </Card>
                    ))}
                    {reviewsPage < reviewsTotalPages && (
                      <div className="flex justify-center" style={{ paddingTop: 4 }}>
                        <Button
                          variant="secondary"
                          onClick={loadMoreReviews}
                          disabled={loadingMoreReviews}
                        >
                          {loadingMoreReviews
                            ? 'Loading…'
                            : `Load more reviews (${totalReviews - reviews.length} left)`}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
              {eligibility?.canReview ? (
                <Card padding={20} style={{ alignSelf: 'start' }}>
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 500,
                      background: 'var(--sage-soft, #E6EDE2)',
                      color: 'var(--sage-2, #56745A)',
                      marginBottom: 10,
                    }}
                  >
                    <I.check size={11} /> You’re a verified purchaser
                  </span>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>
                    Write a review
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>
                    Share what stood out to you.
                  </div>
                  <div
                    className="inline-flex items-center gap-2 flex-wrap"
                    style={{ marginBottom: 12 }}
                    onMouseLeave={() => setReviewHover(0)}
                  >
                    <div className="inline-flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const idx = i + 1;
                        const selected = idx <= reviewRating;
                        const previewing = reviewHover > 0 && idx <= reviewHover;
                        const filled = previewing || (reviewHover === 0 && selected);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setReviewRating((prev) => (prev === idx ? 0 : idx))
                            }
                            onMouseEnter={() => setReviewHover(idx)}
                            aria-label={`${idx} star${idx > 1 ? 's' : ''}`}
                            aria-pressed={selected}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 2,
                              cursor: 'pointer',
                              transition: 'transform 120ms ease',
                              transform: previewing ? 'scale(1.08)' : 'scale(1)',
                            }}
                          >
                            {filled ? (
                              <I.star_f
                                size={28}
                                style={{ color: 'var(--terracotta)' }}
                              />
                            ) : (
                              <I.star
                                size={28}
                                stroke={1.75}
                                style={{
                                  color: selected ? 'var(--terracotta)' : 'var(--line-2)',
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)', minWidth: 48 }}>
                      {(reviewHover || reviewRating)
                        ? `${reviewHover || reviewRating}/5`
                        : 'Tap to rate'}
                    </span>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    onFocus={() => setReviewCommentFocused(true)}
                    onBlur={() => setReviewCommentFocused(false)}
                    placeholder="What stood out? (optional)"
                    rows={4}
                    maxLength={1000}
                    style={{
                      width: '100%',
                      padding: 12,
                      border: `1px solid ${reviewCommentFocused ? 'var(--terracotta)' : 'var(--line)'}`,
                      borderRadius: 8,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      outline: 'none',
                      boxShadow: reviewCommentFocused
                        ? '0 0 0 3px color-mix(in srgb, var(--terracotta) 18%, transparent)'
                        : 'none',
                      transition: 'border-color 120ms ease, box-shadow 120ms ease',
                    }}
                  />
                  <div className="flex justify-end mt-3">
                    <Button onClick={submitReview} disabled={reviewRating === 0 || submittingReview}>
                      {submittingReview ? 'Submitting…' : 'Submit review'}
                    </Button>
                  </div>
                </Card>
              ) : (
                (() => {
                  const state = !user
                    ? {
                        icon: <I.lock size={20} />,
                        title: 'Reviews are for verified purchasers',
                        body: 'Sign in to your Nexus account to leave a review on items you’ve received.',
                        cta: { href: '/login', label: 'Sign in' },
                      }
                    : eligibility?.reason === 'already_reviewed'
                      ? {
                          icon: <I.check size={20} />,
                          title: 'You’ve reviewed this',
                          body: 'Thanks for sharing your thoughts — your review is live below.',
                          cta: null,
                        }
                      : {
                          icon: <I.bag size={20} />,
                          title: 'Only verified purchasers can review',
                          body: 'Once your order is delivered, you’ll be able to share what you thought right here.',
                          cta: { href: '/shop', label: 'Browse shop' },
                        };
                  return (
                    <Card padding={24} style={{ alignSelf: 'start', textAlign: 'center' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          background: 'var(--bg-muted)',
                          color: 'var(--terracotta-2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 12,
                        }}
                      >
                        {state.icon}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--serif)',
                          fontSize: 20,
                          color: 'var(--ink)',
                          marginBottom: 6,
                        }}
                      >
                        {state.title}
                      </div>
                      <p
                        style={{
                          fontSize: 13.5,
                          color: 'var(--ink-3)',
                          lineHeight: 1.6,
                          marginBottom: state.cta ? 16 : 0,
                          maxWidth: 320,
                          marginLeft: 'auto',
                          marginRight: 'auto',
                        }}
                      >
                        {state.body}
                      </p>
                      {state.cta && (
                        <Link
                          href={state.cta.href}
                          style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            borderRadius: 999,
                            background: 'var(--ink)',
                            color: 'var(--bg)',
                            fontSize: 13,
                            fontWeight: 500,
                            textDecoration: 'none',
                          }}
                        >
                          {state.cta.label}
                        </Link>
                      )}
                    </Card>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 28,
              color: 'var(--ink)',
              marginBottom: 20,
            }}
          >
            You may also like
          </h2>
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
