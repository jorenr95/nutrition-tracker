'use client';

import { useState, useEffect } from 'react';
import { getAlleLogs, getDoelen, berekenDagTotalen, exporteerCSV } from '@/lib/opslag';
import type { DagLog, Doelen, MaaltijdType } from '@/lib/types';
import { ProgressBar } from '@/components/MacroRing';

const MAALTIJD_LABELS: Record<MaaltijdType, string> = {
  ontbijt: 'Ontbijt', lunch: 'Lunch', diner: 'Diner', snacks: 'Snacks',
};

function formatDatum(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDatumKort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  const gisteren = new Date(vandaag);
  gisteren.setDate(gisteren.getDate() - 1);
  if (d.toDateString() === vandaag.toDateString()) return 'Vandaag';
  if (d.toDateString() === gisteren.toDateString()) return 'Gisteren';
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' });
}

interface DagKaartProps {
  log: DagLog;
  doelen: Doelen;
}

function DagKaart({ log, doelen }: DagKaartProps) {
  const [open, setOpen] = useState(false);
  const totalen = berekenDagTotalen(log);
  const pct = Math.min((totalen.kcal / doelen.kcal) * 100, 100);
  const over = totalen.kcal > doelen.kcal;
  const aantalProducten = Object.values(log.maaltijden).reduce((s, items) => s + items.length, 0);

  const kleur = over ? 'var(--danger)' : pct >= 80 ? 'var(--accent)' : 'var(--primary-light)';

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '8px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '15px' }}>
              {formatDatumKort(log.datum)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {aantalProducten} product{aantalProducten !== 1 ? 'en' : ''} · {log.datum}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '18px', color: kleur }}>
              {totalen.kcal}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {doelen.kcal} kcal</div>
          </div>
        </div>

        {/* Calorie bar */}
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: kleur, borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>

        {/* Macro summary */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--macro-carbs)' }}>{totalen.koolhydraten}g KH</span>
          <span style={{ fontSize: '12px', color: 'var(--macro-protein)' }}>{totalen.eiwit}g EW</span>
          <span style={{ fontSize: '12px', color: 'var(--macro-fat)' }}>{totalen.vetten}g VT</span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▾</span>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
          {(['ontbijt', 'lunch', 'diner', 'snacks'] as MaaltijdType[]).map((type) => {
            const items = log.maaltijden[type];
            if (items.length === 0) return null;
            const maaltijdKcal = items.reduce((s, i) => s + i.kcal, 0);
            return (
              <div key={type} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{MAALTIJD_LABELS[type]}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{maaltijdKcal} kcal</span>
                </div>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(85,81,184,0.06)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.naam} <span style={{ color: 'var(--text-muted)' }}>({item.portieGram}g)</span></span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Lora, serif', fontWeight: 600 }}>{item.kcal} kcal</span>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Day macro detail */}
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ProgressBar current={totalen.koolhydraten} max={doelen.koolhydraten} color="var(--macro-carbs)" label="Koolhydraten" />
            <ProgressBar current={totalen.eiwit} max={doelen.eiwit} color="var(--macro-protein)" label="Eiwit" />
            <ProgressBar current={totalen.vetten} max={doelen.vetten} color="var(--macro-fat)" label="Vetten" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeschiedenisPage() {
  const [logs, setLogs] = useState<DagLog[]>([]);
  const [doelen, setDoelen] = useState<Doelen | null>(null);
  const [exportBezig, setExportBezig] = useState(false);

  useEffect(() => {
    setLogs(getAlleLogs());
    setDoelen(getDoelen());
  }, []);

  function handleExport() {
    if (!doelen) return;
    setExportBezig(true);
    exporteerCSV(logs, doelen);
    setTimeout(() => setExportBezig(false), 1500);
  }

  const gemiddeldeKcal = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + berekenDagTotalen(l).kcal, 0) / logs.length)
    : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '52px 20px 20px' }}>
        <div style={{ fontFamily: 'Lora, serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.02em', marginBottom: '4px' }}>Geschiedenis</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{logs.length} dag{logs.length !== 1 ? 'en' : ''} bijgehouden</div>
      </div>

      {/* Stats overview */}
      {logs.length > 0 && doelen && (
        <div style={{ margin: '0 16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: '6px' }}>Gemiddeld</div>
            <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '22px', color: 'var(--text-primary)' }}>{gemiddeldeKcal}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>kcal / dag</div>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: '6px' }}>Kcal doel</div>
            <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '22px', color: 'var(--primary-light)' }}>{doelen.kcal}</div>
            <div style={{ fontSize: '12px', color: gemiddeldeKcal <= doelen.kcal ? 'var(--success)' : 'var(--danger)' }}>
              {gemiddeldeKcal <= doelen.kcal ? '✓ Onder doel' : '↑ Boven doel'}
            </div>
          </div>
        </div>
      )}

      {/* Export button */}
      {logs.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={handleExport}
            disabled={exportBezig}
            style={{
              width: '100%', padding: '12px',
              background: exportBezig ? 'var(--bg-card)' : 'rgba(196,255,80,0.1)',
              border: `1px solid ${exportBezig ? 'var(--border)' : 'rgba(196,255,80,0.3)'}`,
              borderRadius: '14px',
              color: exportBezig ? 'var(--text-muted)' : 'var(--accent)',
              fontSize: '14px', fontWeight: 600,
              cursor: exportBezig ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            {exportBezig ? (
              <>✓ CSV geëxporteerd!</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exporteer als CSV
              </>
            )}
          </button>
        </div>
      )}

      {/* Day list */}
      <div style={{ padding: '0 16px' }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Nog niets gelogd</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>Begin met loggen via het menu om je geschiedenis te zien.</div>
          </div>
        ) : (
          doelen && logs.map((log) => <DagKaart key={log.datum} log={log} doelen={doelen} />)
        )}
      </div>
      <div style={{ height: '16px' }} />
    </div>
  );
}
