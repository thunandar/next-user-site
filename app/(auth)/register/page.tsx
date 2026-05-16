'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Field from '@/components/ui/Field';
import Divider from '@/components/ui/Divider';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 14px',
  borderRadius: 12,
  border: '1px solid var(--line-2)',
  background: 'var(--bg-elev)',
  color: 'var(--ink)',
  fontSize: 15,
  outline: 'none',
};

type Step = 'details' | 'verify';

export default function RegisterPage() {
  const { register, verifyEmail, resendVerification } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.name.length < 2) return toast.error('Name is required');
    if (!form.email) return toast.error('Email is required');
    if (!form.password || form.password.length < 8)
      return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register({ ...form, role: 'user' });
      toast.success('Code sent — check your inbox');
      setStep('verify');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return toast.error('Enter the 6-digit code');
    setLoading(true);
    try {
      await verifyEmail(form.email, code);
      toast.success('Welcome to Nexus');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification(form.email);
      toast.success('New code sent');
      setCode('');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Could not resend code'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <Card padding={32}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link
            href="/shop"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 24,
              color: 'var(--ink)',
              textDecoration: 'none',
            }}
          >
            Nexus
          </Link>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 32,
              lineHeight: 1.1,
              color: 'var(--ink)',
              marginTop: 12,
            }}
          >
            {step === 'details' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p style={{ color: 'var(--ink-3)', marginTop: 6, fontSize: 14 }}>
            {step === 'details'
              ? 'A few details to get started.'
              : `We sent a 6-digit code to ${form.email}.`}
          </p>
        </div>

        {step === 'details' ? (
          <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-3">
            <Field label="Full name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={INPUT_STYLE}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={INPUT_STYLE}
              />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={INPUT_STYLE}
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              full
              loading={loading}
              style={{ borderRadius: 12 }}
            >
              Create account
            </Button>

            <div className="flex items-center gap-2 my-3">
              <Divider style={{ flex: 1 }} />
              <span
                style={{ color: 'var(--ink-4)', fontSize: 11, letterSpacing: 0.04 }}
                className="t-micro"
              >
                OR SIGN UP WITH
              </span>
              <Divider style={{ flex: 1 }} />
            </div>
            <GoogleSignInButton label="Sign up with Google" />
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="flex flex-col gap-3">
            <Field label="Verification code" hint="Expires in 10 minutes">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  ...INPUT_STYLE,
                  fontSize: 24,
                  letterSpacing: 12,
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}
                placeholder="------"
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              full
              loading={loading}
              style={{ borderRadius: 12 }}
            >
              Verify and continue
            </Button>
            <div className="flex items-center justify-between" style={{ fontSize: 13 }}>
              <button
                type="button"
                onClick={() => setStep('details')}
                style={{ color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  color: 'var(--terracotta-2)',
                  background: 'none',
                  border: 'none',
                  cursor: resending ? 'not-allowed' : 'pointer',
                  opacity: resending ? 0.5 : 1,
                }}
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </Card>

      <p
        style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 13.5,
          color: 'var(--ink-3)',
        }}
      >
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--terracotta)', fontWeight: 500 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
