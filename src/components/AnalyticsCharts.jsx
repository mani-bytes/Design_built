import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { capitalize } from '../utils/exportUtils';

const MALE_COLOR = '#2563EB';
const FEMALE_COLOR = '#EC4899';
const BALANCED_COLOR = '#8B5CF6';

const EMOTION_COLORS = ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'];
const ROLE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
      {label && <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'white', fontSize: '0.875rem', fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
      {children}
    </h4>
  );
}

// Gender Pie Chart
export function GenderChart({ distribution }) {
  const data = [
    { name: 'Male', value: distribution.male },
    { name: 'Female', value: distribution.female },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <SectionTitle>⚧ Gender Distribution</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
              <Cell fill={MALE_COLOR} />
              <Cell fill={FEMALE_COLOR} />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1 }}>
          {data.map((d, i) => {
            const color = i === 0 ? MALE_COLOR : FEMALE_COLOR;
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={d.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--color-muted)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    {d.name}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div style={{ background: 'var(--color-surface-alt)', borderRadius: 9999, height: 5 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: 6 }}>
            Total: {total} {total === 1 ? 'detection' : 'detections'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Role Bar Chart
export function RoleChart({ distribution }) {
  const data = Object.entries(distribution).map(([name, value]) => ({ name: capitalize(name), value }));

  return (
    <div>
      <SectionTitle>💼 Role Distribution</SectionTitle>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Emotion Pie Chart
export function EmotionChart({ distribution }) {
  const data = Object.entries(distribution).map(([name, value]) => ({ name: capitalize(name), value }));

  return (
    <div>
      <SectionTitle>😊 Emotion Distribution</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={60} paddingAngle={2} dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d, i) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: EMOTION_COLORS[i % EMOTION_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)', flex: 1 }}>{d.name}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'white' }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Bias Score Gauge
export function BiasGauge({ biasScore }) {
  const pct = biasScore * 100;
  const color = biasScore <= 0.2 ? '#10B981' : biasScore <= 0.5 ? '#F59E0B' : '#EF4444';
  const label = biasScore <= 0.2 ? 'Low Bias' : biasScore <= 0.5 ? 'Moderate Bias' : 'High Bias';

  // SVG arc gauge
  const r = 70;
  const cx = 100;
  const cy = 90;
  const startAngle = -180;
  const sweepAngle = 180;
  const arcPct = pct / 100;
  const endAngleDeg = startAngle + sweepAngle * arcPct;

  function polarToCartesian(angle) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngleDeg);
  const largeArc = sweepAngle * arcPct > 90 ? 1 : 0;

  const bgEnd = polarToCartesian(0);
  const bgPath = `M ${polarToCartesian(startAngle).x} ${polarToCartesian(startAngle).y} A ${r} ${r} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;
  const fillPath = arcPct > 0 ? `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}` : '';

  return (
    <div>
      <SectionTitle>⚖️ Bias Score Gauge</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width={200} height={120} viewBox="0 0 200 120">
          {/* BG arc */}
          <path d={bgPath} fill="none" stroke="var(--color-surface-alt)" strokeWidth={12} strokeLinecap="round" />
          {/* Fill arc */}
          {fillPath && <path d={fillPath} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />}
          {/* Needele dot */}
          {fillPath && <circle cx={end.x} cy={end.y} r={6} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />}
          {/* Labels */}
          <text x={18} y={105} fill="#94A3B8" fontSize={10}>0%</text>
          <text x={100} y={18} textAnchor="middle" fill="#94A3B8" fontSize={10}>50%</text>
          <text x={178} y={105} fill="#94A3B8" fontSize={10}>100%</text>
        </svg>
        <div style={{ textAlign: 'center', marginTop: -8 }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{pct.toFixed(1)}%</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color, marginTop: 4 }}>{label}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: 4 }}>
            0–20% Low · 20–50% Moderate · 50%+ High
          </div>
        </div>
      </div>
    </div>
  );
}

// Representation Index
export function RepresentationIndex({ value }) {
  const color = value >= 0.7 ? '#10B981' : value >= 0.4 ? '#F59E0B' : '#EF4444';
  const label = value >= 0.7 ? 'Well Represented' : value >= 0.4 ? 'Partially Represented' : 'Underrepresented';
  const pct = value * 100;

  return (
    <div>
      <SectionTitle>📊 Representation Index</SectionTitle>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', fontWeight: 800, color, lineHeight: 1, marginBottom: 8 }}>
          {pct.toFixed(0)}<span style={{ fontSize: '1.5rem' }}>%</span>
        </div>
        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 9999, background: `${color}20`, border: `1px solid ${color}50`, color, fontSize: '0.82rem', fontWeight: 600, marginBottom: '1rem' }}>
          {label}
        </div>
        <div style={{ background: 'var(--color-surface-alt)', borderRadius: 9999, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 1s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: '0.73rem', color: 'var(--color-muted)' }}>0%</span>
          <span style={{ fontSize: '0.73rem', color: 'var(--color-muted)' }}>100%</span>
        </div>
      </div>
    </div>
  );
}
