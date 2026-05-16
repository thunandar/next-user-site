export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', padding: 40 }}>
      <div className="w-full" style={{ maxWidth: 464 }}>
        {children}
      </div>
    </div>
  );
}
