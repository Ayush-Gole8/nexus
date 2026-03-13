import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Shield, Zap, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'official' | 'responder'>('citizen');
  const [wardId, setWardId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const wardOptions = ['Dharavi', 'Bandra', 'Andheri', 'Kurla', 'Sion', 'Worli', 'Borivali', 'Malad', 'Parel', 'Powai'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (role === 'citizen' && !wardId) {
      setError('Please select your ward.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiLogin(email, password, role, wardId || undefined);
      login(res.token, res.user);
      const dest = res.user.role === 'citizen'
        ? '/citizen'
        : res.user.role === 'responder'
          ? '/emergency-response'
          : '/dashboard';
      navigate(dest, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '25%', left: '25%', width: 380, height: 380, background: 'var(--amber-glow)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '25%', width: 280, height: 280, background: 'rgba(240,165,0,0.06)', borderRadius: '50%', filter: 'blur(60px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo block */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', marginBottom: 16 }}>
            <Shield style={{ width: 26, height: 26, color: 'var(--amber)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: 'var(--amber)' }}>NEXUS</h1>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: 4 }}>City Infrastructure Platform — Mumbai</p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '32px 28px', backdropFilter: 'blur(20px)' }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 24 }}>Sign In</h2>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.25)', color: 'var(--st-fail)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 12, fontFamily: 'var(--font-data)' }}>
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {(['citizen', 'official', 'responder'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: `1px solid ${role === r ? 'var(--amber)' : 'var(--border-hairline)'}`,
                      background: role === r ? 'rgba(240,165,0,0.12)' : 'var(--bg-elevated)',
                      color: role === r ? 'var(--amber)' : 'var(--text-secondary)',
                      fontSize: 11,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {role === 'citizen' && (
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Ward</label>
                <select
                  required
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-data)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-hairline)')}
                >
                  <option value="">Select ward</option>
                  {wardOptions.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-data)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                placeholder="you@example.com"
                onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-hairline)')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-data)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                placeholder="••••••••"
                onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-hairline)')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-amber"
            style={{ width: '100%', marginTop: 20, padding: '11px 0', opacity: loading ? 0.55 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20, fontFamily: 'var(--font-data)' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--amber)', fontWeight: 600, textDecoration: 'none' }}>
              Register
            </Link>
          </p>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-hairline)' }}>
            <p style={{ fontFamily: 'var(--font-data)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Demo Accounts:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-secondary)' }}>
                <Zap style={{ width: 12, height: 12, color: 'var(--amber)' }} />
                <span>Admin: admin@nexus.gov.in / admin123</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-secondary)' }}>
                <Shield style={{ width: 12, height: 12, color: '#7b68ff' }} />
                <span>Official: rajesh@mcgm.gov.in / official123</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-secondary)' }}>
                <Zap style={{ width: 12, height: 12, color: 'var(--st-op)' }} />
                <span>Citizen: amit@citizen.in / citizen123</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
