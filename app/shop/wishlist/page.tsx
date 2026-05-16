'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { wishlistApi } from '@/lib/api';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/shop/ProductCard';
import Card from '@/components/ui/Card';
import SectionHead from '@/components/ui/SectionHead';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import { I } from '@/components/ui/Icons';
import type { Product } from '@/types';

type Tab = 'all' | 'in_stock' | 'notify';

export default function WishlistPage() {
  const { ids, refresh: syncContext } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    wishlistApi
      .getAll()
      .then((res) => {
        setProducts(res.data.map((it) => it.product).filter(Boolean));
        syncContext();
      })
      .catch(() => toast.error('Failed to load wishlist'))
      .finally(() => setLoading(false));
  }, [syncContext]);

  const saved = products.filter((p) => ids.has(p.id));
  const filtered = saved.filter((p) => {
    if (tab === 'in_stock') return p.stock > 0;
    if (tab === 'notify') return p.stock === 0;
    return true;
  });

  const handleAddAllToCart = () => {
    const inStock = saved.filter((p) => p.stock > 0);
    if (inStock.length === 0) {
      toast.error('Nothing in stock to add right now');
      return;
    }
    inStock.forEach((p) => addToCart(p, 1));
    toast.success(`Added ${inStock.length} ${inStock.length === 1 ? 'piece' : 'pieces'} to your cart`);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px' }}>
        <div
          style={{
            height: 28,
            width: 220,
            background: 'var(--bg-muted)',
            borderRadius: 6,
          }}
        />
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px' }}>
        <Card padding={48} style={{ textAlign: 'center' }}>
          <I.heart size={44} style={{ color: 'var(--ink-4)', margin: '0 auto' }} />
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 32,
              color: 'var(--ink)',
              marginTop: 16,
            }}
          >
            Nothing saved yet
          </h2>
          <p style={{ color: 'var(--ink-3)', marginTop: 8 }}>
            Tap the heart on any piece to return here later.
          </p>
          <Link href="/shop/products">
            <Button variant="primary" size="lg" icon={<I.arr_r />} style={{ marginTop: 24 }}>
              Browse the edit
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px 80px' }}>
      <SectionHead
        title="Wishlist"
        sub={`${saved.length} things you've been looking at.`}
        right={
          <>
            <Tabs<Tab>
              tabs={[
                { value: 'all', label: 'All', count: saved.length },
                { value: 'in_stock', label: 'In stock', count: saved.filter((p) => p.stock > 0).length },
                { value: 'notify', label: 'Notify me', count: saved.filter((p) => p.stock === 0).length },
              ]}
              value={tab}
              onChange={setTab}
            />
            <Button
              variant="primary"
              size="sm"
              icon={<I.cart />}
              onClick={handleAddAllToCart}
              disabled={saved.every((p) => p.stock === 0)}
            >
              Add all to cart
            </Button>
          </>
        }
      />
      <div
        className="grid gap-5 mt-6"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
      >
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
