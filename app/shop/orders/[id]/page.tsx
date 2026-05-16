'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ordersApi, getApiErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Divider from '@/components/ui/Divider';
import PlaceholderImg from '@/components/ui/PlaceholderImg';
import { I } from '@/components/ui/Icons';
import type { Order } from '@/types';

const STATUS_TONE: Record<Order['status'], 'warn' | 'info' | 'sage' | 'success' | 'danger'> = {
  pending: 'warn',
  confirmed: 'info',
  shipped: 'sage',
  delivered: 'success',
  cancelled: 'danger',
};

const FLOW: Order['status'][] = ['pending', 'confirmed', 'shipped', 'delivered'];
const STAGE_LABEL: Record<Order['status'], string> = {
  pending: 'Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    ordersApi
      .getById(id)
      .then(setOrder)
      .catch((err) => toast.error(getApiErrorMessage(err, 'Failed to load order')))
      .finally(() => setLoading(false));
  }, [id]);

  const subtotal = useMemo(
    () => (order?.items ?? []).reduce((s, it) => s + Number(it.price) * it.quantity, 0),
    [order],
  );
  const total = Number(order?.totalAmount ?? 0);
  const adjustments = total - subtotal;

  const cancel = async () => {
    if (!order) return;
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, 'cancelled');
      setOrder(updated);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to cancel order'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
        <Card padding={40} style={{ textAlign: 'center', color: 'var(--ink-4)' }}>
          Loading…
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
        <Card padding={40} style={{ textAlign: 'center' }}>
          <I.bag size={36} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, color: 'var(--ink)' }}>We couldn’t find that order.</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>
            It may belong to a different account or has been removed.
          </div>
          <Link href="/shop/orders">
            <Button variant="primary" size="md" style={{ marginTop: 16 }} icon={<I.arr_r />}>
              Back to orders
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentStage = isCancelled ? -1 : FLOW.indexOf(order.status);
  const placedDate = new Date(order.createdAt);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      <button
        type="button"
        onClick={() => router.push('/shop/orders')}
        className="flex items-center gap-1.5"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--ink-3)',
          fontSize: 13,
          padding: 0,
          cursor: 'pointer',
          marginBottom: 20,
        }}
      >
        <I.chev_l size={14} />
        All orders
      </button>

      {/* Header */}
      <Card padding={28}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="t-mono"
                style={{ fontSize: 13, color: 'var(--ink-3)', letterSpacing: 0.4 }}
              >
                #NX-{String(order.id).padStart(5, '0')}
              </span>
              <Badge tone={STATUS_TONE[order.status]} size="sm" dot>
                {order.status}
              </Badge>
            </div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 32,
                color: 'var(--ink)',
                marginTop: 6,
                lineHeight: 1.15,
              }}
            >
              {placedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
              {order.items?.length ?? 0} items · {formatCurrency(total)}
            </div>
          </div>

          <div className="flex gap-2">
            {order.status === 'shipped' && (
              <Button variant="secondary" size="sm" icon={<I.truck />}>
                Track package
              </Button>
            )}
            {order.status === 'pending' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={cancel}
                loading={cancelling}
                icon={<I.x />}
              >
                Cancel order
              </Button>
            )}
            {order.status === 'delivered' && (
              <Button variant="secondary" size="sm" icon={<I.refund />}>
                Request return
              </Button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginTop: 28 }}>
          {isCancelled ? (
            <div
              className="flex items-center gap-2"
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'var(--danger-tint)',
                color: 'var(--danger)',
                fontSize: 13,
              }}
            >
              <I.x size={16} />
              This order was cancelled.
            </div>
          ) : (
            <div className="flex items-center" style={{ gap: 0 }}>
              {FLOW.map((stage, i) => {
                const reached = i <= currentStage;
                const isCurrent = i === currentStage;
                return (
                  <div
                    key={stage}
                    className="flex items-center"
                    style={{ flex: i < FLOW.length - 1 ? 1 : 0 }}
                  >
                    <div className="flex flex-col items-center" style={{ gap: 6 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          background: reached ? 'var(--ink)' : 'var(--bg-muted)',
                          color: reached ? 'var(--bg)' : 'var(--ink-4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isCurrent ? '2px solid var(--terracotta)' : 'none',
                          flexShrink: 0,
                        }}
                      >
                        {reached ? <I.check size={14} /> : <span style={{ fontSize: 12 }}>{i + 1}</span>}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: reached ? 'var(--ink-2)' : 'var(--ink-4)',
                          fontWeight: isCurrent ? 500 : 400,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {STAGE_LABEL[stage]}
                      </div>
                    </div>
                    {i < FLOW.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          margin: '0 8px',
                          marginBottom: 22,
                          background: i < currentStage ? 'var(--ink)' : 'var(--line)',
                          borderRadius: 2,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Body grid */}
      <div
        className="grid gap-4 mt-4"
        style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)' }}
      >
        {/* Items */}
        <Card padding={0}>
          <div style={{ padding: '20px 24px 12px' }}>
            <div className="t-h4">Items</div>
          </div>
          <div>
            {(order.items ?? []).map((it, idx) => {
              const lineTotal = Number(it.price) * it.quantity;
              return (
                <div
                  key={it.id}
                  className="flex items-center gap-4"
                  style={{
                    padding: '14px 24px',
                    borderTop: idx === 0 ? '1px solid var(--line)' : 'none',
                    borderBottom:
                      idx === (order.items?.length ?? 0) - 1 ? 'none' : '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: 'var(--bg-muted)',
                    }}
                  >
                    <PlaceholderImg label={it.product?.name ?? ''} h="100%" w="100%" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/shop/products/${it.productId}`}
                      style={{
                        fontSize: 14,
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      {it.product?.name ?? `Product #${it.productId}`}
                    </Link>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>
                      Qty {it.quantity} · {formatCurrency(it.price)} each
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 18,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCurrency(lineTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card padding={20}>
            <div className="t-h4" style={{ marginBottom: 12 }}>Summary</div>
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            {Math.abs(adjustments) > 0.001 && (
              <Row
                label={adjustments < 0 ? 'Discounts' : 'Shipping & tax'}
                value={`${adjustments < 0 ? '−' : ''}${formatCurrency(Math.abs(adjustments))}`}
                muted={adjustments < 0}
              />
            )}
            <Divider />
            <div
              className="flex items-center justify-between"
              style={{ paddingTop: 4 }}
            >
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Total</span>
              <span
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 22,
                  color: 'var(--ink)',
                }}
              >
                {formatCurrency(total)}
              </span>
            </div>
          </Card>

          <Card padding={20}>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <I.pin size={15} style={{ color: 'var(--ink-3)' }} />
              <div className="t-h4">Shipping</div>
            </div>
            {order.address ? (
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                <div style={{ color: 'var(--ink)', fontWeight: 500 }}>{order.address.name}</div>
                <div>{order.address.line1}</div>
                {order.address.line2 && <div>{order.address.line2}</div>}
                <div>
                  {order.address.city}
                  {order.address.region ? `, ${order.address.region}` : ''} {order.address.postal}
                </div>
                <div>{order.address.country}</div>
                {order.address.phone && (
                  <div style={{ color: 'var(--ink-3)', marginTop: 6 }}>{order.address.phone}</div>
                )}
              </div>
            ) : order.shippingAddress ? (
              <div
                style={{
                  fontSize: 13.5,
                  color: 'var(--ink-2)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line',
                }}
              >
                {order.shippingAddress}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>No address on file.</div>
            )}
          </Card>

          {order.notes && (
            <Card padding={20}>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <I.chat size={15} style={{ color: 'var(--ink-3)' }} />
                <div className="t-h4">Notes</div>
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: 'var(--ink-2)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line',
                }}
              >
                {order.notes}
              </div>
            </Card>
          )}

          <Card padding={20}>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              Need help with this order? Reach us at{' '}
              <a
                href="mailto:hello@nexus.shop"
                style={{ color: 'var(--terracotta-2)', textDecoration: 'none' }}
              >
                hello@nexus.shop
              </a>{' '}
              and reference{' '}
              <span className="t-mono" style={{ color: 'var(--ink)' }}>
                #NX-{String(order.id).padStart(5, '0')}
              </span>
              .
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '6px 0', fontSize: 13.5 }}
    >
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ color: muted ? 'var(--terracotta-2)' : 'var(--ink-2)' }}>{value}</span>
    </div>
  );
}
