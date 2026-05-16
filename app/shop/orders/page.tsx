'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ordersApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import Avatar from '@/components/ui/Avatar';
import PlaceholderImg from '@/components/ui/PlaceholderImg';
import Button from '@/components/ui/Button';
import { I } from '@/components/ui/Icons';
import { cloneElement, type ReactElement } from 'react';
import type { Order } from '@/types';

type Tab = 'all' | 'open' | 'past';

const STATUS_TONE: Record<Order['status'], 'warn' | 'info' | 'sage' | 'success' | 'danger'> = {
  pending: 'warn',
  confirmed: 'info',
  shipped: 'sage',
  delivered: 'success',
  cancelled: 'danger',
};

const ACCOUNT_NAV = [
  { href: '/shop/orders', label: 'Orders', icon: <I.bag /> },
  { href: '/shop/wishlist', label: 'Wishlist', icon: <I.heart /> },
  { href: '/shop/addresses', label: 'Addresses', icon: <I.pin /> },
  { href: '/shop/profile', label: 'Profile', icon: <I.user /> },
];

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    ordersApi
      .getMy()
      .then((res) => setOrders(res.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (tab === 'open') return ['pending', 'confirmed', 'shipped'].includes(o.status);
    if (tab === 'past') return ['delivered', 'cancelled'].includes(o.status);
    return true;
  });

  const lifetime = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <Card padding={24} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Avatar name={user?.name ?? 'You'} size={64} />
        <div className="flex-1">
          <div className="t-micro" style={{ color: 'var(--terracotta-2)' }}>
            Account
          </div>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 32,
              color: 'var(--ink)',
              marginTop: 2,
            }}
          >
            Hello, {user?.name?.split(' ')[0] ?? 'friend'}
          </div>
        </div>
        <div className="flex gap-6">
          <Stat label="Orders" value={String(orders.length)} />
          <Stat label="Lifetime" value={formatCurrency(lifetime)} />
          <Stat label="Loyalty pts" value={String(Math.floor(lifetime / 10))} />
        </div>
      </Card>

      <div
        className="grid gap-8 mt-6"
        style={{ gridTemplateColumns: 'minmax(0, 180px) minmax(0, 1fr)' }}
      >
        <nav className="flex flex-col gap-1">
          {ACCOUNT_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2.5"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background:
                  n.href === '/shop/orders' ? 'var(--bg-muted)' : 'transparent',
                color: n.href === '/shop/orders' ? 'var(--ink)' : 'var(--ink-3)',
                fontSize: 13.5,
                fontWeight: n.href === '/shop/orders' ? 500 : 400,
                textDecoration: 'none',
              }}
            >
              <span>{cloneElement(n.icon as ReactElement<{ size?: number }>, { size: 16 })}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        <div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="t-h2">Order history</h1>
            <Tabs<Tab>
              tabs={[
                { value: 'all', label: 'All' },
                { value: 'open', label: 'Open' },
                { value: 'past', label: 'Past' },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>

          {loading ? (
            <Card padding={40} style={{ marginTop: 16, textAlign: 'center', color: 'var(--ink-4)' }}>
              Loading…
            </Card>
          ) : filtered.length === 0 ? (
            <Card padding={40} style={{ marginTop: 16, textAlign: 'center' }}>
              <I.bag size={36} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, color: 'var(--ink)' }}>No orders yet.</div>
              <Link href="/shop/products">
                <Button variant="primary" size="md" style={{ marginTop: 16 }} icon={<I.arr_r />}>
                  Browse the edit
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="flex flex-col gap-3 mt-6">
              {filtered.map((o) => {
                const images = (o.items ?? []).slice(0, 3);
                const extra = (o.items?.length ?? 0) - images.length;
                return (
                  <Card key={o.id} padding={20}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex -space-x-2">
                        {images.map((it, i) => (
                          <div
                            key={`${o.id}-${i}`}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 12,
                              overflow: 'hidden',
                              border: '2px solid var(--bg-elev)',
                              background: 'var(--bg-muted)',
                              position: 'relative',
                            }}
                          >
                            <PlaceholderImg label={it.product?.name ?? ''} h="100%" w="100%" />
                          </div>
                        ))}
                        {extra > 0 && (
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 12,
                              background: 'var(--bg-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--ink-3)',
                              fontSize: 13,
                              border: '2px solid var(--bg-elev)',
                              fontFamily: 'var(--serif)',
                            }}
                          >
                            +{extra}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="t-mono"
                            style={{ fontSize: 12.5, color: 'var(--ink)' }}
                          >
                            #NX-{String(o.id).padStart(5, '0')}
                          </span>
                          <Badge tone={STATUS_TONE[o.status]} size="sm" dot>
                            {o.status}
                          </Badge>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>
                          {new Date(o.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          · {o.items?.length ?? 0} items
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--serif)',
                          fontSize: 22,
                          color: 'var(--ink)',
                        }}
                      >
                        {formatCurrency(o.totalAmount)}
                      </div>

                      <div className="flex gap-2">
                        {o.status === 'shipped' && (
                          <Link href={`/shop/orders/${o.id}`}>
                            <Button variant="secondary" size="sm" icon={<I.truck />}>
                              Track
                            </Button>
                          </Link>
                        )}
                        <Link href={`/shop/orders/${o.id}`}>
                          <Button variant="ghost" size="sm" iconRight={<I.arr_r />}>
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div className="t-micro" style={{ color: 'var(--ink-3)' }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 22,
          color: 'var(--ink)',
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
