export interface Recipes {
  sourceSheet: SourceSheet;
  name: string;
  image: string;
  buy: number;
  sell: number | null;
  exchangePrice: number | null;
  exchangeCurrency: ExchangeCurrency | null;
  source: string[];
  sourceNotes: null | string;
  seasonEvent: null | string;
  seasonEventExclusive: boolean | null;
  versionAdded: VersionAdded;
  unlocked: boolean;
  recipesToUnlock: number;
  category: Category;
  craftedItemInternalId: number;
  cardColor: CardColor | null;
  diyIconFilename: string;
  serialId: number;
  internalId: number;
  uniqueEntryId: string;
  materials: {[key: string]: number};
}

export enum CardColor {
  Beige = 'beige',
  Blue = 'blue',
  Brick = 'brick',
  Brown = 'brown',
  Cream = 'cream',
  DarkGray = 'dark gray',
  Gold = 'gold',
  Green = 'green',
  LightGray = 'light gray',
  Orange = 'orange',
  Pink = 'pink',
  Purple = 'purple',
  Red = 'red',
  Silver = 'silver',
  White = 'white',
  Yellow = 'yellow',
}

export enum Category {
  Equipment = 'Equipment',
  Floors = 'Floors',
  Housewares = 'Housewares',
  Miscellaneous = 'Miscellaneous',
  Other = 'Other',
  Rugs = 'Rugs',
  Tools = 'Tools',
  WallMounted = 'Wall-mounted',
  Wallpaper = 'Wallpaper',
}

export enum ExchangeCurrency {
  NookMiles = 'Nook Miles',
}

export enum SourceSheet {
  Recipes = 'Recipes',
}

export enum VersionAdded {
  The100 = '1.0.0',
  The110 = '1.1.0',
  The120 = '1.2.0',
  The130 = '1.3.0',
  The140 = '1.4.0',
  The150 = '1.5.0',
  The160 = '1.6.0',
}
