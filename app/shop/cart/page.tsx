'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatCurrency, getPrimaryImage } from '@/lib/utils';
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_RATES,
  calcTax,
  qualifiesForFreeShipping,
} from '@/lib/commerce';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PlaceholderImg from '@/components/ui/PlaceholderImg';
import { I } from '@/components/ui/Icons';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px' }}>
        <Card padding={48} style={{ textAlign: 'center' }}>
          <I.bag size={44} style={{ color: 'var(--ink-4)', margin: '0 auto' }} />
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 32,
              color: 'var(--ink)',
              marginTop: 16,
            }}
          >
            Your cart is empty
          </h2>
          <p style={{ color: 'var(--ink-3)', marginTop: 8 }}>
            A short list of quiet things is waiting for you.
          </p>
          <Link href="/shop/products">
            <Button variant="primary" size="lg" icon={<I.arr_r />} style={{ marginTop: 24 }}>
              Start the edit
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);
  const progress = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100);
  const isFreeShipping = qualifiesForFreeShipping(totalPrice);
  const previewShipping = isFreeShipping ? 0 : SHIPPING_RATES.express;
  const previewTax = calcTax(totalPrice);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div
        className="grid gap-10"
        style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }}
      >
        <div>
          <h1 className="t-h1">
            Your cart{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </h1>

          {remaining > 0 && (
            <Card
              padding={16}
              style={{
                marginTop: 16,
                background: 'var(--sage-tint)',
                borderColor: 'var(--sage-tint)',
              }}
            >
              <div
                className="flex items-center gap-2"
                style={{ color: 'var(--sage-2)', fontSize: 13 }}
              >
                <I.spark size={16} /> You&apos;re {formatCurrency(remaining)} away from free express shipping.
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.5)',
                  marginTop: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'var(--sage)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </Card>
          )}

          <div className="mt-6 flex flex-col">
            {items.map(({ product, quantity }, i) => {
              const primary = getPrimaryImage(product.ProductImages || []);
              const hasImage = primary && primary !== '/placeholder.png';
              return (
                <div
                  key={product.id}
                  className="flex items-start gap-5"
                  style={{
                    padding: '20px 0',
                    borderTop: i === 0 ? '1px solid var(--line)' : 'none',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      width: 120,
                      height: 140,
                      borderRadius: 12,
                      overflow: 'hidden',
                      flexShrink: 0,
                      position: 'relative',
                      background: 'var(--bg-muted)',
                    }}
                  >
                    {hasImage ? (
                      <Image src={primary} alt={product.name} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <PlaceholderImg label={product.name} h="100%" w="100%" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="t-micro" style={{ color: 'var(--ink-3)' }}>
                      {product.vendor ?? product.category ?? 'Nexus'}
                    </div>
                    <Link
                      href={`/shop/products/${product.id}`}
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 22,
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        display: 'block',
                        marginTop: 4,
                      }}
                    >
                      {product.name}
                    </Link>
                    <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 6 }}>
                      {formatCurrency(product.price)}
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <div
                        className="flex items-center"
                        style={{
                          border: '1px solid var(--line-2)',
                          borderRadius: 999,
                          background: 'var(--bg-elev)',
                          height: 34,
                          padding: '0 4px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 999,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ink-2)',
                            cursor: 'pointer',
                          }}
                        >
                          <I.minus size={12} />
                        </button>
                        <span
                          style={{
                            minWidth: 24,
                            textAlign: 'center',
                            fontSize: 13,
                            color: 'var(--ink)',
                          }}
                        >
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 999,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ink-2)',
                            cursor: 'pointer',
                          }}
                        >
                          <I.plus size={12} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--ink-3)',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 20,
                      color: 'var(--ink)',
                    }}
                  >
                    {formatCurrency(Number(product.price) * quantity)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside>
          <Card
            padding={24}
            style={{ position: 'sticky', top: 120, display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div className="t-h4">Order summary</div>
            <div className="flex items-center justify-between" style={{ fontSize: 14 }}>
              <span style={{ color: 'var(--ink-3)' }}>Subtotal</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between" style={{ fontSize: 14 }}>
              <span style={{ color: 'var(--ink-3)' }}>Shipping</span>
              <span style={{ color: remaining > 0 ? 'var(--ink)' : 'var(--success)' }}>
                {remaining > 0 ? 'Calculated at checkout' : 'Free'}
              </span>
            </div>
            <div className="flex items-center justify-between" style={{ fontSize: 14 }}>
              <span style={{ color: 'var(--ink-3)' }}>Estimated tax</span>
              <span>{formatCurrency(previewTax)}</span>
            </div>
            <div
              style={{
                borderTop: '1px solid var(--line)',
                paddingTop: 14,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 32 }}>
                {formatCurrency(totalPrice + previewTax + previewShipping)}
              </span>
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => e.preventDefault()}
              style={{ marginTop: 4 }}
            >
              <input
                placeholder="Promo code"
                style={{
                  flex: 1,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: '1px solid var(--line-2)',
                  background: 'var(--bg-elev)',
                  fontSize: 13,
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
              <Button variant="secondary" size="md">
                Apply
              </Button>
            </form>

            <Link href="/shop/checkout" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" full icon={<I.lock />}>
                Continue to checkout
              </Button>
            </Link>

            <div
              className="flex items-center gap-2"
              style={{ fontSize: 12, color: 'var(--ink-3)' }}
            >
              <I.refund size={14} /> Free returns within 60 days
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
