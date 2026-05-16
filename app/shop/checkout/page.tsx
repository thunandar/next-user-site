'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ordersApi,
  couponsApi,
  addressesApi,
  recordAbandonedCheckout,
  getApiErrorMessage,
  type Address,
  type CouponValidation,
} from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import {
  SHIPPING_RATES,
  SHIPPING_DESCRIPTIONS,
  calcTax,
  type ShippingMethod,
} from '@/lib/commerce';
import Card from '@/components/ui/Card';
import Button, { IconBtn } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Field from '@/components/ui/Field';
import PlaceholderImg from '@/components/ui/PlaceholderImg';
import { I } from '@/components/ui/Icons';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid var(--line-2)',
  background: 'var(--bg-elev)',
  color: 'var(--ink)',
  fontSize: 14,
  outline: 'none',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  const [step] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState(user?.email ?? '');
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [inline, setInline] = useState({
    firstName: '',
    lastName: '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    postal: '',
    country: 'US',
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('express');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (items.length === 0 && !success) router.replace('/shop/cart');
  }, [items.length, success, router]);

  // Record an abandoned-checkout snapshot once per page mount when there are
  // items. The backend de-dupes by user/email, so the admin-side analytics
  // counts unique sessions, not row count. Fire-and-forget — never block UX.
  useEffect(() => {
    if (items.length === 0) return;
    recordAbandonedCheckout({
      email: email || user?.email || null,
      items: items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: Number(i.product.price),
      })),
      totalAmount: totalPrice,
    });
    // Intentionally no deps beyond mount — we don't want to fire on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      addressesApi
        .list()
        .then((r) => {
          setAddresses(r);
          const def = r.find((a) => a.isDefault);
          if (def) setShippingAddressId(def.id);
        })
        .catch(() => {});
    }
  }, [user]);

  const subtotal = totalPrice;
  const shippingAmount = SHIPPING_RATES[shippingMethod];
  const discountAmount = coupon?.discount ?? 0;
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = calcTax(taxable);
  const total = Math.round((taxable + shippingAmount + taxAmount) * 100) / 100;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await couponsApi.validate(couponCode.trim(), subtotal);
      setCoupon(res);
      toast.success(`${res.description ?? res.code} applied`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Invalid code'));
      setCoupon(null);
    }
  };

  const isStaff = user?.role === 'admin' || user?.role === 'super_admin';

  const placeOrder = async () => {
    if (isStaff) {
      toast.error('Staff accounts cannot place customer orders. Sign in as a customer.');
      return;
    }
    setPlacing(true);
    try {
      await ordersApi.create({
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        shippingMethod,
        couponCode: coupon?.code,
        shippingAddressId: shippingAddressId ?? undefined,
        shippingAddress: shippingAddressId
          ? undefined
          : `${inline.firstName} ${inline.lastName}, ${inline.line1}${
              inline.line2 ? ', ' + inline.line2 : ''
            }, ${inline.city}, ${inline.region} ${inline.postal}, ${inline.country}`,
      } as Parameters<typeof ordersApi.create>[0]);
      clearCart();
      setSuccess(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to place order'));
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
        <Card padding={48} style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 999,
              background: 'var(--success-tint)',
              color: 'var(--success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <I.check size={36} />
          </div>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 40,
              color: 'var(--ink)',
            }}
          >
            Thank you.
          </h2>
          <p style={{ marginTop: 10, color: 'var(--ink-3)' }}>
            We&apos;ll send a confirmation to {email}. Made with care, shipped slowly.
          </p>
          <div className="flex gap-3 justify-center mt-8">
            <Button variant="primary" size="md" onClick={() => router.push('/shop/orders')}>
              View my orders
            </Button>
            <Button variant="secondary" size="md" onClick={() => router.push('/shop/products')}>
              Keep browsing
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Progress */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          icon={<I.chev_l />}
          onClick={() => router.push('/shop/cart')}
        >
          Back to cart
        </Button>
        <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
          {(['Cart', 'Information', 'Shipping', 'Payment'] as const).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 500,
                  background: i + 1 <= step ? 'var(--ink)' : 'var(--bg-muted)',
                  color: i + 1 <= step ? 'var(--bg)' : 'var(--ink-3)',
                }}
              >
                {i + 1}
              </span>
              <span style={{ color: i + 1 === step ? 'var(--ink)' : 'var(--ink-3)' }}>{label}</span>
              {i < 3 && (
                <span
                  style={{
                    width: 16,
                    height: 1,
                    background: 'var(--line-2)',
                    display: 'inline-block',
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <span style={{ width: 80 }} />
      </div>

      <div
        className="grid gap-12"
        style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}
      >
        <div className="flex flex-col gap-4">
          <Card padding={24}>
            <div className="t-h4">Contact</div>
            <div className="t-small" style={{ marginBottom: 12 }}>
              Receipt and shipping updates go here.
            </div>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={INPUT_STYLE}
              />
            </Field>
          </Card>

          <Card padding={24}>
            <div className="t-h4">Shipping address</div>
            <div className="t-small" style={{ marginBottom: 12 }}>
              Where should we send this?
            </div>
            {addresses.length > 0 && (
              <div className="flex flex-col gap-2" style={{ marginBottom: 16 }}>
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-start gap-3"
                    style={{
                      padding: 14,
                      border: '1px solid var(--line-2)',
                      borderRadius: 12,
                      background:
                        shippingAddressId === a.id ? 'var(--bg-muted)' : 'var(--bg-elev)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="addr"
                      checked={shippingAddressId === a.id}
                      onChange={() => setShippingAddressId(a.id)}
                      style={{ accentColor: 'var(--ink)', marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.postal}, {a.country}
                      </div>
                      {a.isDefault && (
                        <Badge tone="sage" size="sm" style={{ marginTop: 6 }}>
                          Default
                        </Badge>
                      )}
                    </div>
                  </label>
                ))}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="addr"
                    checked={shippingAddressId === null}
                    onChange={() => setShippingAddressId(null)}
                    style={{ accentColor: 'var(--ink)' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                    Use a new address
                  </span>
                </label>
              </div>
            )}
            {shippingAddressId === null && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name">
                  <input
                    value={inline.firstName}
                    onChange={(e) => setInline((s) => ({ ...s, firstName: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Last name">
                  <input
                    value={inline.lastName}
                    onChange={(e) => setInline((s) => ({ ...s, lastName: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Street address" className="col-span-2">
                  <input
                    value={inline.line1}
                    onChange={(e) => setInline((s) => ({ ...s, line1: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Apartment, suite, etc. (optional)" className="col-span-2">
                  <input
                    value={inline.line2}
                    onChange={(e) => setInline((s) => ({ ...s, line2: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="City">
                  <input
                    value={inline.city}
                    onChange={(e) => setInline((s) => ({ ...s, city: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Postal code">
                  <input
                    value={inline.postal}
                    onChange={(e) => setInline((s) => ({ ...s, postal: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Country" className="col-span-2">
                  <input
                    value={inline.country}
                    onChange={(e) => setInline((s) => ({ ...s, country: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </Field>
              </div>
            )}
          </Card>

          <Card padding={24}>
            <div className="t-h4">Shipping method</div>
            <div className="flex flex-col gap-2 mt-3">
              {(Object.keys(SHIPPING_DESCRIPTIONS) as ShippingMethod[]).map((m) => {
                const active = shippingMethod === m;
                const info = SHIPPING_DESCRIPTIONS[m];
                return (
                  <label
                    key={m}
                    className="flex items-center gap-3 cursor-pointer"
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: active ? 'var(--bg-muted)' : 'var(--bg-elev)',
                      border: active ? '1px solid var(--ink)' : '1px solid var(--line-2)',
                    }}
                  >
                    <input
                      type="radio"
                      name="ship"
                      checked={active}
                      onChange={() => setShippingMethod(m)}
                      style={{ accentColor: 'var(--ink)' }}
                    />
                    <div className="flex-1">
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                        {info.detail}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                      {info.price}
                    </span>
                  </label>
                );
              })}
            </div>
          </Card>

          <Card padding={24}>
            <div className="t-h4">Payment</div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['Card', 'Apple Pay', 'PayPal', 'Klarna'].map((m, i) => (
                <button
                  key={m}
                  type="button"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    background: i === 0 ? 'var(--ink)' : 'var(--bg-elev)',
                    color: i === 0 ? 'var(--bg)' : 'var(--ink-2)',
                    border: '1px solid var(--line-2)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 mt-4">
              <Field label="Card number" className="col-span-3">
                <input placeholder="1234 5678 9012 3456" style={INPUT_STYLE} />
              </Field>
              <Field label="Expires">
                <input placeholder="MM / YY" style={INPUT_STYLE} />
              </Field>
              <Field label="CVC">
                <input placeholder="•••" style={INPUT_STYLE} />
              </Field>
              <Field label="Name on card">
                <input style={INPUT_STYLE} />
              </Field>
            </div>
            <Button
              variant="primary"
              size="lg"
              full
              onClick={placeOrder}
              loading={placing}
              disabled={isStaff}
              icon={<I.lock />}
              style={{ marginTop: 20 }}
            >
              {isStaff ? 'Staff accounts cannot place orders' : `Place order · ${formatCurrency(total)}`}
            </Button>
            {isStaff && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--warning-tint, #fdf3e7)',
                  color: 'var(--warning, #8a5a1f)',
                  fontSize: 12.5,
                  lineHeight: 1.5,
                }}
              >
                You&apos;re signed in as staff. Use the admin panel&apos;s manual-order
                flow to place an order on behalf of a customer.
              </div>
            )}
          </Card>
        </div>

        <aside>
          <Card padding={24} style={{ position: 'sticky', top: 120 }}>
            <div className="t-h4">Your order</div>
            <div className="flex flex-col gap-3 mt-4">
              {items.map((it) => (
                <div key={it.product.id} className="flex items-center gap-3">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'var(--bg-muted)',
                    }}
                  >
                    <PlaceholderImg label={it.product.name} h="100%" w="100%" />
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        background: 'var(--ink)',
                        color: 'var(--bg)',
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        fontSize: 11,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {it.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                      {it.product.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                      {formatCurrency(Number(it.product.price) * it.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                placeholder="Promo code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{
                  ...INPUT_STYLE,
                  height: 36,
                  fontSize: 13,
                }}
              />
              <IconBtn icon={<I.arr_r />} variant="bordered" size={36} onClick={applyCoupon} />
            </div>
            {coupon && (
              <Badge tone="sage" size="sm" dot style={{ marginTop: 8 }}>
                {coupon.code} · −{formatCurrency(coupon.discount)}
              </Badge>
            )}

            <div className="flex flex-col gap-2 mt-4" style={{ fontSize: 13 }}>
              <Row label="Subtotal" value={formatCurrency(subtotal)} />
              <Row
                label={`Shipping (${SHIPPING_DESCRIPTIONS[shippingMethod].label})`}
                value={shippingAmount === 0 ? 'Free' : formatCurrency(shippingAmount)}
              />
              <Row label="Tax" value={formatCurrency(taxAmount)} />
              {discountAmount > 0 && (
                <Row label="Discount" value={`−${formatCurrency(discountAmount)}`} tone="var(--success)" />
              )}
            </div>

            <div
              className="flex items-baseline justify-between"
              style={{
                borderTop: '1px solid var(--line)',
                paddingTop: 12,
                marginTop: 12,
              }}
            >
              <span style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 28 }}>
                {formatCurrency(total)}
              </span>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ color: tone ?? 'var(--ink)' }}>{value}</span>
    </div>
  );
}
