'use client';

import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, getPrimaryImage, getStockStatus } from '@/lib/utils';
import PlaceholderImg from '@/components/ui/PlaceholderImg';
import { I } from '@/components/ui/Icons';
import type { Product } from '@/types';

interface Props {
  product: Product;
  avgRating?: number | null;
}

export default function ProductCard({ product, avgRating }: Props) {
  const { addToCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const primaryImage = getPrimaryImage(product.ProductImages);
  const stockStatus = getStockStatus(product.stock);
  const inWishlist = isInWishlist(product.id);
  const hasImage = primaryImage && primaryImage !== '/placeholder.png';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stockStatus === 'out') return;
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sign in to save items');
      return;
    }
    await toggle(product.id);
    toast.success(inWishlist ? 'Removed from wishlist' : 'Saved');
  };

  const tags = (product as { tags?: string[] }).tags ?? [];

  return (
    <Link
      href={`/shop/products/${product.id}`}
      className="group flex flex-col overflow-hidden transition-all"
      style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        textDecoration: 'none',
        color: 'var(--ink)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--line-strong)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--line)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
      }}
    >
      <div className="relative" style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
        {hasImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <PlaceholderImg label={product.name} h="100%" w="100%" style={{ borderRadius: 0 }} />
        )}

        {stockStatus === 'out' && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(22,20,15,0.35)' }}>
            <span
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: 'var(--ink)', color: 'var(--bg-elev)' }}
            >
              Out of stock
            </span>
          </div>
        )}

        {tags[0] && stockStatus !== 'out' && (
          <div className="absolute top-2.5 left-2.5">
            <span
              className="text-[10px] font-semibold uppercase rounded-full"
              style={{
                padding: '4px 10px',
                letterSpacing: 0.04,
                background: 'var(--bg-elev)',
                color: 'var(--ink-2)',
                border: '1px solid var(--line-2)',
              }}
            >
              {tags[0]}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
          className="absolute top-2.5 right-2.5 rounded-full flex items-center justify-center transition-all"
          style={{
            width: 34,
            height: 34,
            background: inWishlist ? 'var(--terracotta)' : 'rgba(255,255,255,0.92)',
            color: inWishlist ? '#fff' : 'var(--ink-2)',
            border: '1px solid var(--line)',
            cursor: 'pointer',
          }}
        >
          {inWishlist ? <I.heart_f size={15} /> : <I.heart size={15} />}
        </button>
      </div>

      <div className="flex flex-col gap-1" style={{ padding: 16 }}>
        <span className="t-micro" style={{ color: 'var(--ink-3)' }}>
          {(product as { vendor?: string | null }).vendor ?? product.category ?? 'Nexus'}
        </span>
        <h3
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 19,
            lineHeight: 1.15,
            color: 'var(--ink)',
          }}
        >
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--ink)' }}>
            {formatCurrency(product.price)}
          </span>
          {avgRating != null && avgRating > 0 && (
            <span className="inline-flex items-center gap-1" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              <I.star_f size={12} style={{ color: 'var(--sand)' }} />
              {avgRating.toFixed(1)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={stockStatus === 'out'}
          className="mt-3 flex items-center justify-center gap-2 transition-colors"
          style={{
            width: '100%',
            height: 36,
            padding: '0 14px',
            background: stockStatus === 'out' ? 'var(--bg-muted)' : 'var(--ink)',
            color: stockStatus === 'out' ? 'var(--ink-4)' : 'var(--bg-elev)',
            border: 'none',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            cursor: stockStatus === 'out' ? 'not-allowed' : 'pointer',
          }}
        >
          <I.cart size={14} />
          {stockStatus === 'out' ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </Link>
  );
}
