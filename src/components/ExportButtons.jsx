import { Download, FileJson, FileText, File } from 'lucide-react';
import { downloadJSON, downloadCSV, downloadPDF } from '../utils/exportUtils';
import toast from 'react-hot-toast';

export default function ExportButtons({ report }) {
  const handle = (fn, label) => {
    try {
      fn(report);
      toast.success(`Downloading ${label}...`);
    } catch {
      toast.error(`Failed to export ${label}`);
    }
  };

  const exports = [
    { id: 'export-json', label: 'JSON', icon: FileJson, color: '#6366F1', fn: downloadJSON },
    { id: 'export-csv', label: 'CSV', icon: FileText, color: '#10B981', fn: downloadCSV },
    { id: 'export-pdf', label: 'PDF', icon: File, color: '#F59E0B', fn: downloadPDF },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
        <Download size={13} /> Export:
      </span>
      {exports.map(({ id, label, icon: Icon, color, fn }) => (
        <button
          key={id}
          id={id}
          onClick={() => handle(fn, label)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: '0.5rem', border: `1px solid ${color}40`,
            background: `${color}15`, color, fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
          }}
          onMouseOver={e => { e.currentTarget.style.background = `${color}25`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseOut={e => { e.currentTarget.style.background = `${color}15`; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Icon size={13} /> {label}
        </button>
      ))}
    </div>
  );
}
