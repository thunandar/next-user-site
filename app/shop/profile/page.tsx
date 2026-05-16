'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { profileApi, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SectionHead from '@/components/ui/SectionHead';
import Field from '@/components/ui/Field';
import Avatar from '@/components/ui/Avatar';
import Switch from '@/components/ui/Switch';
import Divider from '@/components/ui/Divider';
import { I } from '@/components/ui/Icons';
import { cloneElement, type ReactElement } from 'react';

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

const ACCOUNT_NAV = [
  { href: '/shop/orders', label: 'Orders', icon: <I.bag /> },
  { href: '/shop/wishlist', label: 'Wishlist', icon: <I.heart /> },
  { href: '/shop/addresses', label: 'Addresses', icon: <I.pin /> },
  { href: '/shop/profile', label: 'Profile', icon: <I.user /> },
];

export default function ShopProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: '', email: '' });
  const [alerts, setAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    if (!window.confirm('Sign out of your Nexus account on this device?')) return;
    setSigningOut(true);
    try {
      await logout();
    } catch {
      setSigningOut(false);
      toast.error('Could not sign out — please try again');
    }
  };

  useEffect(() => {
    profileApi
      .get()
      .then((p) => {
        setForm({
          name: p.name,
          email: p.email,
        });
        setAlerts(p.loginAlerts !== false);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await profileApi.update({ ...form, loginAlerts: alerts });
      toast.success('Profile saved');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pw.current || pw.next.length < 8) {
      toast.error('Enter current + new password (8+ chars)');
      return;
    }
    try {
      await profileApi.changePassword(pw.current, pw.next);
      toast.success('Password changed');
      setPw({ current: '', next: '' });
      setPwOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to change password'));
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
        <Card padding={40} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15 }}>Please sign in to view your profile.</div>
          <Link href="/login">
            <Button variant="primary" size="md" style={{ marginTop: 16 }}>Sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }

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
              background: n.href === '/shop/profile' ? 'var(--bg-muted)' : 'transparent',
              color: n.href === '/shop/profile' ? 'var(--ink)' : 'var(--ink-3)',
              fontSize: 13.5,
              fontWeight: n.href === '/shop/profile' ? 500 : 400,
              textDecoration: 'none',
            }}
          >
            <span>{cloneElement(n.icon as ReactElement<{ size?: number }>, { size: 16 })}</span>
            {n.label}
          </Link>
        ))}
        <div style={{ height: 1, background: 'var(--line)', margin: '8px 12px' }} />
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2.5"
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'transparent',
            border: 'none',
            color: 'var(--terracotta-2)',
            fontSize: 13.5,
            fontWeight: 400,
            cursor: signingOut ? 'wait' : 'pointer',
            opacity: signingOut ? 0.6 : 1,
            textAlign: 'left',
            font: 'inherit',
          }}
        >
          <I.logout size={16} />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </nav>

      <div className="flex flex-col gap-5">
        <SectionHead title="Profile" sub="Your Nexus account." />

        <Card padding={24}>
          <div className="flex items-center gap-5">
            <Avatar name={user.name} size={64} />
            <div className="flex-1">
              <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>
                {user.email}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Field label="Full name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={INPUT_STYLE}
              />
            </Field>
            <Field label="Email">
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={INPUT_STYLE}
              />
            </Field>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="primary" size="sm" loading={saving} onClick={save} icon={<I.check />}>
              Save changes
            </Button>
          </div>
        </Card>

        <Card padding={24}>
          <div className="t-h4" style={{ marginBottom: 12 }}>Security</div>
          <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>Password</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Keep it private.</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setPwOpen((v) => !v)}>
              {pwOpen ? 'Cancel' : 'Change'}
            </Button>
          </div>
          {pwOpen && (
            <div className="flex flex-col gap-3" style={{ paddingBottom: 8 }}>
              <Field label="Current">
                <input
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="New password">
                <input
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={changePassword} icon={<I.check />}>
                  Update password
                </Button>
              </div>
            </div>
          )}
          <Divider />
          <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>Login alerts</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                Email me on new device login
              </div>
            </div>
            <Switch checked={alerts} onChange={setAlerts} />
          </div>
        </Card>

        <Card padding={24}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>Sign out</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                End your session on this device.
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSignOut}
              loading={signingOut}
              icon={<I.logout />}
            >
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
