import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';

const MUMBAI_ZONES = [
  'South Mumbai',
  'Lower Parel',
  'Bandra-Kurla',
  'Andheri',
  'Powai',
  'Thane',
  'Navi Mumbai',
  'Dadar-Prabhadevi',
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [zone, setZone] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRegister(name, email, password, role, zone || undefined, phone || undefined);
      login(res.token, res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-data)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--text-secondary)', marginBottom: 6 };
  const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--amber)');
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--border-hairline)');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '20%', width: 380, height: 380, background: 'var(--amber-glow)', borderRadius: '50%', filter: 'blur(80px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', marginBottom: 14 }}>
            <Shield style={{ width: 24, height: 24, color: 'var(--amber)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: 'var(--amber)' }}>NEXUS</h1>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: 4 }}>Create your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '28px 24px', backdropFilter: 'blur(20px)' }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', marginBottom: 22 }}>Register</h2>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.25)', color: 'var(--st-fail)', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 12, fontFamily: 'var(--font-data)' }}>
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Amit Sharma" onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="Min 6 characters" onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                <option value="citizen">Citizen</option>
                <option value="official">City Official</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Zone (optional)</label>
              <select value={zone} onChange={(e) => setZone(e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                <option value="">Select your zone</option>
                {MUMBAI_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Phone (optional)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="+91 XXXXXXXXXX" onFocus={focusIn} onBlur={focusOut} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-amber"
            style={{ width: '100%', marginTop: 20, padding: '11px 0', opacity: loading ? 0.55 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 18, fontFamily: 'var(--font-data)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--amber)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
