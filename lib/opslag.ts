import { DagLog, Doelen, Voedsel, Recept, MaaltijdType, MaaltijdItem, DagTotalen } from './types';
import { INGEBOUWDE_DATABASE } from './voedselDatabase';

const SLEUTELS = {
  DOELEN: 'vt_doelen',
  LOGS: 'vt_logs',
  AANGEPAST_VOEDSEL: 'vt_voedsel',
  RECEPTEN: 'vt_recepten',
  EDITS: 'vt_edits',
} as const;

function getEdits(): Record<string, Voedsel> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SLEUTELS.EDITS);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function slaEditsOp(edits: Record<string, Voedsel>): void {
  localStorage.setItem(SLEUTELS.EDITS, JSON.stringify(edits));
}

const STANDAARD_DOELEN: Doelen = {
  kcal: 2000,
  eiwit: 150,
  koolhydraten: 200,
  vetten: 65,
};

function leegDagLog(datum: string): DagLog {
  return {
    datum,
    maaltijden: { ontbijt: [], lunch: [], diner: [], snacks: [] },
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function vandaagDatum(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDagLog(datum: string): DagLog {
  if (typeof window === 'undefined') return leegDagLog(datum);
  try {
    const raw = localStorage.getItem(SLEUTELS.LOGS);
    if (!raw) return leegDagLog(datum);
    const logs: Record<string, DagLog> = JSON.parse(raw);
    return logs[datum] ?? leegDagLog(datum);
  } catch {
    return leegDagLog(datum);
  }
}

export function slaOp(dagLog: DagLog): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SLEUTELS.LOGS);
    const logs: Record<string, DagLog> = raw ? JSON.parse(raw) : {};
    logs[dagLog.datum] = dagLog;
    localStorage.setItem(SLEUTELS.LOGS, JSON.stringify(logs));
  } catch { /* ignore */ }
}

export function getAlleLogs(): DagLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SLEUTELS.LOGS);
    if (!raw) return [];
    const logs: Record<string, DagLog> = JSON.parse(raw);
    return Object.values(logs).sort((a, b) => b.datum.localeCompare(a.datum));
  } catch {
    return [];
  }
}

export function getDoelen(): Doelen {
  if (typeof window === 'undefined') return STANDAARD_DOELEN;
  try {
    const raw = localStorage.getItem(SLEUTELS.DOELEN);
    if (!raw) return STANDAARD_DOELEN;
    return { ...STANDAARD_DOELEN, ...JSON.parse(raw) };
  } catch {
    return STANDAARD_DOELEN;
  }
}

export function slaDoelen(doelen: Doelen): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SLEUTELS.DOELEN, JSON.stringify(doelen));
}

export function getVoedselDatabase(): Voedsel[] {
  if (typeof window === 'undefined') return INGEBOUWDE_DATABASE;
  try {
    const edits = getEdits();
    const raw = localStorage.getItem(SLEUTELS.AANGEPAST_VOEDSEL);
    const aangepast: Voedsel[] = raw ? JSON.parse(raw) : [];

    // Apply edits to built-in foods
    const builtIn = INGEBOUWDE_DATABASE.map((v) =>
      edits[v.id] ? { ...edits[v.id], bewerkt: true } : v,
    );
    // Apply edits to custom foods
    const custom = aangepast.map((v) => edits[v.id] ?? v);

    return [...builtIn, ...custom];
  } catch {
    return INGEBOUWDE_DATABASE;
  }
}

export function voegVoedselToe(voedsel: Voedsel): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SLEUTELS.AANGEPAST_VOEDSEL);
    const aangepast: Voedsel[] = raw ? JSON.parse(raw) : [];
    aangepast.push({ ...voedsel, aangepast: true });
    localStorage.setItem(SLEUTELS.AANGEPAST_VOEDSEL, JSON.stringify(aangepast));
  } catch { /* ignore */ }
}

export function updateVoedsel(voedsel: Voedsel): void {
  if (typeof window === 'undefined') return;
  const edits = getEdits();
  edits[voedsel.id] = voedsel;
  slaEditsOp(edits);
}

export function verwijderAangepastVoedsel(id: string): void {
  if (typeof window === 'undefined') return;
  // Remove from custom list
  const raw = localStorage.getItem(SLEUTELS.AANGEPAST_VOEDSEL);
  const aangepast: Voedsel[] = raw ? JSON.parse(raw) : [];
  localStorage.setItem(SLEUTELS.AANGEPAST_VOEDSEL, JSON.stringify(aangepast.filter((v) => v.id !== id)));
  // Also remove any edit override
  const edits = getEdits();
  delete edits[id];
  slaEditsOp(edits);
}

export function herstellenVoedsel(id: string): void {
  if (typeof window === 'undefined') return;
  const edits = getEdits();
  delete edits[id];
  slaEditsOp(edits);
}

export function isIngebouwdVoedsel(id: string): boolean {
  return INGEBOUWDE_DATABASE.some((v) => v.id === id);
}

export function getRecepten(): Recept[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SLEUTELS.RECEPTEN);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function slaReceptenOp(recepten: Recept[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SLEUTELS.RECEPTEN, JSON.stringify(recepten));
}

export function berekenMacros(voedsel: Voedsel, portieGram: number) {
  const f = portieGram / 100;
  return {
    kcal: Math.round(voedsel.kcalPer100g * f),
    eiwit: Math.round(voedsel.eiwitPer100g * f * 10) / 10,
    koolhydraten: Math.round(voedsel.koolhydratenPer100g * f * 10) / 10,
    vetten: Math.round(voedsel.vettenPer100g * f * 10) / 10,
  };
}

export function voegItemToe(datum: string, maaltijd: MaaltijdType, item: MaaltijdItem): void {
  const dagLog = getDagLog(datum);
  dagLog.maaltijden[maaltijd] = [...dagLog.maaltijden[maaltijd], item];
  slaOp(dagLog);
}

export function verwijderItem(datum: string, maaltijd: MaaltijdType, itemId: string): void {
  const dagLog = getDagLog(datum);
  dagLog.maaltijden[maaltijd] = dagLog.maaltijden[maaltijd].filter((i) => i.id !== itemId);
  slaOp(dagLog);
}

export function berekenDagTotalen(dagLog: DagLog): DagTotalen {
  const alle = [
    ...dagLog.maaltijden.ontbijt,
    ...dagLog.maaltijden.lunch,
    ...dagLog.maaltijden.diner,
    ...dagLog.maaltijden.snacks,
  ];
  return alle.reduce(
    (acc, item) => ({
      kcal: acc.kcal + item.kcal,
      eiwit: Math.round((acc.eiwit + item.eiwit) * 10) / 10,
      koolhydraten: Math.round((acc.koolhydraten + item.koolhydraten) * 10) / 10,
      vetten: Math.round((acc.vetten + item.vetten) * 10) / 10,
    }),
    { kcal: 0, eiwit: 0, koolhydraten: 0, vetten: 0 },
  );
}

export function exporteerCSV(logs: DagLog[], doelen: Doelen): void {
  const headers = ['Datum', 'Kcal', 'Eiwit (g)', 'Koolhydraten (g)', 'Vetten (g)', 'Kcal Doel', 'Eiwit Doel (g)', 'Koolhydraten Doel (g)', 'Vetten Doel (g)'];
  const rows = logs.map((log) => {
    const t = berekenDagTotalen(log);
    return [log.datum, t.kcal, t.eiwit, t.koolhydraten, t.vetten, doelen.kcal, doelen.eiwit, doelen.koolhydraten, doelen.vetten];
  });
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voedingslog-${vandaagDatum()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function wisAlleData(): void {
  if (typeof window === 'undefined') return;
  Object.values(SLEUTELS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(SLEUTELS.EDITS);
}
