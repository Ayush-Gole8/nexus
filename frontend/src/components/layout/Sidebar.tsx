import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Zap,
  FlaskConical,
  Bot,
  Settings,
  Flame,
  Map,
  Brain,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const commonItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/network', icon: Network, label: 'Network Map' },
  { to: '/cascade', icon: Zap, label: 'Cascade Analysis' },
  { to: '/simulator', icon: FlaskConical, label: 'Simulator' },
  { to: '/ai', icon: Bot, label: 'AI Insights' },
];

const citizenItems = [
  { to: '/emergency', icon: Flame, label: 'Emergency' },
  { to: '/citizen', icon: Users, label: 'Citizen' },
  { to: '/heatmap', icon: Map, label: 'Heatmap' },
];

const officialItems = [
  { to: '/emergency', icon: Flame, label: 'Emergency' },
  { to: '/citizen', icon: Users, label: 'Citizen' },
  { to: '/heatmap', icon: Map, label: 'Heatmap' },
  { to: '/predictive', icon: Brain, label: 'Predictive' },
  { to: '/manage', icon: Settings, label: 'Infrastructure' },
];

export default function Sidebar() {
  const { user, logout, isOfficial } = useAuth();
  const navItems = [...commonItems, ...(isOfficial ? officialItems : citizenItems)];

  return (
    <aside style={{
      background: 'var(--bg-void)',
      borderRight: '1px solid var(--border-hairline)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 0',
      position: 'relative', overflow: 'hidden',
      height: '100vh',
    }}>
      {/* Amber left stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: 'linear-gradient(180deg, transparent, var(--amber) 40%, transparent)',
        opacity: 0.4, pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ padding: '12px 16px 20px', borderBottom: '1px solid var(--border-hairline)', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--amber)' }}>
          NEXUS
        </div>
        <div style={{ fontFamily: 'var(--font-data)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 3 }}>
          Smart Infrastructure
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
              color: isActive ? 'var(--amber-bright)' : 'var(--text-secondary)',
              background: isActive ? 'var(--amber-glow)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--amber)' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'all 120ms var(--ease-out)',
              cursor: 'pointer',
            })}
          >
            <Icon width={13} height={13} style={{ opacity: 0.75, flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-hairline)', marginTop: 'auto' }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--amber-glow)', border: '1px solid var(--amber-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'var(--amber)',
                fontFamily: 'var(--font-data)', flexShrink: 0,
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-data)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{user.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] transition-colors"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-data)',
                letterSpacing: '0.08em',
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--status-failed)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,51,85,0.3)';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hairline)';
              }}
            >
              <LogOut width={11} height={11} />
              Sign Out
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--status-operational)' }} />
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-data)', letterSpacing: '0.10em' }}>SYSTEM ONLINE</span>
          </div>
        )}
      </div>
    </aside>
  );
}

