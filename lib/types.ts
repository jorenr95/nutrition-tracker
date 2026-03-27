export type VoedselCategorie =
  | 'granen'
  | 'vlees-vis'
  | 'zuivel'
  | 'groenten'
  | 'fruit'
  | 'noten-zaden'
  | 'overig';

export interface Voedsel {
  id: string;
  naam: string;
  kcalPer100g: number;
  eiwitPer100g: number;
  koolhydratenPer100g: number;
  vettenPer100g: number;
  categorie: VoedselCategorie;
  aangepast?: boolean; // user-created food
  bewerkt?: boolean;   // built-in food with user edits
}

export interface MaaltijdItem {
  id: string;
  voedselId: string;
  naam: string;
  portieGram: number;
  kcal: number;
  eiwit: number;
  koolhydraten: number;
  vetten: number;
}

export type MaaltijdType = 'ontbijt' | 'lunch' | 'diner' | 'snacks';

export interface DagLog {
  datum: string; // YYYY-MM-DD
  maaltijden: {
    ontbijt: MaaltijdItem[];
    lunch: MaaltijdItem[];
    diner: MaaltijdItem[];
    snacks: MaaltijdItem[];
  };
}

export interface Doelen {
  kcal: number;
  eiwit: number;
  koolhydraten: number;
  vetten: number;
}

export interface ReceptIngredient {
  voedselId: string;
  naam: string;
  portieGram: number;
}

export interface Recept {
  id: string;
  naam: string;
  beschrijving: string;
  aantalPorties: number;
  ingredienten: ReceptIngredient[];
  totaalKcal: number;
  totaalEiwit: number;
  totaalKoolhydraten: number;
  totaalVetten: number;
}

export interface DagTotalen {
  kcal: number;
  eiwit: number;
  koolhydraten: number;
  vetten: number;
}
