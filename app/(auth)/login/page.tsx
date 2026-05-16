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

function needsVerification(err: unknown): boolean {
  return Boolean(
    (err as { response?: { data?: { emailVerificationRequired?: boolean } } })
      ?.response?.data?.emailVerificationRequired,
  );
}

export default function LoginPage() {
  const { login, verifyEmail, resendVerification } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'verify'>('credentials');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email and password required');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back');
    } catch (err: unknown) {
      if (needsVerification(err)) {
        try {
          await resendVerification(form.email);
          toast('Email not verified — code sent', { icon: '✉️' });
        } catch {
          // Fall through; user can hit resend manually.
        }
        setStep('verify');
      } else {
        toast.error(getApiErrorMessage(err, 'Invalid credentials'));
      }
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
            {step === 'verify' ? 'Verify your email' : 'Welcome back'}
          </h1>
          <p style={{ color: 'var(--ink-3)', marginTop: 6, fontSize: 14 }}>
            {step === 'verify'
              ? `We sent a 6-digit code to ${form.email}.`
              : 'Sign in to your Nexus account.'}
          </p>
        </div>

        {step === 'verify' ? (
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
                onClick={() => { setStep('credentials'); setCode(''); }}
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
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Field label="Email">
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Link
                href="#"
                style={{
                  fontSize: 12.5,
                  color: 'var(--terracotta-2)',
                  textDecoration: 'none',
                  alignSelf: 'flex-end',
                }}
              >
                Forgot password?
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                full
                loading={loading}
                style={{ borderRadius: 12 }}
              >
                Sign in
              </Button>

              <div className="flex items-center gap-2 my-3">
                <Divider style={{ flex: 1 }} />
                <span
                  className="t-micro"
                  style={{ color: 'var(--ink-4)', letterSpacing: 0.04, fontSize: 11 }}
                >
                  OR CONTINUE WITH
                </span>
                <Divider style={{ flex: 1 }} />
              </div>
              <GoogleSignInButton />
            </form>
        )}
      </Card>

      {step === 'credentials' && (
        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 13.5,
            color: 'var(--ink-3)',
          }}
        >
          New to Nexus?{' '}
          <Link href="/register" style={{ color: 'var(--terracotta)', fontWeight: 500 }}>
            Create an account
          </Link>
        </p>
      )}

      <p
        style={{
          textAlign: 'center',
          marginTop: step === 'credentials' ? 8 : 24,
          fontSize: 12,
          color: 'var(--ink-4)',
        }}
      >
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
