'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getVoedselDatabase, berekenMacros, voegItemToe, vandaagDatum, generateId, getRecepten } from '@/lib/opslag';
import type { Voedsel, MaaltijdType, Recept } from '@/lib/types';
import { CATEGORIE_LABELS } from '@/lib/voedselDatabase';

const MAALTIJDEN: MaaltijdType[] = ['ontbijt', 'lunch', 'diner', 'snacks'];
const MAALTIJD_LABELS: Record<MaaltijdType, string> = {
  ontbijt: 'Ontbijt',
  lunch: 'Lunch',
  diner: 'Diner',
  snacks: 'Snacks',
};

interface VoedselModalProps {
  voedsel: Voedsel;
  maaltijd: MaaltijdType;
  datum: string;
  onSluiten: () => void;
  onToegevoegd: () => void;
}

function VoedselModal({ voedsel, maaltijd, datum, onSluiten, onToegevoegd }: VoedselModalProps) {
  const [portie, setPortie] = useState(100);
  const macros = berekenMacros(voedsel, portie);

  function handleToevoegen() {
    voegItemToe(datum, maaltijd, {
      id: generateId(),
      voedselId: voedsel.id,
      naam: voedsel.naam,
      portieGram: portie,
      ...macros,
    });
    onToegevoegd();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onSluiten(); }}
    >
      <div style={{
        background: 'var(--bg-elevated)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        padding: '24px 20px 40px',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'var(--border-strong)', borderRadius: 99, margin: '0 auto 20px' }} />

        {/* Food info */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 500 }}>
            {CATEGORIE_LABELS[voedsel.categorie] ?? voedsel.categorie}
          </div>
          <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.01em', marginBottom: '4px' }}>
            {voedsel.naam}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Per 100g: {voedsel.kcalPer100g} kcal</div>
        </div>

        {/* Portion input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Portiegrootte (gram)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setPortie(Math.max(5, portie - 10))}
              style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}
            >−</button>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="number"
                value={portie}
                onChange={(e) => setPortie(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '100%', textAlign: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '12px',
                  padding: '10px 40px 10px 16px',
                  fontSize: '24px',
                  fontFamily: 'Lora, serif',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-muted)', pointerEvents: 'none' }}>g</span>
            </div>
            <button
              onClick={() => setPortie(portie + 10)}
              style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}
            >+</button>
          </div>
          {/* Quick portion buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            {[50, 100, 150, 200, 250].map((g) => (
              <button
                key={g}
                onClick={() => setPortie(g)}
                style={{
                  padding: '5px 12px', borderRadius: '8px',
                  background: portie === g ? 'var(--primary)' : 'var(--bg-card)',
                  border: `1px solid ${portie === g ? 'var(--primary)' : 'var(--border)'}`,
                  color: portie === g ? '#fff' : 'var(--text-muted)',
                  fontSize: '13px', fontWeight: 500,
                }}
              >{g}g</button>
            ))}
          </div>
        </div>

        {/* Calculated macros */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Voor {portie}g
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              { label: 'Kcal', val: macros.kcal, unit: '', color: 'var(--text-primary)' },
              { label: 'Koolhydr.', val: macros.koolhydraten, unit: 'g', color: 'var(--macro-carbs)' },
              { label: 'Eiwit', val: macros.eiwit, unit: 'g', color: 'var(--macro-protein)' },
              { label: 'Vetten', val: macros.vetten, unit: 'g', color: 'var(--macro-fat)' },
            ].map(({ label, val, unit, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '17px', color }}>{val}{unit}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleToevoegen}
          style={{
            width: '100%', padding: '15px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            border: 'none', borderRadius: '14px',
            color: '#fff', fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(85, 81, 184, 0.4)',
          }}
        >
          Toevoegen aan {MAALTIJD_LABELS[maaltijd]}
        </button>
      </div>
    </div>
  );
}

function LoggenContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [maaltijd, setMaaltijd] = useState<MaaltijdType>((params.get('maaltijd') as MaaltijdType) || 'ontbijt');
  const [datum] = useState(() => params.get('datum') || vandaagDatum());
  const [tab, setTab] = useState<'voeding' | 'recepten'>('voeding');
  const [zoekterm, setZoekterm] = useState('');
  const [database, setDatabase] = useState<Voedsel[]>([]);
  const [recepten, setRecepten] = useState<Recept[]>([]);
  const [geselecteerd, setGeselecteerd] = useState<Voedsel | null>(null);
  const [geselecteerdRecept, setGeselecteerdRecept] = useState<Recept | null>(null);
  const [succes, setSucces] = useState(false);
  const zoekRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDatabase(getVoedselDatabase());
    setRecepten(getRecepten());
    setTimeout(() => zoekRef.current?.focus(), 300);
  }, []);

  const gefilterd = database.filter((v) =>
    v.naam.toLowerCase().includes(zoekterm.toLowerCase())
  );

  const gefilterdRecepten = recepten.filter((r) =>
    r.naam.toLowerCase().includes(zoekterm.toLowerCase())
  );

  function handleToegevoegd() {
    setGeselecteerd(null);
    setGeselecteerdRecept(null);
    setSucces(true);
    setZoekterm('');
    setTimeout(() => setSucces(false), 2000);
  }

  function handleReceptLoggen(recept: Recept) {
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
    handleToegevoegd();
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.01em' }}>Voeding toevoegen</div>
        </div>
      </div>

      {/* Meal selector */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {MAALTIJDEN.map((m) => (
            <button
              key={m}
              onClick={() => setMaaltijd(m)}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                border: `1px solid ${maaltijd === m ? 'var(--primary)' : 'var(--border)'}`,
                background: maaltijd === m ? 'rgba(85,81,184,0.2)' : 'var(--bg-card)',
                color: maaltijd === m ? 'var(--primary-light)' : 'var(--text-muted)',
                fontSize: '13px', fontWeight: maaltijd === m ? 600 : 400,
                whiteSpace: 'nowrap', cursor: 'pointer',
              }}
            >{MAALTIJD_LABELS[m]}</button>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '3px', gap: '3px' }}>
          {(['voeding', 'recepten'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setZoekterm(''); }}
              style={{
                flex: 1, padding: '8px', borderRadius: '9px',
                background: tab === t ? 'var(--bg-elevated)' : 'transparent',
                border: tab === t ? '1px solid var(--border-strong)' : '1px solid transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '13px', fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{t === 'voeding' ? 'Voeding' : `Recepten${recepten.length > 0 ? ` (${recepten.length})` : ''}`}</button>
          ))}
        </div>
      </div>

      {/* Success toast */}
      {succes && (
        <div style={{
          margin: '0 16px 12px',
          padding: '12px 16px',
          background: 'rgba(74, 222, 128, 0.15)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          borderRadius: '12px',
          color: 'var(--success)',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>✓</span> Toegevoegd aan {MAALTIJD_LABELS[maaltijd]}
        </div>
      )}

      {/* Search bar */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={zoekRef}
            type="text"
            placeholder={tab === 'voeding' ? 'Zoek voeding...' : 'Zoek recept...'}
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            style={{
              width: '100%', paddingLeft: '44px', paddingRight: '16px', height: '48px',
              background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '14px',
              fontSize: '15px', color: 'var(--text-primary)',
            }}
          />
          {zoekterm && (
            <button
              onClick={() => setZoekterm('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', display: 'flex', alignItems: 'center' }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Lists */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 8px' }}>
        {tab === 'voeding' ? (
          <>
            {zoekterm && gefilterd.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontWeight: 500 }}>Geen resultaten gevonden</div>
                <div style={{ fontSize: '13px', marginTop: '6px' }}>Voeg dit product toe via de <strong>Database</strong> pagina</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {gefilterd.map((voedsel) => (
                <button
                  key={voedsel.id}
                  onClick={() => setGeselecteerd(voedsel)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(85,81,184,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--primary-light)',
                    fontFamily: 'Lora, serif',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}>
                    {voedsel.kcalPer100g}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {voedsel.naam}
                      {voedsel.aangepast && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--primary-light)', fontWeight: 500, background: 'rgba(85,81,184,0.15)', padding: '1px 5px', borderRadius: '4px' }}>Eigen</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '3px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--macro-carbs)' }}>{voedsel.koolhydratenPer100g}g KH</span>
                      <span style={{ fontSize: '11px', color: 'var(--macro-protein)' }}>{voedsel.eiwitPer100g}g EW</span>
                      <span style={{ fontSize: '11px', color: 'var(--macro-fat)' }}>{voedsel.vettenPer100g}g VT</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>/ 100g</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {recepten.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍳</div>
                <div style={{ fontWeight: 500 }}>Nog geen recepten</div>
                <div style={{ fontSize: '13px', marginTop: '6px', lineHeight: 1.6 }}>Maak recepten aan via het <strong>Recepten</strong> tabblad.</div>
              </div>
            ) : gefilterdRecepten.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontWeight: 500 }}>Geen recepten gevonden</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {gefilterdRecepten.map((recept) => {
                  const perPortie = {
                    kcal: Math.round(recept.totaalKcal / recept.aantalPorties),
                    eiwit: Math.round((recept.totaalEiwit / recept.aantalPorties) * 10) / 10,
                    koolhydraten: Math.round((recept.totaalKoolhydraten / recept.aantalPorties) * 10) / 10,
                    vetten: Math.round((recept.totaalVetten / recept.aantalPorties) * 10) / 10,
                  };
                  const isOpen = geselecteerdRecept?.id === recept.id;
                  return (
                    <div key={recept.id} style={{ background: 'var(--bg-card)', border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
                      <button
                        onClick={() => setGeselecteerdRecept(isOpen ? null : recept)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'none', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(85,81,184,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>🍽️</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{recept.naam}</div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Lora, serif', fontWeight: 600 }}>{perPortie.kcal} kcal</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ portie · {recept.aantalPorties}x</span>
                          </div>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                      </button>

                      {isOpen && (
                        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}>
                          {/* Macro row */}
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            {[
                              { l: 'KH', v: perPortie.koolhydraten, c: 'var(--macro-carbs)' },
                              { l: 'EW', v: perPortie.eiwit, c: 'var(--macro-protein)' },
                              { l: 'VT', v: perPortie.vetten, c: 'var(--macro-fat)' },
                            ].map(({ l, v, c }) => (
                              <div key={l} style={{ flex: 1, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '8px 4px' }}>
                                <div style={{ fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '14px', color: c }}>{v}g</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{l}</div>
                              </div>
                            ))}
                          </div>
                          {/* Ingredient list */}
                          <div style={{ marginBottom: '12px' }}>
                            {recept.ingredienten.map((ing, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(85,81,184,0.08)', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{ing.naam}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{ing.portieGram}g</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleReceptLoggen(recept)}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none', color: '#fff', fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(85,81,184,0.35)' }}
                          >
                            Toevoegen aan {MAALTIJD_LABELS[maaltijd]}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {geselecteerd && (
        <VoedselModal
          voedsel={geselecteerd}
          maaltijd={maaltijd}
          datum={datum}
          onSluiten={() => setGeselecteerd(null)}
          onToegevoegd={handleToegevoegd}
        />
      )}
    </div>
  );
}

export default function LoggenPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>Laden...</div>}>
      <LoggenContent />
    </Suspense>
  );
}
