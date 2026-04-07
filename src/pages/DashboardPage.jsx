import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import UploadZone from '../components/UploadZone';
import FrameAnalysis from '../components/FrameAnalysis';
import { GenderChart, RoleChart, EmotionChart, BiasGauge, RepresentationIndex } from '../components/AnalyticsCharts';
import ExportButtons from '../components/ExportButtons';
import BiasBanner from '../components/BiasBanner';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getSeverityLevel, formatDate } from '../utils/exportUtils';
import { BarChart2, Clock, Target, TrendingUp, FileSearch, X, ChevronRight } from 'lucide-react';

function MetricCard({ id, label, value, sub, color, icon }) {
  return (
    <div id={id} className="metric-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0,
        background: `${color}20`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.73rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.73rem', color: 'var(--color-muted)', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentReport, history, analyzing } = useApp();
  const { user } = useAuth();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState('frames'); // 'frames' | 'analytics'

  const report = currentReport;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main style={{ flex: 1, overflow: 'auto', padding: '1.75rem 2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'Researcher'} 👋
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            Upload media to detect gender bias, roles, and fairness metrics using AI
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
          <MetricCard id="metric-total" label="Total Analyses" value={history.length} sub="All time" color="#6366F1" icon={<BarChart2 size={20} style={{ color: '#6366F1' }} />} />
          <MetricCard id="metric-frames" label="Frames Analyzed" value={history.reduce((s, r) => s + r.frames.length, 0)} sub="Across reports" color="#10B981" icon={<FileSearch size={20} style={{ color: '#10B981' }} />} />
          <MetricCard id="metric-bias" label="Avg Bias Score" value={history.length ? `${(history.reduce((s,r)=>s+r.bias_score,0)/history.length*100).toFixed(0)}%` : 'N/A'} sub="Lower is better" color="#F59E0B" icon={<Target size={20} style={{ color: '#F59E0B' }} />} />
          <MetricCard id="metric-recent" label="Last Analysis" value={history[0] ? formatDate(history[0].created_at).split(',')[0] : 'None'} sub={history[0] ? history[0].media_name.slice(0, 20) : '—'} color="#EC4899" icon={<Clock size={20} style={{ color: '#EC4899' }} />} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Upload side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <UploadZone />

            {/* Recent history mini */}
            {history.length > 0 && (
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <span style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Recent Analyses</span>
                  <a href="/history" style={{ fontSize: '0.78rem', color: '#6366F1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                    View all <ChevronRight size={12} />
                  </a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.slice(0, 3).map(r => {
                    const sev = getSeverityLevel(r.bias_score);
                    return (
                      <div key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.625rem',
                        borderRadius: '0.625rem', background: 'var(--color-surface-alt)',
                        cursor: 'pointer', transition: 'background 0.2s',
                      }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--color-border)'}
                        onMouseOut={e => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: `${sev.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <TrendingUp size={14} style={{ color: sev.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.media_name.length > 25 ? r.media_name.slice(0, 25) + '...' : r.media_name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                            {r.frames.length} frames · {formatDate(r.created_at).split(',')[0]}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sev.color }}>
                          {(r.bias_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Report side */}
          <div>
            {report ? (
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                {/* Report header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Analysis Report</h2>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem' }}>
                      {report.media_name} · {formatDate(report.created_at)}
                    </p>
                  </div>
                  <ExportButtons report={report} />
                </div>

                {/* Bias banner */}
                {!bannerDismissed && <BiasBanner biasScore={report.bias_score} onDismiss={() => setBannerDismissed(true)} />}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', background: 'var(--color-surface-alt)', borderRadius: '0.75rem', padding: 4 }}>
                  {[
                    { id: 'frames', label: 'Frame Analysis' },
                    { id: 'analytics', label: 'Analytics' },
                  ].map(tab => (
                    <button key={tab.id} id={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} style={{
                      flex: 1, padding: '0.5rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer',
                      fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s ease', fontFamily: 'inherit',
                      background: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
                      color: activeTab === tab.id ? 'white' : 'var(--color-muted)',
                      boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    }}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'frames' && <FrameAnalysis frames={report.frames} mediaType={report.media_type} />}

                {activeTab === 'analytics' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="metric-card"><GenderChart distribution={report.gender_distribution} /></div>
                    <div className="metric-card"><BiasGauge biasScore={report.bias_score} /></div>
                    <div className="metric-card" style={{ gridColumn: '1 / -1' }}><RoleChart distribution={report.role_distribution} /></div>
                    <div className="metric-card"><EmotionChart distribution={report.emotion_distribution} /></div>
                    <div className="metric-card"><RepresentationIndex value={report.representation_index} /></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', opacity: analyzing ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                <div className="float" style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔬</div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>
                  {analyzing ? 'Running Analysis...' : 'No Report Yet'}
                </h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', maxWidth: 300, margin: '0 auto' }}>
                  {analyzing
                    ? 'AI is analyzing your media for bias patterns. This will only take a moment.'
                    : 'Upload an image, video, or enter a URL and click Analyze to generate a detailed bias analysis report.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
