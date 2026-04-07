import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useApp } from '../context/AppContext';
import { GenderChart, RoleChart, EmotionChart, BiasGauge, RepresentationIndex } from '../components/AnalyticsCharts';
import FrameAnalysis from '../components/FrameAnalysis';
import ExportButtons from '../components/ExportButtons';
import BiasBanner from '../components/BiasBanner';
import { getSeverityLevel, formatDate } from '../utils/exportUtils';
import { Trash2, Clock, Image, Film, Eye, Search, Filter, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

function HistoryCard({ report, onDelete, onView, isSelected }) {
  const sev = getSeverityLevel(report.bias_score);
  const isVideo = report.media_type === 'video';
  const name = report.media_name?.length > 30 ? report.media_name.slice(0, 30) + '...' : report.media_name;

  return (
    <div
      className="screen-card"
      style={{ border: isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--color-border)', cursor: 'pointer' }}
      onClick={() => onView(report)}
    >
      <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Icon */}
        <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: `${sev.color}15`, border: `1px solid ${sev.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isVideo ? <Film size={18} style={{ color: sev.color }} /> : <Image size={18} style={{ color: sev.color }} />}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-muted)', fontSize: '0.73rem' }}>
              <Clock size={11} /> {formatDate(report.created_at)}
            </span>
            <span style={{ fontSize: '0.73rem', padding: '1px 7px', borderRadius: 9999, background: `${sev.color}15`, color: sev.color, border: `1px solid ${sev.color}30`, fontWeight: 600 }}>
              Bias: {(report.bias_score * 100).toFixed(0)}%
            </span>
            <span style={{ fontSize: '0.73rem', color: 'var(--color-muted)' }}>
              {report.frames.length} frames
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          <button
            id={`view-${report.id}`}
            onClick={() => onView(report)}
            style={{ width: 32, height: 32, borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Eye size={14} />
          </button>
          <button
            id={`delete-${report.id}`}
            onClick={() => onDelete(report.id)}
            style={{ width: 32, height: 32, borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { history, deleteReport, setCurrentReport } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'high' | 'low' | 'image' | 'video'
  const [activeTab, setActiveTab] = useState('frames');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleDelete = (id) => {
    deleteReport(id);
    if (selected?.id === id) setSelected(null);
    toast.success('Report deleted');
  };

  const handleView = (report) => {
    setSelected(report);
    setCurrentReport(report);
    setBannerDismissed(false);
    setActiveTab('frames');
  };

  const filtered = history.filter(r => {
    const matchSearch = !search || r.media_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'high' && r.bias_score > 0.5) ||
      (filter === 'low' && r.bias_score <= 0.2) ||
      (filter === 'image' && r.media_type === 'image') ||
      (filter === 'video' && r.media_type === 'video');
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: '1.75rem 2rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>Analysis History</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>{history.length} total analyses · Review and re-examine past reports</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* History list */}
          <div>
            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input
                  id="history-search"
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search reports..."
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', fontSize: '0.8rem' }}
                />
              </div>
              <select
                id="history-filter"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="form-input"
                style={{ width: 'auto', paddingLeft: '0.75rem', fontSize: '0.8rem' }}
              >
                <option value="all">All</option>
                <option value="high">High Bias</option>
                <option value="low">Low Bias</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  {history.length === 0 ? 'No analyses yet. Upload media to get started.' : 'No reports match your filter.'}
                </p>
                {history.length === 0 && (
                  <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Start Analyzing →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {filtered.map(r => (
                  <HistoryCard key={r.id} report={r} onDelete={handleDelete} onView={handleView} isSelected={selected?.id === r.id} />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="glass-card fade-in-up" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Report Details</h2>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem' }}>
                    {selected.media_name} · {formatDate(selected.created_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <ExportButtons report={selected} />
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}>✕</button>
                </div>
              </div>

              {!bannerDismissed && <BiasBanner biasScore={selected.bias_score} onDismiss={() => setBannerDismissed(true)} />}

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', background: 'var(--color-surface-alt)', borderRadius: '0.75rem', padding: 4 }}>
                {['frames', 'analytics'].map(tab => (
                  <button key={tab} id={`history-tab-${tab}`} onClick={() => setActiveTab(tab)} style={{
                    flex: 1, padding: '0.5rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s ease', fontFamily: 'inherit',
                    background: activeTab === tab ? 'var(--color-surface)' : 'transparent',
                    color: activeTab === tab ? 'white' : 'var(--color-muted)',
                    boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  }}>
                    {tab === 'frames' ? 'Frame Analysis' : 'Analytics'}
                  </button>
                ))}
              </div>

              {activeTab === 'frames' && <FrameAnalysis frames={selected.frames} mediaType={selected.media_type} />}
              {activeTab === 'analytics' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="metric-card"><GenderChart distribution={selected.gender_distribution} /></div>
                  <div className="metric-card"><BiasGauge biasScore={selected.bias_score} /></div>
                  <div className="metric-card" style={{ gridColumn: '1 / -1' }}><RoleChart distribution={selected.role_distribution} /></div>
                  <div className="metric-card"><EmotionChart distribution={selected.emotion_distribution} /></div>
                  <div className="metric-card"><RepresentationIndex value={selected.representation_index} /></div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
