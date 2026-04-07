import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { getSeverityLevel } from '../utils/exportUtils';

export default function BiasBanner({ biasScore, onDismiss }) {
  const severity = getSeverityLevel(biasScore);
  const isHigh = biasScore > 0.5;
  const isBalanced = biasScore <= 0.2;

  if (biasScore === null || biasScore === undefined) return null;

  return (
    <div
      id="bias-banner"
      className={isHigh ? 'warning-banner' : ''}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '0.875rem 1rem', borderRadius: '0.875rem',
        background: severity.bg, border: `1px solid ${severity.border}`,
        marginBottom: '1rem',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '0.625rem', flexShrink: 0,
        background: `${severity.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isBalanced
          ? <CheckCircle2 size={18} style={{ color: severity.color }} />
          : <AlertTriangle size={18} style={{ color: severity.color }} />
        }
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: severity.color, fontSize: '0.875rem', marginBottom: 3 }}>
          {isBalanced ? '✅ Fair Representation Detected' : isHigh ? '⚠️ High Bias Alert' : '⚡ Moderate Bias Detected'}
        </div>
        <div style={{ color: 'var(--color-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
          {isBalanced
            ? 'The analyzed media demonstrates balanced gender and role representation. Bias score is within acceptable research thresholds.'
            : isHigh
            ? `Critical bias score of ${(biasScore * 100).toFixed(1)}% detected. Significant gender and/or role imbalance found in the analyzed media. Review the frame analysis for details.`
            : `Moderate bias score of ${(biasScore * 100).toFixed(1)}% detected. Some imbalance present — review analytics for details.`
          }
        </div>

        {isHigh && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {['Review frame analysis', 'Check role distribution', 'Examine leadership roles'].map(a => (
              <span key={a} style={{ fontSize: '0.73rem', padding: '2px 8px', borderRadius: 9999, background: `${severity.color}20`, border: `1px solid ${severity.color}40`, color: severity.color }}>
                → {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4, flexShrink: 0 }}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
