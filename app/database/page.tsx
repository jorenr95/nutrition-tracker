'use client';

import { useState, useEffect } from 'react';
import {
  getVoedselDatabase, voegVoedselToe, updateVoedsel,
  verwijderAangepastVoedsel, herstellenVoedsel, isIngebouwdVoedsel, generateId,
} from '@/lib/opslag';
import type { Voedsel, VoedselCategorie } from '@/lib/types';
import { CATEGORIE_LABELS } from '@/lib/voedselDatabase';
import BarcodeScanner from '@/components/BarcodeScanner';

// ── Open Food Facts ─────────────────────────────────────────────────────────────

interface OpenFoodFactsResultaat {
  naam: string;
  kcalPer100g: number;
  eiwitPer100g: number;
  koolhydratenPer100g: number;
  vettenPer100g: number;
}

async function haalVoedselInfoOp(barcode: string): Promise<OpenFoodFactsResultaat | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const n = p.nutriments ?? {};
    return {
      naam: p.product_name_nl || p.product_name || '',
      kcalPer100g: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
      eiwitPer100g: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
      koolhydratenPer100g: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
      vettenPer100g: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
    };
  } catch {
    return null;
  }
}

const ALLE_CATEGORIEEN = Object.keys(CATEGORIE_LABELS) as VoedselCategorie[];

// ── Shared form ────────────────────────────────────────────────────────────────

interface VoedselFormProps {
  bestaand?: Voedsel;          // provided → edit mode
  voorgevuld?: Partial<Voedsel>; // pre-filled from barcode scan
  onOpgeslagen: () => void;
  onAnnuleer: () => void;
}

function VoedselForm({ bestaand, voorgevuld, onOpgeslagen, onAnnuleer }: VoedselFormProps) {
  const isBewerken = bestaand !== undefined;
  const isIngebouwd = bestaand ? isIngebouwdVoedsel(bestaand.id) : false;

  const init = bestaand ?? voorgevuld ?? {};
  const [naam, setNaam] = useState((init as Voedsel).naam ?? '');
  const [kcal, setKcal] = useState(String((init as Voedsel).kcalPer100g ?? ''));
  const [eiwit, setEiwit] = useState(String((init as Voedsel).eiwitPer100g ?? ''));
  const [koolhydraten, setKoolhydraten] = useState(String((init as Voedsel).koolhydratenPer100g ?? ''));
  const [vetten, setVetten] = useState(String((init as Voedsel).vettenPer100g ?? ''));
  const [categorie, setCategorie] = useState<VoedselCategorie>((init as Voedsel).categorie ?? 'overig');
  const [fout, setFout] = useState('');

  function handleOpslaan() {
    if (!naam.trim()) { setFout('Naam is verplicht'); return; }
    if (!kcal || isNaN(Number(kcal))) { setFout('Geldig kcal getal is verplicht'); return; }

    const voedsel: Voedsel = {
      id: bestaand?.id ?? `eigen-${generateId()}`,
      naam: naam.trim(),
      kcalPer100g: Number(kcal),
      eiwitPer100g: Number(eiwit) || 0,
      koolhydratenPer100g: Number(koolhydraten) || 0,
      vettenPer100g: Number(vetten) || 0,
      categorie,
      aangepast: bestaand?.aangepast ?? true,
    };

    if (isBewerken) {
      updateVoedsel(voedsel);
    } else {
      voegVoedselToe(voedsel);
    }
    onOpgeslagen();
  }

  const inputStijl = {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)',
  };
  const labelStijl = {
    fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500,
    letterSpacing: '0.04em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: '6px',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onAnnuleer(); }}
    >
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '24px 20px 40px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'var(--border-strong)', borderRadius: 99, margin: '0 auto 20px' }} />

        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.01em' }}>
            {isBewerken ? 'Product bewerken' : 'Eigen product toevoegen'}
          </div>
          {isBewerken && isIngebouwd && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(85,81,184,0.08)', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 10px' }}>
              Dit is een ingebouwd product. Aanpassingen worden opgeslagen als persoonlijke override.
            </div>
          )}
        </div>

        {fout && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(255,107,122,0.1)', border: '1px solid rgba(255,107,122,0.3)', borderRadius: '10px', color: 'var(--danger)', fontSize: '13px' }}>
            {fout}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStijl}>Productnaam *</label>
            <input style={inputStijl} placeholder="bijv. Eiwitshake" value={naam} onChange={(e) => setNaam(e.target.value)} />
          </div>

          <div>
            <label style={labelStijl}>Categorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value as VoedselCategorie)} style={{ ...inputStijl, cursor: 'pointer' }}>
              {ALLE_CATEGORIEEN.map((c) => <option key={c} value={c}>{CATEGORIE_LABELS[c]}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStijl}>Kcal / 100g *</label>
              <input style={inputStijl} type="number" placeholder="0" value={kcal} onChange={(e) => setKcal(e.target.value)} />
            </div>
            <div>
              <label style={labelStijl}>Eiwit / 100g (g)</label>
              <input style={inputStijl} type="number" placeholder="0" value={eiwit} onChange={(e) => setEiwit(e.target.value)} />
            </div>
            <div>
              <label style={labelStijl}>Koolhydr. / 100g (g)</label>
              <input style={inputStijl} type="number" placeholder="0" value={koolhydraten} onChange={(e) => setKoolhydraten(e.target.value)} />
            </div>
            <div>
              <label style={labelStijl}>Vetten / 100g (g)</label>
              <input style={inputStijl} type="number" placeholder="0" value={vetten} onChange={(e) => setVetten(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onAnnuleer} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              Annuleer
            </button>
            <button onClick={handleOpslaan} style={{ flex: 2, padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none', color: '#fff', fontFamily: 'Lora, serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(85,81,184,0.4)' }}>
              {isBewerken ? 'Wijzigingen opslaan' : 'Toevoegen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DatabasePage() {
  const [database, setDatabase] = useState<Voedsel[]>([]);
  const [zoekterm, setZoekterm] = useState('');
  const [actieveCategorie, setActieveCategorie] = useState<VoedselCategorie | 'alle'>('alle');
  const [uitvouwen, setUitvouwen] = useState<string | null>(null);
  const [bewerken, setBewerken] = useState<Voedsel | null>(null);
  const [toonNieuw, setToonNieuw] = useState(false);
  const [bevestigVerwijder, setBevestigVerwijder] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLaden, setScanLaden] = useState(false);
  const [scanFout, setScanFout] = useState('');
  const [voorgevuld, setVoorgevuld] = useState<Partial<Voedsel> | null>(null);

  function laadDatabase() {
    setDatabase(getVoedselDatabase());
  }

  useEffect(() => { laadDatabase(); }, []);

  async function handleBarcode(barcode: string) {
    setScannerOpen(false);
    setScanLaden(true);
    setScanFout('');
    const resultaat = await haalVoedselInfoOp(barcode);
    setScanLaden(false);
    if (!resultaat) {
      setScanFout(`Barcode ${barcode} niet gevonden in Open Food Facts.`);
      setToonNieuw(true);
      return;
    }
    setVoorgevuld(resultaat);
    setToonNieuw(true);
  }

  const aantalEigen = database.filter((v) => v.aangepast).length;
  const aantalBewerkt = database.filter((v) => v.bewerkt).length;

  const gefilterd = database.filter((v) => {
    const zoek = v.naam.toLowerCase().includes(zoekterm.toLowerCase());
    const cat = actieveCategorie === 'alle' || v.categorie === actieveCategorie;
    return zoek && cat;
  });

  function handleVerwijder(id: string) {
    if (bevestigVerwijder !== id) { setBevestigVerwijder(id); return; }
    verwijderAangepastVoedsel(id);
    setBevestigVerwijder(null);
    setUitvouwen(null);
    laadDatabase();
  }

  function handleHerstellen(id: string) {
    herstellenVoedsel(id);
    laadDatabase();
  }

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px' }}>
        <div style={{ fontFamily: 'Lora, serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.02em', marginBottom: '4px' }}>Database</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {database.length} producten
          {aantalEigen > 0 && ` · ${aantalEigen} eigen`}
          {aantalBewerkt > 0 && ` · ${aantalBewerkt} bewerkt`}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 12px', position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Zoek product..."
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          style={{ width: '100%', paddingLeft: '44px', paddingRight: '16px', height: '46px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '14px', fontSize: '15px', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Category filter */}
      <div style={{ padding: '0 16px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', width: 'max-content' }}>
          {(['alle', ...ALLE_CATEGORIEEN] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActieveCategorie(cat)}
              style={{
                padding: '6px 14px', borderRadius: '10px', whiteSpace: 'nowrap',
                background: actieveCategorie === cat ? 'var(--primary)' : 'var(--bg-card)',
                border: `1px solid ${actieveCategorie === cat ? 'var(--primary)' : 'var(--border)'}`,
                color: actieveCategorie === cat ? '#fff' : 'var(--text-muted)',
                fontSize: '13px', fontWeight: actieveCategorie === cat ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {cat === 'alle' ? 'Alle' : CATEGORIE_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Food list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {gefilterd.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontWeight: 500 }}>Geen producten gevonden</div>
          </div>
        )}

        {gefilterd.map((voedsel) => {
          const isOpen = uitvouwen === voedsel.id;
          const isCustom = voedsel.aangepast;
          const isBewerktIngebouwd = voedsel.bewerkt;

          return (
            <div key={voedsel.id} style={{ background: 'var(--bg-card)', borderRadius: '14px', border: `1px solid ${isOpen ? 'var(--border-strong)' : 'var(--border)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              {/* Row */}
              <button
                onClick={() => { setUitvouwen(isOpen ? null : voedsel.id); setBevestigVerwijder(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}
              >
                {/* Kcal badge */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: isCustom ? 'rgba(196,255,80,0.1)' : isBewerktIngebouwd ? 'rgba(255,158,108,0.1)' : 'rgba(85,81,184,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '13px', fontFamily: 'Lora, serif', fontWeight: 700, color: isCustom ? 'var(--accent)' : isBewerktIngebouwd ? 'var(--macro-carbs)' : 'var(--primary-light)' }}>
                    {voedsel.kcalPer100g}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{voedsel.naam}</span>
                    {isCustom && <span style={{ fontSize: '10px', color: 'var(--accent)', background: 'rgba(196,255,80,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: 500, flexShrink: 0 }}>Eigen</span>}
                    {isBewerktIngebouwd && <span style={{ fontSize: '10px', color: 'var(--macro-carbs)', background: 'rgba(255,158,108,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: 500, flexShrink: 0 }}>Bewerkt</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{CATEGORIE_LABELS[voedsel.categorie]}</div>
                </div>

                <span style={{ color: 'var(--text-muted)', fontSize: '12px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>▾</span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '14px' }}>
                  {/* Macro grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                    {[
                      { label: 'Kcal', val: voedsel.kcalPer100g, kleur: 'var(--text-primary)', unit: '' },
                      { label: 'Koolhydr.', val: voedsel.koolhydratenPer100g, kleur: 'var(--macro-carbs)', unit: 'g' },
                      { label: 'Eiwit', val: voedsel.eiwitPer100g, kleur: 'var(--macro-protein)', unit: 'g' },
                      { label: 'Vetten', val: voedsel.vettenPer100g, kleur: 'var(--macro-fat)', unit: 'g' },
                    ].map(({ label, val, kleur, unit }) => (
                      <div key={label} style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '10px 4px', border: '1px solid var(--border)' }}>
                        <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '15px', color: kleur }}>{val}{unit}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'right' }}>Per 100g</div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Edit */}
                    <button
                      onClick={() => setBewerken(voedsel)}
                      style={{ flex: 1, minWidth: '80px', padding: '9px 12px', borderRadius: '10px', background: 'rgba(85,81,184,0.1)', border: '1px solid rgba(85,81,184,0.3)', color: 'var(--primary-light)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      Bewerken
                    </button>

                    {/* Restore (built-in with edits) */}
                    {isBewerktIngebouwd && (
                      <button
                        onClick={() => handleHerstellen(voedsel.id)}
                        style={{ flex: 1, minWidth: '80px', padding: '9px 12px', borderRadius: '10px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: 'var(--success)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                        Origineel
                      </button>
                    )}

                    {/* Delete (custom only) */}
                    {isCustom && (
                      <button
                        onClick={() => handleVerwijder(voedsel.id)}
                        style={{ flex: 1, minWidth: '80px', padding: '9px 12px', borderRadius: '10px', background: bevestigVerwijder === voedsel.id ? 'rgba(255,107,122,0.15)' : 'transparent', border: `1px solid ${bevestigVerwijder === voedsel.id ? 'rgba(255,107,122,0.5)' : 'rgba(255,107,122,0.25)'}`, color: 'var(--danger)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                        {bevestigVerwijder === voedsel.id ? 'Zeker?' : 'Verwijder'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height: '24px' }} />

      {/* FABs: scan + add */}
      <div style={{ position: 'fixed', bottom: '96px', right: '24px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 50 }}>
        {/* Barcode scan button */}
        <button
          onClick={() => { setScanFout(''); setScannerOpen(true); }}
          style={{
            width: 56, height: 56, borderRadius: '16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            cursor: 'pointer',
          }}
          title="Scan barcode"
        >
          {scanLaden
            ? <div style={{ width: 22, height: 22, border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                <rect x="7" y="7" width="3" height="10" rx="1" /><rect x="14" y="7" width="3" height="10" rx="1" />
              </svg>
          }
        </button>

        {/* Add manually */}
        <button
          onClick={() => { setVoorgevuld(null); setToonNieuw(true); }}
          style={{
            width: 56, height: 56, borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(85,81,184,0.5)',
            fontSize: '26px', fontWeight: 300, cursor: 'pointer',
          }}
        >+</button>
      </div>

      {/* Scan error toast */}
      {scanFout && (
        <div style={{
          position: 'fixed', bottom: '170px', left: '16px', right: '16px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
          borderRadius: '14px', padding: '12px 16px', zIndex: 50,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>{scanFout}</span>
          <button onClick={() => setScanFout('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
      )}

      {/* Barcode scanner */}
      {scannerOpen && (
        <BarcodeScanner
          onGescand={handleBarcode}
          onSluiten={() => setScannerOpen(false)}
        />
      )}

      {/* Create form (possibly pre-filled from scan) */}
      {toonNieuw && (
        <VoedselForm
          voorgevuld={voorgevuld ?? undefined}
          onOpgeslagen={() => { setToonNieuw(false); setVoorgevuld(null); laadDatabase(); }}
          onAnnuleer={() => { setToonNieuw(false); setVoorgevuld(null); }}
        />
      )}

      {/* Edit form */}
      {bewerken && (
        <VoedselForm
          bestaand={bewerken}
          onOpgeslagen={() => { setBewerken(null); setUitvouwen(null); laadDatabase(); }}
          onAnnuleer={() => setBewerken(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
