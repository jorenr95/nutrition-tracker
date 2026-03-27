'use client';

import { useState, useEffect } from 'react';
import {
  getRecepten, slaReceptenOp, getVoedselDatabase, berekenMacros,
  voegItemToe, vandaagDatum, generateId,
} from '@/lib/opslag';
import type { Recept, ReceptIngredient, Voedsel, MaaltijdType } from '@/lib/types';

const MAALTIJDEN: MaaltijdType[] = ['ontbijt', 'lunch', 'diner', 'snacks'];
const MAALTIJD_LABELS: Record<MaaltijdType, string> = {
  ontbijt: 'Ontbijt', lunch: 'Lunch', diner: 'Diner', snacks: 'Snacks',
};

interface ReceptFormProps {
  database: Voedsel[];
  bestaand?: Recept;
  onOpgeslagen: (recept: Recept) => void;
  onAnnuleer: () => void;
}

function ReceptForm({ database, bestaand, onOpgeslagen, onAnnuleer }: ReceptFormProps) {
  const [naam, setNaam] = useState(bestaand?.naam ?? '');
  const [beschrijving, setBeschrijving] = useState(bestaand?.beschrijving ?? '');
  const [portieAantal, setPortieAantal] = useState(bestaand?.aantalPorties ?? 1);
  const [ingredienten, setIngredienten] = useState<ReceptIngredient[]>(bestaand?.ingredienten ?? []);
  const [zoek, setZoek] = useState('');
  const [toonZoek, setToonZoek] = useState(false);
  const [fout, setFout] = useState('');

  const zoekResultaten = zoek
    ? database.filter((v) => v.naam.toLowerCase().includes(zoek.toLowerCase())).slice(0, 8)
    : [];

  function voegIngredientToe(voedsel: Voedsel) {
    setIngredienten([...ingredienten, { voedselId: voedsel.id, naam: voedsel.naam, portieGram: 100 }]);
    setZoek('');
    setToonZoek(false);
  }

  function updatePortie(idx: number, gram: number) {
    const kopie = [...ingredienten];
    kopie[idx] = { ...kopie[idx], portieGram: Math.max(1, gram) };
    setIngredienten(kopie);
  }

  function verwijderIngredient(idx: number) {
    setIngredienten(ingredienten.filter((_, i) => i !== idx));
  }

  function berekenTotalen() {
    return ingredienten.reduce((acc, ing) => {
      const voedsel = database.find((v) => v.id === ing.voedselId);
      if (!voedsel) return acc;
      const m = berekenMacros(voedsel, ing.portieGram);
      return {
        kcal: acc.kcal + m.kcal,
        eiwit: Math.round((acc.eiwit + m.eiwit) * 10) / 10,
        koolhydraten: Math.round((acc.koolhydraten + m.koolhydraten) * 10) / 10,
        vetten: Math.round((acc.vetten + m.vetten) * 10) / 10,
      };
    }, { kcal: 0, eiwit: 0, koolhydraten: 0, vetten: 0 });
  }

  function handleOpslaan() {
    if (!naam.trim()) { setFout('Geef het recept een naam'); return; }
    if (ingredienten.length === 0) { setFout('Voeg minimaal één ingrediënt toe'); return; }
    const totalen = berekenTotalen();
    const recept: Recept = {
      id: bestaand?.id ?? generateId(),
      naam: naam.trim(),
      beschrijving: beschrijving.trim(),
      aantalPorties: portieAantal,
      ingredienten,
      totaalKcal: totalen.kcal,
      totaalEiwit: totalen.eiwit,
      totaalKoolhydraten: totalen.koolhydraten,
      totaalVetten: totalen.vetten,
    };
    onOpgeslagen(recept);
  }

  const totalen = berekenTotalen();
  const perPortie = portieAantal > 0 ? {
    kcal: Math.round(totalen.kcal / portieAantal),
    eiwit: Math.round((totalen.eiwit / portieAantal) * 10) / 10,
    koolhydraten: Math.round((totalen.koolhydraten / portieAantal) * 10) / 10,
    vetten: Math.round((totalen.vetten / portieAantal) * 10) / 10,
  } : totalen;

  const inputStijl = { width: '100%', padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onAnnuleer(); }}>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '24px 20px 40px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'var(--border-strong)', borderRadius: 99, margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '20px', marginBottom: '20px' }}>
          {bestaand ? 'Recept bewerken' : 'Nieuw recept'}
        </div>

        {fout && <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'rgba(255,107,122,0.1)', border: '1px solid rgba(255,107,122,0.3)', borderRadius: '10px', color: 'var(--danger)', fontSize: '13px' }}>{fout}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: '6px' }}>Naam *</label>
            <input style={inputStijl} placeholder="bijv. Havermout met banaan" value={naam} onChange={(e) => setNaam(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: '6px' }}>Beschrijving</label>
            <textarea
              style={{ ...inputStijl, minHeight: '70px', resize: 'vertical' as const }}
              placeholder="Optionele beschrijving of bereiding..."
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: '6px' }}>Aantal porties</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setPortieAantal(Math.max(1, portieAantal - 1))} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '20px' }}>{portieAantal}</div>
              <button onClick={() => setPortieAantal(portieAantal + 1)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px' }}>Ingrediënten</label>
            {ingredienten.map((ing, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{ing.naam}</div>
                <input
                  type="number"
                  value={ing.portieGram}
                  onChange={(e) => updatePortie(idx, parseInt(e.target.value) || 1)}
                  style={{ width: '70px', padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>g</span>
                <button onClick={() => verwijderIngredient(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '18px', display: 'flex', alignItems: 'center' }}>×</button>
              </div>
            ))}

            {/* Search ingredient */}
            <div style={{ position: 'relative', marginTop: '8px' }}>
              <input
                type="text"
                placeholder="+ Ingrediënt toevoegen..."
                value={zoek}
                onFocus={() => setToonZoek(true)}
                onChange={(e) => { setZoek(e.target.value); setToonZoek(true); }}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(85,81,184,0.08)', border: '1px dashed var(--border-strong)', borderRadius: '12px', fontSize: '14px', color: 'var(--primary-light)' }}
              />
              {toonZoek && zoekResultaten.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                  {zoekResultaten.map((v) => (
                    <button key={v.id} onClick={() => voegIngredientToe(v)} style={{ width: '100%', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}>
                      <span>{v.naam}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{v.kcalPer100g} kcal/100g</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calculated totals */}
          {ingredienten.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 500 }}>Per portie ({portieAantal}x gedeeld)</div>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {[
                  { l: 'Kcal', v: perPortie.kcal, c: 'var(--text-primary)', u: '' },
                  { l: 'KH', v: perPortie.koolhydraten, c: 'var(--macro-carbs)', u: 'g' },
                  { l: 'EW', v: perPortie.eiwit, c: 'var(--macro-protein)', u: 'g' },
                  { l: 'VT', v: perPortie.vetten, c: 'var(--macro-fat)', u: 'g' },
                ].map(({ l, v, c, u }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px', color: c }}>{v}{u}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onAnnuleer} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>Annuleer</button>
            <button onClick={handleOpslaan} style={{ flex: 2, padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none', color: '#fff', fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(85,81,184,0.4)' }}>Opslaan</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReceptDetailProps {
  recept: Recept;
  onSluiten: () => void;
  onBewerken: () => void;
  onVerwijderen: () => void;
}

function ReceptDetail({ recept, onSluiten, onBewerken, onVerwijderen }: ReceptDetailProps) {
  const [maaltijd, setMaaltijd] = useState<MaaltijdType>('lunch');
  const [succes, setSucces] = useState(false);

  function handleLoggen() {
    const datum = vandaagDatum();
    voegItemToe(datum, maaltijd, {
      id: generateId(),
      voedselId: `recept-${recept.id}`,
      naam: recept.naam,
      portieGram: 0,
      kcal: Math.round(recept.totaalKcal / recept.aantalPorties),
      eiwit: Math.round((recept.totaalEiwit / recept.aantalPorties) * 10) / 10,
      koolhydraten: Math.round((recept.totaalKoolhydraten / recept.aantalPorties) * 10) / 10,
      vetten: Math.round((recept.totaalVetten / recept.aantalPorties) * 10) / 10,
    });
    setSucces(true);
    setTimeout(() => { setSucces(false); onSluiten(); }, 1500);
  }

  const perPortie = {
    kcal: Math.round(recept.totaalKcal / recept.aantalPorties),
    eiwit: Math.round((recept.totaalEiwit / recept.aantalPorties) * 10) / 10,
    koolhydraten: Math.round((recept.totaalKoolhydraten / recept.aantalPorties) * 10) / 10,
    vetten: Math.round((recept.totaalVetten / recept.aantalPorties) * 10) / 10,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onSluiten(); }}>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'var(--border-strong)', borderRadius: 99, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', flex: 1, marginRight: '12px' }}>{recept.naam}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onBewerken} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-secondary)', padding: '6px 10px', fontSize: '13px', cursor: 'pointer' }}>Bewerken</button>
            <button onClick={onVerwijderen} style={{ background: 'rgba(255,107,122,0.1)', border: '1px solid rgba(255,107,122,0.3)', borderRadius: '10px', color: 'var(--danger)', padding: '6px 10px', fontSize: '13px', cursor: 'pointer' }}>Verwijder</button>
          </div>
        </div>

        {recept.beschrijving && <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>{recept.beschrijving}</p>}

        {/* Per portion macros */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 500 }}>Per portie · {recept.aantalPorties} portie{recept.aantalPorties !== 1 ? 's' : ''} totaal</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              { l: 'Kcal', v: perPortie.kcal, c: 'var(--text-primary)', u: '' },
              { l: 'Koolhydr.', v: perPortie.koolhydraten, c: 'var(--macro-carbs)', u: 'g' },
              { l: 'Eiwit', v: perPortie.eiwit, c: 'var(--macro-protein)', u: 'g' },
              { l: 'Vetten', v: perPortie.vetten, c: 'var(--macro-fat)', u: 'g' },
            ].map(({ l, v, c, u }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '18px', color: c }}>{v}{u}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Ingrediënten</div>
          {recept.ingredienten.map((ing, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(85,81,184,0.08)' }}>
              <span style={{ fontSize: '14px' }}>{ing.naam}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{ing.portieGram}g</span>
            </div>
          ))}
        </div>

        {/* Log this recipe */}
        {succes ? (
          <div style={{ padding: '14px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '14px', color: 'var(--success)', textAlign: 'center', fontWeight: 600 }}>✓ Toegevoegd aan {MAALTIJD_LABELS[maaltijd]}!</div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select value={maaltijd} onChange={(e) => setMaaltijd(e.target.value as MaaltijdType)}
              style={{ flex: 1, padding: '13px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {MAALTIJDEN.map((m) => <option key={m} value={m}>{MAALTIJD_LABELS[m]}</option>)}
            </select>
            <button onClick={handleLoggen} style={{ flex: 2, padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none', color: '#fff', fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(85,81,184,0.4)' }}>
              Loggen vandaag
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReceptenPage() {
  const [recepten, setRecepten] = useState<Recept[]>([]);
  const [database, setDatabase] = useState<Voedsel[]>([]);
  const [toonForm, setToonForm] = useState(false);
  const [geselecteerd, setGeselecteerd] = useState<Recept | null>(null);
  const [bewerken, setBewerken] = useState<Recept | null>(null);

  function laadData() {
    setRecepten(getRecepten());
    setDatabase(getVoedselDatabase());
  }

  useEffect(() => { laadData(); }, []);

  function handleOpgeslagen(recept: Recept) {
    const bestaand = recepten.find((r) => r.id === recept.id);
    const bijgewerkt = bestaand
      ? recepten.map((r) => (r.id === recept.id ? recept : r))
      : [...recepten, recept];
    slaReceptenOp(bijgewerkt);
    setRecepten(bijgewerkt);
    setToonForm(false);
    setBewerken(null);
  }

  function handleVerwijder(id: string) {
    const bijgewerkt = recepten.filter((r) => r.id !== id);
    slaReceptenOp(bijgewerkt);
    setRecepten(bijgewerkt);
    setGeselecteerd(null);
  }

  return (
    <div>
      <div style={{ padding: '52px 20px 16px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.02em', marginBottom: '4px' }}>Recepten</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{recepten.length} recept{recepten.length !== 1 ? 'en' : ''}</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {recepten.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍳</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Nog geen recepten</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>Maak recepten aan om ze snel toe te kunnen voegen aan je daglog.</div>
            <button
              onClick={() => setToonForm(true)}
              style={{ padding: '12px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none', color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(85,81,184,0.4)' }}
            >Eerste recept maken</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recepten.map((recept) => (
              <button
                key={recept.id}
                onClick={() => setGeselecteerd(recept)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', width: '100%' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(85,81,184,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🍽️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{recept.naam}</div>
                  {recept.beschrijving && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{recept.beschrijving}</div>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>{Math.round(recept.totaalKcal / recept.aantalPorties)} kcal</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ portie · {recept.aantalPorties}x</span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: '24px' }} />

      {recepten.length > 0 && (
        <button
          onClick={() => setToonForm(true)}
          style={{ position: 'fixed', bottom: '96px', right: '24px', width: 56, height: 56, borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(85,81,184,0.5)', fontSize: '24px', cursor: 'pointer', zIndex: 50 }}
        >+</button>
      )}

      {(toonForm || bewerken) && (
        <ReceptForm
          database={database}
          bestaand={bewerken ?? undefined}
          onOpgeslagen={handleOpgeslagen}
          onAnnuleer={() => { setToonForm(false); setBewerken(null); }}
        />
      )}

      {geselecteerd && !bewerken && (
        <ReceptDetail
          recept={geselecteerd}
          onSluiten={() => setGeselecteerd(null)}
          onBewerken={() => { setBewerken(geselecteerd); setGeselecteerd(null); }}
          onVerwijderen={() => handleVerwijder(geselecteerd.id)}
        />
      )}
    </div>
  );
}
