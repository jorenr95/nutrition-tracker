'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MacroRing, { ProgressBar } from '@/components/MacroRing';
import {
  getDagLog, getDoelen, berekenDagTotalen, verwijderItem, vandaagDatum, getNaam,
} from '@/lib/opslag';
import type { DagLog, Doelen, MaaltijdType, MaaltijdItem } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type FocusMetric = 'kcal' | 'eiwit' | 'koolhydraten' | 'vetten';

const FOCUS_OPTIES: { key: FocusMetric; label: string; kortLabel: string }[] = [
  { key: 'kcal',         label: 'Calorieën',    kortLabel: 'Kcal'   },
  { key: 'eiwit',        label: 'Eiwit',         kortLabel: 'Eiwit'  },
  { key: 'koolhydraten', label: 'Koolhydraten',  kortLabel: 'KH'     },
  { key: 'vetten',       label: 'Vetten',        kortLabel: 'Vetten' },
];

const FOCUS_KLEUR: Record<FocusMetric, string> = {
  kcal:         'var(--primary-light)',
  eiwit:        'var(--macro-protein)',
  koolhydraten: 'var(--macro-carbs)',
  vetten:       'var(--macro-fat)',
};

const FOCUS_EENHEID: Record<FocusMetric, string> = {
  kcal: 'kcal', eiwit: 'g', koolhydraten: 'g', vetten: 'g',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function dagBegroeting(): string {
  const uur = new Date().getHours();
  if (uur < 12) return 'Goedemorgen';
  if (uur < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function formatDatum(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Three-level ring colour: green = reached, red = exceeded, else baseColor */
function ringKleur(current: number, max: number, baseColor: string): string {
  if (max <= 0) return baseColor;
  if (current > max * 1.5) return 'var(--danger)';     // > 150% → red
  if (current >= max * 0.995) return 'var(--success)'; // ≥ 99.5% up to 150% → green
  return baseColor;
}

/** Status text + colour for any metric */
function statusInfo(current: number, max: number): { tekst: string; kleur: string } {
  if (max <= 0) return { tekst: '–', kleur: 'var(--text-muted)' };
  const pct = current / max;
  if (pct > 1.5)     return { tekst: 'Overschreden',    kleur: 'var(--danger)'  }; // > 150% → red
  if (pct > 1)       return { tekst: 'Overschreden ✓',  kleur: 'var(--success)' }; // 100–150% → green
  if (pct >= 0.995)  return { tekst: 'Doel bereikt! ✓', kleur: 'var(--success)' };
  if (pct >= 0.85)   return { tekst: 'Bijna bereikt',   kleur: 'var(--accent)'  };
  return               { tekst: 'Op schema',           kleur: '#4ADE80'         };
}

const MAALTIJD_INFO: Record<MaaltijdType, { label: string; icon: string; kleur: string }> = {
  ontbijt: { label: 'Ontbijt', icon: '☀️', kleur: 'rgba(255,220,100,0.15)' },
  lunch:   { label: 'Lunch',   icon: '🌤️', kleur: 'rgba(100,200,255,0.12)' },
  diner:   { label: 'Diner',   icon: '🌙', kleur: 'rgba(130,100,255,0.12)' },
  snacks:  { label: 'Snacks',  icon: '⚡', kleur: 'rgba(196,255,80,0.10)'  },
};

// ── MaaltijdSectie ─────────────────────────────────────────────────────────────

interface MaaltijdSectieProps {
  type: MaaltijdType;
  items: MaaltijdItem[];
  datum: string;
  onVerwijder: (type: MaaltijdType, id: string) => void;
}

function MaaltijdSectie({ type, items, datum, onVerwijder }: MaaltijdSectieProps) {
  const [open, setOpen] = useState(true);
  const info = MAALTIJD_INFO[type];
  const totaalKcal = items.reduce((s, i) => s + i.kcal, 0);

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '10px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
      >
        <span style={{ width: 36, height: 36, borderRadius: 10, background: info.kleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{info.icon}</span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontFamily: 'Lora, serif', fontWeight: 600, fontSize: '15px' }}>{info.label}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
            {items.length === 0 ? 'Niets gelogd' : `${items.length} product${items.length !== 1 ? 'en' : ''}`}
          </div>
        </div>
        {totaalKcal > 0 && <span style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '15px', color: 'var(--text-secondary)' }}>{totaalKcal} kcal</span>}
        <span style={{ color: 'var(--text-muted)', fontSize: '12px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', marginLeft: '4px' }}>▾</span>
      </button>

      {open && (
        <div style={{ borderTop: items.length > 0 ? '1px solid var(--border)' : 'none' }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid rgba(85,81,184,0.08)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.naam}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.portieGram}g</span>
                  <span style={{ fontSize: '11px', color: 'var(--macro-carbs)' }}>{item.koolhydraten}g KH</span>
                  <span style={{ fontSize: '11px', color: 'var(--macro-protein)' }}>{item.eiwit}g EW</span>
                  <span style={{ fontSize: '11px', color: 'var(--macro-fat)' }}>{item.vetten}g VT</span>
                </div>
              </div>
              <span style={{ fontFamily: 'Lora, serif', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{item.kcal} kcal</span>
              <button onClick={() => onVerwijder(type, item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }} aria-label="Verwijder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          ))}
          <Link href={`/loggen?maaltijd=${type}&datum=${datum}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', color: 'var(--primary-light)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
            <span style={{ width: 22, height: 22, borderRadius: '6px', border: '1.5px solid var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', lineHeight: 1 }}>+</span>
            Voeg toe aan {info.label.toLowerCase()}
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

const FOCUS_STORAGE_KEY = 'vt_focus_metric';

export default function DashboardPage() {
  const [datum, setDatum] = useState('');
  const [dagLog, setDagLog] = useState<DagLog | null>(null);
  const [doelen, setDoelen] = useState<Doelen | null>(null);
  const [focusMetric, setFocusMetric] = useState<FocusMetric>('kcal');
  const [naam, setNaam] = useState('');

  const laadData = useCallback(() => {
    const d = vandaagDatum();
    setDatum(d);
    setDagLog(getDagLog(d));
    setDoelen(getDoelen());
    setNaam(getNaam());
  }, []);

  useEffect(() => {
    laadData();
    // Restore persisted focus metric
    const opgeslagen = localStorage.getItem(FOCUS_STORAGE_KEY) as FocusMetric | null;
    if (opgeslagen && FOCUS_OPTIES.some((o) => o.key === opgeslagen)) {
      setFocusMetric(opgeslagen);
    }
    window.addEventListener('focus', laadData);
    return () => window.removeEventListener('focus', laadData);
  }, [laadData]);

  function selecteerFocus(metric: FocusMetric) {
    setFocusMetric(metric);
    localStorage.setItem(FOCUS_STORAGE_KEY, metric);
  }

  const handleVerwijder = (type: MaaltijdType, id: string) => {
    if (!datum) return;
    verwijderItem(datum, type, id);
    setDagLog(getDagLog(datum));
  };

  if (!dagLog || !doelen) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border-strong)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalen = berekenDagTotalen(dagLog);

  // Values for the currently focused metric
  const focusWaardes: Record<FocusMetric, { current: number; max: number }> = {
    kcal:         { current: totalen.kcal,         max: doelen.kcal         },
    eiwit:        { current: totalen.eiwit,        max: doelen.eiwit        },
    koolhydraten: { current: totalen.koolhydraten, max: doelen.koolhydraten },
    vetten:       { current: totalen.vetten,       max: doelen.vetten       },
  };

  const { current: focusCurrent, max: focusMax } = focusWaardes[focusMetric];
  const focusPct = focusMax > 0 ? Math.min(focusCurrent / focusMax, 1) : 0;
  const resterend = focusMax - focusCurrent;
  const focusTeVeel = focusMax > 0 && focusCurrent > focusMax * 1.5; // > 150% → red
  const focusGroen  = focusMax > 0 && focusCurrent >= focusMax * 0.995 && !focusTeVeel; // 99.5–150% → green

  // Ring colour: red only above 150%, green from 99.5% up to 150%, else metric colour
  const baseKleur = FOCUS_KLEUR[focusMetric];
  const ringStroke = focusTeVeel
    ? 'var(--danger)'
    : focusGroen
    ? 'var(--success)'
    : focusMetric === 'kcal'
    ? 'url(#mainGradient)'
    : baseKleur;

  const status = statusInfo(focusCurrent, focusMax);

  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference - focusPct * circumference;
  const eenheid = FOCUS_EENHEID[focusMetric];

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {formatDatum(datum || new Date().toISOString().split('T')[0])}
        </div>
        <div style={{ fontFamily: 'Lora, serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.02em' }}>
          {dagBegroeting()}{naam ? `, ${naam}` : ''} 👋
        </div>
      </div>

      {/* Big ring card */}
      <div style={{ margin: '0 16px 16px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', padding: '20px 20px 24px', position: 'relative', overflow: 'hidden' }}>

        {/* Metric selector tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {FOCUS_OPTIES.map(({ key, kortLabel }) => {
            const isActief = focusMetric === key;
            const kleur = FOCUS_KLEUR[key];
            const { current, max } = focusWaardes[key];
            const teVeel  = max > 0 && current > max * 1.5;
            const groenpje = max > 0 && current >= max * 0.995 && !teVeel;
            const dotKleur = teVeel ? 'var(--danger)' : groenpje ? 'var(--success)' : kleur;
            return (
              <button
                key={key}
                onClick={() => selecteerFocus(key)}
                style={{
                  flex: 1,
                  padding: '7px 6px',
                  borderRadius: '10px',
                  border: `1px solid ${isActief ? kleur + '60' : 'var(--border)'}`,
                  background: isActief ? kleur + '18' : 'var(--bg-elevated)',
                  color: isActief ? kleur : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: isActief ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {/* Status dot */}
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotKleur, opacity: (groenpje || teVeel) ? 1 : 0.35 }} />
                {kortLabel}
              </button>
            );
          })}
        </div>

        {/* Glow */}
        <div style={{ position: 'absolute', top: '55%', left: '40%', transform: 'translate(-50%,-50%)', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${focusGroen ? 'rgba(74,222,128,0.12)' : focusTeVeel ? 'rgba(255,107,122,0.1)' : 'rgba(85,81,184,0.12)'} 0%, transparent 70%)`, pointerEvents: 'none', transition: 'background 0.4s' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px' }}>
          {/* Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={100} cy={100} r={88} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={12} />
              <circle
                cx={100} cy={100} r={88}
                fill="none"
                stroke={ringStroke}
                strokeWidth={12}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s ease' }}
              />
              <defs>
                <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary-light)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <div style={{ fontFamily: 'Lora, serif', fontWeight: 800, fontSize: '34px', lineHeight: 1, letterSpacing: '-0.02em', color: focusTeVeel ? 'var(--danger)' : focusGroen ? 'var(--success)' : 'var(--text-primary)', transition: 'color 0.3s' }}>
                {focusCurrent > focusMax ? `+${Math.round(Math.abs(resterend) * 10) / 10}` : Math.round(Math.abs(resterend) * 10) / 10}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {focusCurrent > focusMax ? `${eenheid} over` : `${eenheid} over`}
              </div>
            </div>
          </div>

          {/* Stats column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '90px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Gegeten</div>
              <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '20px', color: 'var(--text-primary)' }}>
                {Math.round(focusCurrent * 10) / 10}<span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '2px' }}>{eenheid}</span>
              </div>
            </div>
            <div style={{ width: '100%', height: '1px', background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Doel</div>
              <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '20px', color: 'var(--text-secondary)' }}>
                {focusMax}<span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '2px' }}>{eenheid}</span>
              </div>
            </div>
            <div style={{ width: '100%', height: '1px', background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Status</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: status.kleur, transition: 'color 0.3s' }}>{status.tekst}</div>
            </div>
          </div>
        </div>

        {/* Macro progress bars */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ProgressBar current={totalen.koolhydraten} max={doelen.koolhydraten} color={ringKleur(totalen.koolhydraten, doelen.koolhydraten, 'var(--macro-carbs)')} label="Koolhydraten" />
          <ProgressBar current={totalen.eiwit}        max={doelen.eiwit}        color={ringKleur(totalen.eiwit, doelen.eiwit, 'var(--macro-protein)')} label="Eiwit" />
          <ProgressBar current={totalen.vetten}       max={doelen.vetten}       color={ringKleur(totalen.vetten, doelen.vetten, 'var(--macro-fat)')} label="Vetten" />
        </div>
      </div>

      {/* Small macro rings */}
      <div style={{ margin: '0 16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', padding: '20px 8px' }}>
          <MacroRing label="Koolhydr." current={totalen.koolhydraten} max={doelen.koolhydraten} color={ringKleur(totalen.koolhydraten, doelen.koolhydraten, 'var(--macro-carbs)')} />
          <div style={{ width: '1px', background: 'var(--border)' }} />
          <MacroRing label="Eiwit"     current={totalen.eiwit}        max={doelen.eiwit}        color={ringKleur(totalen.eiwit, doelen.eiwit, 'var(--macro-protein)')} />
          <div style={{ width: '1px', background: 'var(--border)' }} />
          <MacroRing label="Vetten"    current={totalen.vetten}       max={doelen.vetten}       color={ringKleur(totalen.vetten, doelen.vetten, 'var(--macro-fat)')} />
        </div>
      </div>

      {/* Meal sections */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '17px', marginBottom: '12px', letterSpacing: '-0.01em' }}>Maaltijden</div>
        {(['ontbijt', 'lunch', 'diner', 'snacks'] as MaaltijdType[]).map((type) => (
          <MaaltijdSectie key={type} type={type} items={dagLog.maaltijden[type]} datum={datum} onVerwijder={handleVerwijder} />
        ))}
      </div>
    </div>
  );
}
