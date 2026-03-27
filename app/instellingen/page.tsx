'use client';

import { useState, useEffect } from 'react';
import { getDoelen, slaDoelen, wisAlleData } from '@/lib/opslag';
import type { Doelen } from '@/lib/types';

function MacroSlider({ label, kleur, waarde, min, max, stap, onChange }: {
  label: string; kleur: string; waarde: number; min: number; max: number; stap: number;
  onChange: (val: number) => void;
}) {
  const pct = ((waarde - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            value={waarde}
            onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
            style={{
              width: '72px', textAlign: 'right',
              padding: '4px 8px',
              background: 'var(--bg-elevated)',
              border: `1px solid ${kleur}40`,
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              color: kleur,
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '14px' }}>
            {label === 'Calorieën' ? 'kcal' : 'g'}
          </span>
        </div>
      </div>
      <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: kleur, borderRadius: 99 }} />
        <input
          type="range"
          min={min} max={max} step={stap}
          value={waarde}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{min}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{max}</span>
      </div>
    </div>
  );
}

export default function InstellingenPage() {
  const [doelen, setDoelen] = useState<Doelen>({ kcal: 2000, eiwit: 150, koolhydraten: 200, vetten: 65 });
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [wisBevestig, setWisBevestig] = useState(false);

  useEffect(() => {
    setDoelen(getDoelen());
  }, []);

  function handleOpslaan() {
    slaDoelen(doelen);
    setOpgeslagen(true);
    setTimeout(() => setOpgeslagen(false), 2000);
  }

  function handleWisData() {
    if (!wisBevestig) { setWisBevestig(true); return; }
    wisAlleData();
    setWisBevestig(false);
    window.location.reload();
  }

  // Calculate macros as % of calories
  const kcalUitEiwit = doelen.eiwit * 4;
  const kcalUitKH = doelen.koolhydraten * 4;
  const kcalUitVetten = doelen.vetten * 9;
  const totaalMacroKcal = kcalUitEiwit + kcalUitKH + kcalUitVetten;

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '52px 20px 24px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.02em', marginBottom: '4px' }}>Instellingen</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Stel je dagelijkse doelen in</div>
      </div>

      {/* Goals section */}
      <div style={{ margin: '0 16px 16px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎯</span> Dagelijkse doelen
        </div>

        <MacroSlider
          label="Calorieën" kleur="var(--accent)"
          waarde={doelen.kcal} min={1000} max={5000} stap={50}
          onChange={(v) => setDoelen({ ...doelen, kcal: v })}
        />
        <MacroSlider
          label="Eiwit" kleur="var(--macro-protein)"
          waarde={doelen.eiwit} min={20} max={400} stap={5}
          onChange={(v) => setDoelen({ ...doelen, eiwit: v })}
        />
        <MacroSlider
          label="Koolhydraten" kleur="var(--macro-carbs)"
          waarde={doelen.koolhydraten} min={20} max={600} stap={10}
          onChange={(v) => setDoelen({ ...doelen, koolhydraten: v })}
        />
        <MacroSlider
          label="Vetten" kleur="var(--macro-fat)"
          waarde={doelen.vetten} min={10} max={300} stap={5}
          onChange={(v) => setDoelen({ ...doelen, vetten: v })}
        />

        {/* Macro verdeling */}
        <div style={{ marginTop: '8px', padding: '14px', background: 'var(--bg-elevated)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Macro verdeling (op basis van kcal)</div>
          {totaalMacroKcal > 0 && (
            <>
              <div style={{ display: 'flex', height: '10px', borderRadius: 99, overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ width: `${(kcalUitKH / totaalMacroKcal) * 100}%`, background: 'var(--macro-carbs)' }} />
                <div style={{ width: `${(kcalUitEiwit / totaalMacroKcal) * 100}%`, background: 'var(--macro-protein)' }} />
                <div style={{ width: `${(kcalUitVetten / totaalMacroKcal) * 100}%`, background: 'var(--macro-fat)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[
                  { l: 'KH', pct: Math.round((kcalUitKH / totaalMacroKcal) * 100), c: 'var(--macro-carbs)' },
                  { l: 'EW', pct: Math.round((kcalUitEiwit / totaalMacroKcal) * 100), c: 'var(--macro-protein)' },
                  { l: 'VT', pct: Math.round((kcalUitVetten / totaalMacroKcal) * 100), c: 'var(--macro-fat)' },
                ].map(({ l, pct, c }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px', color: c }}>{pct}%</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleOpslaan}
          style={{
            width: '100%', marginTop: '16px', padding: '14px',
            background: opgeslagen ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            border: opgeslagen ? '1px solid rgba(74,222,128,0.3)' : 'none',
            borderRadius: '14px',
            color: opgeslagen ? 'var(--success)' : '#fff',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px',
            cursor: 'pointer',
            boxShadow: opgeslagen ? 'none' : '0 4px 20px rgba(85,81,184,0.4)',
            transition: 'all 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {opgeslagen ? <>✓ Opgeslagen!</> : 'Doelen opslaan'}
        </button>
      </div>

      {/* Info section */}
      <div style={{ margin: '0 16px 16px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💡</span> Richtlijnen
        </div>
        {[
          { icon: '🥩', title: 'Eiwit', tip: '1.6–2.2g per kg lichaamsgewicht voor spieropbouw' },
          { icon: '🍞', title: 'Koolhydraten', tip: '45–65% van je totale calorieën' },
          { icon: '🥑', title: 'Vetten', tip: '20–35% van je totale calorieën' },
        ].map(({ icon, title, tip }) => (
          <div key={title} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>{title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Data management */}
      <div style={{ margin: '0 16px 16px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚙️</span> Gegevensbeheer
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
          Alle gegevens worden opgeslagen in je browser (localStorage). Er wordt niets naar servers gestuurd.
        </div>
        <button
          onClick={handleWisData}
          style={{
            width: '100%', padding: '13px',
            background: wisBevestig ? 'rgba(255,107,122,0.15)' : 'transparent',
            border: `1px solid ${wisBevestig ? 'rgba(255,107,122,0.5)' : 'rgba(255,107,122,0.3)'}`,
            borderRadius: '12px',
            color: 'var(--danger)',
            fontSize: '14px', fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {wisBevestig ? '⚠️ Klik nogmaals om te bevestigen' : '🗑️ Alle data wissen'}
        </button>
        {wisBevestig && (
          <button onClick={() => setWisBevestig(false)} style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'none', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
            Annuleer
          </button>
        )}
      </div>

      {/* About */}
      <div style={{ margin: '0 16px 24px', padding: '16px 20px', background: 'rgba(85,81,184,0.06)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>VoedingsTracker v1.0</div>
          <div>Bijhoud je voeding, calorieën en macronutriënten.</div>
          <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>38 producten in database · Geen account vereist</div>
        </div>
      </div>
    </div>
  );
}
