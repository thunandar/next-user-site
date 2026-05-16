'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { addressesApi, type Address, getApiErrorMessage } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button, { IconBtn } from '@/components/ui/Button';
import SectionHead from '@/components/ui/SectionHead';
import Badge from '@/components/ui/Badge';
import Field from '@/components/ui/Field';
import { I } from '@/components/ui/Icons';
import { cloneElement, type ReactElement } from 'react';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid var(--line-2)',
  background: 'var(--bg-elev)',
  color: 'var(--ink)',
  fontSize: 14,
  outline: 'none',
};

const EMPTY = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postal: '',
  country: 'US',
  phone: '',
  isDefault: false,
};

const ACCOUNT_NAV = [
  { href: '/shop/orders', label: 'Orders', icon: <I.bag /> },
  { href: '/shop/wishlist', label: 'Wishlist', icon: <I.heart /> },
  { href: '/shop/addresses', label: 'Addresses', icon: <I.pin /> },
  { href: '/shop/profile', label: 'Profile', icon: <I.user /> },
];

export default function AddressesPage() {
  const [list, setList] = useState<Address[]>([]);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setList(await addressesApi.list());
    } catch {
      toast.error('Failed to load addresses');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (a?: Address) => {
    if (!a) {
      setEditingId('new');
      setDraft({ ...EMPTY });
    } else {
      setEditingId(a.id);
      setDraft({
        name: a.name,
        line1: a.line1,
        line2: a.line2 ?? '',
        city: a.city,
        region: a.region ?? '',
        postal: a.postal,
        country: a.country,
        phone: a.phone ?? '',
        isDefault: a.isDefault,
      });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editingId === 'new') await addressesApi.create(draft);
      else if (typeof editingId === 'number') await addressesApi.update(editingId, draft);
      toast.success('Address saved');
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await addressesApi.remove(id);
      toast.success('Address removed');
      await load();
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div
      className="mx-auto grid gap-8"
      style={{
        maxWidth: 1100,
        padding: '40px 24px 80px',
        gridTemplateColumns: 'minmax(0, 180px) minmax(0, 1fr)',
      }}
    >
      <nav className="flex flex-col gap-1 hidden md:flex">
        {ACCOUNT_NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="flex items-center gap-2.5"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: n.href === '/shop/addresses' ? 'var(--bg-muted)' : 'transparent',
              color: n.href === '/shop/addresses' ? 'var(--ink)' : 'var(--ink-3)',
              fontSize: 13.5,
              fontWeight: n.href === '/shop/addresses' ? 500 : 400,
              textDecoration: 'none',
            }}
          >
            <span>{cloneElement(n.icon as ReactElement<{ size?: number }>, { size: 16 })}</span>
            {n.label}
          </Link>
        ))}
      </nav>

      <div>
        <SectionHead
          title="Addresses"
          sub="Saved shipping addresses for faster checkout."
          right={
            <Button variant="primary" size="sm" icon={<I.plus />} onClick={() => startEdit()}>
              Add address
            </Button>
          }
        />

        {editingId !== null && (
          <Card padding={24} style={{ marginTop: 20 }}>
            <div className="t-h4" style={{ marginBottom: 16 }}>
              {editingId === 'new' ? 'New address' : 'Edit address'}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name" className="col-span-2">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Street address" className="col-span-2">
                <input
                  value={draft.line1}
                  onChange={(e) => setDraft({ ...draft, line1: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Apartment, suite, etc. (optional)" className="col-span-2">
                <input
                  value={draft.line2}
                  onChange={(e) => setDraft({ ...draft, line2: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="City">
                <input
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Region / state">
                <input
                  value={draft.region}
                  onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Postal code">
                <input
                  value={draft.postal}
                  onChange={(e) => setDraft({ ...draft, postal: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Country">
                <input
                  value={draft.country}
                  onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <label className="flex items-center gap-2 col-span-2" style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={draft.isDefault}
                  onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
                  style={{ accentColor: 'var(--ink)' }}
                />
                Make this my default address
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="md" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={save} loading={saving} icon={<I.check />}>
                Save address
              </Button>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-3 mt-6">
          {list.length === 0 && editingId === null ? (
            <Card padding={40} style={{ textAlign: 'center' }}>
              <I.pin size={36} style={{ color: 'var(--ink-4)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, color: 'var(--ink)' }}>No addresses yet</div>
              <Button variant="primary" size="md" icon={<I.plus />} style={{ marginTop: 12 }} onClick={() => startEdit()}>
                Add your first address
              </Button>
            </Card>
          ) : (
            list.map((a) => (
              <Card key={a.id} padding={20}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                        {a.name}
                      </div>
                      {a.isDefault && (
                        <Badge tone="sage" size="sm">Default</Badge>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.6 }}>
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ''}
                      <br />
                      {a.city}, {a.region ? `${a.region} ` : ''}
                      {a.postal}, {a.country}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <IconBtn icon={<I.edit />} variant="bordered" size={34} onClick={() => startEdit(a)} />
                    <IconBtn icon={<I.trash />} variant="bordered" size={34} onClick={() => remove(a.id)} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
