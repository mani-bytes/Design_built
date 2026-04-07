import { useState } from 'react';
import { ChevronDown, ChevronUp, User, Briefcase, Activity, Smile, Target, Clock } from 'lucide-react';
import { capitalize } from '../utils/exportUtils';

const GENDER_STYLES = {
  male: { bg: 'rgba(37,99,235,0.12)', color: '#3B82F6', border: 'rgba(37,99,235,0.3)', label: 'Male' },
  female: { bg: 'rgba(236,72,153,0.12)', color: '#EC4899', border: 'rgba(236,72,153,0.3)', label: 'Female' },
  unknown: { bg: 'rgba(100,116,139,0.12)', color: '#64748B', border: 'rgba(100,116,139,0.3)', label: 'Unknown' },
};

const EMOTION_ICONS = {
  confident: '💪', focused: '🎯', engaged: '✨', neutral: '😐', enthusiastic: '🔥',
  happy: '😊', sad: '😢', anxious: '😰', professional: '💼',
};

const ROLE_ICONS = {
  leadership: '👑', support: '🤝', technical: '⚙️', management: '📋', creative: '🎨',
};

function ConfidenceBar({ value }) {
  const color = value >= 0.85 ? '#10B981' : value >= 0.7 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <div style={{ flex: 1, background: 'var(--color-surface-alt)', borderRadius: 9999, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color, minWidth: 36 }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

function ScreenCard({ frame, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const gStyle = GENDER_STYLES[frame.gender] || GENDER_STYLES.unknown;

  return (
    <div className="screen-card fade-in-up" style={{ animationDelay: `${index * 0.06}s` }}>
      {/* Header (always visible) */}
      <button
        id={`screen-card-${frame.screen_id}`}
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '1rem 1.125rem', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        {/* Screen number badge */}
        <div style={{
          width: 36, height: 36, borderRadius: '0.625rem', flexShrink: 0,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: 'white',
        }}>
          {frame.screen_id}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>Screen {frame.screen_id}</span>
            {frame.timestamp && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--color-muted)', fontSize: '0.78rem' }}>
                <Clock size={11} /> {frame.timestamp}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: gStyle.bg, color: gStyle.color, border: `1px solid ${gStyle.border}` }}>
              {gStyle.label}
            </span>
            <span className="badge" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
              {capitalize(frame.role)}
            </span>
            <span className="badge" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
              {capitalize(frame.emotion)} {EMOTION_ICONS[frame.emotion] || ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: frame.confidence >= 0.8 ? '#10B981' : '#F59E0B' }}>
            {(frame.confidence * 100).toFixed(0)}%
          </span>
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--color-muted)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '0 1.125rem 1.125rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem', marginTop: '0.875rem' }}>

            <DetailItem icon={<User size={14} />} label="Gender" value={gStyle.label} valueStyle={{ color: gStyle.color }} />
            <DetailItem icon={<Briefcase size={14} />} label="Role" value={`${ROLE_ICONS[frame.role] || ''} ${capitalize(frame.role)}`} />
            <DetailItem icon={<Activity size={14} />} label="Activity" value={capitalize(frame.activity)} />
            <DetailItem icon={<Smile size={14} />} label="Emotion" value={`${EMOTION_ICONS[frame.emotion] || ''} ${capitalize(frame.emotion)}`} />
            <DetailItem icon={<User size={14} />} label="Age Group" value={frame.age_group} />
            <DetailItem icon={<User size={14} />} label="Faces" value={`${frame.face_count} detected`} />
          </div>

          <div style={{ marginTop: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Target size={14} style={{ color: 'var(--color-muted)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 500 }}>Confidence Score</span>
            </div>
            <ConfidenceBar value={frame.confidence} />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value, valueStyle = {} }) {
  return (
    <div style={{ background: 'var(--color-surface-alt)', borderRadius: '0.625rem', padding: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-muted)' }}>
        {icon}
        <span style={{ fontSize: '0.73rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', ...valueStyle }}>{value}</div>
    </div>
  );
}

export default function FrameAnalysis({ frames, mediaType }) {
  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
          {mediaType === 'video' ? 'Frame-by-Frame Analysis' : 'Image Analysis'}
        </h3>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.82rem' }}>
          {frames.length} {mediaType === 'video' ? 'frames' : 'screen'} analyzed • Click to expand details
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {frames.map((frame, i) => (
          <ScreenCard key={frame.screen_id} frame={frame} index={i} />
        ))}
      </div>
    </div>
  );
}
