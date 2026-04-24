import catalog from '@/public/art/catalog.json';

export interface PetSpriteOption {
  key: string;
  label: string;
  idle: string;
  walk: string;
  run?: string;
  swipe?: string;
  withBall?: string;
}

export interface PetTypeOption {
  key: string;
  label: string;
  sprites: PetSpriteOption[];
}

export interface PetCatalog {
  petTypes: PetTypeOption[];
}

export const petCatalog = catalog as PetCatalog;

export function getPetTypeByKey(typeKey: string) {
  return petCatalog.petTypes.find((type) => type.key === typeKey) ?? null;
}

export function getSpriteByKeys(typeKey: string, spriteKey: string) {
  const petType = getPetTypeByKey(typeKey);

  if (!petType) {
    return null;
  }

  return petType.sprites.find((sprite) => sprite.key === spriteKey) ?? null;
}
