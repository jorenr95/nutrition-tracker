import { Voedsel } from './types';

export const INGEBOUWDE_DATABASE: Voedsel[] = [
  // Granen & Koolhydraten
  { id: 'havermout', naam: 'Havermout', kcalPer100g: 389, eiwitPer100g: 17, koolhydratenPer100g: 66, vettenPer100g: 7, categorie: 'granen' },
  { id: 'wit-brood', naam: 'Wit brood', kcalPer100g: 265, eiwitPer100g: 9, koolhydratenPer100g: 51, vettenPer100g: 3.2, categorie: 'granen' },
  { id: 'volkoren-brood', naam: 'Volkoren brood', kcalPer100g: 247, eiwitPer100g: 13, koolhydratenPer100g: 41, vettenPer100g: 4.2, categorie: 'granen' },
  { id: 'witte-rijst', naam: 'Witte rijst (gekookt)', kcalPer100g: 130, eiwitPer100g: 2.7, koolhydratenPer100g: 28, vettenPer100g: 0.3, categorie: 'granen' },
  { id: 'zilvervlies-rijst', naam: 'Zilvervliesrijst (gekookt)', kcalPer100g: 112, eiwitPer100g: 2.6, koolhydratenPer100g: 23, vettenPer100g: 0.9, categorie: 'granen' },
  { id: 'pasta', naam: 'Pasta (gekookt)', kcalPer100g: 131, eiwitPer100g: 5, koolhydratenPer100g: 25, vettenPer100g: 1.1, categorie: 'granen' },
  { id: 'aardappel', naam: 'Aardappel (gekookt)', kcalPer100g: 86, eiwitPer100g: 1.8, koolhydratenPer100g: 20, vettenPer100g: 0.1, categorie: 'granen' },
  { id: 'zoete-aardappel', naam: 'Zoete aardappel', kcalPer100g: 86, eiwitPer100g: 1.6, koolhydratenPer100g: 20, vettenPer100g: 0.1, categorie: 'granen' },

  // Vlees & Vis
  { id: 'kipfilet', naam: 'Kipfilet (gekookt)', kcalPer100g: 165, eiwitPer100g: 31, koolhydratenPer100g: 0, vettenPer100g: 3.6, categorie: 'vlees-vis' },
  { id: 'zalm', naam: 'Zalm (vers)', kcalPer100g: 208, eiwitPer100g: 20, koolhydratenPer100g: 0, vettenPer100g: 13, categorie: 'vlees-vis' },
  { id: 'tonijn', naam: 'Tonijn (blik, in water)', kcalPer100g: 116, eiwitPer100g: 26, koolhydratenPer100g: 0, vettenPer100g: 1, categorie: 'vlees-vis' },
  { id: 'rundergehakt', naam: 'Rundergehakt', kcalPer100g: 288, eiwitPer100g: 17, koolhydratenPer100g: 0, vettenPer100g: 24, categorie: 'vlees-vis' },
  { id: 'ei', naam: 'Ei (gekookt)', kcalPer100g: 155, eiwitPer100g: 13, koolhydratenPer100g: 1.1, vettenPer100g: 11, categorie: 'vlees-vis' },
  { id: 'kabeljauw', naam: 'Kabeljauw', kcalPer100g: 82, eiwitPer100g: 18, koolhydratenPer100g: 0, vettenPer100g: 0.7, categorie: 'vlees-vis' },

  // Zuivel
  { id: 'volle-melk', naam: 'Volle melk', kcalPer100g: 61, eiwitPer100g: 3.2, koolhydratenPer100g: 4.8, vettenPer100g: 3.3, categorie: 'zuivel' },
  { id: 'halfvolle-melk', naam: 'Halfvolle melk', kcalPer100g: 46, eiwitPer100g: 3.3, koolhydratenPer100g: 4.8, vettenPer100g: 1.6, categorie: 'zuivel' },
  { id: 'griekse-yoghurt', naam: 'Griekse yoghurt (0%)', kcalPer100g: 59, eiwitPer100g: 10, koolhydratenPer100g: 3.6, vettenPer100g: 0.4, categorie: 'zuivel' },
  { id: 'kaas-gouda', naam: 'Kaas (gouda)', kcalPer100g: 356, eiwitPer100g: 25, koolhydratenPer100g: 2.2, vettenPer100g: 27, categorie: 'zuivel' },
  { id: 'kwark', naam: 'Magere kwark', kcalPer100g: 67, eiwitPer100g: 11, koolhydratenPer100g: 4, vettenPer100g: 0.2, categorie: 'zuivel' },
  { id: 'cottage-cheese', naam: 'Cottage cheese', kcalPer100g: 98, eiwitPer100g: 11, koolhydratenPer100g: 3.4, vettenPer100g: 4.3, categorie: 'zuivel' },
  { id: 'boter', naam: 'Boter', kcalPer100g: 717, eiwitPer100g: 0.9, koolhydratenPer100g: 0.1, vettenPer100g: 81, categorie: 'zuivel' },

  // Groenten
  { id: 'broccoli', naam: 'Broccoli', kcalPer100g: 34, eiwitPer100g: 2.8, koolhydratenPer100g: 7, vettenPer100g: 0.4, categorie: 'groenten' },
  { id: 'wortel', naam: 'Wortel', kcalPer100g: 41, eiwitPer100g: 0.9, koolhydratenPer100g: 10, vettenPer100g: 0.2, categorie: 'groenten' },
  { id: 'tomaat', naam: 'Tomaat', kcalPer100g: 18, eiwitPer100g: 0.9, koolhydratenPer100g: 3.9, vettenPer100g: 0.2, categorie: 'groenten' },
  { id: 'komkommer', naam: 'Komkommer', kcalPer100g: 15, eiwitPer100g: 0.7, koolhydratenPer100g: 3.6, vettenPer100g: 0.1, categorie: 'groenten' },
  { id: 'spinazie', naam: 'Spinazie', kcalPer100g: 23, eiwitPer100g: 2.9, koolhydratenPer100g: 3.6, vettenPer100g: 0.4, categorie: 'groenten' },
  { id: 'champignons', naam: 'Champignons', kcalPer100g: 22, eiwitPer100g: 3.1, koolhydratenPer100g: 3.3, vettenPer100g: 0.3, categorie: 'groenten' },
  { id: 'edamame', naam: 'Edamame', kcalPer100g: 122, eiwitPer100g: 11, koolhydratenPer100g: 10, vettenPer100g: 5.2, categorie: 'groenten' },
  { id: 'mais', naam: 'Maïs (blik)', kcalPer100g: 86, eiwitPer100g: 2.7, koolhydratenPer100g: 19, vettenPer100g: 1.2, categorie: 'groenten' },
  { id: 'paprika', naam: 'Rode paprika', kcalPer100g: 31, eiwitPer100g: 1, koolhydratenPer100g: 6, vettenPer100g: 0.3, categorie: 'groenten' },

  // Fruit
  { id: 'banaan', naam: 'Banaan', kcalPer100g: 89, eiwitPer100g: 1.1, koolhydratenPer100g: 23, vettenPer100g: 0.3, categorie: 'fruit' },
  { id: 'appel', naam: 'Appel', kcalPer100g: 52, eiwitPer100g: 0.3, koolhydratenPer100g: 14, vettenPer100g: 0.2, categorie: 'fruit' },
  { id: 'aardbei', naam: 'Aardbeien', kcalPer100g: 32, eiwitPer100g: 0.7, koolhydratenPer100g: 7.7, vettenPer100g: 0.3, categorie: 'fruit' },
  { id: 'blauwe-bessen', naam: 'Blauwe bessen', kcalPer100g: 57, eiwitPer100g: 0.7, koolhydratenPer100g: 14, vettenPer100g: 0.3, categorie: 'fruit' },
  { id: 'sinaasappel', naam: 'Sinaasappel', kcalPer100g: 47, eiwitPer100g: 0.9, koolhydratenPer100g: 12, vettenPer100g: 0.1, categorie: 'fruit' },
  { id: 'avocado', naam: 'Avocado', kcalPer100g: 160, eiwitPer100g: 2, koolhydratenPer100g: 9, vettenPer100g: 15, categorie: 'fruit' },

  // Noten & Zaden
  { id: 'amandelen', naam: 'Amandelen', kcalPer100g: 579, eiwitPer100g: 21, koolhydratenPer100g: 22, vettenPer100g: 50, categorie: 'noten-zaden' },
  { id: 'notenmelange', naam: 'Notenmelange', kcalPer100g: 607, eiwitPer100g: 20, koolhydratenPer100g: 13, vettenPer100g: 55, categorie: 'noten-zaden' },
  { id: 'pindakaas', naam: 'Pindakaas', kcalPer100g: 588, eiwitPer100g: 25, koolhydratenPer100g: 20, vettenPer100g: 50, categorie: 'noten-zaden' },

  // Overig
  { id: 'olijfolie', naam: 'Olijfolie', kcalPer100g: 884, eiwitPer100g: 0, koolhydratenPer100g: 0, vettenPer100g: 100, categorie: 'overig' },
  { id: 'linzen', naam: 'Linzen (gekookt)', kcalPer100g: 116, eiwitPer100g: 9, koolhydratenPer100g: 20, vettenPer100g: 0.4, categorie: 'overig' },
  { id: 'kikkererwten', naam: 'Kikkererwten (blik)', kcalPer100g: 120, eiwitPer100g: 7.2, koolhydratenPer100g: 20, vettenPer100g: 2, categorie: 'overig' },
];

export const CATEGORIE_LABELS: Record<string, string> = {
  granen: 'Granen & Koolhydraten',
  'vlees-vis': 'Vlees & Vis',
  zuivel: 'Zuivel & Eieren',
  groenten: 'Groenten',
  fruit: 'Fruit',
  'noten-zaden': 'Noten & Zaden',
  overig: 'Overig',
};
