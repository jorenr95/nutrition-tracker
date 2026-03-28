'use client';

interface MacroRingProps {
  label: string;
  current: number;
  max: number;
  color: string;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  showCenter?: boolean;
}

export default function MacroRing({
  label,
  current,
  max,
  color,
  unit = 'g',
  size = 90,
  strokeWidth = 7,
  showCenter = true,
}: MacroRingProps) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(current / max, 1) : 0;
  const offset = circumference - pct * circumference;
  const cx = size / 2;
  const cy = size / 2;
  const over = current > max && max > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={over ? 'var(--danger)' : color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
        </svg>
        {showCenter && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px',
          }}>
            <span style={{
              fontSize: size > 120 ? '22px' : '13px',
              fontWeight: 700,
              fontFamily: 'Lora, serif',
              color: over ? 'var(--danger)' : 'var(--text-primary)',
              lineHeight: 1,
            }}>
              {Math.round(current)}{size <= 120 ? unit : ''}
            </span>
            {size > 120 && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>kcal</span>
            )}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ fontSize: '11px', color: color, fontWeight: 600, marginTop: '1px' }}>
          {max - current > 0 ? `${Math.round((max - current) * 10) / 10}${unit} over` : `+${Math.round((current - max) * 10) / 10}${unit}`}
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  current: number;
  max: number;
  color: string;
  label?: string;
  showValues?: boolean;
  height?: number;
}

export function ProgressBar({ current, max, color, label, showValues = true, height = 6 }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const over = current > max && max > 0;

  return (
    <div style={{ width: '100%' }}>
      {(label || showValues) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          {label && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>}
          {showValues && (
            <span style={{ fontSize: '12px', color: over ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'Lora, serif' }}>
              {Math.round(current)} / {max}
            </span>
          )}
        </div>
      )}
      <div style={{
        height,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: over ? 'var(--danger)' : color,
          borderRadius: 99,
          transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }} />
      </div>
    </div>
  );
}
