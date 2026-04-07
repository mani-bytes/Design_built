import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, LayoutDashboard, History, LogOut, ChevronDown, User, Settings, Sparkles } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/history', icon: History, label: 'History' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside style={{
      width: 240, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column', padding: '1.25rem 0.75rem',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0.5rem', marginBottom: '2rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Brain size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem', lineHeight: 1.2 }}>BiasLens AI</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>Research Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          Navigation
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Features badge */}
        <div style={{
          margin: '1.5rem 0.5rem', padding: '0.875rem', borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Sparkles size={14} style={{ color: '#A5B4FC' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A5B4FC' }}>AI Features</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['Gender detection', 'Role analysis', 'Emotion AI', 'Bias metrics'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6366F1' }} />
                <span style={{ fontSize: '0.73rem', color: 'var(--color-muted)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* User profile */}
      <div style={{ position: 'relative' }}>
        <button
          id="user-menu-btn"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '0.625rem', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366F1, #EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: 'white',
          }}>
            {user?.avatar || 'U'}
          </div>
          <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Researcher'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.role || 'researcher'}
            </div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--color-muted)', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>

        {/* Dropdown */}
        {userMenuOpen && (
          <div className="dropdown-menu" style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8, overflow: 'hidden' }}>
            <button
              id="profile-btn"
              onClick={() => setUserMenuOpen(false)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.875rem', fontFamily: 'inherit', transition: 'background 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = 'white'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-muted)'; }}
            >
              <User size={15} /> Profile
            </button>
            <button
              id="settings-btn"
              onClick={() => setUserMenuOpen(false)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.875rem', fontFamily: 'inherit', transition: 'background 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = 'white'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-muted)'; }}
            >
              <Settings size={15} /> Settings
            </button>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
            <button
              id="logout-btn"
              onClick={handleLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '0.875rem', fontFamily: 'inherit', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
